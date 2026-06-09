
-- 1) Org-scoped setup step table
CREATE TABLE IF NOT EXISTS public.organization_setup_steps (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  step text NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, step)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_setup_steps TO authenticated;
GRANT ALL ON public.organization_setup_steps TO service_role;

ALTER TABLE public.organization_setup_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read setup steps"
  ON public.organization_setup_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_setup_steps.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'developer')
  );
-- All writes go through SECURITY DEFINER RPCs; no direct client writes.

-- 2) Backfill from existing per-user JSONB
INSERT INTO public.organization_setup_steps (organization_id, step, completed, completed_by, completed_at)
SELECT
  (org_key)::uuid AS organization_id,
  step_key AS step,
  (step_val::boolean) AS completed,
  uo.user_id,
  uo.updated_at
FROM public.user_onboarding uo
CROSS JOIN LATERAL jsonb_each(COALESCE(uo.owner_setup_steps, '{}'::jsonb)) AS orgs(org_key, org_val)
CROSS JOIN LATERAL jsonb_each_text(org_val) AS steps(step_key, step_val)
WHERE org_key ~ '^[0-9a-fA-F-]{36}$'
  AND step_val IN ('true','false')
ON CONFLICT (organization_id, step) DO NOTHING;

-- 3) Rewrite record_owner_setup_step to write org-scoped table (keep JSONB for legacy reads)
CREATE OR REPLACE FUNCTION public.record_owner_setup_step(
  p_organization_id uuid,
  p_step text,
  p_done boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
  _allowed_steps text[] := ARRAY['profile','organization','data_source','shop_floor','concierge_review','billing'];
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;
  IF NOT (p_step = ANY(_allowed_steps)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unknown setup step');
  END IF;

  SELECT role INTO _role FROM public.organization_members
   WHERE organization_id = p_organization_id AND user_id = _uid;
  IF _role NOT IN ('owner','admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Owner/admin required');
  END IF;

  INSERT INTO public.organization_setup_steps (organization_id, step, completed, completed_by, completed_at)
  VALUES (p_organization_id, p_step, p_done, _uid, now())
  ON CONFLICT (organization_id, step)
  DO UPDATE SET completed = EXCLUDED.completed,
                completed_by = EXCLUDED.completed_by,
                completed_at = EXCLUDED.completed_at;

  -- Keep per-user JSONB updated for the existing useOwnerSetupGate hook
  INSERT INTO public.user_onboarding (user_id, owner_setup_steps)
  VALUES (_uid, jsonb_build_object(p_organization_id::text, jsonb_build_object(p_step, p_done)))
  ON CONFLICT (user_id) DO UPDATE
    SET owner_setup_steps = COALESCE(public.user_onboarding.owner_setup_steps, '{}'::jsonb)
        || jsonb_build_object(
             p_organization_id::text,
             COALESCE(public.user_onboarding.owner_setup_steps -> p_organization_id::text, '{}'::jsonb)
             || jsonb_build_object(p_step, p_done)
           );

  UPDATE public.organizations
  SET activation_state = 'in_setup'
  WHERE id = p_organization_id AND activation_state = 'claimed';

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (
    p_organization_id, _uid, _role,
    CASE WHEN p_done THEN 'setup_step.completed' ELSE 'setup_step.reopened' END,
    'Step "' || p_step || '" ' || CASE WHEN p_done THEN 'marked complete' ELSE 'reopened' END,
    jsonb_build_object('step', p_step, 'done', p_done)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 4) mark_org_open_for_operations now reads org-scoped table
CREATE OR REPLACE FUNCTION public.mark_org_open_for_operations(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
  _required text[] := ARRAY['profile','organization','data_source','shop_floor','billing'];
  _step text;
  _done boolean;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;

  SELECT role INTO _role FROM public.organization_members
   WHERE organization_id = p_organization_id AND user_id = _uid;
  IF _role NOT IN ('owner','admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Owner/admin required');
  END IF;

  FOREACH _step IN ARRAY _required LOOP
    SELECT completed INTO _done
    FROM public.organization_setup_steps
    WHERE organization_id = p_organization_id AND step = _step;
    IF NOT COALESCE(_done, false) THEN
      RETURN jsonb_build_object('ok', false, 'error',
        'Setup step "' || _step || '" not complete');
    END IF;
  END LOOP;

  UPDATE public.organizations
  SET activation_state = 'open_for_operations',
      opened_for_operations_at = now(),
      opened_for_operations_by = _uid
  WHERE id = p_organization_id;

  INSERT INTO public.organization_audit_events
    (organization_id, actor_user_id, event_type, event_data)
  VALUES (
    p_organization_id, _uid, 'org.opened_for_operations',
    jsonb_build_object('completed_by_role', _role)
  );

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (
    p_organization_id, _uid, _role, 'org.opened_for_operations',
    'Organization opened for operations by ' || _role,
    '{}'::jsonb
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 5) Uppercase delegate invite codes so redeem_invite_code (which upper()s input) can find them
CREATE OR REPLACE FUNCTION public.invite_setup_delegate(
  p_organization_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
  _invite_code text;
  _invite_id uuid;
  _email text := lower(trim(p_email));
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Valid email required');
  END IF;

  SELECT role INTO _role FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = _uid;

  IF _role <> 'owner' AND NOT public.has_role(_uid, 'developer') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only the account owner can delegate setup');
  END IF;

  _invite_code := upper(encode(gen_random_bytes(18), 'hex'));

  INSERT INTO public.organization_invites (
    organization_id, invite_code, created_by, org_role, app_role,
    expires_at, max_uses, invited_email, setup_delegate, is_active
  )
  VALUES (
    p_organization_id, _invite_code, _uid, 'admin', 'admin',
    now() + interval '15 days', 1, _email, true, true
  )
  RETURNING id INTO _invite_id;

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (
    p_organization_id, _uid, COALESCE(_role,'owner'), 'setup_delegate.invited',
    'Owner invited ' || _email || ' to complete setup as admin',
    jsonb_build_object('invite_id', _invite_id, 'invited_email', _email, 'full_name', p_full_name)
  );

  INSERT INTO public.organization_audit_events
    (organization_id, actor_user_id, event_type, event_data)
  VALUES (
    p_organization_id, _uid, 'setup_delegate.invited',
    jsonb_build_object('invite_id', _invite_id, 'invited_email', _email)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'invite_id', _invite_id,
    'invite_code', _invite_code,
    'invited_email', _email,
    'claim_url', 'https://jobline.ai/invite/' || _invite_code
  );
END;
$$;

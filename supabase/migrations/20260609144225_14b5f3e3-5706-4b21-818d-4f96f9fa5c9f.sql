
ALTER TABLE public.organization_invites
  ADD COLUMN IF NOT EXISTS setup_delegate boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.concierge_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  summary text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS concierge_activity_log_org_idx
  ON public.concierge_activity_log(organization_id, created_at DESC);

GRANT SELECT, INSERT ON public.concierge_activity_log TO authenticated;
GRANT ALL ON public.concierge_activity_log TO service_role;

ALTER TABLE public.concierge_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners/admins view concierge activity"
  ON public.concierge_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = concierge_activity_log.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
    OR public.has_role(auth.uid(), 'developer')
  );

CREATE POLICY "Org owners/admins insert concierge activity"
  ON public.concierge_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = concierge_activity_log.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
  );

CREATE OR REPLACE FUNCTION public.log_concierge_activity(
  p_organization_id uuid,
  p_action text,
  p_summary text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO _role FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = _uid;

  IF _role NOT IN ('owner','admin') AND NOT public.has_role(_uid, 'developer') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Owner/admin required');
  END IF;

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES
    (p_organization_id, _uid, COALESCE(_role,'platform'), p_action, p_summary, COALESCE(p_details,'{}'::jsonb));

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_concierge_activity(uuid, text, text, jsonb) TO authenticated;

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

  _invite_code := encode(gen_random_bytes(18), 'hex');

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
GRANT EXECUTE ON FUNCTION public.invite_setup_delegate(uuid, text, text) TO authenticated;

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

CREATE OR REPLACE FUNCTION public.mark_org_open_for_operations(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role text;
  _steps jsonb;
  _required text[] := ARRAY['profile','organization','data_source','shop_floor','billing'];
  _step text;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;

  SELECT role INTO _role FROM public.organization_members
   WHERE organization_id = p_organization_id AND user_id = _uid;
  IF _role NOT IN ('owner','admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Owner/admin required');
  END IF;

  SELECT COALESCE(owner_setup_steps -> p_organization_id::text, '{}'::jsonb)
    INTO _steps
  FROM public.user_onboarding WHERE user_id = _uid;

  FOREACH _step IN ARRAY _required LOOP
    IF NOT COALESCE((_steps ->> _step)::boolean, false) THEN
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
    jsonb_build_object('steps', _steps, 'completed_by_role', _role)
  );

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (
    p_organization_id, _uid, _role, 'org.opened_for_operations',
    'Organization opened for operations by ' || _role,
    jsonb_build_object('steps', _steps)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

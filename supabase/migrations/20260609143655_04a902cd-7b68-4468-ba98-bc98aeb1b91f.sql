
-- 1) activation_state enum + column
DO $$ BEGIN
  CREATE TYPE public.org_activation_state AS ENUM ('claimed','in_setup','open_for_operations');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS activation_state public.org_activation_state NOT NULL DEFAULT 'claimed',
  ADD COLUMN IF NOT EXISTS opened_for_operations_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_for_operations_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Existing orgs that are clearly already operating should not be forced through the wizard
UPDATE public.organizations
SET activation_state = 'open_for_operations',
    opened_for_operations_at = COALESCE(opened_for_operations_at, updated_at)
WHERE activation_state = 'claimed'
  AND created_at < now() - interval '1 day';

-- 2) user_onboarding.explore_only flag
ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS explore_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_setup_steps jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3) record_owner_setup_step — owner marks one of the 6 required steps complete
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

  -- Once any step is recorded, flip from claimed → in_setup
  UPDATE public.organizations
  SET activation_state = 'in_setup'
  WHERE id = p_organization_id AND activation_state = 'claimed';

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_owner_setup_step(uuid, text, boolean) TO authenticated;

-- 4) mark_org_open_for_operations — final gate
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
    jsonb_build_object('steps', _steps)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_org_open_for_operations(uuid) TO authenticated;

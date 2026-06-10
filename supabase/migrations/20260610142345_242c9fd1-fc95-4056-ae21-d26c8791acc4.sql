DO $$
BEGIN
  IF to_regprocedure('public.repair_seed_aymar_concierge_legacy_20260610()') IS NULL
     AND to_regprocedure('public.repair_seed_aymar_concierge()') IS NOT NULL THEN
    ALTER FUNCTION public.repair_seed_aymar_concierge() RENAME TO repair_seed_aymar_concierge_legacy_20260610;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.repair_seed_aymar_concierge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _org_id uuid := '41f0e268-87d6-4981-b21e-a3c4e8245688';
  _owner_user_id uuid := '7d924865-7e19-4bf8-a503-75eeeab26d03';
  _member_id uuid := 'e8e894ba-ea12-410e-b355-35c10e07b5ae';
  _equipment_response_id uuid := '6aefd210-57b6-4f67-8772-45ab5422e138';
  _users_response_id uuid := 'f0dfd05b-c8ff-4bfa-84c4-66f7659d75cb';
  _engagement_id uuid := '631b1d16-18c1-4cc9-b1a0-2886029e4c5c';
  _result jsonb;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (public.has_role(_caller, 'admin'::public.app_role) OR public.has_role(_caller, 'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Platform admin or developer access required';
  END IF;

  UPDATE public.organization_members
  SET id = _member_id,
      role = 'owner',
      joined_at = COALESCE(joined_at, '2026-06-09T21:51:00.786456+00:00'::timestamptz)
  WHERE organization_id = _org_id
    AND user_id = _owner_user_id
    AND id <> _member_id;

  UPDATE public.onboarding_intake_responses
  SET id = _equipment_response_id,
      organization_id = _org_id
  WHERE engagement_id = _engagement_id
    AND module_key = 'equipment'
    AND id <> _equipment_response_id;

  UPDATE public.onboarding_intake_responses
  SET id = _users_response_id,
      organization_id = _org_id
  WHERE engagement_id = _engagement_id
    AND module_key = 'users_roles'
    AND id <> _users_response_id;

  SELECT public.repair_seed_aymar_concierge_legacy_20260610() INTO _result;

  UPDATE public.organizations
  SET onboarding_engagement_id = _engagement_id,
      onboarding_status = 'concierge_in_progress',
      activation_state = 'claimed',
      updated_at = now()
  WHERE id = _org_id;

  RETURN COALESCE(_result, '{}'::jsonb)
    || jsonb_build_object(
      'organization_id', _org_id,
      'members', (SELECT count(*) FROM public.organization_members WHERE organization_id = _org_id),
      'owner_membership', (SELECT count(*) FROM public.organization_members WHERE organization_id = _org_id AND user_id = _owner_user_id),
      'onboarding_engagement_id_set', (SELECT onboarding_engagement_id = _engagement_id FROM public.organizations WHERE id = _org_id)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.repair_seed_aymar_concierge() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.repair_seed_aymar_concierge() FROM anon;
GRANT EXECUTE ON FUNCTION public.repair_seed_aymar_concierge() TO authenticated;

REVOKE ALL ON FUNCTION public.repair_seed_aymar_concierge_legacy_20260610() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.repair_seed_aymar_concierge_legacy_20260610() FROM anon;
REVOKE ALL ON FUNCTION public.repair_seed_aymar_concierge_legacy_20260610() FROM authenticated;
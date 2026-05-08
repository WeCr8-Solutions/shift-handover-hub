-- =====================================================================
-- PASS B/C: Auth & Onboarding Pipeline Hardening (WARN + INFO)
-- .lovable/auth-onboarding-pipeline-audit.md  F-10, F-16, F-18
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- F-10: enforce_operator_profile_publishable
-- Blocks is_discoverable=true when minimum required fields are absent.
-- Required: non-empty headline AND at least one operator_skills row.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_operator_profile_publishable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_skill_count int;
BEGIN
  IF NEW.is_discoverable IS NOT DISTINCT FROM true
     AND (OLD.is_discoverable IS DISTINCT FROM true OR TG_OP = 'INSERT')
  THEN
    IF NEW.headline IS NULL OR trim(NEW.headline) = '' THEN
      RAISE EXCEPTION 'A headline is required before your profile can be made public.'
        USING ERRCODE = '22000', HINT = 'headline';
    END IF;

    SELECT COUNT(*) INTO v_skill_count
    FROM public.operator_skills
    WHERE user_id = NEW.user_id;

    IF v_skill_count = 0 THEN
      RAISE EXCEPTION 'At least one skill is required before your profile can be made public.'
        USING ERRCODE = '22000', HINT = 'skills';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_op_profile_publishable ON public.operator_profiles;
CREATE TRIGGER trg_enforce_op_profile_publishable
  BEFORE INSERT OR UPDATE OF is_discoverable ON public.operator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_operator_profile_publishable();

-- ─────────────────────────────────────────────────────────────────────
-- F-16: Prevent operator self-walkthrough on oap_walkthrough_sessions
-- Blocks INSERT/UPDATE where primary_mentor_id = operator_id.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_walkthrough_no_self_sign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.primary_mentor_id IS NOT NULL
     AND NEW.primary_mentor_id = NEW.operator_id
  THEN
    RAISE EXCEPTION 'An operator cannot be their own walkthrough mentor.'
      USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_walkthrough_no_self_sign ON public.oap_walkthrough_sessions;
CREATE TRIGGER trg_walkthrough_no_self_sign
  BEFORE INSERT OR UPDATE OF primary_mentor_id, operator_id ON public.oap_walkthrough_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_walkthrough_no_self_sign();

-- ─────────────────────────────────────────────────────────────────────
-- F-18: Extend resolve_post_login_destination to expose trial state.
-- Adds trial_expired boolean so Auth.tsx can redirect to /pricing
-- instead of /dashboard when the trial has lapsed and there is no
-- active paid subscription.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolve_post_login_destination()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid              uuid := auth.uid();
  v_org_id           uuid;
  v_org_role         text;
  v_has_talent       boolean;
  v_onboarding_complete boolean;
  v_plan             text;
  v_sub_status       text;
  v_trial_ends_at    timestamptz;
  v_trial_expired    boolean := false;
  v_destination      text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('destination', '/auth');
  END IF;

  SELECT om.organization_id, om.role
    INTO v_org_id, v_org_role
  FROM organization_members om
  WHERE om.user_id = v_uid
  ORDER BY om.joined_at ASC
  LIMIT 1;

  SELECT EXISTS (SELECT 1 FROM operator_profiles WHERE user_id = v_uid)
    INTO v_has_talent;

  SELECT COALESCE(is_complete, false) FROM user_onboarding WHERE user_id = v_uid
    INTO v_onboarding_complete;

  IF v_org_id IS NOT NULL THEN
    SELECT plan FROM entitlements WHERE organization_id = v_org_id INTO v_plan;

    -- Detect expired trial from organization row
    SELECT subscription_status, trial_ends_at
      INTO v_sub_status, v_trial_ends_at
    FROM organizations
    WHERE id = v_org_id;

    IF v_trial_ends_at IS NOT NULL
       AND v_trial_ends_at < now()
       AND v_sub_status IN ('trialing', 'trial_expired', 'canceled', NULL)
       AND COALESCE(v_plan, 'none') = 'none'
    THEN
      v_trial_expired := true;
    END IF;

    IF NOT v_onboarding_complete THEN
      v_destination := '/setup';
    ELSIF v_trial_expired THEN
      v_destination := '/pricing';
    ELSE
      v_destination := '/dashboard';
    END IF;
  ELSIF v_has_talent THEN
    v_destination := '/talent/dashboard';
  ELSE
    v_destination := '/setup';
  END IF;

  RETURN jsonb_build_object(
    'destination',          v_destination,
    'has_org',              v_org_id IS NOT NULL,
    'org_id',               v_org_id,
    'org_role',             v_org_role,
    'has_talent',           v_has_talent,
    'onboarding_complete',  COALESCE(v_onboarding_complete, false),
    'plan',                 COALESCE(v_plan, 'none'),
    'trial_expired',        v_trial_expired
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_post_login_destination() TO authenticated;

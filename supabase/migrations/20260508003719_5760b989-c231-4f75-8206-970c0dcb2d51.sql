-- =====================================================================
-- PASS A: Auth & Onboarding Pipeline Hardening
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- F-1: mark_onboarding_complete RPC + block direct client writes
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_onboarding_complete(_path text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_org boolean;
  v_has_talent boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '28000';
  END IF;
  IF _path NOT IN ('org','talent') THEN
    RAISE EXCEPTION 'invalid path: %', _path USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (SELECT 1 FROM organization_members WHERE user_id = v_uid)
    INTO v_has_org;
  SELECT EXISTS (SELECT 1 FROM operator_profiles WHERE user_id = v_uid)
    INTO v_has_talent;

  IF _path = 'org' AND NOT v_has_org THEN
    RAISE EXCEPTION 'cannot complete org onboarding without organization membership' USING ERRCODE = '22023';
  END IF;
  IF _path = 'talent' AND NOT v_has_talent THEN
    RAISE EXCEPTION 'cannot complete talent onboarding without operator profile' USING ERRCODE = '22023';
  END IF;

  -- Mark via session flag so the guard trigger permits the write
  PERFORM set_config('app.via_onboarding_rpc', 'on', true);

  INSERT INTO user_onboarding (user_id, is_complete, current_step, completed_at, has_seen_welcome)
  VALUES (v_uid, true, 'complete', now(), true)
  ON CONFLICT (user_id) DO UPDATE
    SET is_complete = true,
        current_step = 'complete',
        completed_at = COALESCE(user_onboarding.completed_at, now()),
        has_seen_welcome = true,
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'path', _path);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_onboarding_complete(text) TO authenticated;

-- Trigger to block direct client mutation of completion flags
CREATE OR REPLACE FUNCTION public.guard_user_onboarding_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.via_onboarding_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;
  -- Block toggling is_complete to true or arbitrarily expanding completed_steps from client
  IF NEW.is_complete IS DISTINCT FROM OLD.is_complete AND NEW.is_complete = true THEN
    RAISE EXCEPTION 'is_complete must be set via mark_onboarding_complete()' USING ERRCODE = '42501';
  END IF;
  IF NEW.completed_at IS DISTINCT FROM OLD.completed_at AND OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'completed_at must be set via mark_onboarding_complete()' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_onboarding_completion ON public.user_onboarding;
CREATE TRIGGER trg_guard_user_onboarding_completion
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_onboarding_completion();

-- ─────────────────────────────────────────────────────────────────────
-- F-2 / F-5 / F-18: resolve_post_login_destination RPC
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.resolve_post_login_destination()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_org_id uuid;
  v_org_role text;
  v_has_talent boolean;
  v_onboarding_complete boolean;
  v_plan text;
  v_destination text;
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

  SELECT EXISTS (SELECT 1 FROM operator_profiles WHERE user_id = v_uid) INTO v_has_talent;
  SELECT COALESCE(is_complete, false) FROM user_onboarding WHERE user_id = v_uid INTO v_onboarding_complete;

  IF v_org_id IS NOT NULL THEN
    SELECT plan FROM entitlements WHERE organization_id = v_org_id INTO v_plan;
    IF NOT v_onboarding_complete THEN
      v_destination := '/setup';
    ELSE
      v_destination := '/dashboard';
    END IF;
  ELSIF v_has_talent THEN
    v_destination := '/talent/dashboard';
  ELSE
    -- New user, no org and no talent profile → setup chooser
    v_destination := '/setup';
  END IF;

  RETURN jsonb_build_object(
    'destination', v_destination,
    'has_org', v_org_id IS NOT NULL,
    'org_id', v_org_id,
    'org_role', v_org_role,
    'has_talent', v_has_talent,
    'onboarding_complete', COALESCE(v_onboarding_complete, false),
    'plan', COALESCE(v_plan, 'none')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_post_login_destination() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- F-3 / F-17: Entitlement enforcement triggers on premium write tables
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_employer_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_uid uuid := auth.uid();
BEGIN
  -- Platform admins bypass (audited separately)
  IF v_uid IS NOT NULL AND has_role(v_uid, 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id required' USING ERRCODE = '23502';
  END IF;

  SELECT plan FROM entitlements WHERE organization_id = NEW.organization_id INTO v_plan;
  IF v_plan IS NULL OR v_plan = 'free' THEN
    RAISE EXCEPTION 'employer feature requires a paid subscription (current plan: %)', COALESCE(v_plan,'none')
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_entitlement_job_postings ON public.job_postings;
CREATE TRIGGER trg_enforce_entitlement_job_postings
  BEFORE INSERT ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employer_entitlement();

DROP TRIGGER IF EXISTS trg_enforce_entitlement_saved_lists ON public.talent_saved_lists;
CREATE TRIGGER trg_enforce_entitlement_saved_lists
  BEFORE INSERT ON public.talent_saved_lists
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employer_entitlement();

DROP TRIGGER IF EXISTS trg_enforce_entitlement_contact_requests ON public.talent_contact_requests;
CREATE TRIGGER trg_enforce_entitlement_contact_requests
  BEFORE INSERT ON public.talent_contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employer_entitlement();

-- ─────────────────────────────────────────────────────────────────────
-- F-14: Extend recert recorder org-match check
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_recert_actor_and_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NOT NULL THEN
    NEW.acted_by := v_uid;
  END IF;

  -- Org-match supervisor check (skip for platform admins)
  IF v_uid IS NOT NULL AND NOT has_role(v_uid, 'admin'::app_role) THEN
    IF NOT EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = v_uid
        AND om.organization_id = NEW.organization_id
        AND om.role IN ('owner','admin','supervisor')
    ) THEN
      RAISE EXCEPTION 'recert recorder is not a supervisor at the operator''s organization'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.data_access_logs(user_id, organization_id, table_name, record_id, operation, metadata)
  VALUES (
    v_uid, NEW.organization_id, 'oap_recert_events', NEW.id::text, 'recert_event',
    jsonb_build_object(
      'event_type', NEW.event_type, 'enrollment_id', NEW.enrollment_id,
      'operator_user_id', NEW.operator_user_id,
      'previous_due', NEW.previous_due, 'new_due', NEW.new_due, 'reason', NEW.reason
    )
  );
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- F-15: OAP certificate effective-status view + expiry sweep function
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.oap_certificates_effective
WITH (security_invoker = on) AS
SELECT
  c.*,
  CASE
    WHEN c.status = 'revoked' THEN 'revoked'
    WHEN c.status = 'suspended' THEN 'suspended'
    WHEN c.valid_until IS NOT NULL AND c.valid_until < CURRENT_DATE THEN 'expired'
    WHEN c.status = 'active' THEN 'valid'
    ELSE c.status
  END AS effective_status
FROM public.oap_certificates c;

GRANT SELECT ON public.oap_certificates_effective TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.sweep_expired_oap_certificates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Restricted to platform admins / service role
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  WITH updated AS (
    UPDATE public.oap_certificates
       SET status = 'expired', updated_at = now()
     WHERE status = 'active'
       AND valid_until IS NOT NULL
       AND valid_until < CURRENT_DATE
    RETURNING 1
  )
  SELECT COUNT(*) FROM updated INTO v_count;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sweep_expired_oap_certificates() TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────
-- F-19: admin_get_user_pipeline_summary RPC (audited)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_user_pipeline_summary(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_caller IS NULL OR NOT has_role(v_caller, 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: platform admin required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'user_id', _user_id,
    'onboarding', (SELECT to_jsonb(uo) FROM user_onboarding uo WHERE uo.user_id = _user_id),
    'organizations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'organization_id', om.organization_id,
        'role', om.role,
        'plan', e.plan,
        'joined_at', om.joined_at
      ))
      FROM organization_members om
      LEFT JOIN entitlements e ON e.organization_id = om.organization_id
      WHERE om.user_id = _user_id
    ), '[]'::jsonb),
    'talent_profile', (SELECT jsonb_build_object(
        'has_profile', true,
        'profile_visibility', op.profile_visibility,
        'is_discoverable', op.is_discoverable,
        'public_username', op.public_username,
        'public_published_at', op.public_published_at
      ) FROM operator_profiles op WHERE op.user_id = _user_id),
    'gca_certificates', COALESCE((
      SELECT jsonb_object_agg(COALESCE(bank_slug,'unknown'), cnt)
      FROM (
        SELECT bank_slug, COUNT(*) AS cnt
        FROM gca_certificates
        WHERE user_id = _user_id
        GROUP BY bank_slug
      ) g
    ), '{}'::jsonb),
    'oap_certificates', COALESCE((
      SELECT jsonb_object_agg(effective_status, cnt)
      FROM (
        SELECT effective_status, COUNT(*) AS cnt
        FROM oap_certificates_effective
        WHERE user_id = _user_id
        GROUP BY effective_status
      ) o
    ), '{}'::jsonb),
    'user_roles', COALESCE((
      SELECT jsonb_agg(role) FROM user_roles WHERE user_id = _user_id
    ), '[]'::jsonb)
  ) INTO v_result;

  -- Audit
  INSERT INTO public.data_access_logs(user_id, table_name, record_id, operation, metadata)
  VALUES (v_caller, 'admin_pipeline_summary', _user_id::text, 'admin_read',
    jsonb_build_object('target_user_id', _user_id));

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_pipeline_summary(uuid) TO authenticated;

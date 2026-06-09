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

  PERFORM set_config('app.via_onboarding_rpc', 'on', true);

  INSERT INTO public.user_onboarding (
    user_id,
    is_complete,
    current_step,
    completed_at,
    has_seen_welcome,
    setup_wizard_dismissed
  )
  VALUES (v_uid, true, 'complete', now(), true, true)
  ON CONFLICT (user_id) DO UPDATE
    SET is_complete = true,
        current_step = 'complete',
        completed_at = COALESCE(public.user_onboarding.completed_at, now()),
        has_seen_welcome = true,
        setup_wizard_dismissed = true,
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'path', _path);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_onboarding_complete(text) TO authenticated;

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
  v_onboarding_complete boolean := false;
  v_plan text;
  v_sub_status text;
  v_trial_ends_at timestamptz;
  v_trial_expired boolean := false;
  v_destination text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('destination', '/auth');
  END IF;

  SELECT om.organization_id, om.role
    INTO v_org_id, v_org_role
  FROM public.organization_members om
  WHERE om.user_id = v_uid
  ORDER BY om.joined_at ASC
  LIMIT 1;

  SELECT EXISTS (SELECT 1 FROM public.operator_profiles WHERE user_id = v_uid)
    INTO v_has_talent;

  SELECT COALESCE(is_complete, false)
      OR COALESCE(has_seen_welcome, false)
      OR COALESCE(setup_wizard_dismissed, false)
      OR current_step = 'complete'
    INTO v_onboarding_complete
  FROM public.user_onboarding
  WHERE user_id = v_uid;

  v_onboarding_complete := COALESCE(v_onboarding_complete, false);

  IF v_org_id IS NOT NULL THEN
    SELECT plan FROM public.entitlements WHERE organization_id = v_org_id INTO v_plan;

    SELECT subscription_status, trial_ends_at
      INTO v_sub_status, v_trial_ends_at
    FROM public.organizations
    WHERE id = v_org_id;

    IF v_trial_ends_at IS NOT NULL
       AND v_trial_ends_at < now()
       AND (v_sub_status IS NULL OR v_sub_status IN ('trialing', 'trial_expired', 'canceled'))
       AND COALESCE(v_plan, 'none') = 'none'
    THEN
      v_trial_expired := true;
    END IF;

    IF v_trial_expired THEN
      v_destination := '/pricing';
    ELSIF v_onboarding_complete THEN
      v_destination := '/dashboard';
    ELSE
      v_destination := '/setup';
    END IF;
  ELSIF v_has_talent THEN
    v_destination := '/talent/dashboard';
  ELSE
    v_destination := '/setup';
  END IF;

  RETURN jsonb_build_object(
    'destination', v_destination,
    'has_org', v_org_id IS NOT NULL,
    'org_id', v_org_id,
    'org_role', v_org_role,
    'has_talent', v_has_talent,
    'onboarding_complete', v_onboarding_complete,
    'plan', COALESCE(v_plan, 'none'),
    'trial_expired', v_trial_expired
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_post_login_destination() TO authenticated;
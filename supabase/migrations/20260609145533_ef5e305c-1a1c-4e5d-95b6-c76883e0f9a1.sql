-- 1) Owner-claim audit columns on organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS opened_for_operations_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_for_operations_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2) materialize_intake_invites: turn intake user rows into real organization_invites
CREATE OR REPLACE FUNCTION public.materialize_intake_invites(p_engagement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _uid uuid := auth.uid();
  _eng RECORD;
  _payload jsonb;
  _entry jsonb;
  _entries jsonb[];
  _email text;
  _code text;
  _role text;
  _app_role text;
  _created int := 0;
  _skipped int := 0;
  _is_staff boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, organization_id INTO _eng
  FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF _eng.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Engagement not found');
  END IF;

  _is_staff := public.has_role(_uid, 'platform_admin')
            OR public.has_role(_uid, 'developer')
            OR EXISTS (
              SELECT 1 FROM public.onboarding_engagements
              WHERE id = p_engagement_id AND assigned_admin_id = _uid
            );
  IF NOT _is_staff THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Forbidden');
  END IF;

  SELECT payload INTO _payload
  FROM public.onboarding_intake_responses
  WHERE engagement_id = p_engagement_id AND module_key = 'users_roles'
  ORDER BY version DESC
  LIMIT 1;

  IF _payload IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'users_roles intake not submitted yet');
  END IF;

  -- Build a flat array of {role, app_role, email, invite_code, name}
  _entries := ARRAY[]::jsonb[];
  IF _payload ? 'owner' AND _payload->'owner' ? 'email' THEN
    _entries := _entries || jsonb_set(_payload->'owner', '{role}', '"owner"'::jsonb, true);
  END IF;
  IF _payload ? 'supervisors' AND jsonb_typeof(_payload->'supervisors') = 'array' THEN
    FOR _entry IN SELECT jsonb_array_elements(_payload->'supervisors') LOOP
      _entries := _entries || jsonb_set(_entry, '{role}', '"supervisor"'::jsonb, true);
    END LOOP;
  END IF;
  IF _payload ? 'operators' AND jsonb_typeof(_payload->'operators') = 'array' THEN
    FOR _entry IN SELECT jsonb_array_elements(_payload->'operators') LOOP
      _entries := _entries || jsonb_set(_entry, '{role}', '"operator"'::jsonb, true);
    END LOOP;
  END IF;

  FOREACH _entry IN ARRAY _entries LOOP
    _email := lower(trim(coalesce(_entry->>'email', '')));
    _code  := upper(trim(coalesce(_entry->>'invite_code', '')));
    _role  := coalesce(_entry->>'role', 'operator');
    _app_role := coalesce(_entry->>'app_role', NULL);
    CONTINUE WHEN _email = '' OR _code = '';

    -- Skip if invite_code already present (idempotent)
    IF EXISTS (SELECT 1 FROM public.organization_invites WHERE invite_code = _code) THEN
      _skipped := _skipped + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.organization_invites (
      organization_id, invite_code, created_by, org_role, app_role,
      expires_at, max_uses, invited_email, setup_delegate, is_active
    )
    VALUES (
      _eng.organization_id, _code, _uid,
      CASE WHEN _role = 'owner' THEN 'owner'
           WHEN _role = 'supervisor' THEN 'supervisor'
           ELSE 'member' END,
      _app_role,
      now() + interval '30 days', 1, _email, false, true
    );
    _created := _created + 1;
  END LOOP;

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (
    _eng.organization_id, _uid, 'concierge', 'invites.materialized',
    'Materialized ' || _created || ' intake invite codes into organization_invites',
    jsonb_build_object('created', _created, 'skipped_existing', _skipped, 'engagement_id', p_engagement_id)
  );

  RETURN jsonb_build_object('ok', true, 'created', _created, 'skipped_existing', _skipped);
END;
$$;
GRANT EXECUTE ON FUNCTION public.materialize_intake_invites(uuid) TO authenticated;

-- 3) generate_owner_claim_artifacts: ensure owner invite + activation token + return both URLs
CREATE OR REPLACE FUNCTION public.generate_owner_claim_artifacts(
  p_engagement_id uuid,
  p_owner_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _uid uuid := auth.uid();
  _eng RECORD;
  _is_staff boolean;
  _email text;
  _invite RECORD;
  _invite_code text;
  _token_bytes bytea;
  _token_b64 text;
  _token_hash text;
  _expires timestamptz := now() + interval '7 days';
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT e.id, e.organization_id, o.name AS org_name, o.billing_email
    INTO _eng
  FROM public.onboarding_engagements e
  JOIN public.organizations o ON o.id = e.organization_id
  WHERE e.id = p_engagement_id;
  IF _eng.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Engagement not found');
  END IF;

  _is_staff := public.has_role(_uid, 'platform_admin')
            OR public.has_role(_uid, 'developer')
            OR EXISTS (
              SELECT 1 FROM public.onboarding_engagements
              WHERE id = p_engagement_id AND assigned_admin_id = _uid
            );
  IF NOT _is_staff THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Forbidden');
  END IF;

  _email := lower(trim(coalesce(p_owner_email, _eng.billing_email, '')));
  IF _email = '' OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error',
      'Owner email required — set organizations.billing_email or pass p_owner_email');
  END IF;

  -- Ensure owner invite row exists (creates if not)
  SELECT * INTO _invite FROM public.organization_invites
    WHERE organization_id = _eng.organization_id
      AND org_role = 'owner'
      AND invited_email = _email
      AND is_active = true
    ORDER BY created_at DESC LIMIT 1;

  IF _invite.id IS NULL THEN
    _invite_code := upper(encode(extensions.gen_random_bytes(12), 'hex'));
    INSERT INTO public.organization_invites
      (organization_id, invite_code, created_by, org_role, expires_at, max_uses, invited_email, is_active)
    VALUES
      (_eng.organization_id, _invite_code, _uid, 'owner', now() + interval '15 days', 1, _email, true)
    RETURNING * INTO _invite;
  END IF;

  -- Create fresh single-use activation token (24h)
  _token_bytes := extensions.gen_random_bytes(32);
  _token_b64 := translate(encode(_token_bytes, 'base64'), '+/=', '-_');
  _token_hash := encode(extensions.digest(_token_b64, 'sha256'), 'hex');

  INSERT INTO public.account_activation_tokens
    (email, token_hash, organization_id, invite_id, expires_at, created_by)
  VALUES
    (_email, _token_hash, _eng.organization_id, _invite.id, now() + interval '24 hours', _uid);

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES
    (_eng.organization_id, _uid, 'concierge', 'owner.claim_artifacts_generated',
     'Generated owner claim token + invite for ' || _email,
     jsonb_build_object('invite_id', _invite.id, 'invite_code', _invite.invite_code, 'owner_email', _email));

  RETURN jsonb_build_object(
    'ok', true,
    'owner_email', _email,
    'invite_code', _invite.invite_code,
    'invite_url', 'https://app.jobline.ai/auth?invite=' || _invite.invite_code,
    'backup_claim_url', 'https://app.jobline.ai/claim/account-owner',
    'activation_token', _token_b64,
    'activation_url', 'https://app.jobline.ai/activate?token=' || _token_b64,
    'expires_at', (now() + interval '24 hours')::text
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.generate_owner_claim_artifacts(uuid, text) TO authenticated;

-- 4) stamp_owner_claimed: called once when owner finalizes claim
CREATE OR REPLACE FUNCTION public.stamp_owner_claimed(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  -- Must be a member of the org
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = _uid
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not a member of this organization');
  END IF;

  SELECT claimed_at INTO _existing FROM public.organizations WHERE id = p_organization_id;
  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_claimed', true, 'claimed_at', _existing);
  END IF;

  UPDATE public.organizations
    SET claimed_at = now(),
        claimed_by_user_id = _uid,
        activation_state = CASE WHEN activation_state = 'unclaimed'
                                THEN 'claimed'::org_activation_state
                                ELSE activation_state END
    WHERE id = p_organization_id;

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES
    (p_organization_id, _uid, 'owner', 'owner.claimed',
     'Owner account claimed', '{}'::jsonb);

  INSERT INTO public.organization_audit_events
    (organization_id, actor_id, actor_type, event_type, metadata)
  VALUES
    (p_organization_id, _uid, 'user', 'org.claimed', '{}'::jsonb);

  RETURN jsonb_build_object('ok', true, 'claimed_at', now());
END;
$$;
GRANT EXECUTE ON FUNCTION public.stamp_owner_claimed(uuid) TO authenticated;

-- 5) Harden mark_org_open_for_operations: structured missing[] + payment/contract gates
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
  _missing text[] := ARRAY[]::text[];
  _eng RECORD;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO _role FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = _uid;
  IF _role NOT IN ('owner','admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Owner or admin role required');
  END IF;

  FOREACH _step IN ARRAY _required LOOP
    SELECT completed INTO _done
    FROM public.organization_setup_steps
    WHERE organization_id = p_organization_id AND step = _step;
    IF NOT COALESCE(_done, false) THEN
      _missing := _missing || ('setup:' || _step);
    END IF;
  END LOOP;

  -- Active engagement (concierge orgs)
  SELECT id, payment_status, purchased_via, contract_signed_at
    INTO _eng
    FROM public.onboarding_engagements
    WHERE organization_id = p_organization_id
      AND status NOT IN ('live','cancelled')
    ORDER BY created_at DESC LIMIT 1;

  IF _eng.id IS NOT NULL THEN
    IF _eng.payment_status NOT IN ('paid','waived') THEN
      _missing := _missing || 'concierge:payment';
    END IF;
    IF _eng.purchased_via <> 'stripe'
       AND _eng.payment_status <> 'waived'
       AND _eng.contract_signed_at IS NULL THEN
      _missing := _missing || 'concierge:contract_signature';
    END IF;
  END IF;

  IF array_length(_missing, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Setup incomplete', 'missing', _missing);
  END IF;

  UPDATE public.organizations
    SET activation_state = 'open_for_operations',
        opened_for_operations_at = now(),
        opened_for_operations_by = _uid
    WHERE id = p_organization_id;

  INSERT INTO public.organization_audit_events
    (organization_id, actor_id, actor_type, event_type, metadata)
  VALUES (
    p_organization_id, _uid, 'user', 'org.opened_for_operations',
    jsonb_build_object('completed_by_role', _role, 'engagement_id', _eng.id)
  );

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (
    p_organization_id, _uid, _role, 'org.opened_for_operations',
    'Organization opened for operations by ' || _role, '{}'::jsonb
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_org_open_for_operations(uuid) TO authenticated;
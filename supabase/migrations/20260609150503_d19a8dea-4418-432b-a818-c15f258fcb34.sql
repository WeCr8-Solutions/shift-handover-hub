
CREATE OR REPLACE FUNCTION public.generate_owner_claim_artifacts(p_engagement_id uuid, p_owner_email text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;

  SELECT e.id, e.organization_id, o.name AS org_name, o.billing_email INTO _eng
  FROM public.onboarding_engagements e
  JOIN public.organizations o ON o.id = e.organization_id
  WHERE e.id = p_engagement_id;
  IF _eng.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Engagement not found'); END IF;

  _is_staff := public.has_role(_uid, 'admin'::public.app_role)
            OR public.has_role(_uid, 'developer'::public.app_role)
            OR EXISTS (SELECT 1 FROM public.onboarding_engagements WHERE id = p_engagement_id AND assigned_admin_id = _uid);
  IF NOT _is_staff THEN RETURN jsonb_build_object('ok', false, 'error', 'Forbidden'); END IF;

  _email := lower(trim(coalesce(p_owner_email, _eng.billing_email, '')));
  IF _email = '' OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Owner email required — set organizations.billing_email or pass p_owner_email');
  END IF;

  SELECT * INTO _invite FROM public.organization_invites
    WHERE organization_id = _eng.organization_id AND org_role = 'owner' AND invited_email = _email AND is_active = true
    ORDER BY created_at DESC LIMIT 1;

  IF _invite.id IS NULL THEN
    _invite_code := upper(encode(extensions.gen_random_bytes(12), 'hex'));
    INSERT INTO public.organization_invites
      (organization_id, invite_code, created_by, org_role, expires_at, max_uses, invited_email, is_active)
    VALUES (_eng.organization_id, _invite_code, _uid, 'owner', now() + interval '15 days', 1, _email, true)
    RETURNING * INTO _invite;
  END IF;

  _token_bytes := extensions.gen_random_bytes(32);
  _token_b64 := translate(encode(_token_bytes, 'base64'), '+/=', '-_');
  _token_hash := encode(extensions.digest(_token_b64, 'sha256'), 'hex');

  INSERT INTO public.account_activation_tokens
    (email, token_hash, organization_id, invite_id, expires_at, created_by)
  VALUES (_email, _token_hash, _eng.organization_id, _invite.id, now() + interval '24 hours', _uid);

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (_eng.organization_id, _uid, 'concierge', 'owner.claim_artifacts_generated',
     'Generated owner claim token + invite for ' || _email,
     jsonb_build_object('invite_id', _invite.id, 'invite_code', _invite.invite_code, 'owner_email', _email));

  RETURN jsonb_build_object(
    'ok', true, 'owner_email', _email, 'invite_code', _invite.invite_code,
    'invite_url', 'https://app.jobline.ai/auth?invite=' || _invite.invite_code,
    'backup_claim_url', 'https://app.jobline.ai/claim/account-owner',
    'activation_token', _token_b64,
    'activation_url', 'https://app.jobline.ai/activate?token=' || _token_b64,
    'expires_at', (now() + interval '24 hours')::text
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.materialize_intake_invites(p_engagement_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;

  SELECT id, organization_id INTO _eng FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF _eng.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Engagement not found'); END IF;

  _is_staff := public.has_role(_uid, 'admin'::public.app_role)
            OR public.has_role(_uid, 'developer'::public.app_role)
            OR EXISTS (SELECT 1 FROM public.onboarding_engagements WHERE id = p_engagement_id AND assigned_admin_id = _uid);
  IF NOT _is_staff THEN RETURN jsonb_build_object('ok', false, 'error', 'Forbidden'); END IF;

  SELECT payload INTO _payload FROM public.onboarding_intake_responses
  WHERE engagement_id = p_engagement_id AND module_key = 'users_roles'
  ORDER BY version DESC LIMIT 1;
  IF _payload IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'users_roles intake not submitted yet'); END IF;

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
    IF EXISTS (SELECT 1 FROM public.organization_invites WHERE invite_code = _code) THEN
      _skipped := _skipped + 1; CONTINUE;
    END IF;
    INSERT INTO public.organization_invites (
      organization_id, invite_code, created_by, org_role, app_role,
      expires_at, max_uses, invited_email, setup_delegate, is_active
    ) VALUES (
      _eng.organization_id, _code, _uid,
      CASE WHEN _role = 'owner' THEN 'owner' WHEN _role = 'supervisor' THEN 'supervisor' ELSE 'member' END,
      _app_role, now() + interval '30 days', 1, _email, false, true
    );
    _created := _created + 1;
  END LOOP;

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (_eng.organization_id, _uid, 'concierge', 'invites.materialized',
    'Materialized ' || _created || ' intake invite codes into organization_invites',
    jsonb_build_object('created', _created, 'skipped_existing', _skipped, 'engagement_id', p_engagement_id));

  RETURN jsonb_build_object('ok', true, 'created', _created, 'skipped_existing', _skipped);
END;
$function$;

-- Backfill Aymar Engineering audit fields (no created_at on organization_members; pick any owner/admin)
DO $$
DECLARE
  _org uuid := '41f0e268-87d6-4981-b21e-a3c4e8245688';
  _owner uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = _org AND claimed_at IS NULL) THEN
    RETURN;
  END IF;

  SELECT user_id INTO _owner FROM public.organization_members
  WHERE organization_id = _org AND role IN ('owner','admin')
  ORDER BY (role = 'owner') DESC
  LIMIT 1;

  IF _owner IS NULL THEN RETURN; END IF;

  UPDATE public.organizations
    SET claimed_at = COALESCE(claimed_at, now()),
        claimed_by_user_id = COALESCE(claimed_by_user_id, _owner)
    WHERE id = _org;

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (_org, _owner, 'owner', 'owner.claimed',
     'Backfilled claim audit (pre-stamp_owner_claimed redemption)', jsonb_build_object('backfill', true));

  INSERT INTO public.organization_audit_events
    (organization_id, actor_id, actor_type, event_type, metadata)
  VALUES (_org, _owner, 'user', 'org.claimed', jsonb_build_object('backfill', true));
END $$;

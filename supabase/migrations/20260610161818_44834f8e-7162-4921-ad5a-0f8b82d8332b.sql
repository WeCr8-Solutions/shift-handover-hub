
-- =====================================================================
-- Concierge: lookup existing user by email + attach to org engagement
-- =====================================================================

CREATE OR REPLACE FUNCTION public.concierge_lookup_user_by_email(
  _email text,
  _organization_id uuid DEFAULT NULL
)
RETURNS TABLE (
  exists_account boolean,
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  is_member boolean,
  org_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _norm text := lower(trim(_email));
  _uid  uuid;
  _name text;
  _created timestamptz;
  _role text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF _norm IS NULL OR _norm = '' THEN
    RETURN;
  END IF;

  SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), u.created_at
    INTO _uid, _name, _created
  FROM auth.users u
  WHERE lower(u.email) = _norm
  LIMIT 1;

  IF _uid IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, _norm, NULL::text, NULL::timestamptz, false, NULL::text;
    RETURN;
  END IF;

  IF _organization_id IS NOT NULL THEN
    SELECT om.role INTO _role
    FROM public.organization_members om
    WHERE om.organization_id = _organization_id AND om.user_id = _uid
    LIMIT 1;
  END IF;

  RETURN QUERY SELECT true, _uid, _norm, _name, _created, _role IS NOT NULL, _role;
END;
$$;

REVOKE ALL ON FUNCTION public.concierge_lookup_user_by_email(text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.concierge_lookup_user_by_email(text, uuid) TO authenticated;

-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.concierge_attach_existing_user(
  _engagement_id uuid,
  _bucket text,             -- 'owner' | 'supervisor' | 'operator'
  _email text,
  _app_role text DEFAULT NULL,
  _replaces_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _org_id uuid;
  _norm_email text := lower(trim(_email));
  _norm_replaces text := NULLIF(lower(trim(_replaces_email)), '');
  _user_id uuid;
  _existing_payload jsonb;
  _new_payload jsonb;
  _arr_key text;
  _member_role text;
  _invite_id uuid;
  _invite_code text;
BEGIN
  IF NOT public.has_role(_actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF _bucket NOT IN ('owner','supervisor','operator') THEN
    RAISE EXCEPTION 'Invalid bucket %', _bucket USING ERRCODE = '22023';
  END IF;
  IF _norm_email IS NULL OR _norm_email = '' THEN
    RAISE EXCEPTION 'Email required' USING ERRCODE = '22023';
  END IF;

  SELECT organization_id INTO _org_id
  FROM public.onboarding_engagements WHERE id = _engagement_id;
  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Engagement % has no organization', _engagement_id USING ERRCODE = '22023';
  END IF;

  -- Resolve user
  SELECT u.id INTO _user_id FROM auth.users u WHERE lower(u.email) = _norm_email LIMIT 1;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'No existing account for %', _norm_email USING ERRCODE = '22023';
  END IF;

  _member_role := CASE _bucket
    WHEN 'owner' THEN 'owner'
    WHEN 'supervisor' THEN 'supervisor'
    ELSE 'member'
  END;

  -- Add to org (idempotent)
  INSERT INTO public.organization_members (organization_id, user_id, role, joined_at)
  VALUES (_org_id, _user_id, _member_role, now())
  ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = CASE
      WHEN public.organization_members.role = 'owner' THEN public.organization_members.role
      ELSE EXCLUDED.role
    END;

  -- Update the intake payload to record this existing account
  SELECT payload INTO _existing_payload
  FROM public.onboarding_intake_responses
  WHERE engagement_id = _engagement_id AND module_key = 'users_roles'
  LIMIT 1;

  _new_payload := COALESCE(_existing_payload, '{}'::jsonb);

  IF _bucket = 'owner' THEN
    _new_payload := jsonb_set(_new_payload, '{owner}',
      COALESCE(_new_payload->'owner', '{}'::jsonb)
      || jsonb_build_object(
        'email', _norm_email,
        'app_role', COALESCE(_app_role, 'admin'),
        'role', 'admin',
        'existing_user_id', _user_id,
        'attached_at', now()
      ), true);
  ELSE
    _arr_key := _bucket || 's';   -- supervisors / operators
    DECLARE
      _arr jsonb := COALESCE(_new_payload -> _arr_key, '[]'::jsonb);
      _out jsonb := '[]'::jsonb;
      _elem jsonb;
      _matched boolean := false;
      _match_email text;
    BEGIN
      FOR _elem IN SELECT * FROM jsonb_array_elements(_arr) LOOP
        _match_email := lower(trim(COALESCE(_elem->>'email', '')));
        IF (_norm_replaces IS NOT NULL AND _match_email = _norm_replaces)
           OR (_norm_replaces IS NULL AND _match_email = _norm_email) THEN
          _matched := true;
          _out := _out || jsonb_build_array(
            _elem
            || jsonb_build_object(
              'email', _norm_email,
              'app_role', COALESCE(_app_role, _elem->>'app_role', _bucket),
              'role', _bucket,
              'existing_user_id', _user_id,
              'attached_at', now(),
              'replaced_email', _norm_replaces
            )
          );
        ELSE
          _out := _out || jsonb_build_array(_elem);
        END IF;
      END LOOP;

      IF NOT _matched THEN
        _out := _out || jsonb_build_array(
          jsonb_build_object(
            'email', _norm_email,
            'app_role', COALESCE(_app_role, _bucket),
            'role', _bucket,
            'existing_user_id', _user_id,
            'attached_at', now()
          )
        );
      END IF;

      _new_payload := jsonb_set(_new_payload, ARRAY[_arr_key], _out, true);
    END;
  END IF;

  INSERT INTO public.onboarding_intake_responses
    (engagement_id, organization_id, module_key, payload, submitted_by)
  VALUES (_engagement_id, _org_id, 'users_roles', _new_payload, _actor)
  ON CONFLICT (engagement_id, module_key) DO UPDATE
    SET payload = EXCLUDED.payload,
        submitted_by = EXCLUDED.submitted_by,
        updated_at = now();

  -- Burn matching invite (by replaced email, else by attached email)
  UPDATE public.organization_invites
  SET uses_count = GREATEST(uses_count, 1),
      is_active = false,
      updated_at = now()
  WHERE organization_id = _org_id
    AND lower(invited_email) = COALESCE(_norm_replaces, _norm_email)
  RETURNING id, invite_code INTO _invite_id, _invite_code;

  INSERT INTO public.concierge_activity_log (organization_id, actor_user_id, action, summary, details)
  VALUES (_org_id, _actor, 'intake.existing_user_attached',
    format('Attached existing account %s as %s', _norm_email, _bucket),
    jsonb_build_object(
      'engagement_id', _engagement_id,
      'user_id', _user_id,
      'email', _norm_email,
      'bucket', _bucket,
      'member_role', _member_role,
      'replaced_email', _norm_replaces,
      'burned_invite_id', _invite_id,
      'burned_invite_code', _invite_code
    ));

  RETURN jsonb_build_object(
    'ok', true,
    'organization_id', _org_id,
    'user_id', _user_id,
    'email', _norm_email,
    'bucket', _bucket,
    'member_role', _member_role,
    'burned_invite_id', _invite_id,
    'burned_invite_code', _invite_code
  );
END;
$$;

REVOKE ALL ON FUNCTION public.concierge_attach_existing_user(uuid, text, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.concierge_attach_existing_user(uuid, text, text, text, text) TO authenticated;

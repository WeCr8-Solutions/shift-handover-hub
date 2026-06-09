
CREATE OR REPLACE FUNCTION public.invite_setup_delegate(
  p_organization_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

  _invite_code := upper(encode(extensions.gen_random_bytes(18), 'hex'));

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

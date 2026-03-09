
-- =============================================================================
-- Create a SECURITY DEFINER function for invite redemption
-- This replaces the client-side SELECT on organization_invites (now restricted)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.redeem_invite_code(_code text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite RECORD;
  _existing RECORD;
  _member_count integer;
  _seat_limit integer;
  _app_role public.app_role;
  _child_wo_id uuid;
BEGIN
  -- 1. Find and validate invite
  SELECT * INTO _invite
  FROM public.organization_invites
  WHERE invite_code = upper(_code)
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid or inactive invite code');
  END IF;

  -- 2. Check expiration
  IF _invite.expires_at IS NOT NULL AND _invite.expires_at < now() THEN
    UPDATE public.organization_invites SET is_active = false WHERE id = _invite.id;
    RETURN jsonb_build_object('error', 'This invite code has expired (15-day limit). The seat has been returned to the organization for another user.');
  END IF;

  -- 3. Check max uses
  IF _invite.max_uses IS NOT NULL AND _invite.uses_count >= _invite.max_uses THEN
    RETURN jsonb_build_object('error', 'This invite code has reached its maximum number of uses');
  END IF;

  -- 4. Check seat limits
  SELECT COUNT(*) INTO _member_count
  FROM public.organization_members
  WHERE organization_id = _invite.organization_id;

  SELECT (limits->>'users')::integer INTO _seat_limit
  FROM public.entitlements
  WHERE organization_id = _invite.organization_id;

  IF _seat_limit IS NOT NULL AND _member_count >= _seat_limit THEN
    RETURN jsonb_build_object('error', 'This organization has reached its seat limit. Please ask an admin to add more seats.');
  END IF;

  -- 5. Check if already a member
  SELECT id INTO _existing
  FROM public.organization_members
  WHERE organization_id = _invite.organization_id
    AND user_id = _user_id;

  IF FOUND THEN
    RETURN jsonb_build_object('error', 'You are already a member of this organization');
  END IF;

  -- 6. Add to organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_invite.organization_id, _user_id, _invite.org_role);

  -- 7. Add to team if specified
  IF _invite.team_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role, organization_id)
    VALUES (_invite.team_id, _user_id, 'member', _invite.organization_id);
  END IF;

  -- 8. Assign app role if specified
  IF _invite.app_role IS NOT NULL THEN
    _app_role := _invite.app_role::public.app_role;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- 9. Record redemption
  INSERT INTO public.invite_redemptions (invite_id, user_id)
  VALUES (_invite.id, _user_id);

  -- 10. Increment uses_count
  UPDATE public.organization_invites
  SET uses_count = uses_count + 1
  WHERE id = _invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', _invite.organization_id,
    'team_id', _invite.team_id
  );
END;
$$;

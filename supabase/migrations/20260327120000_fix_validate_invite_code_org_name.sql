
-- Fix validate_invite_code to include organization_name in result,
-- avoiding a second client-side query that fails due to RLS for unauthenticated users.

CREATE OR REPLACE FUNCTION public.validate_invite_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite RECORD;
  _org_name text;
BEGIN
  SELECT
    oi.id,
    oi.organization_id,
    oi.team_id,
    oi.org_role,
    oi.app_role,
    oi.expires_at,
    oi.max_uses,
    oi.uses_count,
    oi.is_active,
    o.name AS organization_name
  INTO _invite
  FROM public.organization_invites oi
  JOIN public.organizations o ON o.id = oi.organization_id
  WHERE oi.invite_code = upper(_code)
    AND oi.is_active = true
    AND (oi.expires_at IS NULL OR oi.expires_at > now())
    AND (oi.max_uses IS NULL OR oi.uses_count < oi.max_uses)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  -- Return only safe fields — no invited_email
  RETURN jsonb_build_object(
    'valid', true,
    'id', _invite.id,
    'organization_id', _invite.organization_id,
    'organization_name', _invite.organization_name,
    'team_id', _invite.team_id,
    'org_role', _invite.org_role,
    'app_role', _invite.app_role,
    'expires_at', _invite.expires_at,
    'max_uses', _invite.max_uses,
    'uses_count', _invite.uses_count
  );
END;
$$;

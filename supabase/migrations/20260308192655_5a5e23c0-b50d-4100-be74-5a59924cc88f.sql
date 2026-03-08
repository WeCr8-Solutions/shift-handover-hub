
-- =============================================================================
-- FIX 1: organization_invites — replace public SELECT policy with a secure
--        validation function that excludes invited_email
-- =============================================================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON public.organization_invites;

-- Create a security-definer function that returns only safe columns
CREATE OR REPLACE FUNCTION public.validate_invite_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite RECORD;
BEGIN
  SELECT
    id,
    organization_id,
    team_id,
    org_role,
    app_role,
    expires_at,
    max_uses,
    uses_count,
    is_active
  INTO _invite
  FROM public.organization_invites
  WHERE invite_code = upper(_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  -- Return only safe fields — no invited_email
  RETURN jsonb_build_object(
    'valid', true,
    'id', _invite.id,
    'organization_id', _invite.organization_id,
    'team_id', _invite.team_id,
    'org_role', _invite.org_role,
    'app_role', _invite.app_role,
    'expires_at', _invite.expires_at,
    'max_uses', _invite.max_uses,
    'uses_count', _invite.uses_count
  );
END;
$$;

-- =============================================================================
-- FIX 2: activity_logs_org_admin view — recreate with security_invoker=on
-- =============================================================================

DROP VIEW IF EXISTS public.activity_logs_org_admin;

CREATE VIEW public.activity_logs_org_admin
WITH (security_invoker = on)
AS
SELECT
  al.id,
  al.user_id,
  al.activity_type,
  al.description,
  al.user_display_name,
  al.user_email,
  al.created_at,
  al.metadata,
  al.organization_id
FROM public.activity_logs al
WHERE EXISTS (
  SELECT 1
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
    AND om.organization_id = al.organization_id
);

-- =============================================================================
-- FIX 3: notification_queue — tighten INSERT policy to prevent arbitrary
--        recipient injection by non-admin users
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can create own notifications" ON public.notification_queue;

CREATE POLICY "Authenticated users can create own notifications"
ON public.notification_queue
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin/developer: can insert anything (system notifications, etc.)
  is_dev_or_admin(auth.uid())
  -- Regular users: must set user_id to themselves (no arbitrary recipient)
  OR (user_id = auth.uid())
);

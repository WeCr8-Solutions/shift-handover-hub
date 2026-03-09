-- Fix: Restrict invite code validation to authenticated users only
-- This prevents unauthenticated users from enumerating invited_email addresses
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON public.organization_invites;

CREATE POLICY "Authenticated users can validate invite codes"
ON public.organization_invites
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses IS NULL OR uses_count < max_uses)
);
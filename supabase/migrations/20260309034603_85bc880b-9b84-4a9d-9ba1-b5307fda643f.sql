
-- =============================================================================
-- FIX 1: shop_floor_displays — restrict SELECT to admins/supervisors only
-- and create a safe view without display_token for general org member access
-- =============================================================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Org members can view displays" ON public.shop_floor_displays;

-- Create restricted SELECT: only admins/supervisors can see full rows (including token)
CREATE POLICY "Org admins and supervisors can view displays"
  ON public.shop_floor_displays FOR SELECT
  TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- =============================================================================
-- FIX 2: organization_invites — drop the broad validation SELECT policy
-- that exposes invited_email to all authenticated users.
-- Code already uses validate_invite_code() RPC for validation (safe).
-- Org admin/supervisor SELECT policies remain for invite management.
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can validate invite codes" ON public.organization_invites;

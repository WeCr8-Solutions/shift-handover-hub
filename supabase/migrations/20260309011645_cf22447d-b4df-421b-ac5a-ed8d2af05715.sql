-- Fix privilege escalation: restrict self-join to 'member' role only
DROP POLICY IF EXISTS "Users can join as owner or admins can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can join as member or admins can add members" ON public.organization_members;

CREATE POLICY "Users can join as member or admins can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Self-join: user can only add themselves with 'member' role
  ((auth.uid() = user_id) AND (role = 'member'))
  -- Org admins/owners can add anyone with any role
  OR public.is_org_admin(auth.uid(), organization_id)
  -- Platform admins can add anyone
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);
-- Fix: Allow organization creator to bootstrap themselves as 'owner'
-- The previous security fix restricted self-joins to 'member' only,
-- which broke org creation (creator must be 'owner').
-- Solution: Also allow 'owner' when the user is the org's created_by.

DROP POLICY IF EXISTS "Users can join as member or admins can add members" ON public.organization_members;

CREATE POLICY "Users can join as member or admins can add members"
ON public.organization_members FOR INSERT TO authenticated
WITH CHECK (
  -- Self-join as member (normal invite redemption)
  ((auth.uid() = user_id) AND (role = 'member'))
  -- Org creator bootstrap: allow self-insert as owner if user created the org
  OR (
    (auth.uid() = user_id)
    AND (role = 'owner')
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id
        AND o.created_by = auth.uid()
    )
    -- Only allow if no owner exists yet (prevents re-claiming)
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.role = 'owner'
    )
  )
  -- Org admins can add anyone
  OR public.is_org_admin(auth.uid(), organization_id)
  -- Platform admins can add anyone
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);
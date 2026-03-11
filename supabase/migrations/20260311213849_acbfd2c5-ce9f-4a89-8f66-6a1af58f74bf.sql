
-- Fix privilege escalation: restrict org admins from assigning/escalating to 'owner' role

-- 1. Drop and recreate INSERT policy with role restriction on org-admin branch
DROP POLICY IF EXISTS "Users can join as member or admins can add members" ON public.organization_members;

CREATE POLICY "Users can join as member or admins can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Self-join as member (e.g. via invite code)
  ((auth.uid() = user_id) AND (role = 'member'))
  -- Creator bootstrap: self-insert as owner only if org creator and no owner exists yet
  OR (
    (auth.uid() = user_id)
    AND (role = 'owner')
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_members.organization_id
        AND o.created_by = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.role = 'owner'
    )
  )
  -- Org admins can add members with admin or member role ONLY (not owner)
  OR (
    is_org_admin(auth.uid(), organization_id)
    AND role IN ('admin', 'member')
  )
  -- Platform admins can assign any role
  OR has_role(auth.uid(), 'admin'::public.app_role)
);

-- 2. Drop and recreate UPDATE policy with WITH CHECK preventing owner assignment
DROP POLICY IF EXISTS "Org admins can update member roles" ON public.organization_members;

CREATE POLICY "Org admins can update member roles"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (is_org_admin(auth.uid(), organization_id))
WITH CHECK (
  -- Org admins cannot set role to 'owner'
  (is_org_admin(auth.uid(), organization_id) AND role IN ('admin', 'member'))
  -- Platform admins can set any role
  OR has_role(auth.uid(), 'admin'::public.app_role)
);

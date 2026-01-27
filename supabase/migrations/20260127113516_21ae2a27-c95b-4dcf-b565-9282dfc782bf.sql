-- Drop existing policy and recreate with better naming to avoid conflicts
DROP POLICY IF EXISTS "Supervisors can view org user roles" ON public.user_roles;

-- Supervisors can view roles of users in their organization (read-only)
CREATE POLICY "Supervisors view org member roles"
ON public.user_roles FOR SELECT
USING (
  has_role(auth.uid(), 'supervisor')
  AND EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
    AND om2.user_id = user_roles.user_id
  )
);
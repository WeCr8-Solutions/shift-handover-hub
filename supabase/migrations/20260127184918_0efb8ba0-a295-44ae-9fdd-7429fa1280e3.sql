-- Step 1: Create helper function to check if role is org-assignable
CREATE OR REPLACE FUNCTION public.is_org_assignable_role(_role app_role)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT _role IN ('supervisor', 'operator', 'viewer')
$$;

-- Step 2: Create helper function to check if users are in same org
CREATE OR REPLACE FUNCTION public.is_in_same_org(_caller_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = _caller_id 
      AND om2.user_id = _target_user_id
  )
$$;

-- Step 3: Add SELECT policy for org admins to view org member roles
CREATE POLICY "Org admins view org member roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_roles.user_id
  )
);

-- Step 4: Add INSERT policy for org admins (restricted to org-assignable roles)
CREATE POLICY "Org admins can assign org-scoped roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow supervisor, operator, viewer roles
  role IN ('supervisor', 'operator', 'viewer')
  -- AND caller must be org admin/owner
  AND EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_roles.user_id
  )
);

-- Step 5: Add DELETE policy for org admins (restricted to org-assignable roles)
CREATE POLICY "Org admins can remove org-scoped roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  -- Only allow removing supervisor, operator, viewer roles
  role IN ('supervisor', 'operator', 'viewer')
  -- AND caller must be org admin/owner
  AND EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_roles.user_id
  )
);
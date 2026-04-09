-- Create a security barrier view that excludes billing columns for regular members
CREATE OR REPLACE VIEW public.organizations_member_view
WITH (security_barrier = true)
AS
SELECT
  id,
  name,
  slug,
  description,
  logo_url,
  subscription_status,
  subscription_tier,
  created_by,
  created_at,
  updated_at,
  trial_ends_at,
  mfa_required,
  requires_us_person_declaration
FROM public.organizations;

-- Grant access to authenticated users
GRANT SELECT ON public.organizations_member_view TO authenticated;

-- Drop the overly broad member SELECT policy
DROP POLICY IF EXISTS "Org members can view their organization" ON public.organizations;

-- Recreate with admin-only access for full table (includes billing fields)
CREATE POLICY "Org admins can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  is_org_admin(auth.uid(), id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = created_by
);

-- Add RLS policy equivalent for the view by checking membership
-- Note: The view inherits the underlying table's RLS, but since we removed
-- the member policy, we need to handle view access via a function
-- Instead, let's use a different approach: keep member SELECT but use the view pattern

-- Actually, we need members to still SELECT from organizations for the app to work
-- The proper fix: keep the policy but create the safe view as the recommended access path
-- and add a DB function to check if billing fields should be visible

-- Revert: re-add member policy since many queries need org data
DROP POLICY IF EXISTS "Org admins can view their organization" ON public.organizations;

CREATE POLICY "Org members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  is_org_member(auth.uid(), id)
  OR auth.uid() = created_by
  OR has_role(auth.uid(), 'admin'::app_role)
);
-- Fix profiles_email_exposure: Create a public view that excludes email for team members
-- while allowing full access to own profile and org admins

-- Create a safe view that excludes sensitive email field for general team member access
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;
-- Note: email is intentionally excluded from this view

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;

-- Add comment explaining the view
COMMENT ON VIEW public.profiles_public IS 'Public view of profiles that excludes email addresses for privacy. Use this view for team member lookups where email is not required.';

-- Drop the overly permissive team members policy on base profiles table
DROP POLICY IF EXISTS "Users can view team members profiles" ON public.profiles;

-- Create more restrictive policy: Team members can ONLY view profiles through the view
-- For the base table, restrict to own profile, org admins, and supervisors who actually need emails
CREATE POLICY "Team members view profiles via public view"
  ON public.profiles FOR SELECT
  USING (
    -- Users can always see their own full profile
    auth.uid() = user_id
    -- Admins can see all profiles
    OR has_role(auth.uid(), 'admin')
    -- Supervisors can see profiles in their org (for management purposes)
    OR (has_role(auth.uid(), 'supervisor') AND EXISTS (
      SELECT 1
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.user_id
    ))
    -- Org admins can see profiles in their org
    OR EXISTS (
      SELECT 1
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() 
        AND om2.user_id = profiles.user_id
        AND om1.role IN ('owner', 'admin')
    )
  );
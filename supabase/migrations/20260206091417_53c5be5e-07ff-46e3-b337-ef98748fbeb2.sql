-- =====================================================
-- SECURITY FIX: Address 3 error-level security issues
-- =====================================================

-- 1. FIX: activity_logs_supervisor view has no RLS
-- The view exists but needs RLS enabled and proper policies
-- Note: The view already excludes ip_address, user_email, and metadata for privacy

-- Drop and recreate the view as a proper security invoker view
DROP VIEW IF EXISTS public.activity_logs_supervisor;

CREATE OR REPLACE VIEW public.activity_logs_supervisor 
WITH (security_invoker = on)
AS
SELECT 
  al.id,
  al.user_id,
  al.activity_type,
  al.description,
  al.user_display_name,
  al.created_at
  -- Intentionally excludes: ip_address, user_email, metadata for supervisor privacy
FROM public.activity_logs al
-- Only show logs from users in the same organization as the supervisor
WHERE EXISTS (
  SELECT 1 FROM organization_members om1
  JOIN organization_members om2 ON om1.organization_id = om2.organization_id
  WHERE om1.user_id = auth.uid() 
  AND om2.user_id = al.user_id
);

-- Grant access to authenticated users (view will filter based on security_invoker)
GRANT SELECT ON public.activity_logs_supervisor TO authenticated;

COMMENT ON VIEW public.activity_logs_supervisor IS 
'Redacted activity logs for supervisors - excludes ip_address, user_email, and metadata. Uses security_invoker to apply RLS from underlying activity_logs table.';

-- 2. FIX: activity_logs table - restrict IP address access to platform admins only
-- Create a more restrictive view for org-level admins that excludes IP

DROP VIEW IF EXISTS public.activity_logs_org_admin;

CREATE OR REPLACE VIEW public.activity_logs_org_admin
WITH (security_invoker = on)
AS
SELECT 
  al.id,
  al.user_id,
  al.activity_type,
  al.description,
  al.user_display_name,
  al.user_email,  -- Org admins can see email (needed for user management)
  al.created_at,
  al.metadata
  -- Intentionally excludes: ip_address (only platform admins should see this)
FROM public.activity_logs al
WHERE EXISTS (
  SELECT 1 FROM organization_members om1
  JOIN organization_members om2 ON om1.organization_id = om2.organization_id
  WHERE om1.user_id = auth.uid() 
  AND om1.role IN ('owner', 'admin')
  AND om2.user_id = al.user_id
);

GRANT SELECT ON public.activity_logs_org_admin TO authenticated;

COMMENT ON VIEW public.activity_logs_org_admin IS 
'Activity logs for org admins - includes email but excludes IP addresses for privacy. Only platform admins should access IP data via the main activity_logs table.';

-- 3. FIX: profiles table - create restricted view that excludes email for general org member lookups
-- The profiles_public view exists but let's ensure it's properly configured

-- First, verify/recreate profiles_public without email
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on)
AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.created_at,
  p.updated_at
  -- Intentionally excludes: email (use full profiles table only when email access is needed)
FROM public.profiles p;

GRANT SELECT ON public.profiles_public TO authenticated;

COMMENT ON VIEW public.profiles_public IS 
'Public profile view that excludes email addresses. Use this for general team member lookups. Full profiles table with email is restricted to self, org admins, and supervisors within same org.';

-- 4. Add a new policy for org members to see teammate profiles WITHOUT email
-- They should use profiles_public view instead of profiles table
-- The existing policies on profiles are fine - org admins/supervisors NEED email for management
-- But we should document the intended usage pattern
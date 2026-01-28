-- Fix 1: Secure profiles_public view with security_invoker
-- Drop and recreate the view with security_invoker = on
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE VIEW public.profiles_public 
WITH (security_invoker = on)
AS SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT to authenticated users only
GRANT SELECT ON public.profiles_public TO authenticated;
REVOKE ALL ON public.profiles_public FROM anon;

-- Fix 2: Restrict supervisor access to activity logs - hide IP addresses
-- Create a view for supervisors that excludes sensitive data
DROP VIEW IF EXISTS public.activity_logs_supervisor;

CREATE OR REPLACE VIEW public.activity_logs_supervisor
WITH (security_invoker = on)
AS SELECT 
  id,
  user_id,
  user_display_name,
  activity_type,
  description,
  created_at
  -- Intentionally excludes: ip_address, user_email, metadata (may contain sensitive info)
FROM public.activity_logs;

-- Grant access to authenticated users
GRANT SELECT ON public.activity_logs_supervisor TO authenticated;

-- Update the supervisor activity log RLS policy to use more restrictive access
-- Drop the old permissive supervisor policy and replace with a more restrictive one
DROP POLICY IF EXISTS "Supervisors can view org activity logs" ON public.activity_logs;

-- Supervisors can now only view via the restricted view, not the main table
-- They should use activity_logs_supervisor view instead
-- Keep admins with full access to the main table

-- Fix 3: Add index for email rate limiting performance
CREATE INDEX IF NOT EXISTS idx_email_rate_limits_user_sent ON public.email_rate_limits(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_email_rate_limits_recipient_sent ON public.email_rate_limits(recipient, sent_at);

-- ============================================================
-- SECURITY FIX: Org-scoped data isolation and sensitive data protection
-- ============================================================

-- 1. FIX: current_station_status - Supervisors should only see their org's stations
DROP POLICY IF EXISTS "Admins and supervisors can view all station status" ON public.current_station_status;

CREATE POLICY "Admins can view all station status"
ON public.current_station_status FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can view org station status"
ON public.current_station_status FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stations s
    JOIN teams t ON s.team_id = t.id
    WHERE s.id = current_station_status.station_id
      AND t.organization_id IS NOT NULL
      AND is_supervisor_in_org(auth.uid(), t.organization_id)
  )
);

-- 2. FIX: app_settings - Supervisors should only see their org's settings
DROP POLICY IF EXISTS "Members can view settings" ON public.app_settings;

CREATE POLICY "Members can view org and team settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (
  -- Platform admin sees all
  has_role(auth.uid(), 'admin'::app_role)
  -- Org members see org settings
  OR ((organization_id IS NOT NULL) AND is_org_member(auth.uid(), organization_id))
  -- Team members see team settings  
  OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id))
  -- Supervisors see their org's settings only (not global)
  OR (
    has_role(auth.uid(), 'supervisor'::app_role) 
    AND organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), organization_id)
  )
);

-- 3. FIX: organization_webhooks - Create a view to hide secrets from non-admins
DROP VIEW IF EXISTS public.organization_webhooks_safe;

CREATE VIEW public.organization_webhooks_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  organization_id,
  name,
  url,
  events,
  is_active,
  retry_count,
  timeout_seconds,
  created_at,
  updated_at,
  created_by
  -- NOTE: 'secret' column is intentionally excluded
FROM public.organization_webhooks;

COMMENT ON VIEW public.organization_webhooks_safe IS 'Safe view of webhooks without exposing secrets. Use this for non-admin queries.';

-- 4. FIX: Ensure profiles_public view has security_invoker set
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  created_at,
  updated_at
  -- NOTE: email is intentionally excluded for privacy
FROM public.profiles;

COMMENT ON VIEW public.profiles_public IS 'Public-safe view of profiles without email addresses.';

-- 5. FIX: activity_logs_supervisor - Ensure security_invoker is set
DROP VIEW IF EXISTS public.activity_logs_supervisor;

CREATE VIEW public.activity_logs_supervisor
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  user_display_name,
  activity_type,
  description,
  created_at
  -- NOTE: ip_address, user_email, and metadata are excluded for privacy
FROM public.activity_logs;

COMMENT ON VIEW public.activity_logs_supervisor IS 'Privacy-safe view of activity logs for supervisors, excluding IP addresses and emails.';

-- 6. FIX: Add explicit authenticated-only policies for profiles
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

CREATE POLICY "Block anonymous access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- 7. FIX: Ensure stripe_events blocks regular user access
DROP POLICY IF EXISTS "Block user access to stripe events" ON public.stripe_events;

CREATE POLICY "Block user access to stripe events"
ON public.stripe_events FOR SELECT
TO authenticated
USING (
  -- Only platform developers can view stripe events
  has_role(auth.uid(), 'developer'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

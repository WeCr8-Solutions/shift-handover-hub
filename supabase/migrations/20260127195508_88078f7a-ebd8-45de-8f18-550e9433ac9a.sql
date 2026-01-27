-- =====================================================
-- SECURITY FIX: Entitlement Limit Enforcement & Email Rate Limiting
-- =====================================================

-- 1. Create function to check feature access
CREATE OR REPLACE FUNCTION public.check_feature_access(
  _org_id UUID,
  _feature TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_feature BOOLEAN;
BEGIN
  -- Get feature from entitlements
  SELECT COALESCE((features->>_feature)::BOOLEAN, false) INTO _has_feature
  FROM entitlements WHERE organization_id = _org_id;
  
  RETURN COALESCE(_has_feature, false);
END;
$$;

-- 2. Create function to check entitlement limits
CREATE OR REPLACE FUNCTION public.check_limit_access(
  _org_id UUID,
  _limit_key TEXT,
  _increment INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count INT;
  _limit INT;
BEGIN
  -- Get limit from entitlements
  SELECT COALESCE((limits->>_limit_key)::INT, 0) INTO _limit
  FROM entitlements WHERE organization_id = _org_id;
  
  -- If no limit set, allow (unlimited)
  IF _limit IS NULL OR _limit = 0 THEN
    RETURN true;
  END IF;
  
  -- Count current usage based on limit type
  IF _limit_key = 'stations' THEN
    SELECT COUNT(*) INTO _current_count FROM stations 
    WHERE organization_id = _org_id;
  ELSIF _limit_key = 'work_orders_per_month' THEN
    SELECT COUNT(*) INTO _current_count FROM queue_items 
    WHERE organization_id = _org_id 
    AND item_type = 'work_order'
    AND created_at >= date_trunc('month', CURRENT_DATE);
  ELSIF _limit_key = 'users' THEN
    SELECT COUNT(*) INTO _current_count FROM organization_members
    WHERE organization_id = _org_id;
  ELSE
    -- Unknown limit key, allow
    RETURN true;
  END IF;
  
  RETURN (_current_count + _increment) <= _limit;
END;
$$;

-- 3. Add RLS policy for station limits enforcement
CREATE POLICY "Enforce station limits on insert"
ON stations FOR INSERT
WITH CHECK (
  organization_id IS NULL OR
  check_limit_access(organization_id, 'stations', 1)
);

-- 4. Add RLS policy for organization member limits enforcement  
CREATE POLICY "Enforce user limits on insert"
ON organization_members FOR INSERT
WITH CHECK (
  check_limit_access(organization_id, 'users', 1)
);

-- 5. Add RLS policy for work order limits enforcement
CREATE POLICY "Enforce work order limits on insert"
ON queue_items FOR INSERT
WITH CHECK (
  item_type != 'work_order' OR
  organization_id IS NULL OR
  check_limit_access(organization_id, 'work_orders_per_month', 1)
);

-- =====================================================
-- EMAIL RATE LIMITING TABLE
-- =====================================================

-- 6. Create email rate limits table for persistent rate limiting
CREATE TABLE public.email_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient rate limit queries
CREATE INDEX idx_email_rate_limits_user_window 
ON email_rate_limits(user_id, sent_at DESC);

CREATE INDEX idx_email_rate_limits_recipient_window 
ON email_rate_limits(recipient, sent_at DESC);

-- Enable RLS
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage this table (edge functions use service role)
CREATE POLICY "Service role only"
ON email_rate_limits FOR ALL
USING (false)
WITH CHECK (false);

-- =====================================================
-- PROFILES EMAIL EXPOSURE FIX
-- =====================================================

-- 7. Drop overly permissive policies on profiles table
DROP POLICY IF EXISTS "Team members view profiles via public view" ON profiles;
DROP POLICY IF EXISTS "Supervisors can view org profiles" ON profiles;

-- 8. Create more restrictive policies
-- Users can always view their own profile
-- Platform admins can view all profiles
-- Org admins can view profiles of their org members (for admin tasks)
CREATE POLICY "Org admins can view org member profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() 
    AND om1.role IN ('owner', 'admin')
    AND om2.user_id = profiles.user_id
  )
);

-- Supervisors can view org member profiles for operational needs
CREATE POLICY "Supervisors can view org member profiles"
ON profiles FOR SELECT
USING (
  has_role(auth.uid(), 'supervisor'::app_role) AND
  EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() 
    AND om2.user_id = profiles.user_id
  )
);
-- Phase 1: Auto-Create Entitlements on Organization Creation
-- This fixes the critical issue where new orgs have no entitlements

-- 1. Create trigger function with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.auto_create_org_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create free tier entitlements for new org
  INSERT INTO public.entitlements (
    organization_id,
    plan,
    features,
    limits
  ) VALUES (
    NEW.id,
    'free',
    '{"handoff_hub": true, "work_orders": true, "analytics": false, "api_access": false, "bulk_upload": false}'::jsonb,
    '{"users": 5, "work_orders_per_month": 100, "stations": 3}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- 2. Create trigger on organizations table
CREATE TRIGGER trigger_auto_create_entitlements
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_org_entitlements();

-- 3. Backfill existing orgs without entitlements
INSERT INTO public.entitlements (organization_id, plan, features, limits)
SELECT 
  o.id,
  'free',
  '{"handoff_hub": true, "work_orders": true, "analytics": false, "api_access": false, "bulk_upload": false}'::jsonb,
  '{"users": 5, "work_orders_per_month": 100, "stations": 3}'::jsonb
FROM public.organizations o
LEFT JOIN public.entitlements e ON o.id = e.organization_id
WHERE e.id IS NULL;
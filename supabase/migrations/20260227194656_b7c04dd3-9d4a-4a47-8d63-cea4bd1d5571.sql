
-- Update the auto_create_org_entitlements function to include erp_connector: false by default
CREATE OR REPLACE FUNCTION public.auto_create_org_entitlements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.entitlements (
    organization_id,
    plan,
    features,
    limits
  ) VALUES (
    NEW.id,
    'free',
    '{"handoff_hub": true, "work_orders": true, "analytics": false, "api_access": false, "bulk_upload": false, "erp_connector": false}'::jsonb,
    '{"users": 5, "work_orders_per_month": 100, "stations": 3}'::jsonb
  );
  RETURN NEW;
END;
$function$;

-- Update existing free/single/team entitlements to explicitly set erp_connector = false
UPDATE public.entitlements
SET features = features || '{"erp_connector": false}'::jsonb
WHERE plan IN ('free', 'single', 'team')
  AND NOT (features ? 'erp_connector');

-- Update existing enterprise entitlements to set erp_connector = true
UPDATE public.entitlements
SET features = features || '{"erp_connector": true}'::jsonb
WHERE plan = 'enterprise'
  AND NOT (features ? 'erp_connector');


-- Fix: Recreate view with SECURITY INVOKER (default in newer PG, but explicit is better)
DROP VIEW IF EXISTS public.erp_connections_safe;

CREATE VIEW public.erp_connections_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  organization_id,
  erp_vendor,
  instance_type,
  api_base_url,
  oauth_token_endpoint,
  scopes,
  tenant_identifier,
  sync_interval_minutes,
  is_active,
  last_tested_at,
  connection_status,
  metadata,
  created_by,
  created_at,
  updated_at
FROM public.erp_connections;

COMMENT ON VIEW public.erp_connections_safe IS 'Secure view excluding client_id/secret columns. Uses SECURITY INVOKER so RLS of querying user applies.';

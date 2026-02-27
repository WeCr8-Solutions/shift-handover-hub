
-- Create a secure view that excludes sensitive credential columns
CREATE OR REPLACE VIEW public.erp_connections_safe AS
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

-- Grant access to the view (inherits RLS from underlying table)
COMMENT ON VIEW public.erp_connections_safe IS 'Secure view excluding client_id_encrypted and client_secret_encrypted columns. Frontend should query this view.';

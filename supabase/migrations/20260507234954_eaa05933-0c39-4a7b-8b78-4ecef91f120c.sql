-- Safe view: organization_integrations (excludes credentials_encrypted and config)
CREATE OR REPLACE VIEW public.organization_integrations_safe
WITH (security_invoker=off) AS
SELECT
  id, organization_id, provider, name, status,
  last_sync_at, error_message, created_by, created_at, updated_at
FROM public.organization_integrations
WHERE
  public.is_org_member(organization_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.organization_integrations_safe TO authenticated;

-- Safe view: organization_api_keys (excludes key_hash)
CREATE OR REPLACE VIEW public.organization_api_keys_safe
WITH (security_invoker=off) AS
SELECT
  id, organization_id, name, key_prefix, scopes,
  last_used_at, expires_at, is_active,
  created_by, created_at, revoked_at, revoked_by
FROM public.organization_api_keys
WHERE
  public.is_org_admin(organization_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role);

GRANT SELECT ON public.organization_api_keys_safe TO authenticated;
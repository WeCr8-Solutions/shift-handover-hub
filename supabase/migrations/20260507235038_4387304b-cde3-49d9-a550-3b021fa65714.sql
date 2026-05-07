-- Drop the SECURITY DEFINER views from the previous step
DROP VIEW IF EXISTS public.organization_integrations_safe;
DROP VIEW IF EXISTS public.organization_api_keys_safe;

-- Helper functions returning only safe columns
CREATE OR REPLACE FUNCTION public.get_organization_integrations_safe(_org_id uuid)
RETURNS TABLE (
  id uuid, organization_id uuid, provider text, name text, status text,
  last_sync_at timestamptz, error_message text, created_by uuid,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, organization_id, provider, name, status,
         last_sync_at, error_message, created_by, created_at, updated_at
  FROM public.organization_integrations
  WHERE organization_id = _org_id
    AND (
      public.is_org_member(_org_id, auth.uid())
      OR public.has_role(auth.uid(), 'admin'::app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.get_organization_integrations_safe(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_integrations_safe(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_organization_api_keys_safe(_org_id uuid)
RETURNS TABLE (
  id uuid, organization_id uuid, name text, key_prefix text, scopes text[],
  last_used_at timestamptz, expires_at timestamptz, is_active boolean,
  created_by uuid, created_at timestamptz, revoked_at timestamptz, revoked_by uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, organization_id, name, key_prefix, scopes,
         last_used_at, expires_at, is_active,
         created_by, created_at, revoked_at, revoked_by
  FROM public.organization_api_keys
  WHERE organization_id = _org_id
    AND (
      public.is_org_admin(_org_id, auth.uid())
      OR public.has_role(auth.uid(), 'admin'::app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.get_organization_api_keys_safe(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_api_keys_safe(uuid) TO authenticated;
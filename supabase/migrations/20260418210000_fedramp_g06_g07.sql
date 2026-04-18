-- FedRAMP G-06: SAML 2.0 / SSO Configuration
-- Controls: IA-2, IA-8, AC-2
-- Stores per-org SAML IdP metadata and SP configuration.
-- NOTE: Actual SAML token processing requires Supabase Enterprise plan.
--       This table stores the configuration for the SSO admin UI and
--       is pre-wired for when the Enterprise plan is enabled.

CREATE TABLE IF NOT EXISTS public.sso_configurations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled             BOOLEAN     NOT NULL DEFAULT false,
  provider_name       TEXT,       -- 'Azure AD', 'Okta', 'Google Workspace', 'ADFS', 'Custom SAML 2.0'
  metadata_url        TEXT,       -- IdP metadata URL for auto-configuration
  idp_entity_id       TEXT,       -- IdP Entity ID (from metadata)
  idp_sso_url         TEXT,       -- IdP Single Sign-On URL
  idp_certificate     TEXT,       -- IdP signing certificate (PEM, stored for validation)
  attribute_email     TEXT NOT NULL DEFAULT 'email',        -- SAML attribute → email
  attribute_name      TEXT NOT NULL DEFAULT 'displayName',  -- SAML attribute → display name
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;

-- Org admins/owners can read and write their SSO config
CREATE POLICY "Org admins can manage SSO configuration"
  ON public.sso_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = sso_configurations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = sso_configurations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  );

-- Service role access (for edge functions reading config)
CREATE POLICY "Service role full SSO config access"
  ON public.sso_configurations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_sso_configurations()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sso_configurations_updated_at
  BEFORE UPDATE ON public.sso_configurations
  FOR EACH ROW EXECUTE FUNCTION public.touch_sso_configurations();

-- ---------------------------------------------------------------------------
-- FedRAMP G-07: SIEM Log Export Configuration
-- Controls: AU-6, AU-9
-- Stores per-org SIEM endpoint settings for the log-export edge function.
-- The auth_token field should be treated as sensitive — store only in this
-- table (not in client-side code), accessed only by the service role.

CREATE TABLE IF NOT EXISTS public.siem_configurations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled              BOOLEAN     NOT NULL DEFAULT false,
  provider_type        TEXT        NOT NULL DEFAULT 'custom',
    -- CHECK: 'splunk' | 'sentinel' | 'qradar' | 'elastic' | 'custom'
  endpoint_url         TEXT,       -- SIEM ingest URL
  auth_header_name     TEXT        NOT NULL DEFAULT 'Authorization',
  auth_token           TEXT,       -- Bearer token / API key (plaintext; protect via RLS)
  event_format         TEXT        NOT NULL DEFAULT 'json',
    -- CHECK: 'json' | 'cef'
  min_severity         TEXT        NOT NULL DEFAULT 'info',
    -- Only export events at or above this severity: 'debug' | 'info' | 'warning' | 'error'
  last_export_at       TIMESTAMPTZ,
  export_error_count   INTEGER     NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.siem_configurations ENABLE ROW LEVEL SECURITY;

-- Org admins/owners can manage their SIEM config
CREATE POLICY "Org admins can manage SIEM configuration"
  ON public.siem_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = siem_configurations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = siem_configurations.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  );

-- Service role full access (edge function log-export reads this)
CREATE POLICY "Service role full SIEM config access"
  ON public.siem_configurations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_siem_configurations()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER siem_configurations_updated_at
  BEFORE UPDATE ON public.siem_configurations
  FOR EACH ROW EXECUTE FUNCTION public.touch_siem_configurations();

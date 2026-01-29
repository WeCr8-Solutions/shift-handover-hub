
-- =====================================================
-- MULTI-TENANT SAAS DATABASE STRUCTURES
-- =====================================================

-- 1. API KEYS - Allow organizations to generate API keys for external integrations
CREATE TABLE public.organization_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL, -- First 8 chars for identification (e.g., "org_live_")
  key_hash text NOT NULL, -- Hashed full key (never store plain text)
  scopes text[] DEFAULT '{}', -- e.g., ['read:handoffs', 'write:queue']
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid
);

-- 2. WEBHOOKS - Per-org webhook configuration for external integrations
CREATE TABLE public.organization_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  secret text, -- Webhook signing secret (hashed)
  events text[] NOT NULL DEFAULT '{}', -- e.g., ['handoff.created', 'work_order.completed']
  is_active boolean DEFAULT true,
  retry_count integer DEFAULT 3,
  timeout_seconds integer DEFAULT 30,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. WEBHOOK DELIVERIES - Track webhook delivery attempts
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.organization_webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  attempt_count integer DEFAULT 1,
  delivered_at timestamptz,
  next_retry_at timestamptz,
  status text DEFAULT 'pending', -- pending, delivered, failed, retrying
  created_at timestamptz DEFAULT now()
);

-- 4. USAGE METERING - Track resource usage per org for billing
CREATE TABLE public.organization_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  metric_type text NOT NULL, -- 'api_calls', 'storage_gb', 'active_users', 'work_orders', 'handoffs'
  usage_count bigint DEFAULT 0,
  usage_limit bigint, -- null = unlimited
  overage_count bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, period_start, metric_type)
);

-- 5. ORG AUDIT EVENTS - Detailed org-level audit trail
CREATE TABLE public.organization_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid, -- User who performed action (null for system events)
  actor_type text DEFAULT 'user', -- 'user', 'api_key', 'system', 'webhook'
  event_type text NOT NULL, -- 'member.added', 'settings.updated', 'api_key.created', etc.
  resource_type text, -- 'team', 'station', 'work_order', 'member', etc.
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 6. ORG FEATURE FLAGS - Fine-grained feature control beyond plan entitlements
CREATE TABLE public.organization_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  is_enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}', -- Feature-specific configuration
  enabled_by uuid,
  enabled_at timestamptz,
  expires_at timestamptz, -- For time-limited beta features
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, feature_key)
);

-- 7. ORG INTEGRATIONS - Third-party integration configs per org
CREATE TABLE public.organization_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL, -- 'slack', 'teams', 'jira', 'erp_system', etc.
  name text NOT NULL,
  config jsonb DEFAULT '{}', -- Encrypted/tokenized config
  credentials_encrypted text, -- Encrypted OAuth tokens, etc.
  status text DEFAULT 'pending', -- 'pending', 'active', 'error', 'disconnected'
  last_sync_at timestamptz,
  error_message text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, provider)
);

-- Enable RLS on all new tables
ALTER TABLE public.organization_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_integrations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Organization-scoped access
-- =====================================================

-- API Keys: Only org admins can manage
CREATE POLICY "Org admins can manage API keys"
ON public.organization_api_keys FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org members can view API key metadata"
ON public.organization_api_keys FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

-- Webhooks: Only org admins
CREATE POLICY "Org admins can manage webhooks"
ON public.organization_webhooks FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org members can view webhooks"
ON public.organization_webhooks FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

-- Webhook Deliveries: Org admins only
CREATE POLICY "Org admins can view webhook deliveries"
ON public.webhook_deliveries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_webhooks w
  WHERE w.id = webhook_deliveries.webhook_id
  AND is_org_admin(auth.uid(), w.organization_id)
));

-- Usage: Org members can view, system inserts
CREATE POLICY "Org members can view usage"
ON public.organization_usage FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

-- Audit Events: Org admins can view
CREATE POLICY "Org admins can view audit events"
ON public.organization_audit_events FOR SELECT
USING (is_org_admin(auth.uid(), organization_id));

-- Feature Flags: Org members can view, platform admins manage
CREATE POLICY "Org members can view feature flags"
ON public.organization_feature_flags FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Platform admins can manage feature flags"
ON public.organization_feature_flags FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- Integrations: Org admins manage
CREATE POLICY "Org admins can manage integrations"
ON public.organization_integrations FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org members can view integrations"
ON public.organization_integrations FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check feature flag status
CREATE OR REPLACE FUNCTION public.is_feature_enabled(_org_id uuid, _feature_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled 
     FROM organization_feature_flags 
     WHERE organization_id = _org_id 
     AND feature_key = _feature_key
     AND (expires_at IS NULL OR expires_at > now())
    ), 
    false
  )
$$;

-- Function to increment usage metric
CREATE OR REPLACE FUNCTION public.increment_usage(_org_id uuid, _metric text, _count integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO organization_usage (
    organization_id, 
    period_start, 
    period_end, 
    metric_type, 
    usage_count
  )
  VALUES (
    _org_id,
    date_trunc('month', CURRENT_DATE)::date,
    (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date,
    _metric,
    _count
  )
  ON CONFLICT (organization_id, period_start, metric_type)
  DO UPDATE SET 
    usage_count = organization_usage.usage_count + _count,
    updated_at = now();
END;
$$;

-- Indexes for performance
CREATE INDEX idx_api_keys_org ON public.organization_api_keys(organization_id);
CREATE INDEX idx_api_keys_prefix ON public.organization_api_keys(key_prefix);
CREATE INDEX idx_webhooks_org ON public.organization_webhooks(organization_id);
CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status) WHERE status != 'delivered';
CREATE INDEX idx_usage_org_period ON public.organization_usage(organization_id, period_start);
CREATE INDEX idx_audit_org_created ON public.organization_audit_events(organization_id, created_at DESC);
CREATE INDEX idx_audit_resource ON public.organization_audit_events(resource_type, resource_id);
CREATE INDEX idx_feature_flags_org ON public.organization_feature_flags(organization_id);
CREATE INDEX idx_integrations_org ON public.organization_integrations(organization_id);

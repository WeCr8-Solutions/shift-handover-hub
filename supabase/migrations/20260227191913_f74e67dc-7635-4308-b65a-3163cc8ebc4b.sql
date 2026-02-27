
-- ============================================================
-- Phase 1: ERP Connector Database Schema
-- ============================================================

-- 1. erp_connections — One per org, stores ERP vendor config
CREATE TABLE public.erp_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  erp_vendor TEXT NOT NULL,
  instance_type TEXT NOT NULL DEFAULT 'cloud',
  api_base_url TEXT,
  oauth_token_endpoint TEXT,
  client_id_encrypted TEXT,
  client_secret_encrypted TEXT,
  scopes TEXT DEFAULT 'read-only',
  tenant_identifier TEXT,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_tested_at TIMESTAMPTZ,
  connection_status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.erp_connections ENABLE ROW LEVEL SECURITY;

-- Org admins/owners can read+write their own org's connection
CREATE POLICY "Org admins can manage ERP connections"
  ON public.erp_connections FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Developers can read all connections
CREATE POLICY "Developers can read all ERP connections"
  ON public.erp_connections FOR SELECT
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()));

-- 2. erp_sync_logs — Audit trail per sync run
CREATE TABLE public.erp_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  erp_connection_id UUID NOT NULL REFERENCES public.erp_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'incremental',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  duration_ms INTEGER,
  triggered_by TEXT NOT NULL DEFAULT 'manual'
);

ALTER TABLE public.erp_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can read their sync logs"
  ON public.erp_sync_logs FOR SELECT
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Service role inserts (edge function uses service role)
CREATE POLICY "Service role can insert sync logs"
  ON public.erp_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Developers can read all sync logs"
  ON public.erp_sync_logs FOR SELECT
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()));

-- 3. erp_sync_errors — Per-record error capture
CREATE TABLE public.erp_sync_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_log_id UUID NOT NULL REFERENCES public.erp_sync_logs(id) ON DELETE CASCADE,
  erp_record_type TEXT NOT NULL,
  erp_record_id TEXT,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_sync_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can read their sync errors"
  ON public.erp_sync_errors FOR SELECT
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Developers can read all sync errors"
  ON public.erp_sync_errors FOR SELECT
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()));

-- 4. erp_work_center_mappings
CREATE TABLE public.erp_work_center_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  erp_work_center_id TEXT NOT NULL,
  erp_work_center_name TEXT,
  jobline_station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, erp_work_center_id)
);

ALTER TABLE public.erp_work_center_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage work center mappings"
  ON public.erp_work_center_mappings FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Developers can read all work center mappings"
  ON public.erp_work_center_mappings FOR SELECT
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()));

-- 5. erp_status_mappings
CREATE TABLE public.erp_status_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  erp_status TEXT NOT NULL,
  jobline_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, erp_status)
);

ALTER TABLE public.erp_status_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage status mappings"
  ON public.erp_status_mappings FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Developers can read all status mappings"
  ON public.erp_status_mappings FOR SELECT
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()));

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-populate org_id on erp_sync_logs from erp_connection_id
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_erp_sync_log()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.erp_connection_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.erp_connections WHERE id = NEW.erp_connection_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_populate_org_id_erp_sync_logs
  BEFORE INSERT ON public.erp_sync_logs
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_erp_sync_log();

-- Auto-populate org_id on erp_sync_errors from sync_log_id
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_erp_sync_error()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.sync_log_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.erp_sync_logs WHERE id = NEW.sync_log_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_populate_org_id_erp_sync_errors
  BEFORE INSERT ON public.erp_sync_errors
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_erp_sync_error();

-- updated_at triggers
CREATE TRIGGER update_erp_connections_updated_at
  BEFORE UPDATE ON public.erp_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_work_center_mappings_updated_at
  BEFORE UPDATE ON public.erp_work_center_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Add ERP columns to queue_items
-- ============================================================
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS erp_job_id TEXT,
  ADD COLUMN IF NOT EXISTS erp_source TEXT,
  ADD COLUMN IF NOT EXISTS erp_last_synced_at TIMESTAMPTZ;

-- Partial unique index for org-scoped ERP job deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_items_org_erp_job_id
  ON public.queue_items (organization_id, erp_job_id)
  WHERE erp_job_id IS NOT NULL;

-- ============================================================
-- Add ERP columns to work_order_routing
-- ============================================================
ALTER TABLE public.work_order_routing
  ADD COLUMN IF NOT EXISTS erp_operation_id TEXT,
  ADD COLUMN IF NOT EXISTS erp_sequence_number INTEGER;

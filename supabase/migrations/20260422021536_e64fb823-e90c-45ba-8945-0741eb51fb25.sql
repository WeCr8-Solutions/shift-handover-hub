-- SAP Phase 5: extend queue_items so SAP-sourced rows are flagged and freshness-tracked.
-- Idempotent guards so re-running is safe.
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_queue_items_source_system
  ON public.queue_items (organization_id, source_system)
  WHERE source_system IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_queue_items_erp_job_id
  ON public.queue_items (organization_id, erp_job_id)
  WHERE erp_job_id IS NOT NULL;

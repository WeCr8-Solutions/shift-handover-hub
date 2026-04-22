
-- ITAR / FedRAMP hardening: ERP persistence mode
-- Default to read_through so JobBOSS/SAP data is never persisted to Supabase
-- unless an org explicitly opts in (and is not ITAR-flagged).

-- 1. Add column
ALTER TABLE public.erp_connections
  ADD COLUMN IF NOT EXISTS erp_persistence_mode TEXT NOT NULL DEFAULT 'read_through';

-- 2. Validation: only two allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'erp_connections_persistence_mode_check'
  ) THEN
    ALTER TABLE public.erp_connections
      ADD CONSTRAINT erp_connections_persistence_mode_check
      CHECK (erp_persistence_mode IN ('read_through','write_through'));
  END IF;
END$$;

-- 3. Trigger: ITAR-flagged orgs are forced to read_through.
--    Looks at organizations.metadata->>'itar_controlled' = 'true'
CREATE OR REPLACE FUNCTION public.enforce_itar_read_through()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_itar BOOLEAN;
BEGIN
  SELECT COALESCE((metadata->>'itar_controlled')::boolean, false)
    INTO is_itar
  FROM public.organizations
  WHERE id = NEW.organization_id;

  IF is_itar AND NEW.erp_persistence_mode = 'write_through' THEN
    RAISE EXCEPTION 'ITAR-controlled organizations cannot use write_through ERP persistence';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_erp_connections_itar_guard ON public.erp_connections;
CREATE TRIGGER trg_erp_connections_itar_guard
  BEFORE INSERT OR UPDATE OF erp_persistence_mode ON public.erp_connections
  FOR EACH ROW EXECUTE FUNCTION public.enforce_itar_read_through();

-- 4. Helper function for edge functions to check persistence mode
CREATE OR REPLACE FUNCTION public.get_erp_persistence_mode(_org_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT erp_persistence_mode FROM public.erp_connections WHERE organization_id = _org_id LIMIT 1),
    'read_through'
  );
$$;

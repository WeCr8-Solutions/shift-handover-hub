
-- =============================================================
-- Work Order Packages (assembly / convergence groups)
-- =============================================================

CREATE TYPE public.package_status AS ENUM (
  'draft', 'in_progress', 'ready_to_ship', 'shipped', 'closed', 'cancelled'
);

CREATE TABLE public.work_order_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  package_number text NOT NULL,
  title text NOT NULL,
  description text,
  notes text,
  required_ship_date date,
  promised_ship_date date,
  actual_ship_date date,
  status public.package_status NOT NULL DEFAULT 'draft',
  priority text NOT NULL DEFAULT 'normal',
  is_quote boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, package_number)
);

CREATE INDEX idx_wo_packages_org ON public.work_order_packages(organization_id);
CREATE INDEX idx_wo_packages_status ON public.work_order_packages(organization_id, status);
CREATE INDEX idx_wo_packages_ship ON public.work_order_packages(organization_id, required_ship_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_order_packages TO authenticated;
GRANT ALL ON public.work_order_packages TO service_role;

ALTER TABLE public.work_order_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view packages"
  ON public.work_order_packages FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create packages"
  ON public.work_order_packages FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Org members can update packages"
  ON public.work_order_packages FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins/supervisors can delete packages"
  ON public.work_order_packages FOR DELETE TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND public.can_supervisor_override_in_org(auth.uid(), organization_id)
  );

CREATE TRIGGER trg_wo_packages_updated_at
  BEFORE UPDATE ON public.work_order_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- Link queue_items to packages
-- =============================================================

ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.work_order_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_sequence integer;

CREATE INDEX IF NOT EXISTS idx_queue_items_package
  ON public.queue_items(package_id, package_sequence);

-- =============================================================
-- Package numbering: reuse org_numbering_counters with kind='package'
-- =============================================================

CREATE OR REPLACE FUNCTION public.generate_next_package_number(_organization_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefix text;
  _starting integer;
  _next integer;
  _settings jsonb;
BEGIN
  IF NOT public.is_org_member(auth.uid(), _organization_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT value INTO _settings
  FROM public.app_settings
  WHERE organization_id = _organization_id
    AND key = 'manufacturing_preferences'
  LIMIT 1;

  _prefix := COALESCE(_settings->>'packagePrefix', 'PKG-');
  _starting := GREATEST(COALESCE((_settings->>'packageStartingNumber')::int, 1), 1);

  INSERT INTO public.org_numbering_counters (organization_id, kind, next_value)
  VALUES (_organization_id, 'package', _starting + 1)
  ON CONFLICT (organization_id, kind) DO UPDATE
    SET next_value = GREATEST(public.org_numbering_counters.next_value, _starting) + 1
  RETURNING next_value - 1 INTO _next;

  RETURN _prefix || lpad(_next::text, 5, '0');
END;
$$;

-- =============================================================
-- Add items to a package (with org check)
-- =============================================================

CREATE OR REPLACE FUNCTION public.add_items_to_package(
  _package_id uuid,
  _item_ids uuid[]
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
  _updated integer;
BEGIN
  SELECT organization_id INTO _org FROM public.work_order_packages WHERE id = _package_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'package not found'; END IF;
  IF NOT public.is_org_member(auth.uid(), _org) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.queue_items
     SET package_id = _package_id, updated_at = now()
   WHERE id = ANY(_item_ids)
     AND organization_id = _org;

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated;
END;
$$;

-- =============================================================
-- Cascade due date from package to all child WOs (optional)
-- =============================================================

CREATE OR REPLACE FUNCTION public.cascade_package_due_date(
  _package_id uuid,
  _new_date date,
  _cascade boolean DEFAULT true
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid;
BEGIN
  SELECT organization_id INTO _org FROM public.work_order_packages WHERE id = _package_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'package not found'; END IF;
  IF NOT public.is_org_member(auth.uid(), _org) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.work_order_packages
     SET required_ship_date = _new_date, updated_at = now()
   WHERE id = _package_id;

  IF _cascade THEN
    UPDATE public.queue_items
       SET due_date = _new_date::timestamptz, updated_at = now()
     WHERE package_id = _package_id
       AND organization_id = _org
       AND status NOT IN ('completed','cancelled');
  END IF;
END;
$$;

-- =============================================================
-- Mark package shipped
-- =============================================================

CREATE OR REPLACE FUNCTION public.mark_package_shipped(_package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _org uuid;
BEGIN
  SELECT organization_id INTO _org FROM public.work_order_packages WHERE id = _package_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'package not found'; END IF;
  IF NOT public.can_supervisor_override_in_org(auth.uid(), _org) THEN
    RAISE EXCEPTION 'supervisor or admin required';
  END IF;

  UPDATE public.work_order_packages
     SET status = 'shipped', actual_ship_date = CURRENT_DATE, updated_at = now()
   WHERE id = _package_id;
END;
$$;

-- =============================================================
-- Auto-recompute package status when child item status changes
-- =============================================================

CREATE OR REPLACE FUNCTION public.sync_package_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pkg uuid;
  _total int;
  _done int;
  _active int;
  _current public.package_status;
BEGIN
  _pkg := COALESCE(NEW.package_id, OLD.package_id);
  IF _pkg IS NULL THEN RETURN NEW; END IF;

  SELECT status INTO _current FROM public.work_order_packages WHERE id = _pkg;
  IF _current IN ('shipped','closed','cancelled') THEN RETURN NEW; END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'completed'),
    count(*) FILTER (WHERE status IN ('in_progress','queued','on_hold'))
  INTO _total, _done, _active
  FROM public.queue_items
  WHERE package_id = _pkg;

  IF _total = 0 THEN
    UPDATE public.work_order_packages SET status = 'draft', updated_at = now() WHERE id = _pkg;
  ELSIF _done = _total THEN
    UPDATE public.work_order_packages SET status = 'ready_to_ship', updated_at = now() WHERE id = _pkg;
  ELSIF _active > 0 OR _done > 0 THEN
    UPDATE public.work_order_packages SET status = 'in_progress', updated_at = now() WHERE id = _pkg;
  ELSE
    UPDATE public.work_order_packages SET status = 'draft', updated_at = now() WHERE id = _pkg;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_items_sync_package ON public.queue_items;
CREATE TRIGGER trg_queue_items_sync_package
  AFTER INSERT OR UPDATE OF status, package_id OR DELETE
  ON public.queue_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_package_status();

-- Add cancellation and hold audit fields to queue_items
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID,
  ADD COLUMN IF NOT EXISTS cancelled_by_name TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS on_hold_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS on_hold_by UUID,
  ADD COLUMN IF NOT EXISTS on_hold_by_name TEXT,
  ADD COLUMN IF NOT EXISTS hold_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_queue_items_status_cancelled
  ON public.queue_items (organization_id, status)
  WHERE status = 'cancelled';

-- Auto-stamp audit fields on status transitions
CREATE OR REPLACE FUNCTION public.stamp_queue_item_status_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_actor_name TEXT;
BEGIN
  IF v_actor IS NOT NULL THEN
    SELECT display_name INTO v_actor_name FROM public.profiles WHERE id = v_actor LIMIT 1;
  END IF;

  IF NEW.status = 'cancelled' AND COALESCE(OLD.status::text,'') <> 'cancelled' THEN
    NEW.cancelled_at := now();
    IF NEW.cancelled_by IS NULL THEN NEW.cancelled_by := v_actor; END IF;
    IF NEW.cancelled_by_name IS NULL THEN NEW.cancelled_by_name := v_actor_name; END IF;
  END IF;

  IF NEW.status = 'on_hold' AND COALESCE(OLD.status::text,'') <> 'on_hold' THEN
    NEW.on_hold_at := now();
    IF NEW.on_hold_by IS NULL THEN NEW.on_hold_by := v_actor; END IF;
    IF NEW.on_hold_by_name IS NULL THEN NEW.on_hold_by_name := v_actor_name; END IF;
  END IF;

  -- Clear hold stamps if leaving on_hold
  IF NEW.status <> 'on_hold' AND OLD.status::text = 'on_hold' THEN
    NEW.on_hold_at := NULL;
    NEW.on_hold_by := NULL;
    NEW.on_hold_by_name := NULL;
    NEW.hold_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_queue_item_status_audit ON public.queue_items;
CREATE TRIGGER trg_stamp_queue_item_status_audit
  BEFORE UPDATE OF status ON public.queue_items
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_queue_item_status_audit();

-- Prevent hard delete of cancelled work orders to preserve audit trail
CREATE OR REPLACE FUNCTION public.prevent_cancelled_wo_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'cancelled' AND OLD.item_type = 'work_order' THEN
    RAISE EXCEPTION 'Cancelled work orders cannot be deleted; they are retained for audit trail.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_cancelled_wo_delete ON public.queue_items;
CREATE TRIGGER trg_prevent_cancelled_wo_delete
  BEFORE DELETE ON public.queue_items
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_cancelled_wo_delete();
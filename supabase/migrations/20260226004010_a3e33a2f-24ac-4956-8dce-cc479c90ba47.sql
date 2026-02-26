
-- ============================================================
-- NCR Governance System: Schema, Functions, Triggers, RLS
-- ============================================================

-- 1. Add quantity tracking columns to queue_items
--    Following 3-step safe migration: add nullable first
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS qty_original INTEGER,
  ADD COLUMN IF NOT EXISTS qty_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qty_scrap INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qty_rework INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qty_open INTEGER,
  ADD COLUMN IF NOT EXISTS quantity_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_work_order_id UUID REFERENCES public.queue_items(id),
  ADD COLUMN IF NOT EXISTS is_rework BOOLEAN DEFAULT false;

-- Backfill qty_original from existing quantity, qty_open = qty_original - completed
UPDATE public.queue_items
SET qty_original = COALESCE(quantity, 0),
    qty_open = GREATEST(COALESCE(quantity, 0) - COALESCE(parts_completed, 0) - 0 - 0, 0),
    qty_completed = COALESCE(parts_completed, 0)
WHERE qty_original IS NULL;

-- 2. Expand activity_type enum
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'ncr_created';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'ncr_approved';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'ncr_rejected';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'quantity_override';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'rework_wo_created';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'work_order_quantity_adjusted';

-- 3. Create ncr_reports table
CREATE TABLE public.ncr_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id),
  queue_item_id     UUID NOT NULL REFERENCES public.queue_items(id),
  ncr_number        TEXT NOT NULL,
  work_order_number TEXT NOT NULL,
  part_number       TEXT,
  serial_or_lot     TEXT NOT NULL,
  operation_number  TEXT NOT NULL,
  defect_type       TEXT NOT NULL,
  disposition       TEXT NOT NULL CHECK (disposition IN ('scrap', 'rework', 'use_as_is', 'return_to_vendor')),
  description       TEXT NOT NULL,
  authorized_by     UUID,
  authorized_by_name TEXT,
  authorized_at     TIMESTAMPTZ,
  authorization_status TEXT NOT NULL DEFAULT 'pending' CHECK (authorization_status IN ('pending', 'approved', 'rejected')),
  quantity_affected INTEGER NOT NULL DEFAULT 1,
  rework_wo_id      UUID REFERENCES public.queue_items(id),
  quality_signoff   BOOLEAN DEFAULT false,
  customer_approval BOOLEAN DEFAULT false,
  rejection_reason  TEXT,
  metadata          JSONB DEFAULT '{}',
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create ncr_audit_log table (immutable)
CREATE TABLE public.ncr_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL,
  ncr_id            UUID NOT NULL REFERENCES public.ncr_reports(id),
  queue_item_id     UUID NOT NULL,
  action            TEXT NOT NULL,
  performed_by      UUID NOT NULL,
  performed_by_name TEXT NOT NULL,
  old_values        JSONB,
  new_values        JSONB,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.ncr_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncr_audit_log ENABLE ROW LEVEL SECURITY;

-- 6. RLS: ncr_reports
-- SELECT: org members
CREATE POLICY "ncr_reports_select_org_member"
  ON public.ncr_reports FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- INSERT: any org member can create pending NCRs
CREATE POLICY "ncr_reports_insert_org_member"
  ON public.ncr_reports FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND authorization_status = 'pending'
    AND created_by = auth.uid()
  );

-- UPDATE: only supervisor or org admin can approve/reject
CREATE POLICY "ncr_reports_update_supervisor"
  ON public.ncr_reports FOR UPDATE TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  );

-- No DELETE policy — NCRs are permanent records

-- 7. RLS: ncr_audit_log (immutable)
-- SELECT: org members
CREATE POLICY "ncr_audit_log_select_org_member"
  ON public.ncr_audit_log FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- INSERT: only via SECURITY DEFINER functions (no direct insert)
-- No UPDATE or DELETE policies — immutable

-- 8. Updated_at trigger for ncr_reports
CREATE TRIGGER update_ncr_reports_updated_at
  BEFORE UPDATE ON public.ncr_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Helper function: can_approve_ncr
CREATE OR REPLACE FUNCTION public.can_approve_ncr(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public.is_org_admin(_user_id, _org_id)
    OR public.is_supervisor_in_org(_user_id, _org_id)
$$;

-- 10. Helper function: can_adjust_wo_quantity (org owner only)
CREATE OR REPLACE FUNCTION public.can_adjust_wo_quantity(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = 'owner'
  )
$$;

-- 11. NCR auto-numbering trigger
CREATE OR REPLACE FUNCTION public.generate_ncr_number()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _seq INTEGER;
BEGIN
  -- Count NCRs for this org today + 1
  SELECT COUNT(*) + 1 INTO _seq
  FROM public.ncr_reports
  WHERE organization_id = NEW.organization_id
    AND created_at::date = CURRENT_DATE;

  NEW.ncr_number := 'NCR-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER ncr_auto_number
  BEFORE INSERT ON public.ncr_reports
  FOR EACH ROW EXECUTE FUNCTION public.generate_ncr_number();

-- 12. Quantity integrity trigger on queue_items
CREATE OR REPLACE FUNCTION public.enforce_qty_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-compute qty_open
  IF NEW.qty_original IS NOT NULL THEN
    NEW.qty_open := GREATEST(
      NEW.qty_original - COALESCE(NEW.qty_completed, 0) - COALESCE(NEW.qty_scrap, 0) - COALESCE(NEW.qty_rework, 0),
      0
    );
  END IF;

  -- Sync parts_completed from qty_completed
  IF NEW.qty_completed IS DISTINCT FROM OLD.qty_completed THEN
    NEW.parts_completed := COALESCE(NEW.qty_completed, 0);
  END IF;

  -- Quantity lock: auto-lock when completed >= original
  IF NEW.qty_original IS NOT NULL AND NEW.qty_original > 0 
     AND COALESCE(NEW.qty_completed, 0) >= NEW.qty_original THEN
    NEW.quantity_locked := true;
  END IF;

  -- Prevent exceeding original qty (unless supervisor override via metadata flag)
  IF OLD.quantity_locked = true AND NEW.quantity_locked = true
     AND COALESCE(NEW.qty_completed, 0) > COALESCE(OLD.qty_completed, 0)
     AND COALESCE(NEW.qty_completed, 0) > COALESCE(NEW.qty_original, 0) THEN
    RAISE EXCEPTION 'Quantity lock active: cannot exceed qty_original (%). Override required.', NEW.qty_original;
  END IF;

  -- Prevent increasing qty_original unless org owner
  IF NEW.qty_original IS DISTINCT FROM OLD.qty_original
     AND COALESCE(NEW.qty_original, 0) > COALESCE(OLD.qty_original, 0)
     AND OLD.quantity_locked = true THEN
    IF NOT public.can_adjust_wo_quantity(auth.uid(), NEW.organization_id) THEN
      RAISE EXCEPTION 'Only org owner can increase qty_original after lock';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_qty_integrity_trigger
  BEFORE UPDATE ON public.queue_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_qty_integrity();

-- 13. Apply NCR disposition effects (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.apply_ncr_disposition(_ncr_id UUID, _approver_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _ncr RECORD;
  _approver_name TEXT;
  _child_wo_id UUID;
  _parent_wo RECORD;
  _next_rework_num INTEGER;
  _max_position INTEGER;
BEGIN
  -- Get NCR details
  SELECT * INTO _ncr FROM public.ncr_reports WHERE id = _ncr_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NCR not found'; END IF;

  -- Verify approver can approve
  IF NOT public.can_approve_ncr(_approver_id, _ncr.organization_id) THEN
    RAISE EXCEPTION 'User not authorized to approve NCRs';
  END IF;

  -- Get approver name
  SELECT display_name INTO _approver_name FROM public.profiles WHERE user_id = _approver_id;

  -- Update NCR status
  UPDATE public.ncr_reports
  SET authorization_status = 'approved',
      authorized_by = _approver_id,
      authorized_by_name = _approver_name,
      authorized_at = now()
  WHERE id = _ncr_id;

  -- Get parent work order
  SELECT * INTO _parent_wo FROM public.queue_items WHERE id = _ncr.queue_item_id;

  -- Apply disposition effects
  IF _ncr.disposition = 'scrap' THEN
    UPDATE public.queue_items
    SET qty_scrap = COALESCE(qty_scrap, 0) + _ncr.quantity_affected
    WHERE id = _ncr.queue_item_id;

  ELSIF _ncr.disposition = 'rework' THEN
    UPDATE public.queue_items
    SET qty_rework = COALESCE(qty_rework, 0) + _ncr.quantity_affected
    WHERE id = _ncr.queue_item_id;

    -- Create child rework WO
    SELECT COUNT(*) + 1 INTO _next_rework_num
    FROM public.queue_items
    WHERE parent_work_order_id = _ncr.queue_item_id AND is_rework = true;

    SELECT COALESCE(MAX(position), 0) + 1 INTO _max_position FROM public.queue_items
    WHERE organization_id = _parent_wo.organization_id;

    INSERT INTO public.queue_items (
      organization_id, team_id, station_id, item_type, title,
      description, work_order, part_number, operation_number,
      quantity, qty_original, qty_open, qty_completed,
      priority, position, status, parent_work_order_id, is_rework,
      created_by, tags
    ) VALUES (
      _parent_wo.organization_id, _parent_wo.team_id, _parent_wo.station_id,
      'work_order', 'Rework: ' || _parent_wo.title,
      'Rework order from NCR ' || _ncr.ncr_number || ': ' || _ncr.description,
      COALESCE(_parent_wo.work_order, '') || '-R' || _next_rework_num,
      _parent_wo.part_number, _parent_wo.operation_number,
      _ncr.quantity_affected, _ncr.quantity_affected, _ncr.quantity_affected, 0,
      _parent_wo.priority, _max_position, 'pending',
      _ncr.queue_item_id, true,
      _approver_id, ARRAY['rework']
    ) RETURNING id INTO _child_wo_id;

    -- Link child WO to NCR
    UPDATE public.ncr_reports SET rework_wo_id = _child_wo_id WHERE id = _ncr_id;

  ELSIF _ncr.disposition = 'use_as_is' THEN
    UPDATE public.queue_items
    SET qty_completed = COALESCE(qty_completed, 0) + _ncr.quantity_affected
    WHERE id = _ncr.queue_item_id;
  END IF;

  -- Insert audit log entry
  INSERT INTO public.ncr_audit_log (
    organization_id, ncr_id, queue_item_id, action,
    performed_by, performed_by_name,
    new_values
  ) VALUES (
    _ncr.organization_id, _ncr_id, _ncr.queue_item_id,
    'ncr_approved_' || _ncr.disposition,
    _approver_id, COALESCE(_approver_name, 'Unknown'),
    jsonb_build_object(
      'disposition', _ncr.disposition,
      'quantity_affected', _ncr.quantity_affected,
      'child_wo_id', _child_wo_id
    )
  );
END;
$$;

-- 14. Reject NCR function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.reject_ncr(_ncr_id UUID, _rejector_id UUID, _reason TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _ncr RECORD;
  _rejector_name TEXT;
BEGIN
  SELECT * INTO _ncr FROM public.ncr_reports WHERE id = _ncr_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NCR not found'; END IF;

  IF NOT public.can_approve_ncr(_rejector_id, _ncr.organization_id) THEN
    RAISE EXCEPTION 'User not authorized to reject NCRs';
  END IF;

  SELECT display_name INTO _rejector_name FROM public.profiles WHERE user_id = _rejector_id;

  UPDATE public.ncr_reports
  SET authorization_status = 'rejected',
      authorized_by = _rejector_id,
      authorized_by_name = _rejector_name,
      authorized_at = now(),
      rejection_reason = _reason
  WHERE id = _ncr_id;

  INSERT INTO public.ncr_audit_log (
    organization_id, ncr_id, queue_item_id, action,
    performed_by, performed_by_name, reason
  ) VALUES (
    _ncr.organization_id, _ncr_id, _ncr.queue_item_id,
    'ncr_rejected',
    _rejector_id, COALESCE(_rejector_name, 'Unknown'), _reason
  );
END;
$$;

-- 15. Enable realtime for ncr_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.ncr_reports;

-- 16. Indexes for performance
CREATE INDEX idx_ncr_reports_org ON public.ncr_reports(organization_id);
CREATE INDEX idx_ncr_reports_queue_item ON public.ncr_reports(queue_item_id);
CREATE INDEX idx_ncr_reports_status ON public.ncr_reports(authorization_status);
CREATE INDEX idx_ncr_audit_log_ncr ON public.ncr_audit_log(ncr_id);
CREATE INDEX idx_queue_items_parent ON public.queue_items(parent_work_order_id) WHERE parent_work_order_id IS NOT NULL;

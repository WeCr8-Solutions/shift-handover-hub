
-- State transition validation trigger for queue_items (work orders)
-- Closes 5 gaps identified in state_gaps.md
CREATE OR REPLACE FUNCTION public.validate_queue_item_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- cancelled is a terminal state — no transitions out
  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot transition from cancelled state';
  END IF;

  -- completed can only go to pending (rework via NCR)
  IF OLD.status = 'completed' AND NEW.status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Cannot transition from completed to %. Only rework (pending) is allowed.', NEW.status;
  END IF;

  -- Define valid transitions
  IF OLD.status = 'pending' AND NEW.status NOT IN ('queued', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid transition: pending can only go to queued or cancelled, not %', NEW.status;
  END IF;

  IF OLD.status = 'queued' AND NEW.status NOT IN ('in_progress', 'cancelled', 'pending') THEN
    RAISE EXCEPTION 'Invalid transition: queued can only go to in_progress, cancelled, or pending, not %', NEW.status;
  END IF;

  IF OLD.status = 'in_progress' AND NEW.status NOT IN ('on_hold', 'completed', 'queued', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid transition: in_progress can only go to on_hold, completed, queued, or cancelled, not %', NEW.status;
  END IF;

  IF OLD.status = 'on_hold' AND NEW.status NOT IN ('in_progress', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid transition: on_hold can only go to in_progress or cancelled, not %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_queue_item_status
  BEFORE UPDATE ON public.queue_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_queue_item_status_transition();

-- State transition validation trigger for ncr_reports
CREATE OR REPLACE FUNCTION public.validate_ncr_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.authorization_status = NEW.authorization_status THEN
    RETURN NEW;
  END IF;

  -- approved is terminal (disposition already applied)
  IF OLD.authorization_status = 'approved' THEN
    RAISE EXCEPTION 'Cannot change status once NCR is approved — disposition has been applied';
  END IF;

  -- Valid transitions
  IF OLD.authorization_status = 'draft' AND NEW.authorization_status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Draft NCR can only be submitted (pending), not %', NEW.authorization_status;
  END IF;

  IF OLD.authorization_status = 'pending' AND NEW.authorization_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Pending NCR can only be approved or rejected, not %', NEW.authorization_status;
  END IF;

  IF OLD.authorization_status = 'rejected' AND NEW.authorization_status NOT IN ('draft', 'pending') THEN
    RAISE EXCEPTION 'Rejected NCR can only return to draft or pending, not %', NEW.authorization_status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ncr_status
  BEFORE UPDATE ON public.ncr_reports
  FOR EACH ROW
  WHEN (OLD.authorization_status IS DISTINCT FROM NEW.authorization_status)
  EXECUTE FUNCTION public.validate_ncr_status_transition();

CREATE OR REPLACE FUNCTION public.prevent_cancelled_wo_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'cancelled' AND OLD.item_type = 'work_order' THEN
    RAISE EXCEPTION 'Cancelled work orders cannot be deleted; they are retained for audit trail.';
  END IF;
  RETURN OLD;
END;
$$;
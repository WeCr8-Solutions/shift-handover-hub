CREATE OR REPLACE FUNCTION public.stamp_queue_item_status_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_actor_name TEXT;
  v_reason TEXT;
BEGIN
  IF v_actor IS NOT NULL THEN
    SELECT display_name INTO v_actor_name FROM public.profiles WHERE id = v_actor LIMIT 1;
  END IF;

  IF NEW.status = 'cancelled' AND COALESCE(OLD.status::text,'') <> 'cancelled' THEN
    NEW.cancelled_at := now();
    IF NEW.cancelled_by IS NULL THEN NEW.cancelled_by := v_actor; END IF;
    IF NEW.cancelled_by_name IS NULL THEN NEW.cancelled_by_name := v_actor_name; END IF;
    v_reason := NEW.cancellation_reason;
  END IF;

  IF NEW.status = 'on_hold' AND COALESCE(OLD.status::text,'') <> 'on_hold' THEN
    NEW.on_hold_at := now();
    IF NEW.on_hold_by IS NULL THEN NEW.on_hold_by := v_actor; END IF;
    IF NEW.on_hold_by_name IS NULL THEN NEW.on_hold_by_name := v_actor_name; END IF;
    v_reason := NEW.hold_reason;
  END IF;

  IF NEW.status <> 'on_hold' AND OLD.status::text = 'on_hold' THEN
    NEW.on_hold_at := NULL;
    NEW.on_hold_by := NULL;
    NEW.on_hold_by_name := NULL;
    NEW.hold_reason := NULL;
  END IF;

  -- Write a unified status-trace row to queue_item_history for every status change.
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.organization_id IS NOT NULL THEN
    INSERT INTO public.queue_item_history (
      queue_item_id, user_id, user_name, action, old_value, new_value, organization_id
    ) VALUES (
      NEW.id,
      COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid),
      COALESCE(v_actor_name, 'system'),
      'Status: ' || OLD.status::text || ' → ' || NEW.status::text || COALESCE(' (' || v_reason || ')', ''),
      jsonb_build_object('status', OLD.status::text),
      jsonb_build_object('status', NEW.status::text, 'reason', v_reason),
      NEW.organization_id
    );
  END IF;

  RETURN NEW;
END;
$$;
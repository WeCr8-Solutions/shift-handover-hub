
-- 1) Awaiting-delivery flag on queue_items so kanban/list views can label incoming WOs
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS awaiting_delivery boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_queue_items_awaiting_delivery
  ON public.queue_items (organization_id, awaiting_delivery)
  WHERE awaiting_delivery = true;

-- 2) Updated routing-pass RPC: now also opens a delivery_request when advancing
CREATE OR REPLACE FUNCTION public.pass_work_order_to_next_step(
  _queue_item_id uuid,
  _current_station_id uuid,
  _actor_id uuid,
  _is_override boolean DEFAULT false,
  _override_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _queue_item RECORD;
  _cur_step RECORD;
  _next_step RECORD;
  _total_steps integer;
  _actor_name text;
  _org_id uuid;
  _result jsonb;
  _delivery_id uuid;
  _from_station_name text;
BEGIN
  SELECT display_name INTO _actor_name FROM public.profiles WHERE user_id = _actor_id;

  SELECT * INTO _queue_item FROM public.queue_items WHERE id = _queue_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  _org_id := _queue_item.organization_id;

  -- Permission check
  IF _is_override THEN
    IF NOT public.can_supervisor_override_in_org(_actor_id, _org_id) THEN
      RAISE EXCEPTION 'Permission denied: supervisor or admin role required for override';
    END IF;
    IF _override_reason IS NULL OR trim(_override_reason) = '' THEN
      RAISE EXCEPTION 'Override reason is required';
    END IF;
  ELSE
    IF NOT public.can_operator_act_on_station(_actor_id, _current_station_id) THEN
      IF NOT public.can_supervisor_override_in_org(_actor_id, _org_id) THEN
        RAISE EXCEPTION 'Permission denied: you must be checked into this station or have supervisor access';
      END IF;
    END IF;
  END IF;

  -- Find current routing step
  SELECT * INTO _cur_step
  FROM public.work_order_routing
  WHERE queue_item_id = _queue_item_id
    AND station_id = _current_station_id
    AND status != 'completed'
  ORDER BY step_number ASC
  LIMIT 1;

  SELECT COUNT(*) INTO _total_steps
  FROM public.work_order_routing
  WHERE queue_item_id = _queue_item_id;

  -- Find next step
  IF _cur_step.id IS NOT NULL THEN
    SELECT wor.*, s.name as next_station_name
    INTO _next_step
    FROM public.work_order_routing wor
    LEFT JOIN public.stations s ON s.id = wor.station_id
    WHERE wor.queue_item_id = _queue_item_id
      AND wor.step_number > _cur_step.step_number
    ORDER BY wor.step_number ASC
    LIMIT 1;
  END IF;

  -- Complete current step
  IF _cur_step.id IS NOT NULL THEN
    UPDATE public.work_order_routing
    SET status = 'completed',
        completed_at = now(),
        completed_by = _actor_id,
        completed_by_name = _actor_name
    WHERE id = _cur_step.id;
  END IF;

  -- Move to next or complete
  IF _next_step.id IS NOT NULL AND _next_step.station_id IS NOT NULL THEN
    UPDATE public.queue_items
    SET status = 'queued',
        station_id = _next_step.station_id,
        started_at = NULL,
        assigned_to = NULL,
        awaiting_delivery = true
    WHERE id = _queue_item_id;

    UPDATE public.work_order_routing
    SET status = 'pending'
    WHERE id = _next_step.id;

    INSERT INTO public.current_station_status (
      station_id, current_job_work_order, current_job_part_number,
      current_job_state, current_operator_name, current_operator_id,
      parts_complete, parts_required
    ) VALUES (
      _next_step.station_id,
      COALESCE(_queue_item.work_order, _queue_item.title),
      _queue_item.part_number,
      'Waiting on Material', NULL, NULL, 0,
      COALESCE(_queue_item.quantity, 0)
    )
    ON CONFLICT (station_id) DO UPDATE SET
      current_job_work_order = EXCLUDED.current_job_work_order,
      current_job_part_number = EXCLUDED.current_job_part_number,
      current_job_state = EXCLUDED.current_job_state,
      current_operator_name = EXCLUDED.current_operator_name,
      current_operator_id = EXCLUDED.current_operator_id,
      parts_complete = EXCLUDED.parts_complete,
      parts_required = EXCLUDED.parts_required;

    -- Open a physical-delivery handoff so someone moves the parts + paperwork
    SELECT name INTO _from_station_name FROM public.stations WHERE id = _current_station_id;

    INSERT INTO public.delivery_requests (
      organization_id, queue_item_id, routing_step_id,
      from_station_id, to_station_id, status, priority,
      quantity, requested_by, requested_by_name, notes
    ) VALUES (
      _org_id, _queue_item_id, _next_step.id,
      _current_station_id, _next_step.station_id, 'pending',
      COALESCE(_queue_item.priority, 'normal'),
      COALESCE(_queue_item.qty_open, _queue_item.quantity, 1),
      _actor_id, _actor_name,
      'Auto-created on routing advancement from ' || COALESCE(_from_station_name, 'previous station')
    )
    RETURNING id INTO _delivery_id;

    _result := jsonb_build_object(
      'action', 'advanced',
      'next_station_name', _next_step.next_station_name,
      'next_station_id', _next_step.station_id,
      'next_operation_name', _next_step.operation_name,
      'next_operation_number', _next_step.operation_number,
      'step_completed', _cur_step.step_number,
      'total_steps', _total_steps,
      'delivery_id', _delivery_id
    );
  ELSE
    UPDATE public.queue_items
    SET status = 'completed',
        completed_at = now(),
        started_at = NULL,
        awaiting_delivery = false
    WHERE id = _queue_item_id;

    _result := jsonb_build_object(
      'action', 'completed',
      'step_completed', COALESCE(_cur_step.step_number, 0),
      'total_steps', _total_steps
    );
  END IF;

  -- Clear current station
  UPDATE public.current_station_status
  SET current_job_work_order = NULL,
      current_job_part_number = NULL,
      current_job_state = NULL,
      current_operator_name = NULL,
      current_operator_id = NULL,
      parts_complete = NULL,
      parts_required = NULL
  WHERE station_id = _current_station_id;

  -- Audit log
  INSERT INTO public.activity_logs (
    user_id, user_display_name, activity_type, description,
    organization_id, metadata
  ) VALUES (
    _actor_id, _actor_name,
    'work_order_update',
    CASE WHEN _is_override
      THEN 'Supervisor override: passed WO ' || COALESCE(_queue_item.work_order, _queue_item.title) || '. Reason: ' || _override_reason
      ELSE 'Completed op on ' || COALESCE(_queue_item.work_order, _queue_item.title) || ' and advanced'
    END,
    _org_id,
    jsonb_build_object(
      'queue_item_id', _queue_item_id,
      'from_station_id', _current_station_id,
      'is_override', _is_override,
      'override_reason', _override_reason,
      'result', _result
    )
  );

  RETURN _result;
END;
$$;

-- 3) Helper: operator marks themselves as picking the parts up for delivery
CREATE OR REPLACE FUNCTION public.mark_delivery_picked_up(_delivery_id uuid)
RETURNS public.delivery_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.delivery_requests;
  _actor_name text;
  _actor_id uuid := auth.uid();
BEGIN
  IF _actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO _row FROM public.delivery_requests WHERE id = _delivery_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery not found';
  END IF;

  IF NOT public.is_org_member(_actor_id, _row.organization_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF _row.status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Delivery already %', _row.status;
  END IF;

  SELECT display_name INTO _actor_name FROM public.profiles WHERE user_id = _actor_id;

  UPDATE public.delivery_requests
  SET status = 'in_transit',
      picked_up_by = _actor_id,
      picked_up_by_name = _actor_name,
      picked_up_at = now(),
      updated_at = now()
  WHERE id = _delivery_id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

-- 4) Helper: mark delivery as delivered + clear the WO's awaiting_delivery flag
CREATE OR REPLACE FUNCTION public.mark_delivery_delivered(_delivery_id uuid)
RETURNS public.delivery_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.delivery_requests;
  _actor_name text;
  _actor_id uuid := auth.uid();
BEGIN
  IF _actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO _row FROM public.delivery_requests WHERE id = _delivery_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery not found';
  END IF;

  IF NOT public.is_org_member(_actor_id, _row.organization_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF _row.status = 'delivered' THEN
    RAISE EXCEPTION 'Delivery already delivered';
  END IF;

  SELECT display_name INTO _actor_name FROM public.profiles WHERE user_id = _actor_id;

  UPDATE public.delivery_requests
  SET status = 'delivered',
      delivered_by = _actor_id,
      delivered_by_name = _actor_name,
      delivered_at = now(),
      -- If picked-up was skipped (small shops where the same operator drops it off),
      -- record it now so we always have a pickup actor for audit.
      picked_up_by = COALESCE(picked_up_by, _actor_id),
      picked_up_by_name = COALESCE(picked_up_by_name, _actor_name),
      picked_up_at = COALESCE(picked_up_at, now()),
      updated_at = now()
  WHERE id = _delivery_id
  RETURNING * INTO _row;

  -- Clear awaiting flag on the work order so it joins the next station's WIP queue cleanly
  IF _row.queue_item_id IS NOT NULL THEN
    UPDATE public.queue_items
    SET awaiting_delivery = false
    WHERE id = _row.queue_item_id;
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_delivery_picked_up(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_delivery_delivered(uuid) TO authenticated;


-- Add acceptance columns
ALTER TABLE public.delivery_requests
  ADD COLUMN IF NOT EXISTS accepted_by uuid,
  ADD COLUMN IF NOT EXISTS accepted_by_name text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_via text; -- 'operator' | 'supervisor_override' | 'auto_check_in'

-- mark_delivery_delivered: move to awaiting_acceptance, keep awaiting flag
CREATE OR REPLACE FUNCTION public.mark_delivery_delivered(_delivery_id uuid)
RETURNS public.delivery_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF _row.status IN ('delivered','awaiting_acceptance','accepted') THEN
    RAISE EXCEPTION 'Delivery already dropped off';
  END IF;

  SELECT display_name INTO _actor_name FROM public.profiles WHERE user_id = _actor_id;

  UPDATE public.delivery_requests
  SET status = 'awaiting_acceptance',
      delivered_by = _actor_id,
      delivered_by_name = _actor_name,
      delivered_at = now(),
      picked_up_by = COALESCE(picked_up_by, _actor_id),
      picked_up_by_name = COALESCE(picked_up_by_name, _actor_name),
      picked_up_at = COALESCE(picked_up_at, now()),
      updated_at = now()
  WHERE id = _delivery_id
  RETURNING * INTO _row;

  -- awaiting_delivery stays TRUE until the receiving station accepts
  RETURN _row;
END;
$function$;

-- Shared helper used by accept_delivery and force_accept_delivery
CREATE OR REPLACE FUNCTION public._finalize_delivery_acceptance(
  _delivery_id uuid,
  _actor_id uuid,
  _via text
)
RETURNS public.delivery_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _row public.delivery_requests;
  _actor_name text;
  _to_station_name text;
BEGIN
  SELECT * INTO _row FROM public.delivery_requests WHERE id = _delivery_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery not found';
  END IF;

  IF _row.status = 'accepted' THEN
    RAISE EXCEPTION 'Delivery already accepted';
  END IF;

  IF _row.status NOT IN ('awaiting_acceptance','delivered','in_transit','pending') THEN
    RAISE EXCEPTION 'Delivery cannot be accepted in status %', _row.status;
  END IF;

  SELECT display_name INTO _actor_name FROM public.profiles WHERE user_id = _actor_id;
  SELECT name INTO _to_station_name FROM public.stations WHERE id = _row.to_station_id;

  UPDATE public.delivery_requests
  SET status = 'accepted',
      accepted_by = _actor_id,
      accepted_by_name = _actor_name,
      accepted_at = now(),
      accepted_via = _via,
      -- If delivery is being accepted directly (carrier dropped + accepted by same person)
      delivered_by = COALESCE(delivered_by, _actor_id),
      delivered_by_name = COALESCE(delivered_by_name, _actor_name),
      delivered_at = COALESCE(delivered_at, now()),
      picked_up_by = COALESCE(picked_up_by, _actor_id),
      picked_up_by_name = COALESCE(picked_up_by_name, _actor_name),
      picked_up_at = COALESCE(picked_up_at, now()),
      updated_at = now()
  WHERE id = _delivery_id
  RETURNING * INTO _row;

  -- Clear awaiting flag so the WO is fully checked in to receiving station
  IF _row.queue_item_id IS NOT NULL THEN
    UPDATE public.queue_items
    SET awaiting_delivery = false,
        updated_at = now()
    WHERE id = _row.queue_item_id;

    -- Audit entry
    INSERT INTO public.queue_item_history (
      queue_item_id, user_id, user_name, action, new_value, organization_id
    ) VALUES (
      _row.queue_item_id,
      _actor_id,
      COALESCE(_actor_name, 'Unknown'),
      'delivery_accepted',
      jsonb_build_object(
        'station', _to_station_name,
        'via', _via,
        'delivery_id', _row.id
      ),
      _row.organization_id
    );
  END IF;

  RETURN _row;
END;
$function$;

-- Operator-side acceptance
CREATE OR REPLACE FUNCTION public.accept_delivery(_delivery_id uuid)
RETURNS public.delivery_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _row public.delivery_requests;
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

  RETURN public._finalize_delivery_acceptance(_delivery_id, _actor_id, 'operator');
END;
$function$;

-- Supervisor / admin override (when operator is not at station)
CREATE OR REPLACE FUNCTION public.force_accept_delivery(_delivery_id uuid)
RETURNS public.delivery_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _row public.delivery_requests;
  _actor_id uuid := auth.uid();
BEGIN
  IF _actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO _row FROM public.delivery_requests WHERE id = _delivery_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery not found';
  END IF;

  IF NOT (
    public.is_org_admin(_actor_id, _row.organization_id)
    OR public.is_supervisor_in_org(_actor_id, _row.organization_id)
  ) THEN
    RAISE EXCEPTION 'Supervisor or admin role required';
  END IF;

  RETURN public._finalize_delivery_acceptance(_delivery_id, _actor_id, 'supervisor_override');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.accept_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_accept_delivery(uuid) TO authenticated;

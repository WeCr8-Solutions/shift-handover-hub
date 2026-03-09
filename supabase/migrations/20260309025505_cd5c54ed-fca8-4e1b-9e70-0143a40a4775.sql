
-- Server-side function to fetch shop floor display data
-- Uses SECURITY DEFINER to bypass RLS since displays are session-less (token-based)
-- Validates the token first, then returns org/team-scoped station and queue data

CREATE OR REPLACE FUNCTION public.fetch_display_data(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _display RECORD;
  _stations jsonb;
  _queue_items jsonb;
  _team_filter uuid[];
BEGIN
  -- Validate token
  SELECT * INTO _display
  FROM public.shop_floor_displays
  WHERE display_token = _token
    AND is_active = true
    AND token_expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Token invalid or expired');
  END IF;

  -- Update last_seen
  UPDATE public.shop_floor_displays SET last_seen_at = now() WHERE id = _display.id;

  -- Resolve team filter
  _team_filter := _display.team_ids;

  -- Fetch stations with current status, scoped by org + optional team filter
  SELECT COALESCE(jsonb_agg(row_to_json(sq)), '[]'::jsonb)
  INTO _stations
  FROM (
    SELECT
      s.id,
      s.name,
      s.station_id,
      s.work_center,
      s.work_center_type,
      s.is_active,
      s.team_id,
      t.name AS team_name,
      jsonb_build_object(
        'current_job_state', css.current_job_state,
        'current_job_work_order', css.current_job_work_order,
        'current_job_part_number', css.current_job_part_number,
        'current_operator_name', css.current_operator_name,
        'current_operator_id', css.current_operator_id,
        'parts_complete', css.parts_complete,
        'parts_required', css.parts_required,
        'condition_notes', css.condition_notes,
        'condition_status', css.condition_status
      ) AS current_status
    FROM public.stations s
    LEFT JOIN public.current_station_status css ON css.station_id = s.id
    LEFT JOIN public.teams t ON t.id = s.team_id
    WHERE s.organization_id = _display.organization_id
      AND s.is_active = true
      AND (_team_filter IS NULL OR array_length(_team_filter, 1) IS NULL OR s.team_id = ANY(_team_filter))
    ORDER BY s.name ASC
  ) sq;

  -- Fetch active queue items, scoped by org + optional team/station filter
  SELECT COALESCE(jsonb_agg(row_to_json(qq)), '[]'::jsonb)
  INTO _queue_items
  FROM (
    SELECT
      qi.id,
      qi.title,
      qi.work_order,
      qi.part_number,
      qi.operation_number,
      qi.status,
      qi.priority,
      qi.due_date,
      qi.station_id,
      qi.quantity,
      qi.qty_completed,
      qi.qty_open,
      qi.assigned_to,
      s.name AS station_name,
      t.name AS team_name
    FROM public.queue_items qi
    LEFT JOIN public.stations s ON s.id = qi.station_id
    LEFT JOIN public.teams t ON t.id = qi.team_id
    WHERE qi.organization_id = _display.organization_id
      AND qi.status NOT IN ('completed', 'cancelled')
      AND (
        _team_filter IS NULL
        OR array_length(_team_filter, 1) IS NULL
        OR qi.team_id = ANY(_team_filter)
        OR qi.station_id IN (
          SELECT id FROM public.stations WHERE team_id = ANY(_team_filter)
        )
      )
    ORDER BY
      CASE qi.priority
        WHEN 'critical' THEN 1
        WHEN 'urgent' THEN 2
        WHEN 'high' THEN 3
        WHEN 'normal' THEN 4
        WHEN 'low' THEN 5
        ELSE 6
      END ASC,
      qi.position ASC NULLS LAST
    LIMIT 50
  ) qq;

  RETURN jsonb_build_object(
    'valid', true,
    'display_id', _display.id,
    'organization_id', _display.organization_id,
    'display_name', _display.display_name,
    'display_mode', _display.display_mode,
    'team_ids', _display.team_ids,
    'refresh_interval_seconds', _display.refresh_interval_seconds,
    'auto_rotate_enabled', _display.auto_rotate_enabled,
    'auto_rotate_interval_seconds', _display.auto_rotate_interval_seconds,
    'dark_mode', _display.dark_mode,
    'alert_sound_enabled', _display.alert_sound_enabled,
    'stations', _stations,
    'queue_items', _queue_items
  );
END;
$$;

-- Grant execute to anon so token-based displays can call it without auth
GRANT EXECUTE ON FUNCTION public.fetch_display_data(text) TO anon, authenticated;

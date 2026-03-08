
CREATE OR REPLACE FUNCTION public.compute_smart_alerts(
  _org_id uuid,
  _station_id uuid DEFAULT NULL,
  _stale_days integer DEFAULT 2,
  _stale_critical_days integer DEFAULT 5,
  _over_time_pct integer DEFAULT 0,
  _over_time_critical_pct integer DEFAULT 100,
  _bottleneck_min_wos integer DEFAULT 3,
  _enable_overdue boolean DEFAULT true,
  _enable_on_hold boolean DEFAULT true,
  _enable_stale boolean DEFAULT true,
  _enable_over_time boolean DEFAULT true,
  _enable_high_priority boolean DEFAULT true,
  _enable_no_operator boolean DEFAULT true,
  _enable_bottleneck boolean DEFAULT true,
  _enable_unassigned boolean DEFAULT true,
  _enable_no_routing boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _now timestamptz := now();
  _result jsonb := '[]'::jsonb;
  _row RECORD;
  _days integer;
  _pct integer;
  _elapsed_ms double precision;
  _estimated_ms double precision;
  _count integer;
  _station_counts jsonb := '{}'::jsonb;
BEGIN
  -- 1. OVERDUE work orders
  IF _enable_overdue THEN
    FOR _row IN
      SELECT id, title, work_order, due_date, priority
      FROM queue_items
      WHERE organization_id = _org_id
        AND (_station_id IS NULL OR station_id = _station_id)
        AND status NOT IN ('completed', 'cancelled')
        AND due_date IS NOT NULL
        AND due_date < _now
      ORDER BY due_date ASC
      LIMIT 10
    LOOP
      _days := EXTRACT(DAY FROM (_now - _row.due_date))::integer;
      _result := _result || jsonb_build_object(
        'id', 'overdue-' || _row.id,
        'type', 'overdue',
        'severity', CASE WHEN _days >= 3 OR _row.priority = 'critical' THEN 'critical' ELSE 'warning' END,
        'title', COALESCE(_row.work_order, _row.title),
        'detail', 'Due ' || to_char(_row.due_date, 'MM/DD/YYYY') || ' — ' || _days || 'd overdue',
        'targetId', _row.id,
        'targetType', 'work_order',
        'metric', _days,
        'metricLabel', _days || 'd OVERDUE',
        'sortWeight', 100 + _days
      );
    END LOOP;
  END IF;

  -- 2. ON HOLD work orders
  IF _enable_on_hold THEN
    FOR _row IN
      SELECT id, title, work_order, priority, updated_at
      FROM queue_items
      WHERE organization_id = _org_id
        AND (_station_id IS NULL OR station_id = _station_id)
        AND status = 'on_hold'
      ORDER BY updated_at ASC
      LIMIT 10
    LOOP
      _days := EXTRACT(DAY FROM (_now - _row.updated_at))::integer;
      _result := _result || jsonb_build_object(
        'id', 'hold-' || _row.id,
        'type', 'on_hold',
        'severity', CASE WHEN _days >= 3 THEN 'warning' ELSE 'info' END,
        'title', COALESCE(_row.work_order, _row.title),
        'detail', 'On hold' || CASE WHEN _days > 0 THEN ' for ' || _days || 'd' ELSE '' END,
        'targetId', _row.id,
        'targetType', 'work_order',
        'metric', _days,
        'metricLabel', 'ON HOLD',
        'sortWeight', 60 + _days
      );
    END LOOP;
  END IF;

  -- 3. STALE work orders
  IF _enable_stale THEN
    FOR _row IN
      SELECT id, title, work_order, updated_at, status
      FROM queue_items
      WHERE organization_id = _org_id
        AND (_station_id IS NULL OR station_id = _station_id)
        AND status NOT IN ('completed', 'cancelled')
        AND updated_at < (_now - (_stale_days || ' days')::interval)
      ORDER BY updated_at ASC
      LIMIT 10
    LOOP
      _days := EXTRACT(DAY FROM (_now - _row.updated_at))::integer;
      _result := _result || jsonb_build_object(
        'id', 'stale-' || _row.id,
        'type', 'stale',
        'severity', CASE WHEN _days >= _stale_critical_days THEN 'critical' ELSE 'warning' END,
        'title', COALESCE(_row.work_order, _row.title),
        'detail', 'No movement in ' || _days || ' days (status: ' || _row.status || ')',
        'targetId', _row.id,
        'targetType', 'work_order',
        'metric', _days,
        'metricLabel', _days || 'd STALE',
        'sortWeight', 70 + _days
      );
    END LOOP;
  END IF;

  -- 4. HIGH PRIORITY WAITING
  IF _enable_high_priority THEN
    FOR _row IN
      SELECT id, title, work_order, priority
      FROM queue_items
      WHERE organization_id = _org_id
        AND (_station_id IS NULL OR station_id = _station_id)
        AND status = 'queued'
        AND priority IN ('critical', 'urgent')
      ORDER BY created_at ASC
      LIMIT 10
    LOOP
      _result := _result || jsonb_build_object(
        'id', 'hp-' || _row.id,
        'type', 'high_priority_waiting',
        'severity', CASE WHEN _row.priority = 'critical' THEN 'critical' ELSE 'warning' END,
        'title', COALESCE(_row.work_order, _row.title),
        'detail', CASE WHEN _row.priority = 'critical' THEN 'Critical' ELSE 'Urgent' END || ' WO queued — not started',
        'targetId', _row.id,
        'targetType', 'work_order',
        'metricLabel', upper(_row.priority::text) || ' WAITING',
        'sortWeight', CASE WHEN _row.priority = 'critical' THEN 95 ELSE 85 END
      );
    END LOOP;
  END IF;

  -- 5. OVER TIME + NO OPERATOR (in_progress items)
  IF _enable_over_time OR _enable_no_operator THEN
    FOR _row IN
      SELECT id, title, work_order, started_at, estimated_duration, assigned_to
      FROM queue_items
      WHERE organization_id = _org_id
        AND (_station_id IS NULL OR station_id = _station_id)
        AND status = 'in_progress'
      LIMIT 50
    LOOP
      -- Over time check
      IF _enable_over_time AND _row.started_at IS NOT NULL AND _row.estimated_duration IS NOT NULL THEN
        _elapsed_ms := EXTRACT(EPOCH FROM (_now - _row.started_at)) * 1000;
        _estimated_ms := _row.estimated_duration * 60000.0;
        IF _elapsed_ms > _estimated_ms THEN
          _pct := ((_elapsed_ms / _estimated_ms) * 100)::integer - 100;
          IF _pct >= _over_time_pct THEN
            _result := _result || jsonb_build_object(
              'id', 'overtime-' || _row.id,
              'type', 'over_time',
              'severity', CASE WHEN _pct >= _over_time_critical_pct THEN 'critical' ELSE 'warning' END,
              'title', COALESCE(_row.work_order, _row.title),
              'detail', 'Running ' || _pct || '% over estimated duration',
              'targetId', _row.id,
              'targetType', 'work_order',
              'metric', _pct,
              'metricLabel', '+' || _pct || '% OVER',
              'sortWeight', 80 + LEAST(_pct, 50)
            );
          END IF;
        END IF;
      END IF;

      -- No operator check
      IF _enable_no_operator AND _row.assigned_to IS NULL THEN
        _result := _result || jsonb_build_object(
          'id', 'noops-' || _row.id,
          'type', 'no_operator',
          'severity', 'warning',
          'title', COALESCE(_row.work_order, _row.title),
          'detail', 'In progress but no operator checked in',
          'targetId', _row.id,
          'targetType', 'work_order',
          'metricLabel', 'NO OPERATOR',
          'sortWeight', 50
        );
      END IF;
    END LOOP;
  END IF;

  -- 6. BOTTLENECK stations
  IF _enable_bottleneck THEN
    FOR _row IN
      SELECT qi.station_id, s.name AS station_name, COUNT(*) AS wo_count
      FROM queue_items qi
      JOIN stations s ON s.id = qi.station_id
      WHERE qi.organization_id = _org_id
        AND (_station_id IS NULL OR qi.station_id = _station_id)
        AND qi.status IN ('queued', 'in_progress')
        AND qi.station_id IS NOT NULL
      GROUP BY qi.station_id, s.name
      HAVING COUNT(*) >= _bottleneck_min_wos
      ORDER BY COUNT(*) DESC
    LOOP
      _result := _result || jsonb_build_object(
        'id', 'bottleneck-' || _row.station_id,
        'type', 'bottleneck',
        'severity', CASE WHEN _row.wo_count >= 5 THEN 'critical' ELSE 'warning' END,
        'title', _row.station_name,
        'detail', _row.wo_count || ' work orders competing for this station',
        'targetId', _row.station_id,
        'targetType', 'station',
        'metric', _row.wo_count,
        'metricLabel', _row.wo_count || ' WOs QUEUED',
        'sortWeight', 75 + _row.wo_count
      );
    END LOOP;
  END IF;

  -- 7. UNASSIGNED work orders
  IF _enable_unassigned THEN
    SELECT COUNT(*) INTO _count
    FROM queue_items
    WHERE organization_id = _org_id
      AND (_station_id IS NULL OR station_id = _station_id)
      AND station_id IS NULL
      AND status NOT IN ('completed', 'cancelled');

    IF _count > 0 THEN
      _result := _result || jsonb_build_object(
        'id', 'unassigned',
        'type', 'unassigned',
        'severity', CASE WHEN _count >= 5 THEN 'warning' ELSE 'info' END,
        'title', _count || ' Unassigned',
        'detail', _count || ' work order' || CASE WHEN _count != 1 THEN 's' ELSE '' END || ' without a station assignment',
        'targetId', '',
        'targetType', 'work_order',
        'metric', _count,
        'metricLabel', _count || ' UNASSIGNED',
        'sortWeight', 40
      );
    END IF;
  END IF;

  -- 8. NO ROUTING
  IF _enable_no_routing THEN
    FOR _row IN
      SELECT qi.id, qi.title, qi.work_order
      FROM queue_items qi
      LEFT JOIN work_order_routing wor ON wor.queue_item_id = qi.id
      WHERE qi.organization_id = _org_id
        AND (_station_id IS NULL OR qi.station_id = _station_id)
        AND qi.status NOT IN ('completed', 'cancelled')
        AND wor.id IS NULL
      LIMIT 5
    LOOP
      _result := _result || jsonb_build_object(
        'id', 'noroute-' || _row.id,
        'type', 'no_routing',
        'severity', 'info',
        'title', COALESCE(_row.work_order, _row.title),
        'detail', 'Active work order with no routing defined',
        'targetId', _row.id,
        'targetType', 'work_order',
        'metricLabel', 'NO ROUTING',
        'sortWeight', 30
      );
    END LOOP;
  END IF;

  -- Sort by sortWeight descending
  SELECT jsonb_agg(elem ORDER BY (elem->>'sortWeight')::int DESC)
  INTO _result
  FROM jsonb_array_elements(_result) AS elem;

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

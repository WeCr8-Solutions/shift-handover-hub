
-- 1) Setup/Run time split on queue_items
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS setup_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS setup_ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS run_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS run_ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS setup_actual_minutes integer,
  ADD COLUMN IF NOT EXISTS run_actual_minutes integer,
  ADD COLUMN IF NOT EXISTS current_phase text;

COMMENT ON COLUMN public.queue_items.current_phase IS 'setup | run | idle — operator-driven phase tag for two-button time split';

-- 2) Consolidated WO performance view (item #20)
-- Read-through view that combines queue_items + station status so charts
-- and the morning brief share a single source of truth.
CREATE OR REPLACE VIEW public.wo_performance_summary
WITH (security_invoker = true)
AS
SELECT
  qi.id                              AS queue_item_id,
  qi.organization_id,
  qi.team_id,
  qi.station_id,
  qi.work_order,
  qi.part_number,
  qi.operation_number,
  qi.status,
  qi.priority,
  qi.due_date,
  qi.qty_original,
  qi.qty_completed,
  qi.qty_scrap,
  qi.qty_rework,
  qi.qty_open,
  qi.setup_time_minutes              AS setup_planned_minutes,
  qi.cycle_time_minutes,
  qi.first_article_minutes,
  qi.setup_actual_minutes,
  qi.run_actual_minutes,
  qi.current_phase,
  qi.setup_started_at,
  qi.setup_ended_at,
  qi.run_started_at,
  qi.run_ended_at,
  qi.started_at,
  qi.completed_at,
  CASE
    WHEN qi.due_date IS NULL THEN 'unknown'
    WHEN qi.status = 'completed' AND qi.completed_at <= qi.due_date THEN 'on_time'
    WHEN qi.status = 'completed' AND qi.completed_at >  qi.due_date THEN 'late'
    WHEN qi.due_date < now() THEN 'overdue'
    WHEN qi.due_date < now() + interval '24 hours' THEN 'at_risk'
    ELSE 'on_track'
  END                                AS schedule_status,
  CASE
    WHEN COALESCE(qi.qty_original, qi.quantity, 0) = 0 THEN 0
    ELSE round(
      (COALESCE(qi.qty_completed, qi.parts_completed, 0)::numeric
        / GREATEST(COALESCE(qi.qty_original, qi.quantity, 1), 1)::numeric) * 100,
      1
    )
  END                                AS pct_complete,
  CASE
    WHEN qi.setup_time_minutes IS NULL OR qi.setup_time_minutes = 0 THEN NULL
    WHEN qi.setup_actual_minutes IS NULL THEN NULL
    ELSE round(
      ((qi.setup_actual_minutes - qi.setup_time_minutes)::numeric
        / qi.setup_time_minutes::numeric) * 100,
      1
    )
  END                                AS setup_variance_pct,
  s.name                             AS station_name,
  s.work_center,
  s.work_center_type,
  css.current_job_state              AS station_state,
  css.current_operator_name          AS current_operator_name
FROM public.queue_items qi
LEFT JOIN public.stations s              ON s.id = qi.station_id
LEFT JOIN public.current_station_status css ON css.station_id = qi.station_id;

GRANT SELECT ON public.wo_performance_summary TO authenticated;
GRANT SELECT ON public.wo_performance_summary TO service_role;

ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS daily_capacity_hours numeric NOT NULL DEFAULT 8
  CHECK (daily_capacity_hours > 0 AND daily_capacity_hours <= 24);

COMMENT ON COLUMN public.stations.daily_capacity_hours IS
  'Per-station daily available hours used by the load balancer and capacity views. Defaults to 8 (one shift). Override to reflect multi-shift coverage, partial-coverage cells, or constrained bottlenecks.';
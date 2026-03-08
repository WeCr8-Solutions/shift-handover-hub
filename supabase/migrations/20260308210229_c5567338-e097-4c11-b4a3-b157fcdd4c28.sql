-- Backfill null team_id on handoff_records from their associated station
UPDATE public.handoff_records h
SET team_id = s.team_id
FROM public.stations s
WHERE h.station_id = s.id
  AND h.team_id IS NULL
  AND s.team_id IS NOT NULL;
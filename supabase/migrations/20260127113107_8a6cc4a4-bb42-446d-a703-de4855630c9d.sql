-- Add assignment fields to job_performance_updates for post-approval assignment

ALTER TABLE public.job_performance_updates 
ADD COLUMN IF NOT EXISTS assigned_station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_by UUID;
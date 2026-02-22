
-- Create operator_station_sessions table
CREATE TABLE public.operator_station_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id uuid NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id),
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_out_at timestamptz,
  shift text NOT NULL DEFAULT 'Day',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique partial index: one active session per user per station
CREATE UNIQUE INDEX idx_unique_active_session 
  ON public.operator_station_sessions (user_id, station_id) 
  WHERE is_active = true;

-- Index for querying active sessions
CREATE INDEX idx_operator_sessions_active 
  ON public.operator_station_sessions (user_id, is_active) 
  WHERE is_active = true;

CREATE INDEX idx_operator_sessions_org 
  ON public.operator_station_sessions (organization_id, is_active) 
  WHERE is_active = true;

-- Auto-populate organization_id from station
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_operator_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.station_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id 
    FROM public.stations WHERE id = NEW.station_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_populate_org_id_operator_session
  BEFORE INSERT ON public.operator_station_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_org_id_for_operator_session();

-- Enable RLS
ALTER TABLE public.operator_station_sessions ENABLE ROW LEVEL SECURITY;

-- Operators can SELECT their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.operator_station_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Org admins/supervisors can view all sessions in their org
CREATE POLICY "Org admins can view org sessions"
  ON public.operator_station_sessions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL 
    AND (
      public.is_org_admin(auth.uid(), organization_id)
      OR public.is_supervisor_in_org(auth.uid(), organization_id)
    )
  );

-- Platform admins can view all
CREATE POLICY "Platform admins can view all sessions"
  ON public.operator_station_sessions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Operators can insert their own sessions
CREATE POLICY "Users can create own sessions"
  ON public.operator_station_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Operators can update their own sessions (for checkout)
CREATE POLICY "Users can update own sessions"
  ON public.operator_station_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_station_sessions;

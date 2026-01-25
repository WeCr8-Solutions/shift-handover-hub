-- Create stations table
CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  station_id TEXT NOT NULL,
  name TEXT NOT NULL,
  work_center TEXT NOT NULL,
  work_center_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (team_id, station_id)
);

-- Create handoff_records table
CREATE TABLE public.handoff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
  record_version INTEGER NOT NULL DEFAULT 1,
  date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('Day', 'Swing', 'Night')),
  work_order TEXT NOT NULL,
  work_center TEXT NOT NULL,
  work_center_type TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  
  -- Part info
  part_number TEXT NOT NULL,
  part_revision TEXT NOT NULL,
  operation_number TEXT NOT NULL,
  
  -- Personnel
  outgoing_operator_id UUID REFERENCES auth.users(id),
  incoming_operator_id UUID REFERENCES auth.users(id),
  outgoing_operator_name TEXT NOT NULL,
  incoming_operator_name TEXT NOT NULL,
  supervisor_name TEXT,
  
  -- Job state
  primary_state TEXT NOT NULL,
  state_reason TEXT,
  delay_code TEXT DEFAULT 'None',
  
  -- Machine/Equipment Readiness (stored as JSONB for flexibility)
  machine_readiness JSONB,
  equipment_readiness JSONB,
  
  -- Conditions (stored as JSONB)
  machine_condition JSONB,
  welding_condition JSONB,
  water_jet_condition JSONB,
  
  -- Quality status
  last_good_part_timestamp TEXT,
  parts_completed_this_shift INTEGER NOT NULL DEFAULT 0,
  scrap_count INTEGER NOT NULL DEFAULT 0,
  rework_count INTEGER NOT NULL DEFAULT 0,
  critical_dims_verified BOOLEAN NOT NULL DEFAULT false,
  qa_notified TEXT DEFAULT 'N/A',
  quality_notes TEXT,
  
  -- Setup process
  fixture_installed TEXT DEFAULT 'N/A',
  clamps_bolts_torqued TEXT DEFAULT 'N/A',
  fixture_orientation_verified TEXT DEFAULT 'N/A',
  special_instructions_followed TEXT DEFAULT 'N/A',
  process_notes_for_next_shift TEXT,
  
  -- Materials status
  raw_material_available BOOLEAN NOT NULL DEFAULT true,
  next_material_lot_ready BOOLEAN NOT NULL DEFAULT false,
  material_issues_noted BOOLEAN NOT NULL DEFAULT false,
  material_notes TEXT,
  
  -- Summary and sign-off
  handoff_summary TEXT NOT NULL,
  outgoing_time TIMESTAMP WITH TIME ZONE,
  incoming_time TIMESTAMP WITH TIME ZONE,
  supervisor_time TIMESTAMP WITH TIME ZONE,
  
  -- Tooling notes and issues (stored as JSONB arrays)
  tooling_notes JSONB DEFAULT '[]'::jsonb,
  issues_follow_ups JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create current_station_status table for real-time station state
CREATE TABLE public.current_station_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE UNIQUE,
  current_job_work_order TEXT,
  current_job_part_number TEXT,
  current_job_state TEXT,
  current_operator_id UUID REFERENCES auth.users(id),
  current_operator_name TEXT,
  parts_complete INTEGER DEFAULT 0,
  parts_required INTEGER DEFAULT 0,
  condition_status TEXT DEFAULT 'OK',
  condition_notes TEXT,
  last_handoff_id UUID REFERENCES public.handoff_records(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoff_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_station_status ENABLE ROW LEVEL SECURITY;

-- Timestamp triggers
CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_handoff_records_updated_at
  BEFORE UPDATE ON public.handoff_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_current_station_status_updated_at
  BEFORE UPDATE ON public.current_station_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for stations
CREATE POLICY "Team members can view stations"
  ON public.stations FOR SELECT
  TO authenticated
  USING (
    team_id IS NULL OR public.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY "Team admins can create stations"
  ON public.stations FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IS NULL OR public.is_team_admin(auth.uid(), team_id)
  );

CREATE POLICY "Team admins can update stations"
  ON public.stations FOR UPDATE
  TO authenticated
  USING (
    team_id IS NULL OR public.is_team_admin(auth.uid(), team_id)
  );

CREATE POLICY "Team admins can delete stations"
  ON public.stations FOR DELETE
  TO authenticated
  USING (
    team_id IS NULL OR public.is_team_admin(auth.uid(), team_id)
  );

-- RLS Policies for handoff_records
CREATE POLICY "Team members can view handoff records"
  ON public.handoff_records FOR SELECT
  TO authenticated
  USING (
    team_id IS NULL OR public.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY "Team members can create handoff records"
  ON public.handoff_records FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IS NULL OR public.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY "Team members can update own handoff records"
  ON public.handoff_records FOR UPDATE
  TO authenticated
  USING (
    outgoing_operator_id = auth.uid() OR 
    incoming_operator_id = auth.uid() OR
    public.is_team_admin(auth.uid(), team_id)
  );

-- RLS Policies for current_station_status
CREATE POLICY "Team members can view station status"
  ON public.current_station_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stations s 
      WHERE s.id = current_station_status.station_id 
      AND (s.team_id IS NULL OR public.is_team_member(auth.uid(), s.team_id))
    )
  );

CREATE POLICY "Team members can insert station status"
  ON public.current_station_status FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stations s 
      WHERE s.id = current_station_status.station_id 
      AND (s.team_id IS NULL OR public.is_team_member(auth.uid(), s.team_id))
    )
  );

CREATE POLICY "Team members can modify station status"
  ON public.current_station_status FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stations s 
      WHERE s.id = current_station_status.station_id 
      AND (s.team_id IS NULL OR public.is_team_member(auth.uid(), s.team_id))
    )
  );

-- Enable realtime for handoff records and station status
ALTER PUBLICATION supabase_realtime ADD TABLE public.handoff_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.current_station_status;
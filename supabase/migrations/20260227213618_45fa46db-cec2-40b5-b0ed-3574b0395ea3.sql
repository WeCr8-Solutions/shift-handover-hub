
-- Manual machine profiles: per-station, org-scoped, same fields as verified_machine_library
CREATE TABLE public.station_manual_machine_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  
  -- Same fields as verified_machine_library
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  platform_category TEXT NOT NULL,
  max_x_travel NUMERIC,
  max_y_travel NUMERIC,
  max_z_travel NUMERIC,
  max_part_weight NUMERIC,
  max_part_envelope_length NUMERIC,
  max_part_envelope_width NUMERIC,
  max_part_envelope_height NUMERIC,
  five_axis_simultaneous BOOLEAN NOT NULL DEFAULT false,
  fourth_axis BOOLEAN NOT NULL DEFAULT false,
  live_tooling BOOLEAN NOT NULL DEFAULT false,
  y_axis_turn BOOLEAN NOT NULL DEFAULT false,
  sub_spindle BOOLEAN NOT NULL DEFAULT false,
  probing BOOLEAN NOT NULL DEFAULT false,
  through_spindle_coolant BOOLEAN NOT NULL DEFAULT false,
  pallet_pool BOOLEAN NOT NULL DEFAULT false,
  bar_feeder BOOLEAN NOT NULL DEFAULT false,
  material_capability TEXT[] NOT NULL DEFAULT '{}',
  typical_tolerance NUMERIC,
  hard_constraints JSONB[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One manual profile per station
  UNIQUE(station_id)
);

-- Enable RLS
ALTER TABLE public.station_manual_machine_profiles ENABLE ROW LEVEL SECURITY;

-- Org members can view
CREATE POLICY "Org members can view manual profiles"
  ON public.station_manual_machine_profiles FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Org admins, team admins, or platform admins can insert
CREATE POLICY "Org admins can insert manual profiles"
  ON public.station_manual_machine_profiles FOR INSERT
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Org admins can update
CREATE POLICY "Org admins can update manual profiles"
  ON public.station_manual_machine_profiles FOR UPDATE
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Org admins can delete
CREATE POLICY "Org admins can delete manual profiles"
  ON public.station_manual_machine_profiles FOR DELETE
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Auto-populate org_id from station
CREATE TRIGGER auto_populate_org_id_for_manual_machine_profile
  BEFORE INSERT ON public.station_manual_machine_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_org_id_for_machine_assignment();

-- Updated_at trigger
CREATE TRIGGER update_manual_machine_profile_updated_at
  BEFORE UPDATE ON public.station_manual_machine_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- Station Machine Identity Profiles for routing integrity
CREATE TABLE public.station_machine_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Machine Identity
  manufacturer TEXT NOT NULL,
  model TEXT,
  machine_type TEXT NOT NULL,
  platform_category TEXT NOT NULL,
  
  -- Envelope (all in mm)
  max_x_travel NUMERIC,
  max_y_travel NUMERIC,
  max_z_travel NUMERIC,
  max_part_weight NUMERIC,
  max_part_envelope_length NUMERIC,
  max_part_envelope_width NUMERIC,
  max_part_envelope_height NUMERIC,
  
  -- Capability Flags
  five_axis_simultaneous BOOLEAN NOT NULL DEFAULT false,
  fourth_axis BOOLEAN NOT NULL DEFAULT false,
  live_tooling BOOLEAN NOT NULL DEFAULT false,
  y_axis_turn BOOLEAN NOT NULL DEFAULT false,
  sub_spindle BOOLEAN NOT NULL DEFAULT false,
  probing BOOLEAN NOT NULL DEFAULT false,
  through_spindle_coolant BOOLEAN NOT NULL DEFAULT false,
  pallet_pool BOOLEAN NOT NULL DEFAULT false,
  bar_feeder BOOLEAN NOT NULL DEFAULT false,
  
  -- Material Capability
  material_capability TEXT[] NOT NULL DEFAULT '{}',
  
  -- Tolerance (in inches)
  typical_tolerance NUMERIC,
  
  -- Hard Constraints (structured JSON array)
  hard_constraints JSONB NOT NULL DEFAULT '[]',
  
  -- Payment / Activation
  context_active BOOLEAN NOT NULL DEFAULT false,
  stripe_payment_id TEXT,
  activated_at TIMESTAMPTZ,
  activated_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_station_profile UNIQUE(station_id)
);

-- Enable RLS
ALTER TABLE public.station_machine_profiles ENABLE ROW LEVEL SECURITY;

-- Org members can view profiles in their org
CREATE POLICY "Org members can view machine profiles"
ON public.station_machine_profiles FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

-- Org admins/supervisors can insert profiles
CREATE POLICY "Org admins can insert machine profiles"
ON public.station_machine_profiles FOR INSERT
WITH CHECK (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_supervisor_in_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Org admins/supervisors can update profiles
CREATE POLICY "Org admins can update machine profiles"
ON public.station_machine_profiles FOR UPDATE
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_supervisor_in_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Org admins can delete profiles
CREATE POLICY "Org admins can delete machine profiles"
ON public.station_machine_profiles FOR DELETE
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Auto-update timestamp
CREATE TRIGGER update_station_machine_profiles_updated_at
BEFORE UPDATE ON public.station_machine_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-populate org_id from station
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_machine_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.station_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.stations WHERE id = NEW.station_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_populate_org_id_machine_profile
BEFORE INSERT OR UPDATE ON public.station_machine_profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_org_id_for_machine_profile();


-- Drop old per-station profile table (replacing with library model)
DROP TABLE IF EXISTS public.station_machine_profiles;

-- 1) Global verified machine library (managed by platform admins)
CREATE TABLE public.verified_machine_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  platform_category TEXT NOT NULL,
  max_x_travel NUMERIC NULL,
  max_y_travel NUMERIC NULL,
  max_z_travel NUMERIC NULL,
  max_part_weight NUMERIC NULL,
  max_part_envelope_length NUMERIC NULL,
  max_part_envelope_width NUMERIC NULL,
  max_part_envelope_height NUMERIC NULL,
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
  typical_tolerance NUMERIC NULL,
  hard_constraints JSONB NOT NULL DEFAULT '[]',
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(manufacturer, model)
);

ALTER TABLE public.verified_machine_library ENABLE ROW LEVEL SECURITY;

-- Everyone can read the library
CREATE POLICY "Anyone can read verified machine library"
  ON public.verified_machine_library FOR SELECT USING (true);

-- Only platform admins can modify
CREATE POLICY "Platform admins can manage machine library"
  ON public.verified_machine_library FOR ALL
  USING (public.is_dev_or_admin(auth.uid()));

CREATE TRIGGER update_verified_machine_library_updated_at
  BEFORE UPDATE ON public.verified_machine_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Organization machine purchases (tracks which org bought which library entry)
CREATE TABLE public.organization_machine_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  machine_library_id UUID NOT NULL REFERENCES public.verified_machine_library(id) ON DELETE RESTRICT,
  purchased_by UUID NOT NULL,
  stripe_payment_id TEXT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, machine_library_id)
);

ALTER TABLE public.organization_machine_purchases ENABLE ROW LEVEL SECURITY;

-- Org members can see their org's purchases
CREATE POLICY "Org members can view their purchases"
  ON public.organization_machine_purchases FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Org admins can insert (purchase)
CREATE POLICY "Org admins can purchase machines"
  ON public.organization_machine_purchases FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- Platform admins full access
CREATE POLICY "Platform admins manage purchases"
  ON public.organization_machine_purchases FOR ALL
  USING (public.is_dev_or_admin(auth.uid()));

-- 3) Station machine assignments (junction: station → purchased machine)
CREATE TABLE public.station_machine_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.organization_machine_purchases(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(station_id)
);

ALTER TABLE public.station_machine_assignments ENABLE ROW LEVEL SECURITY;

-- Auto-populate org_id from station
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_machine_assignment()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.station_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.stations WHERE id = NEW.station_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_populate_org_id_machine_assignment
  BEFORE INSERT ON public.station_machine_assignments
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_machine_assignment();

-- Org members can view assignments
CREATE POLICY "Org members can view station assignments"
  ON public.station_machine_assignments FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Org admins/team admins can assign
CREATE POLICY "Org members can assign machines to stations"
  ON public.station_machine_assignments FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update station assignments"
  ON public.station_machine_assignments FOR UPDATE
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can remove station assignments"
  ON public.station_machine_assignments FOR DELETE
  USING (public.is_org_member(auth.uid(), organization_id));

-- Platform admins full access
CREATE POLICY "Platform admins manage assignments"
  ON public.station_machine_assignments FOR ALL
  USING (public.is_dev_or_admin(auth.uid()));

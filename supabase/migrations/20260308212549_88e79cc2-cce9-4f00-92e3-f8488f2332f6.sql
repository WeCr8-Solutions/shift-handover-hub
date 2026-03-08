
-- Table: Dimension requirements defined per routing step
CREATE TABLE public.routing_step_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_step_id UUID NOT NULL REFERENCES public.work_order_routing(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  dimension_name TEXT NOT NULL,
  nominal_value NUMERIC NOT NULL,
  upper_tolerance NUMERIC NOT NULL,
  lower_tolerance NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'in',
  is_critical BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: Operator-recorded dimension readings
CREATE TABLE public.dimension_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL REFERENCES public.routing_step_dimensions(id) ON DELETE CASCADE,
  routing_step_id UUID NOT NULL REFERENCES public.work_order_routing(id) ON DELETE CASCADE,
  queue_item_id UUID NOT NULL REFERENCES public.queue_items(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  measured_value NUMERIC NOT NULL,
  is_pass BOOLEAN NOT NULL DEFAULT true,
  instrument_used TEXT,
  recorded_by UUID,
  recorded_by_name TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Auto-populate org_id triggers
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_step_dimension()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.routing_step_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.work_order_routing WHERE id = NEW.routing_step_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_org_step_dimension
  BEFORE INSERT ON public.routing_step_dimensions
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_step_dimension();

CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_dimension_reading()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.queue_item_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.queue_items WHERE id = NEW.queue_item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_org_dimension_reading
  BEFORE INSERT ON public.dimension_readings
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_dimension_reading();

-- Auto-compute is_pass based on tolerances
CREATE OR REPLACE FUNCTION public.auto_compute_dimension_pass()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  _dim RECORD;
BEGIN
  SELECT nominal_value, upper_tolerance, lower_tolerance INTO _dim
  FROM public.routing_step_dimensions WHERE id = NEW.dimension_id;
  
  IF FOUND THEN
    NEW.is_pass := NEW.measured_value >= (_dim.nominal_value - _dim.lower_tolerance)
                AND NEW.measured_value <= (_dim.nominal_value + _dim.upper_tolerance);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_pass_dimension
  BEFORE INSERT OR UPDATE OF measured_value ON public.dimension_readings
  FOR EACH ROW EXECUTE FUNCTION public.auto_compute_dimension_pass();

-- RLS
ALTER TABLE public.routing_step_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimension_readings ENABLE ROW LEVEL SECURITY;

-- Routing step dimensions: org members can view, supervisors/admins can manage
CREATE POLICY "Org members can view step dimensions"
  ON public.routing_step_dimensions FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage step dimensions"
  ON public.routing_step_dimensions FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id));

-- Dimension readings: org members can view and insert
CREATE POLICY "Org members can view readings"
  ON public.dimension_readings FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can insert readings"
  ON public.dimension_readings FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage readings"
  ON public.dimension_readings FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR public.is_supervisor_in_org(auth.uid(), organization_id));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routing_step_dimensions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dimension_readings TO authenticated;

-- Add dimensions_required flag to work_order_routing
ALTER TABLE public.work_order_routing ADD COLUMN IF NOT EXISTS dimensions_required BOOLEAN NOT NULL DEFAULT false;

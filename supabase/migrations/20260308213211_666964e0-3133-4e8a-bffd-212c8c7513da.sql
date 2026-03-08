
-- Table for operators to request dimension checks on routing steps
CREATE TABLE public.dimension_check_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_step_id UUID NOT NULL REFERENCES public.work_order_routing(id) ON DELETE CASCADE,
  queue_item_id UUID NOT NULL REFERENCES public.queue_items(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  requested_by UUID REFERENCES auth.users(id),
  requested_by_name TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-populate org_id
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_dim_check_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.queue_item_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.queue_items WHERE id = NEW.queue_item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_org_dim_check_request
  BEFORE INSERT ON public.dimension_check_requests
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_dim_check_request();

-- RLS
ALTER TABLE public.dimension_check_requests ENABLE ROW LEVEL SECURITY;

-- Org members can view requests in their org
CREATE POLICY "Org members can view dimension check requests"
  ON public.dimension_check_requests FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- Authenticated users can insert (operators requesting)
CREATE POLICY "Authenticated users can request dimension checks"
  ON public.dimension_check_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by AND public.is_org_member(auth.uid(), organization_id));

-- Supervisors/admins can update (approve/reject)
CREATE POLICY "Supervisors can review dimension check requests"
  ON public.dimension_check_requests FOR UPDATE TO authenticated
  USING (public.can_supervisor_override_in_org(auth.uid(), organization_id));

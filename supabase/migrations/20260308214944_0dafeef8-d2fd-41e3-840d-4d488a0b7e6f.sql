
-- Setup sheets table: one per routing step (operation) per work order
CREATE TABLE public.setup_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routing_step_id UUID NOT NULL REFERENCES public.work_order_routing(id) ON DELETE CASCADE,
  queue_item_id UUID NOT NULL REFERENCES public.queue_items(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sheet_type TEXT NOT NULL DEFAULT 'setup_sheet',
  file_url TEXT,
  file_name TEXT,
  external_link TEXT,
  description TEXT,
  revision TEXT DEFAULT 'A',
  uploaded_by UUID,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_setup_sheets_routing_step ON public.setup_sheets(routing_step_id);
CREATE INDEX idx_setup_sheets_queue_item ON public.setup_sheets(queue_item_id);
CREATE INDEX idx_setup_sheets_org ON public.setup_sheets(organization_id);

-- Auto-populate org_id trigger
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_setup_sheet()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.queue_item_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.queue_items WHERE id = NEW.queue_item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_setup_sheets_org_id
  BEFORE INSERT ON public.setup_sheets
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_setup_sheet();

-- RLS
ALTER TABLE public.setup_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view setup sheets"
  ON public.setup_sheets FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can insert setup sheets"
  ON public.setup_sheets FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Supervisors and dimension roles can update setup sheets"
  ON public.setup_sheets FOR UPDATE TO authenticated
  USING (public.can_manage_dimensions(auth.uid(), organization_id));

CREATE POLICY "Supervisors and dimension roles can delete setup sheets"
  ON public.setup_sheets FOR DELETE TO authenticated
  USING (public.can_manage_dimensions(auth.uid(), organization_id));

-- Grant API access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setup_sheets TO authenticated;
GRANT SELECT ON public.setup_sheets TO anon;

-- Storage bucket for setup sheet files
INSERT INTO storage.buckets (id, name, public)
VALUES ('setup-sheets', 'setup-sheets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for setup-sheets bucket
CREATE POLICY "Org members can upload setup sheets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'setup-sheets');

CREATE POLICY "Org members can view setup sheets files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'setup-sheets');

CREATE POLICY "Supervisors can delete setup sheet files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'setup-sheets');

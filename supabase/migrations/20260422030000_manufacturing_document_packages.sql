CREATE TABLE public.manufacturing_document_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_revision TEXT,
  package_code TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  release_notes TEXT,
  effective_at TIMESTAMPTZ,
  superseded_by_package_id UUID REFERENCES public.manufacturing_document_packages(id) ON DELETE SET NULL,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT manufacturing_document_packages_status_check
    CHECK (status IN ('draft', 'in_review', 'released', 'superseded', 'archived')),
  CONSTRAINT manufacturing_document_packages_org_code_key
    UNIQUE (organization_id, package_code)
);

CREATE TABLE public.manufacturing_package_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.manufacturing_document_packages(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_code TEXT,
  title TEXT NOT NULL,
  revision TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  storage_path TEXT,
  external_link TEXT,
  file_name TEXT,
  mime_type TEXT,
  checksum TEXT,
  uploaded_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT manufacturing_package_documents_status_check
    CHECK (status IN ('draft', 'released', 'obsolete')),
  CONSTRAINT manufacturing_package_documents_link_check
    CHECK (storage_path IS NOT NULL OR external_link IS NOT NULL)
);

CREATE TABLE public.manufacturing_package_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.manufacturing_document_packages(id) ON DELETE CASCADE,
  required_document_type TEXT NOT NULL,
  required_min_count INTEGER NOT NULL DEFAULT 1,
  routing_step_id UUID REFERENCES public.work_order_routing(id) ON DELETE CASCADE,
  operation_type TEXT,
  is_blocking BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT manufacturing_package_requirements_min_count_check
    CHECK (required_min_count > 0)
);

CREATE TABLE public.queue_item_document_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_item_id UUID NOT NULL REFERENCES public.queue_items(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.manufacturing_document_packages(id) ON DELETE CASCADE,
  assigned_revision TEXT,
  assignment_mode TEXT NOT NULL DEFAULT 'linked',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT queue_item_document_packages_mode_check
    CHECK (assignment_mode IN ('linked', 'snapshot')),
  CONSTRAINT queue_item_document_packages_queue_item_package_key
    UNIQUE (queue_item_id, package_id)
);

CREATE TABLE public.routing_step_package_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routing_step_id UUID NOT NULL REFERENCES public.work_order_routing(id) ON DELETE CASCADE,
  package_document_id UUID NOT NULL REFERENCES public.manufacturing_package_documents(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL DEFAULT 'required',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT routing_step_package_documents_usage_type_check
    CHECK (usage_type IN ('required', 'optional', 'reference')),
  CONSTRAINT routing_step_package_documents_step_doc_key
    UNIQUE (routing_step_id, package_document_id)
);

CREATE INDEX idx_mdp_org ON public.manufacturing_document_packages(organization_id);
CREATE INDEX idx_mdp_part ON public.manufacturing_document_packages(organization_id, part_number, part_revision);
CREATE INDEX idx_mpd_package ON public.manufacturing_package_documents(package_id);
CREATE INDEX idx_mpd_org ON public.manufacturing_package_documents(organization_id);
CREATE INDEX idx_mpr_package ON public.manufacturing_package_requirements(package_id);
CREATE INDEX idx_qidp_queue_item ON public.queue_item_document_packages(queue_item_id);
CREATE INDEX idx_qidp_package ON public.queue_item_document_packages(package_id);
CREATE INDEX idx_rspd_step ON public.routing_step_package_documents(routing_step_id);
CREATE INDEX idx_rspd_document ON public.routing_step_package_documents(package_document_id);

CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_package_document()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.package_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.manufacturing_document_packages
    WHERE id = NEW.package_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_package_document_org_id
  BEFORE INSERT ON public.manufacturing_package_documents
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_package_document();

ALTER TABLE public.manufacturing_document_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_package_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_package_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_item_document_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_step_package_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view manufacturing document packages"
  ON public.manufacturing_document_packages FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Supervisors can insert manufacturing document packages"
  ON public.manufacturing_document_packages FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_dimensions(auth.uid(), organization_id));

CREATE POLICY "Supervisors can update manufacturing document packages"
  ON public.manufacturing_document_packages FOR UPDATE TO authenticated
  USING (public.can_manage_dimensions(auth.uid(), organization_id));

CREATE POLICY "Supervisors can delete manufacturing document packages"
  ON public.manufacturing_document_packages FOR DELETE TO authenticated
  USING (public.can_manage_dimensions(auth.uid(), organization_id));

CREATE POLICY "Org members can view manufacturing package documents"
  ON public.manufacturing_package_documents FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Supervisors can insert manufacturing package documents"
  ON public.manufacturing_package_documents FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_dimensions(auth.uid(), organization_id));

CREATE POLICY "Supervisors can update manufacturing package documents"
  ON public.manufacturing_package_documents FOR UPDATE TO authenticated
  USING (public.can_manage_dimensions(auth.uid(), organization_id));

CREATE POLICY "Supervisors can delete manufacturing package documents"
  ON public.manufacturing_package_documents FOR DELETE TO authenticated
  USING (public.can_manage_dimensions(auth.uid(), organization_id));

CREATE POLICY "Org members can view manufacturing package requirements"
  ON public.manufacturing_package_requirements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.manufacturing_document_packages mdp
      WHERE mdp.id = package_id
      AND public.is_org_member(auth.uid(), mdp.organization_id)
    )
  );

CREATE POLICY "Supervisors can insert manufacturing package requirements"
  ON public.manufacturing_package_requirements FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.manufacturing_document_packages mdp
      WHERE mdp.id = package_id
      AND public.can_manage_dimensions(auth.uid(), mdp.organization_id)
    )
  );

CREATE POLICY "Supervisors can update manufacturing package requirements"
  ON public.manufacturing_package_requirements FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.manufacturing_document_packages mdp
      WHERE mdp.id = package_id
      AND public.can_manage_dimensions(auth.uid(), mdp.organization_id)
    )
  );

CREATE POLICY "Supervisors can delete manufacturing package requirements"
  ON public.manufacturing_package_requirements FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.manufacturing_document_packages mdp
      WHERE mdp.id = package_id
      AND public.can_manage_dimensions(auth.uid(), mdp.organization_id)
    )
  );

CREATE POLICY "Org members can view queue item document packages"
  ON public.queue_item_document_packages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.queue_items qi
      WHERE qi.id = queue_item_id
      AND public.is_org_member(auth.uid(), qi.organization_id)
    )
  );

CREATE POLICY "Supervisors can insert queue item document packages"
  ON public.queue_item_document_packages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.queue_items qi
      WHERE qi.id = queue_item_id
      AND public.can_manage_dimensions(auth.uid(), qi.organization_id)
    )
  );

CREATE POLICY "Supervisors can update queue item document packages"
  ON public.queue_item_document_packages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.queue_items qi
      WHERE qi.id = queue_item_id
      AND public.can_manage_dimensions(auth.uid(), qi.organization_id)
    )
  );

CREATE POLICY "Supervisors can delete queue item document packages"
  ON public.queue_item_document_packages FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.queue_items qi
      WHERE qi.id = queue_item_id
      AND public.can_manage_dimensions(auth.uid(), qi.organization_id)
    )
  );

CREATE POLICY "Org members can view routing step package documents"
  ON public.routing_step_package_documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.work_order_routing wor
      JOIN public.queue_items qi ON qi.id = wor.queue_item_id
      WHERE wor.id = routing_step_id
      AND public.is_org_member(auth.uid(), qi.organization_id)
    )
  );

CREATE POLICY "Supervisors can insert routing step package documents"
  ON public.routing_step_package_documents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.work_order_routing wor
      JOIN public.queue_items qi ON qi.id = wor.queue_item_id
      WHERE wor.id = routing_step_id
      AND public.can_manage_dimensions(auth.uid(), qi.organization_id)
    )
  );

CREATE POLICY "Supervisors can update routing step package documents"
  ON public.routing_step_package_documents FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.work_order_routing wor
      JOIN public.queue_items qi ON qi.id = wor.queue_item_id
      WHERE wor.id = routing_step_id
      AND public.can_manage_dimensions(auth.uid(), qi.organization_id)
    )
  );

CREATE POLICY "Supervisors can delete routing step package documents"
  ON public.routing_step_package_documents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.work_order_routing wor
      JOIN public.queue_items qi ON qi.id = wor.queue_item_id
      WHERE wor.id = routing_step_id
      AND public.can_manage_dimensions(auth.uid(), qi.organization_id)
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturing_document_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturing_package_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturing_package_requirements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_item_document_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routing_step_package_documents TO authenticated;

GRANT SELECT ON public.manufacturing_document_packages TO anon;
GRANT SELECT ON public.manufacturing_package_documents TO anon;
GRANT SELECT ON public.manufacturing_package_requirements TO anon;
GRANT SELECT ON public.queue_item_document_packages TO anon;
GRANT SELECT ON public.routing_step_package_documents TO anon;
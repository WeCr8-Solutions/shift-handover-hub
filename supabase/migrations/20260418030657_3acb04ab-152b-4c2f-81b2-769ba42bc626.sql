CREATE TABLE IF NOT EXISTS public.gca_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  bank_id UUID NOT NULL REFERENCES public.gca_question_banks(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_by_name TEXT,
  notes TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, bank_id)
);

CREATE INDEX IF NOT EXISTS idx_gca_assignments_org ON public.gca_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_gca_assignments_user ON public.gca_assignments(user_id);

ALTER TABLE public.gca_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own GCA assignments"
  ON public.gca_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Org staff view org GCA assignments"
  ON public.gca_assignments FOR SELECT TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  );

CREATE POLICY "Org staff create GCA assignments"
  ON public.gca_assignments FOR INSERT TO authenticated
  WITH CHECK (
    (public.is_org_admin(auth.uid(), organization_id)
     OR public.is_supervisor_in_org(auth.uid(), organization_id))
    AND assigned_by = auth.uid()
  );

CREATE POLICY "Org staff update GCA assignments"
  ON public.gca_assignments FOR UPDATE TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
    OR auth.uid() = user_id
  )
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
    OR auth.uid() = user_id
  );

CREATE POLICY "Org admins delete GCA assignments"
  ON public.gca_assignments FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER trg_gca_assignments_updated_at
  BEFORE UPDATE ON public.gca_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
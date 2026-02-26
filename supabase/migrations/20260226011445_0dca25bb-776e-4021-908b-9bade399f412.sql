
-- routing_templates: allow supervisors to manage templates (org-scoped)
DROP POLICY IF EXISTS "Org admins can manage templates" ON public.routing_templates;
CREATE POLICY "Org admins and supervisors can manage templates"
  ON public.routing_templates
  FOR ALL
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  )
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  );

-- routing_template_steps: allow supervisors to manage template steps (org-scoped via template join)
DROP POLICY IF EXISTS "Org admins can manage template steps" ON public.routing_template_steps;
CREATE POLICY "Org admins and supervisors can manage template steps"
  ON public.routing_template_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.routing_templates rt
      WHERE rt.id = template_id
        AND (
          public.is_org_admin(auth.uid(), rt.organization_id)
          OR public.is_supervisor_in_org(auth.uid(), rt.organization_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routing_templates rt
      WHERE rt.id = template_id
        AND (
          public.is_org_admin(auth.uid(), rt.organization_id)
          OR public.is_supervisor_in_org(auth.uid(), rt.organization_id)
        )
    )
  );

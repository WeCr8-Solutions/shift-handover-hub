
-- Drop and recreate the org settings management policy to include supervisors
DROP POLICY IF EXISTS "Org admins can manage org settings" ON public.app_settings;

CREATE POLICY "Org admins and supervisors can manage org settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (
  (organization_id IS NOT NULL AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  ))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  (organization_id IS NOT NULL AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  ))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

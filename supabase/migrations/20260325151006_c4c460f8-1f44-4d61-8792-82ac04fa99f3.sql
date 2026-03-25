
-- Fix: Restrict organization_integrations SELECT to org admins only
-- Previously all org members could read credentials_encrypted

DROP POLICY IF EXISTS "Org members can view integrations" ON public.organization_integrations;

CREATE POLICY "Org admins can view integrations"
ON public.organization_integrations FOR SELECT
TO authenticated
USING (is_org_admin(auth.uid(), organization_id));

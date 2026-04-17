-- Fix 1: Restrict flyer_stop_visits SELECT to own visits or admins
DROP POLICY IF EXISTS "Flyer workers can view stop visits" ON public.flyer_stop_visits;

CREATE POLICY "Flyer workers can view their own stop visits"
ON public.flyer_stop_visits
FOR SELECT
USING (
  has_role(auth.uid(), 'flyer_worker'::app_role)
  AND visited_by = auth.uid()
);

-- Fix 2: Restrict machine purchase INSERT to org admins (not just any member)
DROP POLICY IF EXISTS "Org admins can purchase machines" ON public.organization_machine_purchases;

CREATE POLICY "Org admins can purchase machines"
ON public.organization_machine_purchases
FOR INSERT
WITH CHECK (is_org_admin(auth.uid(), organization_id));
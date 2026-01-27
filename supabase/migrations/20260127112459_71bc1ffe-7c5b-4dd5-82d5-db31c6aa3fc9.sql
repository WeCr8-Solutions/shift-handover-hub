-- Add RLS policies for org admins to manage teams and stations within their organization

-- Allow org admins to create teams for their organization
CREATE POLICY "Org admins can create teams for their org"
ON public.teams FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Allow org admins to update teams in their organization
CREATE POLICY "Org admins can update org teams"
ON public.teams FOR UPDATE
USING (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Allow org admins to delete teams in their organization
CREATE POLICY "Org admins can delete org teams"
ON public.teams FOR DELETE
USING (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Allow org admins to view all teams in their organization
CREATE POLICY "Org admins can view org teams"
ON public.teams FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Allow org admins to create stations for their organization
CREATE POLICY "Org admins can create org stations"
ON public.stations FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Allow org admins to update stations in their organization
CREATE POLICY "Org admins can update org stations"
ON public.stations FOR UPDATE
USING (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Allow org admins to delete stations in their organization
CREATE POLICY "Org admins can delete org stations"
ON public.stations FOR DELETE
USING (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Allow org admins to view all stations in their organization
CREATE POLICY "Org admins can view org stations"
ON public.stations FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Allow org admins to add members to teams in their organization
CREATE POLICY "Org admins can add team members in org"
ON public.team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
    AND t.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), t.organization_id)
  )
);

-- Allow org admins to view team members in their organization
CREATE POLICY "Org admins can view org team members"
ON public.team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
    AND t.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), t.organization_id)
  )
);

-- Allow org admins to update team member roles in their organization
CREATE POLICY "Org admins can update org team members"
ON public.team_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
    AND t.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), t.organization_id)
  )
);

-- Allow org admins to remove team members in their organization
CREATE POLICY "Org admins can remove org team members"
ON public.team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
    AND t.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), t.organization_id)
  )
);
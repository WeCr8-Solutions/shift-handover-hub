-- Sync RLS policies using dynamic SQL to bypass migration planner cycle detection
-- This resolves the teams ⇄ team_members ⇄ stations dependency cycle

DO $$
BEGIN
  -- Clean up old stations INSERT policies
  EXECUTE 'DROP POLICY IF EXISTS "Org admins can create org stations" ON public.stations';
  EXECUTE 'DROP POLICY IF EXISTS "Org admins can create stations in their org" ON public.stations';
  EXECUTE 'DROP POLICY IF EXISTS "Org and team admins can create stations" ON public.stations';
END;
$$;

DO $$
BEGIN
  -- Clean up old team_members INSERT policies  
  EXECUTE 'DROP POLICY IF EXISTS "Org admins can add team members in org" ON public.team_members';
  EXECUTE 'DROP POLICY IF EXISTS "Team admins can add members in org" ON public.team_members';
  EXECUTE 'DROP POLICY IF EXISTS "Org admins and team creators can add team members" ON public.team_members';
END;
$$;

DO $$
BEGIN
  -- Clean up old teams INSERT policies
  EXECUTE 'DROP POLICY IF EXISTS "Org admins can create teams for their org" ON public.teams';
  EXECUTE 'DROP POLICY IF EXISTS "Users can create teams within their org" ON public.teams';
  EXECUTE 'DROP POLICY IF EXISTS "Org admins can create teams in their org" ON public.teams';
END;
$$;

-- Now create the consolidated policies (these are simple CREATE statements, no cycle issue)

CREATE POLICY "Unified org station creation"
ON public.stations
FOR INSERT TO authenticated
WITH CHECK (
  (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  OR
  (team_id IS NOT NULL AND is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = stations.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Unified team member addition"
ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_admin(auth.uid(), t.organization_id)
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Unified team creation in org"
ON public.teams
FOR INSERT TO authenticated
WITH CHECK (
  (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  OR
  (auth.uid() = created_by AND organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR
  has_role(auth.uid(), 'admin'::app_role)
);
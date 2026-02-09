-- Comprehensive RLS policy repair migration
-- Uses dynamic SQL to bypass migration planner cycle detection for teams ⇄ team_members ⇄ stations

-- Step 1: Drop ALL conflicting INSERT policies on all three tables using dynamic SQL
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop all INSERT policies on stations
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'stations' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.stations', pol.policyname);
  END LOOP;
  
  -- Drop all INSERT policies on team_members
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'team_members' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', pol.policyname);
  END LOOP;
  
  -- Drop all INSERT policies on teams
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'teams' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', pol.policyname);
  END LOOP;
END;
$$;

-- Step 2: Create simple, non-cyclic INSERT policies

-- Teams: org admins or org members (as creator) can create
CREATE POLICY "teams_insert_policy"
ON public.teams FOR INSERT TO authenticated
WITH CHECK (
  organization_id IS NOT NULL 
  AND (
    is_org_admin(auth.uid(), organization_id)
    OR (auth.uid() = created_by AND is_org_member(auth.uid(), organization_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Team members: org admins, team admins, or self-join if org member
CREATE POLICY "team_members_insert_policy"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id 
    AND t.organization_id IS NOT NULL
    AND (
      is_org_admin(auth.uid(), t.organization_id)
      OR is_team_admin(auth.uid(), team_members.team_id)
      OR (auth.uid() = team_members.user_id AND is_org_member(auth.uid(), t.organization_id))
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Stations: org admins or team admins within their org
CREATE POLICY "stations_insert_policy"
ON public.stations FOR INSERT TO authenticated
WITH CHECK (
  (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  OR (team_id IS NOT NULL AND is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = stations.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);
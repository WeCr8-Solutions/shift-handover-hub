
-- Fix RLS policies for new user org creation flow
-- Problem: When a user creates an org and tries to add themselves as owner,
-- the is_org_admin check fails because they're not yet a member

-- 1. Drop and recreate organization_members INSERT policy to be clearer
DROP POLICY IF EXISTS "Org admins can add members" ON organization_members;

-- Allow users to add themselves as owner when creating a new org (auth.uid() = user_id)
-- OR allow org admins to add other members
CREATE POLICY "Users can join as owner or admins can add members"
ON organization_members
FOR INSERT TO authenticated
WITH CHECK (
  -- User adding themselves (for org creation - they become owner)
  (auth.uid() = user_id)
  OR
  -- Org admin adding other users
  is_org_admin(auth.uid(), organization_id)
);

-- 2. Fix teams INSERT policy to allow org owners (not just admins) to create teams
DROP POLICY IF EXISTS "Org admins can create teams for their org" ON teams;
DROP POLICY IF EXISTS "Users can create teams within their org" ON teams;

-- Allow org members who are admin/owner to create teams
CREATE POLICY "Org admins can create teams in their org"
ON teams
FOR INSERT TO authenticated
WITH CHECK (
  (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  OR
  -- Allow authenticated users to create teams with themselves as creator in their org
  (auth.uid() = created_by AND organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR
  -- Platform admins can create any team
  has_role(auth.uid(), 'admin')
);

-- 3. Fix team_members INSERT to allow team creators to add themselves
DROP POLICY IF EXISTS "Team admins can add members in org" ON team_members;
DROP POLICY IF EXISTS "Org admins can add team members in org" ON team_members;

-- Allow org admins or team creators to add members
CREATE POLICY "Org admins and team creators can add team members"
ON team_members
FOR INSERT TO authenticated
WITH CHECK (
  -- User adding themselves to a team in their org
  (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR
  -- Team admin adding others
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR
  -- Org admin adding anyone to org teams
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_admin(auth.uid(), t.organization_id)
  )
  OR
  -- Platform admin
  has_role(auth.uid(), 'admin')
);

-- 4. Fix stations INSERT to allow team admins in their org
DROP POLICY IF EXISTS "Org admins can create stations in their org" ON stations;
DROP POLICY IF EXISTS "Org admins can create org stations" ON stations;

-- Cleaner station creation policy
CREATE POLICY "Org and team admins can create stations"
ON stations
FOR INSERT TO authenticated
WITH CHECK (
  -- Org admin creating station with org_id
  (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  OR
  -- Team admin creating station with team_id (must be in same org)
  (team_id IS NOT NULL AND is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR
  -- Platform admin
  has_role(auth.uid(), 'admin')
);

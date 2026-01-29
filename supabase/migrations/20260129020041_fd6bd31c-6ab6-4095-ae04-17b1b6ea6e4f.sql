
-- SECURITY FIX: Strengthen organization-level data isolation
-- Ensures users cannot see other organization's teams or data

-- 1. Update teams table RLS: restrict team visibility to org members ONLY
-- Drop existing permissive policies that allow viewing without org context
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they created" ON public.teams;

-- Create stricter policies that REQUIRE organization membership
CREATE POLICY "Team members within org can view teams"
ON public.teams FOR SELECT
USING (
  -- User must be a member of the team AND team must belong to user's org
  (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id) AND is_team_member(auth.uid(), id))
  OR
  -- OR user is platform admin
  has_role(auth.uid(), 'admin')
);

-- Allow viewing teams you created ONLY if within your org
CREATE POLICY "Creators can view own teams in their org"
ON public.teams FOR SELECT
USING (
  auth.uid() = created_by 
  AND (organization_id IS NULL OR is_org_member(auth.uid(), organization_id))
);

-- 2. team_members: Ensure org isolation
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;

CREATE POLICY "Team members can view membership within org"
ON public.team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND (
      -- Team is in an org user belongs to
      (t.organization_id IS NOT NULL AND is_org_member(auth.uid(), t.organization_id))
      OR
      -- Legacy: team without org, user is member
      (t.organization_id IS NULL AND is_team_member(auth.uid(), team_id))
      OR
      -- Platform admin
      has_role(auth.uid(), 'admin')
    )
  )
);

-- 3. Tighten team creation to require org context (going forward)
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

CREATE POLICY "Users can create teams within their org"
ON public.teams FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    -- Must specify an org they belong to OR be admin
    (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
    OR has_role(auth.uid(), 'admin')
  )
);

-- 4. Fix handoff_records to require org context via team
DROP POLICY IF EXISTS "Team members can view handoff records" ON public.handoff_records;

CREATE POLICY "Team members can view handoff records in their org"
ON public.handoff_records FOR SELECT
USING (
  -- Handoff belongs to a team in user's org
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = handoff_records.team_id
    AND t.organization_id IS NOT NULL
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

-- 5. Fix queue_items visibility
DROP POLICY IF EXISTS "Team members can view queue items" ON public.queue_items;

CREATE POLICY "Members can view queue items in their org"
ON public.queue_items FOR SELECT
USING (
  -- Org-level access
  (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR
  -- Team-level access within org
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = queue_items.team_id
    AND t.organization_id IS NOT NULL
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

-- 6. Stations visibility scoped to org
DROP POLICY IF EXISTS "Team members can view stations" ON public.stations;

CREATE POLICY "Org members can view stations in their org"
ON public.stations FOR SELECT
USING (
  (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = stations.team_id
    AND t.organization_id IS NOT NULL
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

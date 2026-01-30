
-- Fix org-level data isolation issues across multiple tables

-- ============================================
-- 1. FIX departments - add org scope via team
-- ============================================
DROP POLICY IF EXISTS "Team members can view departments" ON public.departments;

CREATE POLICY "Org members can view departments in their org"
ON public.departments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = departments.team_id 
    AND t.organization_id IS NOT NULL
    AND is_org_member(auth.uid(), t.organization_id)
  )
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- 2. FIX job_performance_updates - require org membership
-- ============================================
DROP POLICY IF EXISTS "Users can view updates in their teams" ON public.job_performance_updates;

CREATE POLICY "Org members can view updates in their org"
ON public.job_performance_updates
FOR SELECT
USING (
  -- User's own updates
  (auth.uid() = user_id)
  -- Or updates in teams within user's org
  OR (
    team_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = job_performance_updates.team_id
      AND t.organization_id IS NOT NULL
      AND is_org_member(auth.uid(), t.organization_id)
    )
  )
  -- Platform admins
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- 3. FIX current_station_status - require org scope
-- ============================================
DROP POLICY IF EXISTS "Team members can view station status" ON public.current_station_status;
DROP POLICY IF EXISTS "Team members can modify station status" ON public.current_station_status;
DROP POLICY IF EXISTS "Team members can insert station status" ON public.current_station_status;

-- SELECT: Org members can view station status in their org
CREATE POLICY "Org members can view station status"
ON public.current_station_status
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stations s
    JOIN teams t ON s.team_id = t.id
    WHERE s.id = current_station_status.station_id
    AND t.organization_id IS NOT NULL
    AND is_org_member(auth.uid(), t.organization_id)
  )
  OR has_role(auth.uid(), 'admin')
);

-- UPDATE: Org members can modify station status in their org
CREATE POLICY "Org members can modify station status"
ON public.current_station_status
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stations s
    JOIN teams t ON s.team_id = t.id
    WHERE s.id = current_station_status.station_id
    AND t.organization_id IS NOT NULL
    AND is_org_member(auth.uid(), t.organization_id)
  )
  OR has_role(auth.uid(), 'admin')
);

-- INSERT: Org members can insert station status in their org
CREATE POLICY "Org members can insert station status"
ON public.current_station_status
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stations s
    JOIN teams t ON s.team_id = t.id
    WHERE s.id = current_station_status.station_id
    AND t.organization_id IS NOT NULL
    AND is_org_member(auth.uid(), t.organization_id)
  )
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- 4. FIX handoff_records INSERT - require org scope
-- ============================================
DROP POLICY IF EXISTS "Team members can create handoff records" ON public.handoff_records;

CREATE POLICY "Org members can create handoff records"
ON public.handoff_records
FOR INSERT
WITH CHECK (
  -- Must have a team_id that belongs to user's org
  (
    team_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = handoff_records.team_id
      AND t.organization_id IS NOT NULL
      AND is_org_member(auth.uid(), t.organization_id)
    )
  )
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- 5. FIX queue_items INSERT - require org scope
-- ============================================
DROP POLICY IF EXISTS "Team members can create queue items" ON public.queue_items;

CREATE POLICY "Org members can create queue items"
ON public.queue_items
FOR INSERT
WITH CHECK (
  -- Organization must be set and user must be member
  (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  -- Or platform admin
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- 6. FIX queue_items UPDATE - require org scope
-- ============================================
DROP POLICY IF EXISTS "Team members can update queue items" ON public.queue_items;

CREATE POLICY "Org members can update queue items"
ON public.queue_items
FOR UPDATE
USING (
  (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- 7. FIX stations INSERT - require org scope 
-- ============================================
DROP POLICY IF EXISTS "Team admins can create stations" ON public.stations;

CREATE POLICY "Org admins can create stations in their org"
ON public.stations
FOR INSERT
WITH CHECK (
  -- Organization must be set and user must be org admin
  (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  -- Or through team that belongs to user's org (as team admin)
  OR (
    team_id IS NOT NULL 
    AND is_team_admin(auth.uid(), team_id)
    AND EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = stations.team_id 
      AND t.organization_id IS NOT NULL 
      AND is_org_member(auth.uid(), t.organization_id)
    )
  )
  -- Platform admin
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- 8. FIX stations UPDATE - require org scope
-- ============================================
DROP POLICY IF EXISTS "Team admins can update stations" ON public.stations;

CREATE POLICY "Team admins can update org stations"
ON public.stations
FOR UPDATE
USING (
  -- Direct org admin
  (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  -- Or team admin within same org
  OR (
    team_id IS NOT NULL 
    AND is_team_admin(auth.uid(), team_id)
    AND EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = stations.team_id 
      AND t.organization_id IS NOT NULL 
      AND is_org_member(auth.uid(), t.organization_id)
    )
  )
  OR has_role(auth.uid(), 'admin')
);

-- ============================================
-- 9. FIX stations DELETE - require org scope
-- ============================================
DROP POLICY IF EXISTS "Team admins can delete stations" ON public.stations;

CREATE POLICY "Team admins can delete org stations"
ON public.stations
FOR DELETE
USING (
  (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  OR (
    team_id IS NOT NULL 
    AND is_team_admin(auth.uid(), team_id)
    AND EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = stations.team_id 
      AND t.organization_id IS NOT NULL 
      AND is_org_member(auth.uid(), t.organization_id)
    )
  )
  OR has_role(auth.uid(), 'admin')
);

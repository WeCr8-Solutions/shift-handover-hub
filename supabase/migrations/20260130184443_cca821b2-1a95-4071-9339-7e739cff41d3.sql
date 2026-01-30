
-- =====================================================
-- RLS HARDENING: Org-Scoped Access for Team-Based Operations
-- =====================================================

-- 1. FIX team_members: Team admins must be verified in same org
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update member roles" ON public.team_members;

-- New: Team admins can add members only if team is in their org
CREATE POLICY "Team admins can add members in org"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

-- New: Team admins can remove members only if team is in their org
CREATE POLICY "Team admins can remove members in org"
ON public.team_members FOR DELETE
TO authenticated
USING (
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR (auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin')
);

-- New: Team admins can update member roles only if team is in their org
CREATE POLICY "Team admins can update member roles in org"
ON public.team_members FOR UPDATE
TO authenticated
USING (
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

-- 2. FIX departments: Team admins must be verified in same org
DROP POLICY IF EXISTS "Team admins can create departments" ON public.departments;
DROP POLICY IF EXISTS "Team admins can update departments" ON public.departments;
DROP POLICY IF EXISTS "Team admins can delete departments" ON public.departments;

CREATE POLICY "Team admins can create departments in org"
ON public.departments FOR INSERT
TO authenticated
WITH CHECK (
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = departments.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Team admins can update departments in org"
ON public.departments FOR UPDATE
TO authenticated
USING (
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = departments.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Team admins can delete departments in org"
ON public.departments FOR DELETE
TO authenticated
USING (
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = departments.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

-- 3. FIX teams: Team admins can only update if in same org
DROP POLICY IF EXISTS "Team admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON public.teams;

CREATE POLICY "Team admins can update teams in org"
ON public.teams FOR UPDATE
TO authenticated
USING (
  (is_team_admin(auth.uid(), id) AND organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Team owners can delete teams in org"
ON public.teams FOR DELETE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id 
    AND team_members.user_id = auth.uid() 
    AND team_members.role = 'owner'
  ) AND organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR has_role(auth.uid(), 'admin')
);

-- 4. FIX work_order_routing: Remove NULL org bypass
DROP POLICY IF EXISTS "Team members can manage routing" ON public.work_order_routing;
DROP POLICY IF EXISTS "Team members can view routing" ON public.work_order_routing;

CREATE POLICY "Org members can manage routing"
ON public.work_order_routing FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM queue_items qi
    WHERE qi.id = work_order_routing.queue_item_id 
    AND qi.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), qi.organization_id)
  )
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM queue_items qi
    WHERE qi.id = work_order_routing.queue_item_id 
    AND qi.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), qi.organization_id)
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Org members can view routing"
ON public.work_order_routing FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM queue_items qi
    WHERE qi.id = work_order_routing.queue_item_id 
    AND qi.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), qi.organization_id)
  )
  OR has_role(auth.uid(), 'admin')
);

-- 5. FIX queue_items: Team admin delete must verify org
DROP POLICY IF EXISTS "Team admins can delete queue items" ON public.queue_items;

CREATE POLICY "Team admins can delete queue items in org"
ON public.queue_items FOR DELETE
TO public
USING (
  (is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = queue_items.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
  OR has_role(auth.uid(), 'admin')
);

-- 6. FIX app_settings: Team settings must verify org membership
DROP POLICY IF EXISTS "Team admins can manage team settings" ON public.app_settings;

CREATE POLICY "Team admins can manage team settings in org"
ON public.app_settings FOR ALL
TO public
USING (
  ((team_id IS NOT NULL) AND is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = app_settings.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  ((team_id IS NOT NULL) AND is_team_admin(auth.uid(), team_id) AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = app_settings.team_id 
    AND t.organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), t.organization_id)
  ))
  OR has_role(auth.uid(), 'admin')
);

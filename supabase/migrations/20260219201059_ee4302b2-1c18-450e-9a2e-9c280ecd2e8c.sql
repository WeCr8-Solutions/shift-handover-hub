
-- Helper: check if user can view a station (via org membership through team)
CREATE OR REPLACE FUNCTION public.can_view_station_via_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = _team_id
      AND t.organization_id IS NOT NULL
      AND public.is_org_member(_user_id, t.organization_id)
  )
$$;

-- Helper: check if user can manage station via team admin + org membership
CREATE OR REPLACE FUNCTION public.can_manage_station_via_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_team_admin(_user_id, _team_id)
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = _team_id
        AND t.organization_id IS NOT NULL
        AND public.is_org_member(_user_id, t.organization_id)
    )
$$;

-- Helper: check if user is org admin via team
CREATE OR REPLACE FUNCTION public.is_org_admin_via_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = _team_id
      AND t.organization_id IS NOT NULL
      AND public.is_org_admin(_user_id, t.organization_id)
  )
$$;

-- Helper: check if user is org member via team
CREATE OR REPLACE FUNCTION public.is_org_member_via_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = _team_id
      AND t.organization_id IS NOT NULL
      AND public.is_org_member(_user_id, t.organization_id)
  )
$$;

-- Helper: check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id
      AND user_id = _user_id
      AND role = 'owner'
  )
$$;

-- ============================================
-- FIX STATIONS POLICIES (remove teams joins)
-- ============================================

-- Drop the SELECT policy with cross-table join
DROP POLICY IF EXISTS "Org members can view stations in their org" ON public.stations;
CREATE POLICY "Org members can view stations in their org" ON public.stations
  FOR SELECT TO authenticated
  USING (
    (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
    OR (team_id IS NOT NULL AND can_view_station_via_team(auth.uid(), team_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Drop and recreate UPDATE policy without cross-table join
DROP POLICY IF EXISTS "Team admins can update org stations" ON public.stations;
CREATE POLICY "Team admins can update org stations" ON public.stations
  FOR UPDATE TO authenticated
  USING (
    (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
    OR (team_id IS NOT NULL AND can_manage_station_via_team(auth.uid(), team_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Drop and recreate DELETE policy without cross-table join
DROP POLICY IF EXISTS "Team admins can delete org stations" ON public.stations;
CREATE POLICY "Team admins can delete org stations" ON public.stations
  FOR DELETE TO authenticated
  USING (
    (organization_id IS NOT NULL AND is_org_admin(auth.uid(), organization_id))
    OR (team_id IS NOT NULL AND can_manage_station_via_team(auth.uid(), team_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- FIX TEAM_MEMBERS POLICIES (remove teams joins)
-- ============================================

DROP POLICY IF EXISTS "Org admins can remove org team members" ON public.team_members;
CREATE POLICY "Org admins can remove org team members" ON public.team_members
  FOR DELETE TO authenticated
  USING (is_org_admin_via_team(auth.uid(), team_id));

DROP POLICY IF EXISTS "Org admins can update org team members" ON public.team_members;
CREATE POLICY "Org admins can update org team members" ON public.team_members
  FOR UPDATE TO authenticated
  USING (is_org_admin_via_team(auth.uid(), team_id));

DROP POLICY IF EXISTS "Org admins can view org team members" ON public.team_members;
CREATE POLICY "Org admins can view org team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (is_org_admin_via_team(auth.uid(), team_id));

DROP POLICY IF EXISTS "Team members can view membership within org" ON public.team_members;
CREATE POLICY "Team members can view membership within org" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    is_org_member_via_team(auth.uid(), team_id)
    OR is_team_member(auth.uid(), team_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Team admins can remove members in org" ON public.team_members;
CREATE POLICY "Team admins can remove members in org" ON public.team_members
  FOR DELETE TO authenticated
  USING (
    (is_team_admin(auth.uid(), team_id) AND is_org_member_via_team(auth.uid(), team_id))
    OR auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Team admins can update member roles in org" ON public.team_members;
CREATE POLICY "Team admins can update member roles in org" ON public.team_members
  FOR UPDATE TO authenticated
  USING (
    (is_team_admin(auth.uid(), team_id) AND is_org_member_via_team(auth.uid(), team_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- FIX TEAMS DELETE POLICY (remove team_members join)
-- ============================================

DROP POLICY IF EXISTS "Team owners can delete teams in org" ON public.teams;
CREATE POLICY "Team owners can delete teams in org" ON public.teams
  FOR DELETE TO authenticated
  USING (
    (is_team_owner(auth.uid(), id) AND organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

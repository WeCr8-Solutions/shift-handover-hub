-- Fix supervisor role to be org-scoped, not platform-wide
-- Supervisors should only see data within their organization

-- 1. Create helper function: is user a supervisor within a specific org?
CREATE OR REPLACE FUNCTION public.is_supervisor_in_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    has_role(_user_id, 'supervisor') 
    AND is_org_member(_user_id, _org_id)
$$;

-- 2. Create helper function: is user a supervisor for a specific team?
CREATE OR REPLACE FUNCTION public.is_supervisor_for_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    has_role(_user_id, 'supervisor') 
    AND (
      is_team_member(_user_id, _team_id)
      OR EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = _team_id 
        AND t.organization_id IS NOT NULL
        AND is_org_member(_user_id, t.organization_id)
      )
    )
$$;

-- 3. Update RLS policies to use org-scoped supervisor checks

-- TEAMS table: supervisors can only view teams in their org
DROP POLICY IF EXISTS "Admins and supervisors can view all teams" ON public.teams;
CREATE POLICY "Admins can view all teams" ON public.teams
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view org teams" ON public.teams
  FOR SELECT USING (
    has_role(auth.uid(), 'supervisor') 
    AND organization_id IS NOT NULL 
    AND is_org_member(auth.uid(), organization_id)
  );

-- TEAM_MEMBERS table: supervisors can only view members of their org's teams
DROP POLICY IF EXISTS "Admins and supervisors can view all team members" ON public.team_members;
CREATE POLICY "Admins can view all team members" ON public.team_members
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view org team members" ON public.team_members
  FOR SELECT USING (is_supervisor_for_team(auth.uid(), team_id));

-- STATIONS table: supervisors can only view stations in their org
DROP POLICY IF EXISTS "Admins and supervisors can view all stations" ON public.stations;
CREATE POLICY "Admins can view all stations" ON public.stations
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view org stations" ON public.stations
  FOR SELECT USING (
    has_role(auth.uid(), 'supervisor')
    AND (
      (team_id IS NOT NULL AND is_supervisor_for_team(auth.uid(), team_id))
      OR (organization_id IS NOT NULL AND is_supervisor_in_org(auth.uid(), organization_id))
    )
  );

-- HANDOFF_RECORDS table: supervisors only see their org's handoffs
DROP POLICY IF EXISTS "Admins and supervisors can view all handoff records" ON public.handoff_records;
CREATE POLICY "Admins can view all handoff records" ON public.handoff_records
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view org handoff records" ON public.handoff_records
  FOR SELECT USING (
    team_id IS NOT NULL AND is_supervisor_for_team(auth.uid(), team_id)
  );

-- ACTIVITY_LOGS table: supervisors only see their org's activity
DROP POLICY IF EXISTS "Admins and supervisors can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Note: activity_logs doesn't have org_id, so supervisors see logs from users in same org
CREATE POLICY "Supervisors can view org activity logs" ON public.activity_logs
  FOR SELECT USING (
    has_role(auth.uid(), 'supervisor')
    AND EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = activity_logs.user_id
    )
  );

-- DEPARTMENTS table: supervisors only see their org's departments
DROP POLICY IF EXISTS "Admins and supervisors can view all departments" ON public.departments;
CREATE POLICY "Admins can view all departments" ON public.departments
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view org departments" ON public.departments
  FOR SELECT USING (is_supervisor_for_team(auth.uid(), team_id));

-- USER_ROLES table: supervisors only see roles for users in their org
DROP POLICY IF EXISTS "Admins and supervisors can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view org user roles" ON public.user_roles
  FOR SELECT USING (
    has_role(auth.uid(), 'supervisor')
    AND EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = user_roles.user_id
    )
  );

-- JOB_PERFORMANCE_UPDATES table: supervisors only see their org's updates
DROP POLICY IF EXISTS "Admins and supervisors can view all updates" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Admins and supervisors can update any updates" ON public.job_performance_updates;

CREATE POLICY "Admins can view all updates" ON public.job_performance_updates
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view org updates" ON public.job_performance_updates
  FOR SELECT USING (
    team_id IS NOT NULL AND is_supervisor_for_team(auth.uid(), team_id)
  );

CREATE POLICY "Admins can update any updates" ON public.job_performance_updates
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can update org updates" ON public.job_performance_updates
  FOR UPDATE USING (
    team_id IS NOT NULL AND is_supervisor_for_team(auth.uid(), team_id)
  );

-- PROFILES table: supervisors only see profiles in their org
DROP POLICY IF EXISTS "Admins and supervisors can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can view org profiles" ON public.profiles
  FOR SELECT USING (
    has_role(auth.uid(), 'supervisor')
    AND EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.user_id
    )
  );
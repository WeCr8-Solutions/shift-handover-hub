-- Break publish planner cycle by removing cross-table dependencies from RLS policies.
-- Strategy:
-- 1) Denormalize organization_id onto team_members (filled from teams)
-- 2) Rewrite INSERT policies to reference only the row itself + security definer functions

-- 1) Add organization_id to team_members (if missing)
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 2) Backfill organization_id for existing rows
UPDATE public.team_members tm
SET organization_id = t.organization_id
FROM public.teams t
WHERE t.id = tm.team_id
  AND tm.organization_id IS NULL;

-- 3) Trigger to auto-populate organization_id from team_id on insert/update
-- Reuse existing helper function name pattern but create a team_members-specific one.
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_from_team_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.team_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.teams
    WHERE id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS team_members_auto_org_id ON public.team_members;
CREATE TRIGGER team_members_auto_org_id
BEFORE INSERT OR UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_org_id_from_team_member();

-- 4) Replace INSERT policies with cycle-free expressions
-- Drop known policy names (safe if they don't exist)
DROP POLICY IF EXISTS "stations_insert_policy" ON public.stations;
DROP POLICY IF EXISTS "Unified org station creation" ON public.stations;
DROP POLICY IF EXISTS "Org admins can create org stations" ON public.stations;
DROP POLICY IF EXISTS "Org admins can create stations in their org" ON public.stations;

DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
DROP POLICY IF EXISTS "Unified team member addition" ON public.team_members;
DROP POLICY IF EXISTS "Org admins can add team members in org" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add members in org" ON public.team_members;

DROP POLICY IF EXISTS "teams_insert_policy" ON public.teams;
DROP POLICY IF EXISTS "Unified team creation in org" ON public.teams;
DROP POLICY IF EXISTS "Org admins can create teams for their org" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams within their org" ON public.teams;
DROP POLICY IF EXISTS "Org admins can create teams in their org" ON public.teams;

-- Create clean INSERT policies with no joins to teams/stations across tables

-- teams: only depends on organization_members + user_roles (via functions)
CREATE POLICY "teams_insert_policy"
ON public.teams
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IS NOT NULL
  AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR (auth.uid() = created_by AND public.is_org_member(auth.uid(), organization_id))
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- team_members: use denormalized organization_id + is_team_admin (team_members table only)
-- Also supports self-join if user is org member.
CREATE POLICY "team_members_insert_policy"
ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_org_admin(auth.uid(), organization_id)
    OR (public.is_team_admin(auth.uid(), team_id) AND public.is_org_member(auth.uid(), organization_id))
    OR (auth.uid() = user_id AND public.is_org_member(auth.uid(), organization_id))
  )
);

-- stations: rely on stations.organization_id + team admin (team_members) + org membership
CREATE POLICY "stations_insert_policy"
ON public.stations
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_org_admin(auth.uid(), organization_id)
    OR (
      team_id IS NOT NULL
      AND public.is_team_admin(auth.uid(), team_id)
      AND public.is_org_member(auth.uid(), organization_id)
    )
  )
);

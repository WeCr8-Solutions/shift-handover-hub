-- Fix publish migration cycle by removing cross-table references in policy expressions.
-- Approach: encapsulate checks in SECURITY DEFINER functions, then recreate INSERT policies.

-- 1) Helper functions (SECURITY DEFINER) so policies don't reference other tables directly

CREATE OR REPLACE FUNCTION public.can_insert_team(_actor uuid, _org_id uuid, _created_by uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    _org_id IS NOT NULL AND (
      public.is_org_admin(_actor, _org_id)
      OR (_actor = _created_by AND public.is_org_member(_actor, _org_id))
      OR public.has_role(_actor, 'admin'::public.app_role)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_insert_team_member(_actor uuid, _team_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    public.has_role(_actor, 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = _team_id
        AND t.organization_id IS NOT NULL
        AND (
          public.is_org_admin(_actor, t.organization_id)
          OR public.is_team_admin(_actor, _team_id)
          OR (_actor = _target_user_id AND public.is_org_member(_actor, t.organization_id))
        )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_insert_station(_actor uuid, _org_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    public.has_role(_actor, 'admin'::public.app_role)
    OR (_org_id IS NOT NULL AND public.is_org_admin(_actor, _org_id))
    OR (
      _team_id IS NOT NULL
      AND public.is_team_admin(_actor, _team_id)
      AND EXISTS (
        SELECT 1
        FROM public.teams t
        WHERE t.id = _team_id
          AND t.organization_id IS NOT NULL
          AND public.is_org_member(_actor, t.organization_id)
      )
    )
  );
$$;

-- 2) Recreate the INSERT policies using ONLY the helper functions

DROP POLICY IF EXISTS "stations_insert_policy" ON public.stations;
DROP POLICY IF EXISTS "Unified org station creation" ON public.stations;

DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
DROP POLICY IF EXISTS "Unified team member addition" ON public.team_members;

DROP POLICY IF EXISTS "teams_insert_policy" ON public.teams;
DROP POLICY IF EXISTS "Unified team creation in org" ON public.teams;

CREATE POLICY "stations_insert_policy"
ON public.stations
FOR INSERT TO authenticated
WITH CHECK (
  public.can_insert_station(auth.uid(), organization_id, team_id)
);

CREATE POLICY "team_members_insert_policy"
ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (
  public.can_insert_team_member(auth.uid(), team_id, user_id)
);

CREATE POLICY "teams_insert_policy"
ON public.teams
FOR INSERT TO authenticated
WITH CHECK (
  public.can_insert_team(auth.uid(), organization_id, created_by)
);

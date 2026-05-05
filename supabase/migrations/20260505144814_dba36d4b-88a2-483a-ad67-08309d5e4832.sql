CREATE OR REPLACE FUNCTION public.create_org_with_owner(
  _name text,
  _slug text,
  _description text,
  _requires_itar boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_team_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RAISE EXCEPTION 'Organization name required';
  END IF;

  -- 1. Organization
  INSERT INTO public.organizations (name, slug, description, created_by, requires_us_person_declaration)
  VALUES (trim(_name), _slug, NULLIF(trim(coalesce(_description,'')), ''), v_user_id, coalesce(_requires_itar, false))
  RETURNING id INTO v_org_id;

  -- 2. Owner member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  -- 3. Default team
  INSERT INTO public.teams (name, description, organization_id, created_by)
  VALUES ('Shop Floor', 'Default production team', v_org_id, v_user_id)
  RETURNING id INTO v_team_id;

  -- 4. Team owner
  INSERT INTO public.team_members (team_id, user_id, role, organization_id)
  VALUES (v_team_id, v_user_id, 'owner', v_org_id);

  -- 5. Default station
  INSERT INTO public.stations (name, station_id, work_center, work_center_type, team_id, organization_id, is_active)
  VALUES ('Station 1', 'Station-1', 'General', 'General', v_team_id, v_org_id, true);

  RETURN v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_org_with_owner(text, text, text, boolean) TO authenticated;
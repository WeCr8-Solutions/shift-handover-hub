-- Add zach@wecr8.info to WeCr8 org in production (safe idempotent insert)
-- This ensures the user has org + team membership in all environments

DO $$
DECLARE
  _user_id uuid;
  _org_id uuid;
  _team_id uuid;
BEGIN
  -- Find user by email
  SELECT user_id INTO _user_id FROM public.profiles WHERE email = 'zach@wecr8.info' LIMIT 1;
  IF _user_id IS NULL THEN RETURN; END IF;

  -- Find WeCr8 org
  SELECT id INTO _org_id FROM public.organizations WHERE name = 'WeCr8' LIMIT 1;
  IF _org_id IS NULL THEN RETURN; END IF;

  -- Add org membership if not exists
  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (_user_id, _org_id, 'owner')
  ON CONFLICT DO NOTHING;

  -- Find first team in the org
  SELECT id INTO _team_id FROM public.teams WHERE organization_id = _org_id LIMIT 1;
  IF _team_id IS NULL THEN RETURN; END IF;

  -- Add team membership if not exists
  INSERT INTO public.team_members (user_id, team_id, role)
  VALUES (_user_id, _team_id, 'owner')
  ON CONFLICT DO NOTHING;
END;
$$;
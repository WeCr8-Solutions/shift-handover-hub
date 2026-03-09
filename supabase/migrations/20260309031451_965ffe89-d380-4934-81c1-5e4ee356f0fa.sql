
-- Fix cross-org team references for WeCr8 org (e6031d24-caad-4f32-8632-a6efc03e69c0)
-- Stations in WeCr8 reference teams from other orgs. We need to:
-- 1. Create matching teams in WeCr8
-- 2. Update station team_id references
-- 3. Update handoff_records team_id references
-- 4. Create team_members for the org owner

DO $$
DECLARE
  _wecr8_org_id uuid := 'e6031d24-caad-4f32-8632-a6efc03e69c0';
  _owner_id uuid := '7d924865-7e19-4bf8-a503-75eeeab26d03';
  _old_team RECORD;
  _new_team_id uuid;
BEGIN
  -- For each distinct team referenced by WeCr8 stations that doesn't belong to WeCr8
  FOR _old_team IN
    SELECT DISTINCT t.id AS old_id, t.name, t.description
    FROM stations s
    JOIN teams t ON t.id = s.team_id
    WHERE s.organization_id = _wecr8_org_id
      AND t.organization_id != _wecr8_org_id
  LOOP
    -- Check if a team with same name already exists in WeCr8
    SELECT id INTO _new_team_id
    FROM teams
    WHERE organization_id = _wecr8_org_id AND name = _old_team.name
    LIMIT 1;

    -- Create new team if it doesn't exist
    IF _new_team_id IS NULL THEN
      INSERT INTO teams (name, description, created_by, organization_id)
      VALUES (_old_team.name, _old_team.description, _owner_id, _wecr8_org_id)
      RETURNING id INTO _new_team_id;

      -- Add owner as team owner
      INSERT INTO team_members (team_id, user_id, role, organization_id)
      VALUES (_new_team_id, _owner_id, 'owner', _wecr8_org_id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- Update stations referencing the old cross-org team
    UPDATE stations
    SET team_id = _new_team_id
    WHERE organization_id = _wecr8_org_id AND team_id = _old_team.old_id;

    -- Update handoff_records referencing the old cross-org team
    UPDATE handoff_records
    SET team_id = _new_team_id
    WHERE organization_id = _wecr8_org_id AND team_id = _old_team.old_id;

    RAISE NOTICE 'Migrated team "%" (% -> %)', _old_team.name, _old_team.old_id, _new_team_id;
  END LOOP;
END;
$$;

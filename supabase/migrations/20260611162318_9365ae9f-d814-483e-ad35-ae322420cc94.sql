DROP FUNCTION IF EXISTS public.concierge_finalize_membership(uuid,uuid,uuid,uuid,text);

CREATE OR REPLACE FUNCTION public.concierge_finalize_membership(
  _org_id uuid,
  _user_id uuid,
  _team_id uuid,
  _default_station_id uuid,
  _app_role text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_org_name text;
  v_team_name text;
  v_station_name text;
BEGIN
  IF NOT (public.has_role(v_caller, 'platform_admin') OR public.has_role(v_caller, 'developer')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_org_id, _user_id, 'member')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  IF _team_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (_team_id, _user_id, 'operator')
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;

  IF _app_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _app_role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.user_org_preferences (user_id, organization_id, default_team_id, default_station_id)
  VALUES (_user_id, _org_id, _team_id, _default_station_id)
  ON CONFLICT (user_id, organization_id) DO UPDATE
    SET default_team_id = COALESCE(EXCLUDED.default_team_id, public.user_org_preferences.default_team_id),
        default_station_id = COALESCE(EXCLUDED.default_station_id, public.user_org_preferences.default_station_id),
        updated_at = now();

  SELECT name INTO v_org_name FROM public.organizations WHERE id = _org_id;
  IF _team_id IS NOT NULL THEN
    SELECT name INTO v_team_name FROM public.teams WHERE id = _team_id;
  END IF;
  IF _default_station_id IS NOT NULL THEN
    SELECT name INTO v_station_name FROM public.stations WHERE id = _default_station_id;
  END IF;

  INSERT INTO public.notification_queue (
    organization_id, user_id, notification_type, channel, recipient, subject, content, metadata, priority, status
  ) VALUES (
    _org_id,
    _user_id,
    'org_membership_added',
    'in_app',
    _user_id::text,
    'You''ve been added to ' || COALESCE(v_org_name, 'an organization'),
    'You now have access to ' || COALESCE(v_org_name, 'this organization')
      || CASE WHEN v_team_name IS NOT NULL THEN ' on the ' || v_team_name || ' team' ELSE '' END
      || CASE WHEN v_station_name IS NOT NULL THEN ' (default station: ' || v_station_name || ')' ELSE '' END
      || '. Sign in to get started.',
    jsonb_build_object(
      'organization_id', _org_id,
      'team_id', _team_id,
      'station_id', _default_station_id,
      'app_role', _app_role,
      'added_by', v_caller
    ),
    'normal',
    'pending'
  );

  INSERT INTO public.concierge_activity_log (organization_id, actor_id, action, target_kind, target_id, details)
  VALUES (
    _org_id, v_caller, 'finalize_membership', 'user', _user_id,
    jsonb_build_object('team_id', _team_id, 'station_id', _default_station_id, 'app_role', _app_role)
  );
END;
$$;
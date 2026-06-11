
-- 1. Add nullable default station on invites
ALTER TABLE public.organization_invites
  ADD COLUMN IF NOT EXISTS default_station_id uuid REFERENCES public.stations(id) ON DELETE SET NULL;

-- 2. Rewrite redeem_invite_code to also seed user_org_preferences.default_station_id
CREATE OR REPLACE FUNCTION public.redeem_invite_code(_code text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _invite RECORD;
  _existing RECORD;
  _member_count integer;
  _seat_limit integer;
  _app_role public.app_role;
BEGIN
  SELECT * INTO _invite
  FROM public.organization_invites
  WHERE invite_code = upper(_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','Invalid or inactive invite code');
  END IF;

  IF _invite.expires_at IS NOT NULL AND _invite.expires_at < now() THEN
    UPDATE public.organization_invites SET is_active = false WHERE id = _invite.id;
    RETURN jsonb_build_object('error','This invite code has expired (15-day limit). The seat has been returned to the organization for another user.');
  END IF;

  IF _invite.max_uses IS NOT NULL AND _invite.uses_count >= _invite.max_uses THEN
    RETURN jsonb_build_object('error','This invite code has reached its maximum number of uses');
  END IF;

  SELECT COUNT(*) INTO _member_count FROM public.organization_members
   WHERE organization_id = _invite.organization_id;
  SELECT (limits->>'users')::integer INTO _seat_limit FROM public.entitlements
   WHERE organization_id = _invite.organization_id;
  IF _seat_limit IS NOT NULL AND _member_count >= _seat_limit THEN
    RETURN jsonb_build_object('error','This organization has reached its seat limit. Please ask an admin to add more seats.');
  END IF;

  SELECT id INTO _existing FROM public.organization_members
   WHERE organization_id = _invite.organization_id AND user_id = _user_id;
  IF FOUND THEN
    RETURN jsonb_build_object('error','You are already a member of this organization');
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_invite.organization_id, _user_id, _invite.org_role);

  IF _invite.team_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role, organization_id)
    VALUES (_invite.team_id, _user_id, 'member', _invite.organization_id)
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;

  IF _invite.app_role IS NOT NULL THEN
    _app_role := _invite.app_role::public.app_role;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Pre-stage default team + station preference
  IF _invite.team_id IS NOT NULL OR _invite.default_station_id IS NOT NULL THEN
    INSERT INTO public.user_org_preferences (user_id, organization_id, default_team_id, default_station_id)
    VALUES (_user_id, _invite.organization_id, _invite.team_id, _invite.default_station_id)
    ON CONFLICT (user_id, organization_id) DO UPDATE
      SET default_team_id    = COALESCE(EXCLUDED.default_team_id, public.user_org_preferences.default_team_id),
          default_station_id = COALESCE(EXCLUDED.default_station_id, public.user_org_preferences.default_station_id),
          updated_at = now();
  END IF;

  INSERT INTO public.invite_redemptions (invite_id, user_id) VALUES (_invite.id, _user_id);
  UPDATE public.organization_invites SET uses_count = uses_count + 1 WHERE id = _invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', _invite.organization_id,
    'team_id', _invite.team_id,
    'default_station_id', _invite.default_station_id
  );
END;
$function$;

-- 3. Concierge helper: fully finalize an existing Jobline user into the org (team + station)
CREATE OR REPLACE FUNCTION public.concierge_finalize_membership(
  _org_id uuid,
  _user_id uuid,
  _team_id uuid DEFAULT NULL,
  _default_station_id uuid DEFAULT NULL,
  _app_role text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _actor uuid := auth.uid();
  _app public.app_role;
BEGIN
  IF NOT public.has_role(_actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF _team_id IS NOT NULL THEN
    -- team must belong to org
    IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = _team_id AND organization_id = _org_id) THEN
      RAISE EXCEPTION 'Team % not in org %', _team_id, _org_id USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.team_members (team_id, user_id, role, organization_id)
    VALUES (_team_id, _user_id, 'member', _org_id)
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;

  IF _default_station_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.stations WHERE id = _default_station_id AND organization_id = _org_id) THEN
      RAISE EXCEPTION 'Station % not in org %', _default_station_id, _org_id USING ERRCODE = '22023';
    END IF;
  END IF;

  IF _team_id IS NOT NULL OR _default_station_id IS NOT NULL THEN
    INSERT INTO public.user_org_preferences (user_id, organization_id, default_team_id, default_station_id)
    VALUES (_user_id, _org_id, _team_id, _default_station_id)
    ON CONFLICT (user_id, organization_id) DO UPDATE
      SET default_team_id    = COALESCE(EXCLUDED.default_team_id, public.user_org_preferences.default_team_id),
          default_station_id = COALESCE(EXCLUDED.default_station_id, public.user_org_preferences.default_station_id),
          updated_at = now();
  END IF;

  IF _app_role IS NOT NULL THEN
    BEGIN
      _app := _app_role::public.app_role;
      INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _app)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN invalid_text_representation THEN
      -- ignore bad app_role
      NULL;
    END;
  END IF;

  INSERT INTO public.concierge_activity_log (organization_id, actor_user_id, action, summary, details)
  VALUES (_org_id, _actor, 'membership.finalized',
    'Finalized membership (team/station)',
    jsonb_build_object(
      'user_id', _user_id,
      'team_id', _team_id,
      'default_station_id', _default_station_id,
      'app_role', _app_role
    ));

  RETURN jsonb_build_object('ok', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.concierge_finalize_membership(uuid, uuid, uuid, uuid, text) TO authenticated;

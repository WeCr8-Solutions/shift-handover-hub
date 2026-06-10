-- Concierge Phase 1: member management + station-machine assignment RPCs

create or replace function public.concierge_update_org_member(
  _org_id uuid,
  _user_id uuid,
  _action text,
  _new_role text default null
) returns jsonb
security definer
set search_path = public
language plpgsql as $$
declare
  _actor uuid := auth.uid();
  _owner_count int;
begin
  if _actor is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not public.has_role(_actor, 'admin'::app_role) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select count(*) into _owner_count
    from public.organization_members
   where organization_id = _org_id and role = 'owner';

  if _action = 'change_role' then
    if _new_role not in ('owner','supervisor','member') then
      raise exception 'Invalid role: %', _new_role;
    end if;
    if _new_role <> 'owner' and exists (
      select 1 from public.organization_members
       where organization_id = _org_id and user_id = _user_id and role = 'owner'
    ) and _owner_count <= 1 then
      raise exception 'Cannot demote the only owner';
    end if;
    update public.organization_members
       set role = _new_role
     where organization_id = _org_id and user_id = _user_id;

  elsif _action = 'remove' then
    if exists (
      select 1 from public.organization_members
       where organization_id = _org_id and user_id = _user_id and role = 'owner'
    ) and _owner_count <= 1 then
      raise exception 'Cannot remove the only owner';
    end if;
    delete from public.organization_members
     where organization_id = _org_id and user_id = _user_id;

  elsif _action = 'transfer_owner' then
    update public.organization_members
       set role = 'supervisor'
     where organization_id = _org_id and role = 'owner' and user_id <> _user_id;
    insert into public.organization_members (organization_id, user_id, role, joined_at)
    values (_org_id, _user_id, 'owner', now())
    on conflict (organization_id, user_id) do update set role = 'owner';

  else
    raise exception 'Unknown action: %', _action;
  end if;

  insert into public.concierge_activity_log (organization_id, actor_user_id, action, summary, details)
  values (
    _org_id,
    _actor,
    'concierge.member.' || _action,
    format('Member %s: %s', _user_id, _action),
    jsonb_build_object('user_id', _user_id, 'new_role', _new_role, 'action', _action)
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.concierge_update_org_member(uuid, uuid, text, text) from public, anon;
grant execute on function public.concierge_update_org_member(uuid, uuid, text, text) to authenticated;


create or replace function public.concierge_assign_machine_to_station(
  _station_id uuid,
  _equipment_id uuid,
  _attach boolean
) returns jsonb
security definer
set search_path = public
language plpgsql as $$
declare
  _actor uuid := auth.uid();
  _org uuid;
  _equip_org uuid;
begin
  if _actor is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not public.has_role(_actor, 'admin'::app_role) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select organization_id into _org from public.stations where id = _station_id;
  if _org is null then
    raise exception 'Station not found';
  end if;
  select organization_id into _equip_org from public.equipment where id = _equipment_id;
  if _equip_org is null or _equip_org <> _org then
    raise exception 'Equipment must belong to the same organization as the station';
  end if;

  if _attach then
    insert into public.station_machine_assignments (station_id, equipment_id)
    values (_station_id, _equipment_id)
    on conflict do nothing;
  else
    delete from public.station_machine_assignments
     where station_id = _station_id and equipment_id = _equipment_id;
  end if;

  insert into public.concierge_activity_log (organization_id, actor_user_id, action, summary, details)
  values (
    _org,
    _actor,
    case when _attach then 'concierge.station.machine_attached' else 'concierge.station.machine_detached' end,
    format('Station %s %s machine %s',
           _station_id,
           case when _attach then 'attached' else 'detached' end,
           _equipment_id),
    jsonb_build_object('station_id', _station_id, 'equipment_id', _equipment_id, 'attach', _attach)
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.concierge_assign_machine_to_station(uuid, uuid, boolean) from public, anon;
grant execute on function public.concierge_assign_machine_to_station(uuid, uuid, boolean) to authenticated;
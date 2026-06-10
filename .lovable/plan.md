# Concierge Full Shop-Setup CRUD — Phase 1

Closes the blockers preventing concierge from fully organizing a shop before handoff. Phases 2 and 3 (routing steps, org profile editor, shift schedules, branding) follow in later turns and don't depend on this work.

## What we're shipping

1. **Departments CRUD** — new tile-grid module on a new tab in the engagement.
2. **Teams CRUD** — new tile-grid module on the same tab.
3. **Stations get `department_id` + `team_id` selects** — concierge can assign each station to a department and team without leaving the page.
4. **Station ↔ Machine matrix** — toggle which `equipment` rows are mounted at which `stations` (writes `station_machine_assignments`).
5. **Org members management panel** — lists current `organization_members` with avatar/email/role, plus actions: change role, remove member, transfer ownership.

All work is admin-gated (`has_role(auth.uid(),'admin')`) and audit-logged to `concierge_activity_log.details`.

## Architecture (technical)

### New module configs (`src/lib/concierge/intakeModuleSchema.ts`)

```ts
departments: {
  table: 'departments', orgColumn: 'organization_id',
  titleField: 'name', subtitleFields: ['code'],
  fields: [name (req), code, description, sort_order],
  noun: 'Department',
}
teams: {
  table: 'teams', orgColumn: 'organization_id',
  titleField: 'name', subtitleFields: ['description'],
  fields: [name (req), description],
  noun: 'Team',
}
```

Extend the `stations` config with two new field types:
```text
{ key: 'department_id', type: 'select_from', source: { table: 'departments', label: 'name', value: 'id' } }
{ key: 'team_id',       type: 'select_from', source: { table: 'teams',       label: 'name', value: 'id' } }
```
`FieldDef` grows a `select_from` variant. `IntakeRecordDialog` fetches options via a single keyed query (cached per org) and renders the same `<Select>`.

### New component: `StationMachineMatrix.tsx`

- Loads stations + equipment + existing `station_machine_assignments` for the org.
- Renders a compact matrix (stations rows × equipment columns, scrollable). Each cell is a small toggle.
- Toggle calls `concierge_assign_machine_to_station(_station_id, _equipment_id, _attach)`.
- Optimistic UI; invalidates `["station-machines", orgId]`.

### New component: `OrgMembersPanel.tsx`

- Loads `organization_members` joined to `profiles` (email, full_name, avatar).
- Row actions:
  - **Change role** dropdown (owner / supervisor / member) → `concierge_update_org_member(action='change_role')`.
  - **Remove** (with confirm dialog) → `concierge_update_org_member(action='remove')`.
  - **Transfer ownership** (with confirm + destination user picker) → `concierge_update_org_member(action='transfer_owner')`.
- RPC enforces: org has at least one owner after the operation; never removes the only owner; logs every action.

### New tab in `EngagementDetail.tsx`

Add a top-level "Shop structure" `<Tabs>` panel above the per-module tabs:
```
Shop structure
  ├── Departments (IntakeTileGrid)
  ├── Teams (IntakeTileGrid)
  ├── Station ↔ Machine matrix (StationMachineMatrix)
  └── Members (OrgMembersPanel)
```
The existing `stations` checklist tab keeps its tile grid; the new department/team selects appear inside each station's edit dialog.

### New hooks

- `useOrgStructure(orgId)` — one combined query returning `{ departments, teams, stations, assignments }`. Used by the matrix and by the station dialog's option fetch.
- `useOrgMembers(orgId)` — joined member list + mutations for the 3 RPC actions.
- `useStationMachineMatrix(orgId)` — wraps the assign/detach RPC with optimistic updates.

All three integrate with `useConciergeRefresh` so concierge changes ripple through dashboards.

### New SQL (migration)

```sql
-- 1. Admin-gated member management
create or replace function public.concierge_update_org_member(
  _org_id uuid, _user_id uuid,
  _action text,            -- 'change_role' | 'remove' | 'transfer_owner'
  _new_role text default null
) returns jsonb
security definer set search_path = public
language plpgsql as $$
declare _actor uuid := auth.uid(); _owner_count int;
begin
  if not has_role(_actor,'admin'::app_role) then
    raise exception 'Not authorized' using errcode='42501';
  end if;

  select count(*) into _owner_count
    from organization_members where organization_id=_org_id and role='owner';

  if _action = 'change_role' then
    if _new_role not in ('owner','supervisor','member') then
      raise exception 'Invalid role';
    end if;
    -- prevent demoting the last owner
    if _new_role <> 'owner' and exists (
      select 1 from organization_members
       where organization_id=_org_id and user_id=_user_id and role='owner'
    ) and _owner_count <= 1 then
      raise exception 'Cannot demote the only owner';
    end if;
    update organization_members
       set role=_new_role
     where organization_id=_org_id and user_id=_user_id;

  elsif _action = 'remove' then
    if exists (
      select 1 from organization_members
       where organization_id=_org_id and user_id=_user_id and role='owner'
    ) and _owner_count <= 1 then
      raise exception 'Cannot remove the only owner';
    end if;
    delete from organization_members
     where organization_id=_org_id and user_id=_user_id;

  elsif _action = 'transfer_owner' then
    update organization_members set role='supervisor'
     where organization_id=_org_id and role='owner';
    insert into organization_members (organization_id, user_id, role, joined_at)
    values (_org_id, _user_id, 'owner', now())
    on conflict (organization_id,user_id) do update set role='owner';
  else
    raise exception 'Unknown action %', _action;
  end if;

  insert into concierge_activity_log(organization_id, actor_user_id, action, summary, details)
  values (_org_id, _actor, 'concierge.member.'||_action,
          format('Member %s: %s', _user_id, _action),
          jsonb_build_object('user_id',_user_id,'new_role',_new_role));

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.concierge_update_org_member(uuid,uuid,text,text) from public, anon;
grant execute on function public.concierge_update_org_member(uuid,uuid,text,text) to authenticated;

-- 2. Station ↔ machine assignment helper
create or replace function public.concierge_assign_machine_to_station(
  _station_id uuid, _equipment_id uuid, _attach boolean
) returns jsonb
security definer set search_path = public
language plpgsql as $$
declare _actor uuid := auth.uid(); _org uuid;
begin
  if not has_role(_actor,'admin'::app_role) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  select organization_id into _org from stations where id=_station_id;
  if _attach then
    insert into station_machine_assignments (station_id, equipment_id)
    values (_station_id, _equipment_id)
    on conflict do nothing;
  else
    delete from station_machine_assignments
     where station_id=_station_id and equipment_id=_equipment_id;
  end if;
  insert into concierge_activity_log(organization_id, actor_user_id, action, summary, details)
  values (_org, _actor,
          case when _attach then 'concierge.station.machine_attached' else 'concierge.station.machine_detached' end,
          format('Station %s %s machine %s', _station_id, case when _attach then 'attached' else 'detached' end, _equipment_id),
          jsonb_build_object('station_id',_station_id,'equipment_id',_equipment_id));
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.concierge_assign_machine_to_station(uuid,uuid,boolean) from public, anon;
grant execute on function public.concierge_assign_machine_to_station(uuid,uuid,boolean) to authenticated;
```

No new tables. No RLS changes (existing org-scoped policies + admin override cover everything).

## Files touched

- `src/lib/concierge/intakeModuleSchema.ts` — add `departments`, `teams`; extend `stations` with select_from fields; extend `FieldDef`/`FieldType`.
- `src/components/admin/onboarding/IntakeRecordDialog.tsx` — support `select_from` (fetches options per source table, scoped by org).
- `src/components/admin/onboarding/EngagementDetail.tsx` — add "Shop structure" tab block above per-module tabs.
- `src/components/admin/onboarding/StationMachineMatrix.tsx` *(new)*.
- `src/components/admin/onboarding/OrgMembersPanel.tsx` *(new)*.
- `src/hooks/useOrgStructure.ts` *(new)*.
- `src/hooks/useOrgMembers.ts` *(new)*.
- `src/hooks/useStationMachineMatrix.ts` *(new)*.
- `src/hooks/useConciergeRefresh.ts` — add new cache keys.
- New migration: `concierge_update_org_member`, `concierge_assign_machine_to_station`.

## Out of scope (deferred to Phase 2/3)

- Routing template steps editor
- Org profile inline editor (`organizations` row patch)
- `organization_setup_steps` panel
- Shift schedules / work-center config
- Org branding editor

Each can be added without reworking Phase 1.

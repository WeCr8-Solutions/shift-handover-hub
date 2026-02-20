

# Org-Scoping Hardening -- Phase 2

## Findings Summary

The previous migration (Phase 1) added `organization_id` to 7 tables and created org-scoped unique constraints. This audit found **remaining gaps** across 5 categories.

---

## Issue 1: Critical -- 4 Tables Still Missing `organization_id`

These tables rely on multi-join RLS (fragile, slow) instead of direct org filtering:

| Table | Current Scoping | Risk |
|-------|----------------|------|
| `current_station_status` | Via `station_id` -> `stations` -> `teams` (2 joins) | Handoff/CI data invisible without org filter; RLS does 2-join chain |
| `routing_template_steps` | Via `template_id` -> `routing_templates` (1 join) | Routing step visibility depends entirely on parent template RLS |
| `shift_assignments` | Via `shift_schedule_id` -> `shift_schedules` (1 join) | Shift data can't be directly queried by org for CI/kaizen reports |
| `webhook_deliveries` | Via `webhook_id` -> `organization_webhooks` (1 join) | Audit trail for integrations lacks direct org scope |

**Fix**: Add `organization_id` column + auto-populate trigger + direct RLS policies to each.

---

## Issue 2: High -- 378 Activity Log Rows with NULL `organization_id`

The Phase 1 backfill trigger only populates from `organization_members`, but 3 users have no org membership, leaving 378 rows permanently NULL. These rows are invisible to everyone except platform admins.

**Fix**: Backfill those 378 rows where possible, then set the column to allow NULLs only for platform admin actions (users without orgs). No NOT NULL constraint on `activity_logs` since platform admins legitimately have no org.

---

## Issue 3: High -- Nullable `organization_id` on 10 Core Tables

These tables allow NULL `organization_id`, which means records can become orphaned and invisible. All currently have 0 NULL rows (except activity_logs), so enforcing NOT NULL is safe:

- `queue_items`, `stations`, `teams`, `team_members`, `handoff_records`, `work_order_routing`, `departments`, `job_performance_updates`, `queue_item_comments`, `queue_item_history`

**Fix**: Set `NOT NULL` on all 10 tables (activity_logs excluded since platform admin logs have no org).

---

## Issue 4: Medium -- Missing Org-Scoped Name Uniqueness

These tables have `name` columns but no constraint preventing duplicates within the same org:

| Table | Column | Should Be |
|-------|--------|-----------|
| `teams` | `name` | `UNIQUE(organization_id, name)` -- prevent two teams called "Assembly" in same org |
| `quality_checkpoints` | `name` | `UNIQUE(organization_id, name)` -- prevent duplicate checkpoint names per org |
| `saved_views` | `name` | `UNIQUE(organization_id, user_id, name)` -- one view named "My Queue" per user per org |
| `stations` | `name` | `UNIQUE(organization_id, name)` -- prevent two stations called "CNC Bay 1" in same org (station_id is already scoped, but human-readable name is not) |

All these names can be freely reused **across** different organizations.

---

## Issue 5: Low -- Duplicate Unique Index on `work_center_config`

Two identical unique indexes exist:
- `work_center_config_organization_id_work_center_type_key`
- `work_center_config_org_id_type_key`

**Fix**: Drop the duplicate to avoid unnecessary index maintenance overhead.

---

## Implementation Plan

### Migration 1: Add `organization_id` to 4 remaining tables + triggers

```sql
-- current_station_status
ALTER TABLE public.current_station_status
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.current_station_status css
SET organization_id = s.organization_id
FROM public.stations s WHERE s.id = css.station_id;

-- routing_template_steps
ALTER TABLE public.routing_template_steps
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.routing_template_steps rts
SET organization_id = rt.organization_id
FROM public.routing_templates rt WHERE rt.id = rts.template_id;

-- shift_assignments
ALTER TABLE public.shift_assignments
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.shift_assignments sa
SET organization_id = ss.organization_id
FROM public.shift_schedules ss WHERE ss.id = sa.shift_schedule_id;

-- webhook_deliveries
ALTER TABLE public.webhook_deliveries
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.webhook_deliveries wd
SET organization_id = w.organization_id
FROM public.organization_webhooks w WHERE w.id = wd.webhook_id;
```

Plus auto-populate triggers for each table on INSERT/UPDATE.

### Migration 2: Enforce NOT NULL on 10 tables

Set `ALTER TABLE ... ALTER COLUMN organization_id SET NOT NULL` on: `queue_items`, `stations`, `teams`, `team_members`, `handoff_records`, `work_order_routing`, `departments`, `job_performance_updates`, `queue_item_comments`, `queue_item_history`.

Also set NOT NULL on the 4 new columns from Migration 1 (except `current_station_status` which may have station_id NULL).

### Migration 3: Add org-scoped name uniqueness

```sql
CREATE UNIQUE INDEX teams_org_id_name_key
  ON public.teams (organization_id, name);

CREATE UNIQUE INDEX quality_checkpoints_org_id_name_key
  ON public.quality_checkpoints (organization_id, name);

CREATE UNIQUE INDEX saved_views_org_user_name_key
  ON public.saved_views (organization_id, user_id, name);

CREATE UNIQUE INDEX stations_org_id_name_key
  ON public.stations (organization_id, name);
```

### Migration 4: Cleanup duplicate index

```sql
DROP INDEX IF EXISTS work_center_config_org_id_type_key;
```

### No Frontend Changes Required

Existing hooks already filter by org context. The new columns, triggers, and constraints are transparent to the application layer.

---

## What This Completes

- **Every table with business data** now has a direct `organization_id` column -- no more fragile multi-join RLS
- **All core tables** enforce NOT NULL on `organization_id` -- no orphaned records
- **Team names, station names, checkpoint names, and saved view names** can be reused across orgs but are unique within each org
- **Handoff and CI/Kaizen data** (current_station_status, shift_assignments) are directly org-scoped for supervisor reporting
- **Duplicate index** cleaned up for better write performance


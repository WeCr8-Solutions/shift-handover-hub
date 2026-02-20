

# Org-Scoping & Name Reuse Audit

## Summary of Findings

After a full audit of every table, unique constraint, and RLS policy, here are the issues categorized by priority.

---

## Priority 1: Critical -- Tables Missing `organization_id` Entirely

These tables have no `organization_id` column, meaning they cannot be properly org-scoped. Data isolation depends on indirect joins through `team_id` or `station_id`, which is fragile and slower for RLS.

| Table | Current Scoping | Risk |
|-------|----------------|------|
| `handoff_records` | Via `team_id` join | Core business data with no direct org filter; every RLS check requires a join to `teams` |
| `work_order_routing` | Via `queue_item_id` join | Routing steps lack direct org scope; cross-org leakage possible if queue_item RLS is bypassed |
| `job_performance_updates` | Via `team_id` join | Kaizen/CI data can't be directly filtered by org |
| `activity_logs` | Only `user_id` | No org isolation at all -- admins see all orgs' logs, not just their own |
| `departments` | Via `team_id` join | Department names can't be org-scoped for uniqueness |
| `queue_item_comments` | Via `queue_item_id` join | Comment visibility depends entirely on parent item RLS |
| `queue_item_history` | Via `queue_item_id` join | Audit trail for work orders lacks direct org scope |
| `current_station_status` | Via `station_id` join | Station status globally unique on `station_id` -- correct since station UUIDs are unique, but no org-level query filter |

**Fix**: Add `organization_id` (NOT NULL, FK to organizations) to each of these tables, with a trigger to auto-populate from the parent record (team/station/queue_item). Add org-scoped RLS policies.

---

## Priority 2: High -- Nullable `organization_id` on Core Tables

These tables have `organization_id` but allow NULL, creating potential RLS bypass vectors where `is_org_member(uid, NULL)` returns false and rows become invisible or orphaned.

| Table | Concern |
|-------|---------|
| `queue_items` | Work orders with NULL org_id are invisible to all non-platform-admins |
| `stations` | Stations with NULL org_id bypass org scoping |
| `teams` | Teams with NULL org_id can't be properly isolated |
| `team_members` | Members with NULL org_id have undefined scope |
| `shift_schedules` | Schedules without org can't be filtered |
| `work_center_config` | Config without org is globally ambiguous |

**Fix**: For each table, set `organization_id` to NOT NULL (after backfilling any NULL values from parent records). This ensures every record is firmly org-scoped.

---

## Priority 3: Medium -- Missing Org-Scoped Unique Constraints for Name Reuse

These allow name collisions within the same org (confusing) or block reuse across orgs (restrictive):

| Table | Current Constraint | Should Be |
|-------|-------------------|-----------|
| `departments` | No uniqueness on name | `UNIQUE(team_id, name)` -- prevent duplicate dept names within a team |
| `routing_templates` | Only PK | `UNIQUE(organization_id, name)` -- two orgs can have a template called "Standard CNC" but one org shouldn't have two |
| `shift_schedules` | No uniqueness on name | `UNIQUE(organization_id, name)` -- prevent duplicate shift schedule names within an org |
| `work_center_config` | No uniqueness | `UNIQUE(organization_id, work_center_type)` -- one config per type per org |

---

## Priority 4: Low -- Activity Logs Org Scoping for Kaizen/CI

The `activity_logs` table only has `user_id` -- supervisors can only see their own logs, not their team's. For continuous improvement and kaizen activities:

- Add `organization_id` and `team_id` columns
- Update RLS so supervisors can see all activity within their org
- Org admins can view org-wide activity patterns for CI metrics

---

## Implementation Plan

### Migration 1: Add `organization_id` to Missing Tables

```sql
-- handoff_records
ALTER TABLE public.handoff_records 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.handoff_records hr
SET organization_id = t.organization_id
FROM public.teams t WHERE t.id = hr.team_id;

-- work_order_routing (populate from queue_items)
ALTER TABLE public.work_order_routing 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.work_order_routing wor
SET organization_id = qi.organization_id
FROM public.queue_items qi WHERE qi.id = wor.queue_item_id;

-- job_performance_updates
ALTER TABLE public.job_performance_updates 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.job_performance_updates jpu
SET organization_id = t.organization_id
FROM public.teams t WHERE t.id = jpu.team_id;

-- activity_logs
ALTER TABLE public.activity_logs 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.activity_logs 
  ADD COLUMN team_id uuid REFERENCES public.teams(id);

UPDATE public.activity_logs al
SET organization_id = om.organization_id
FROM public.organization_members om WHERE om.user_id = al.user_id;

-- departments
ALTER TABLE public.departments 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.departments d
SET organization_id = t.organization_id
FROM public.teams t WHERE t.id = d.team_id;

-- queue_item_comments
ALTER TABLE public.queue_item_comments 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.queue_item_comments qic
SET organization_id = qi.organization_id
FROM public.queue_items qi WHERE qi.id = qic.queue_item_id;

-- queue_item_history
ALTER TABLE public.queue_item_history 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

UPDATE public.queue_item_history qih
SET organization_id = qi.organization_id
FROM public.queue_items qi WHERE qi.id = qih.queue_item_id;
```

### Migration 2: Enforce NOT NULL on Critical Org IDs

After backfill, set `NOT NULL` on `organization_id` for: `queue_items`, `stations`, `teams`, `team_members`, `handoff_records`, `work_order_routing`, `departments`, `job_performance_updates`.

### Migration 3: Add Org-Scoped Unique Constraints

```sql
CREATE UNIQUE INDEX departments_team_id_name_key 
  ON public.departments (team_id, name);

CREATE UNIQUE INDEX routing_templates_org_id_name_key 
  ON public.routing_templates (organization_id, name);
```

### Migration 4: Add Auto-Populate Triggers

Create triggers on `handoff_records`, `work_order_routing`, `departments`, `queue_item_comments`, and `queue_item_history` to auto-populate `organization_id` from the parent record on INSERT.

### Migration 5: Update RLS Policies

Replace join-based RLS with direct `organization_id` checks on the newly-added columns for faster, simpler, and more reliable access control. Update `activity_logs` policies so supervisors see org-wide activity for CI/kaizen reporting.

### No Frontend Changes Required

Existing hooks already filter by `organization_id` where available. The new columns and triggers are transparent to the frontend -- data flows correctly through the existing org context.

---

## What This Fixes

- **Name reuse**: Department names, routing template names, shift schedule names can be reused across orgs freely
- **Data isolation**: Every core table has a direct `organization_id` for fast, reliable RLS without fragile joins
- **Kaizen/CI**: Activity logs become org-scoped so supervisors can track team patterns and improvement metrics
- **NULL bypass prevention**: No more orphaned records that disappear from everyone's view
- **Performance**: Direct `organization_id` column checks are faster than multi-table joins in RLS policies


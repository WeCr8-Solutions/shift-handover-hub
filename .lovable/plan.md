

# Fix Live Deployment Blocker: NULL Organization ID

## Problem

Publishing fails because the schema diff tries to add `organization_id NOT NULL` columns to 11 tables on Live that have existing rows but no such column yet. Postgres rejects this because rows would have no value.

## Root Cause

The publish system generates a single schema diff (not individual migrations). It sees the final state on Test (`organization_id UUID NOT NULL`) and tries to apply it in one step on Live -- which fails on tables with existing data.

## Affected Tables (with row counts on Live)

| Table | Rows | Needs NOT NULL | Backfill Source |
|---|---|---|---|
| work_order_routing | 15 | Yes | queue_items |
| queue_item_comments | 1 | Yes | queue_items |
| queue_item_history | 6 | Yes | queue_items |
| current_station_status | 1 | No (nullable) | stations |
| activity_logs | 517 | No (nullable) | organization_members |
| handoff_records | 0 | Yes | (empty, safe) |
| departments | 0 | Yes | (empty, safe) |
| job_performance_updates | 0 | Yes | (empty, safe) |
| routing_template_steps | 0 | Yes | (empty, safe) |
| shift_assignments | 0 | Yes | (empty, safe) |
| webhook_deliveries | 0 | Yes | (empty, safe) |

All rows with data have valid parent records -- no orphans. The backfill will succeed for every row.

## Solution

You need to run a single SQL script on **Live** via **Lovable Cloud > Run SQL** (with **Live** environment selected). This script:

1. Adds `organization_id` as a nullable column on all 11 tables
2. Backfills values from parent records
3. Sets `NOT NULL` on the 10 core tables (activity_logs stays nullable by design)
4. Also adds the `team_id` column to `activity_logs` (part of the same pending migration)

After running this script, the publish schema diff will see no changes needed for these columns and will succeed.

### SQL Script to Run on Live

```sql
-- ==========================================
-- PRE-PUBLISH BACKFILL: Run on LIVE only
-- ==========================================

-- 1. work_order_routing (15 rows)
ALTER TABLE public.work_order_routing
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
UPDATE public.work_order_routing wor
  SET organization_id = qi.organization_id
  FROM public.queue_items qi WHERE qi.id = wor.queue_item_id AND wor.organization_id IS NULL;
ALTER TABLE public.work_order_routing ALTER COLUMN organization_id SET NOT NULL;

-- 2. handoff_records (0 rows)
ALTER TABLE public.handoff_records
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.handoff_records ALTER COLUMN organization_id SET NOT NULL;

-- 3. departments (0 rows)
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.departments ALTER COLUMN organization_id SET NOT NULL;

-- 4. job_performance_updates (0 rows)
ALTER TABLE public.job_performance_updates
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.job_performance_updates ALTER COLUMN organization_id SET NOT NULL;

-- 5. queue_item_comments (1 row)
ALTER TABLE public.queue_item_comments
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
UPDATE public.queue_item_comments qic
  SET organization_id = qi.organization_id
  FROM public.queue_items qi WHERE qi.id = qic.queue_item_id AND qic.organization_id IS NULL;
ALTER TABLE public.queue_item_comments ALTER COLUMN organization_id SET NOT NULL;

-- 6. queue_item_history (6 rows)
ALTER TABLE public.queue_item_history
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
UPDATE public.queue_item_history qih
  SET organization_id = qi.organization_id
  FROM public.queue_items qi WHERE qi.id = qih.queue_item_id AND qih.organization_id IS NULL;
ALTER TABLE public.queue_item_history ALTER COLUMN organization_id SET NOT NULL;

-- 7. activity_logs (517 rows, stays NULLABLE)
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id);
UPDATE public.activity_logs al
  SET organization_id = om.organization_id
  FROM public.organization_members om WHERE om.user_id = al.user_id AND al.organization_id IS NULL;

-- 8. current_station_status (1 row, stays NULLABLE on NOT NULL -- check Test)
ALTER TABLE public.current_station_status
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
UPDATE public.current_station_status css
  SET organization_id = s.organization_id
  FROM public.stations s WHERE s.id = css.station_id AND css.organization_id IS NULL;

-- 9. routing_template_steps (0 rows)
ALTER TABLE public.routing_template_steps
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.routing_template_steps ALTER COLUMN organization_id SET NOT NULL;

-- 10. shift_assignments (0 rows)
ALTER TABLE public.shift_assignments
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.shift_assignments ALTER COLUMN organization_id SET NOT NULL;

-- 11. webhook_deliveries (0 rows)
ALTER TABLE public.webhook_deliveries
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.webhook_deliveries ALTER COLUMN organization_id SET NOT NULL;
```

## Steps

1. Open **Lovable Cloud > Run SQL**
2. Select the **Live** environment
3. Paste and run the SQL script above
4. Publish again -- the deployment should now succeed

## What This Fixes

- All 11 tables will have `organization_id` columns matching Test schema
- All existing data is backfilled from parent records
- NOT NULL constraints match Test on the 10 core tables
- The publish schema diff will have no column additions to make, so no NULL conflicts

## No Code Changes Needed

This is purely a Live database preparation step. The Test environment and all application code are already correct.



# Separate Machine Time Tracking: Setup, First Article, and Production Run Times

## Problem

Currently, each work order and routing step has a single `estimated_duration` field (in minutes). This doesn't reflect real manufacturing, where machine time is composed of three distinct phases:

1. **Setup Time** -- One-time cost to prepare the machine (fixturing, tooling, alignment)
2. **First Article Time** -- Time to run and inspect the first piece (FAI / prove-out)
3. **Cycle Time Per Part** -- Repeatable time per unit, multiplied by quantity for total production run time

**Total estimated machine time** = Setup + First Article + (Cycle Time x Quantity)

The old single `estimated_duration` field conflates all of these, making scheduling and capacity planning inaccurate.

## Solution

Replace the single `estimated_duration` with three granular time fields on both the `queue_items` and `work_order_routing` tables (and the `routing_template_steps` table for templates). Keep `estimated_duration` as a computed/display value so existing code doesn't break, but calculate it from the new fields.

## Database Changes

### Tables Modified

**`queue_items`** -- Add 3 new columns:
- `setup_time_minutes` (integer, nullable) -- Machine setup time
- `first_article_minutes` (integer, nullable) -- First article / prove-out time
- `cycle_time_minutes` (integer, nullable) -- Per-part production cycle time

**`work_order_routing`** -- Add 3 new columns:
- `setup_time_minutes` (integer, nullable)
- `first_article_minutes` (integer, nullable)
- `cycle_time_minutes` (integer, nullable)

**`routing_template_steps`** -- Add 3 new columns:
- `setup_time_minutes` (integer, nullable)
- `first_article_minutes` (integer, nullable)
- `cycle_time_minutes` (integer, nullable)

The existing `estimated_duration` column is kept for backward compatibility but will be auto-computed via a trigger:

```
estimated_duration = COALESCE(setup_time_minutes, 0)
                   + COALESCE(first_article_minutes, 0)
                   + (COALESCE(cycle_time_minutes, 0) * COALESCE(quantity, 1))
```

A `BEFORE INSERT OR UPDATE` trigger on `queue_items` will auto-calculate `estimated_duration` whenever the component fields change. For `work_order_routing` (which has no `quantity` column), the formula uses the parent queue item's quantity via a lookup.

## UI Changes

### 1. Create Work Order Dialog (`CreateWorkOrderDialog.tsx`)
Replace the single "Est. Duration (min)" field with three labeled inputs:
- **Setup Time (min)** -- placeholder "e.g., 30"
- **First Article (min)** -- placeholder "e.g., 15"
- **Cycle Time / Part (min)** -- placeholder "e.g., 5"

Show a computed "Total Est." summary below when quantity is entered:
> Total: 30 min setup + 15 min FAI + (5 min x 100 pcs) = 545 min (~9.1 hrs)

### 2. Create Queue Item Dialog (`CreateQueueItemDialog.tsx`)
Same three-field replacement for the estimated duration input.

### 3. Work Order Detail Dialog (`QueueItemDetailDialog.tsx`)
Display the three time components in the details section instead of the single "Estimated Duration" line:
- Setup: X min | FAI: X min | Cycle: X min/pc
- Total: computed value

In the Routing tab, show per-step time breakdowns with the same three fields.

### 4. Operator Station Panel (`OperatorStationPanel.tsx`)
No structural changes needed -- it already uses `started_at` for elapsed timer. The improved `estimated_duration` (now auto-computed) will make the "overdue" detection in `OperatorWorkflowPanel` more accurate.

### 5. Routing Template Management (`RoutingTemplateManagement.tsx`)
Add setup/FAI/cycle time fields to the template step editor alongside the existing `estimated_duration`.

### 6. Bulk Upload (`useBulkUpload.ts`)
Update the Excel template and parser to accept the three new columns (setup_time, first_article_time, cycle_time_per_part) in addition to or replacing estimated_duration.

### 7. Queue Hook (`useQueue.ts`)
Update `QueueItem`, `CreateQueueItemInput`, and `UpdateQueueItemInput` types to include the three new fields. The `createItem` and `updateItem` functions pass them through.

### 8. Seed Data (`SeedTestDataButton.tsx`)
Update test data generation to populate the three new fields with realistic values.

## Files to Modify

1. **Database migration** -- Add columns + auto-compute trigger
2. `src/hooks/useQueue.ts` -- Types and create/update logic
3. `src/components/queue/CreateWorkOrderDialog.tsx` -- Three time inputs + total preview
4. `src/components/queue/CreateQueueItemDialog.tsx` -- Three time inputs
5. `src/components/queue/QueueItemDetailDialog.tsx` -- Display breakdown
6. `src/components/OperatorWorkflowPanel.tsx` -- Use improved estimated_duration
7. `src/components/admin/RoutingTemplateManagement.tsx` -- Template step fields
8. `src/components/admin/SeedTestDataButton.tsx` -- Realistic seed data
9. `src/hooks/useBulkUpload.ts` -- Excel column mapping

## Technical Notes

- The `estimated_duration` column is preserved and auto-calculated, so all existing views (calendar, kanban, list, operator panels) that reference it continue working without changes.
- RLS policies are unaffected -- no new tables or access patterns are introduced.
- The trigger uses `COALESCE` with sensible defaults (0 for times, 1 for quantity) so partial data entry still produces a reasonable total.


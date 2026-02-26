

# Fix Work Order Queue Population and Dashboard Status Issues

## Root Causes Identified

1. **Station ID mismatch**: `SupervisorDashboard` passes display code (e.g., "STN-001") instead of database UUID when clicking a station. The `OperatorStationPanel` then queries `queue_items WHERE station_id = 'STN-001'` which matches nothing.
2. **Missing `on_hold` in operator panel fetch**: Items on hold are excluded from the operator panel's queue query.
3. **Station status not updating on next station after handoff advance**: When a work order advances to the next station via routing, the new station's `current_station_status` is not updated with "Waiting on Material" state, so the dashboard shows no activity.
4. **Queue/routing status inconsistency on advance**: Queue item set to "queued" but next routing step set to "in_progress" simultaneously.

## Fixes

### 1. `src/components/dashboard/SupervisorDashboard.tsx` -- Pass database UUID, not display code

Line 348: Change `onViewStation?.(station.id, station.name)` to `onViewStation?.(station.dbId, station.name)`.

The `station.id` field is the display code (`station_id` column). The `station.dbId` field is the actual database `id` UUID that all foreign keys reference.

### 2. `src/components/dashboard/OperatorStationPanel.tsx` -- Include `on_hold` in fetch

Line 147: Change `.in("status", ["pending", "queued", "in_progress"])` to `.in("status", ["pending", "queued", "in_progress", "on_hold"])`.

This ensures on-hold items remain visible in the operator panel.

### 3. `src/components/dashboard/OperatorStationPanel.tsx` -- Update next station status on advance

After line 243 in `confirmDelivery`, add an upsert to `current_station_status` for the next station, setting `current_job_state: "Waiting on Material"` with the work order and part number pre-filled. This makes the dashboard immediately show the next station as "waiting".

### 4. `src/components/dashboard/OperatorStationPanel.tsx` -- Fix routing step status on advance

Line 247: Change next routing step status from `"in_progress"` to `"pending"` so it matches the queue item's `"queued"` status. The next station's operator starts it explicitly, which then sets both to `"in_progress"`.

### 5. `src/components/queue/QueueItemDetailDialog.tsx` -- Same routing step fix

Line 295: Same change as #4 — set next routing step to `"pending"` instead of `"in_progress"` and don't set `started_at` until the operator actually starts it.

### 6. `src/components/queue/QueueItemDetailDialog.tsx` -- Update next station status on advance

After line 297, add the same `current_station_status` upsert for the next station with "Waiting on Material" state.

## Files

| File | Change |
|------|--------|
| `src/components/dashboard/SupervisorDashboard.tsx` | Pass `dbId` instead of display `id` to `onViewStation` |
| `src/components/dashboard/OperatorStationPanel.tsx` | Add `on_hold` to fetch filter; update next station status on advance; fix routing step status |
| `src/components/queue/QueueItemDetailDialog.tsx` | Update next station status on advance; fix routing step status |


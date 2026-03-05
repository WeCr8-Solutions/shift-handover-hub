# Queue & Kanban Readiness Checklist

Last updated: 2026-03-05

## ✅ Working / Fixed

| Area | Status | Notes |
|------|--------|-------|
| **State machine enforcement (DB)** | ✅ Working | `trg_validate_queue_item_status` trigger blocks invalid transitions at DB level |
| **Kanban drag-drop validation** | ✅ Fixed | Client-side `VALID_TRANSITIONS` map prevents invalid drops with toast error feedback |
| **Kanban error handling** | ✅ Fixed | `handleDrop` now catches and displays DB rejection errors via `toast.error()` |
| **Kanban cancelled column** | ✅ Fixed | Added 6th "Cancelled" column (was missing, only had 5) |
| **List view status dropdown** | ✅ Fixed | Only shows valid target statuses per item's current status |
| **Detail dialog status dropdown** | ✅ Fixed | Filtered to show current status + valid transitions only |
| **Start Work button (pending→in_progress)** | ✅ Fixed | Now auto-transitions through `queued` intermediate step before `in_progress` |
| **Start Work button (queued→in_progress)** | ✅ Working | Direct transition, sets `started_at` timestamp |
| **Pause/Hold button** | ✅ Working | `in_progress → on_hold` transition |
| **Complete button (routing-aware)** | ✅ Working | Checks routing steps, advances to next station or completes WO |
| **Pre-advance validation** | ✅ Working | Quantity reconciliation, QA sign-off, First Article checks before advancing |
| **Queue loading anti-flash** | ✅ Fixed | `hasFetchedOnce` ref + `loading && items.length === 0` gate |
| **Org-scoped realtime channel** | ✅ Fixed | Channel name includes `orgId` for tenant isolation |
| **Exponential backoff polling** | ✅ Working | 5s start → 1.5x → 30s cap fallback |
| **Scope toggle (Org/Station)** | ✅ Working | Admins can switch between org-wide and station-specific queue view |
| **Operator auto-scope** | ✅ Working | Operators auto-filter to their checked-in station (includes `on_hold` items) |
| **URL station param** | ✅ Working | `?station=xyz` pre-filters queue to specific station |
| **Kanban drag reorder** | ✅ Working | Atomic `reorder_queue_item` RPC for position updates |
| **Quote → Work Order conversion** | ✅ Working | Inline form with WO number and station assignment |
| **NCR creation from WO detail** | ✅ Working | Opens NCR dialog with queue item context |
| **Handoff creation from WO detail** | ✅ Working | Pre-fills handoff form via sessionStorage |
| **Routing tab in WO detail** | ✅ Working | Shows step timeline with color-coded status and sign-offs |
| **Outside Processing tab** | ✅ Working | Separate tab for vendor/PO tracking |
| **NCR Queue tab (supervisor)** | ✅ Working | Pending NCR approval panel with approve/reject |
| **History tab (supervisor)** | ✅ Working | Full work order history log |
| **Quality metrics dashboard** | ✅ Working | FPY, scrap rate, rework rate computed from queue items |
| **Station & stage display in list** | ✅ Working | Shows assigned station and routing step for each item |
| **Calendar view** | ✅ Working | Week/month views with scheduled/unscheduled handling |
| **Stats cards** | ✅ Working | Total, pending, in-progress, completed, overdue counts |

## ⚠️ Monitor / Minor Issues

| Area | Status | Notes |
|------|--------|-------|
| **Kanban grid responsiveness** | ⚠️ Adjusted | Changed from 5-col to `md:3 lg:6` grid for 6 columns — may need scroll on small screens |
| **Duplicate station/routing queries in list** | ⚠️ Monitor | `QueueListView` fetches stations and routing independently — could be batched |
| **No undo for status changes** | ⚠️ UX | Status changes are immediate with no confirmation modal |
| **Drag-drop on mobile** | ⚠️ Limitation | HTML5 drag-and-drop doesn't work on touch devices — need touch polyfill or alternate UI |
| **Supervisor override for blocked transitions** | ⚠️ Partial | Override exists in `pass_work_order_to_next_step` RPC but not exposed in status dropdown |
| **Kanban column height** | ⚠️ UX | Fixed 350px ScrollArea may hide items in busy columns |
| **Error messages from DB triggers** | ⚠️ OK | Raw Postgres error messages shown — could be friendlier |

## 🔴 Known Gaps

| Area | Status | Notes |
|------|--------|-------|
| **React Query migration** | 🔴 TODO | Would solve caching, dedup, stale-while-revalidate for queue data |
| **Optimistic updates** | 🔴 TODO | Status changes trigger full refetch instead of local state update |
| **Supervisor override UI** | 🔴 TODO | Need a "Force Override" button with reason input for supervisors to bypass state machine |
| **Touch drag-and-drop** | 🔴 TODO | Need `react-dnd-touch-backend` or similar for mobile kanban |
| **Batch status operations** | 🔴 TODO | No multi-select to move multiple items at once |
| **Connection status indicator** | 🔴 TODO | No visual indicator when realtime is disconnected |

## State Machine Reference

```
pending → queued → in_progress → completed
  ↓         ↓    ↗     ↓   ↘        ↓
cancelled  pending   on_hold  queued   pending (rework)
                       ↓
                   in_progress
                       ↓
                   cancelled
```

**Terminal states:** `cancelled` (no exit)
**Rework path:** `completed → pending` (via NCR)

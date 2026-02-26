

# Allow Admins and Supervisors to Toggle Into Operator Dashboard View

## Problem

Currently in `Index.tsx`, the dashboard routing is binary:
- `hasOrgSupervisorAccess` = true → always shows `SupervisorDashboard`
- Otherwise → shows `OperatorDashboard`

Org admins and supervisors cannot view individual station work panels, check in to stations, start/complete work orders, or see the operator perspective. They are locked into the high-level production overview with no way to drill down into the task-level view that operators use daily.

## Approach

Add a **view toggle** to the `SupervisorDashboard` header that lets admins/supervisors switch between "Production Floor" (current overview) and "Station View" (the operator dashboard). Additionally, add a **"View Station"** click action on each row in the active stations table so supervisors can jump directly into a single station's `OperatorStationPanel`.

This requires no database changes -- it is purely a UI/state change in the dashboard layer.

## Changes

### 1. `src/pages/Index.tsx` -- Add view mode state and pass through

- Add a `viewMode` state: `"supervisor" | "operator" | "station-detail"`
- Add a `focusedStationId` state for single-station drill-in
- When `showSupervisorView` is true, respect `viewMode`:
  - `"supervisor"` → render `SupervisorDashboard` (current behavior)
  - `"operator"` → render `OperatorDashboard` (the full operator flow with check-in)
  - `"station-detail"` → render a single `OperatorStationPanel` for the focused station, with a "Back to Overview" button
- Pass `onSwitchToOperatorView` and `onViewStation` callbacks to `SupervisorDashboard`

### 2. `src/components/dashboard/SupervisorDashboard.tsx` -- Add toggle and station click

- Accept new props: `onSwitchToOperatorView`, `onViewStation(stationId, stationName)`
- Add a toggle button in the header area (e.g., an icon button with `Monitor` icon labeled "Operator View") alongside the existing action buttons
- Make each active station row clickable, calling `onViewStation` with the station's database ID and name
- Add a cursor/hover style to station rows to indicate they are clickable

### 3. `src/components/dashboard/OperatorDashboard.tsx` -- Accept optional `isAdminView` prop

- Accept an optional `isAdminView` boolean prop
- When `isAdminView` is true, show a banner at the top: "Viewing as Operator" with a subtle info style
- The admin can use the full operator flow (check in, start/complete work orders, handoffs) -- this is intentional so they can step in and help on the floor
- No changes to the core check-in/check-out logic -- admins simply create their own operator sessions just like any operator would

### 4. New component: `src/components/dashboard/StationDetailView.tsx`

A lightweight wrapper that renders:
- A "Back to Production Floor" button at the top
- The `OperatorStationPanel` for the specified station (without requiring check-in)
- This allows supervisors to **view** a station's queue, active work order, and elapsed time without needing to formally check in
- Quick actions (Handoff, Performance Update, Full Queue) remain available

## UX Flow

```text
Supervisor Dashboard (Production Floor)
├── [Toggle: "Operator View"] → Full Operator Dashboard (check-in flow, multi-station tabs)
│   └── [Back to Overview] → returns to Supervisor Dashboard
│
├── [Click station row: "Station-1"] → Station Detail View
│   ├── Shows OperatorStationPanel (active WO, queue, actions)
│   └── [Back to Production Floor] → returns to Supervisor Dashboard
```

## What This Enables

1. **Supervisors can monitor individual stations** -- see active work orders, queue depth, elapsed time
2. **Admins can step in as operators** -- check in, start work orders, complete tasks when short-staffed
3. **Single-station drill-down** -- click any station from the overview to see its detailed operator panel
4. **Full flexibility** -- toggle freely between oversight view and hands-on view without leaving the dashboard

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `viewMode` state, conditional rendering for 3 modes |
| `src/components/dashboard/SupervisorDashboard.tsx` | Add toggle button, clickable station rows, new callback props |
| `src/components/dashboard/OperatorDashboard.tsx` | Add optional `isAdminView` prop with info banner |
| `src/components/dashboard/StationDetailView.tsx` | New component -- back button + `OperatorStationPanel` wrapper |


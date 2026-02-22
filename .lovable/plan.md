

# Operator Station Dashboard

## Overview

Build a dedicated operator-facing dashboard that replaces the current "all stations + supervisor actions" view for operator-role users. When an operator logs in, they will see only their assigned stations, the work orders queued at those stations, and the tools they need to complete work -- nothing more.

## Current State

- The `Index.tsx` page branches on `hasOrgSupervisorAccess` to show either the `SupervisorDashboard` or a grid of ALL stations in the organization
- Operators currently see every station, every action button (Add Work Order, Performance Update, New Handoff), and the full `WorkCenterFilter`
- There is no concept of "station login" -- operators are not associated with specific stations for the day

## What Changes

### 1. Station Login / Check-In System

Operators will "check in" to one or more stations at the start of their shift. This creates a session record so the system knows which stations they are responsible for.

**New database table: `operator_station_sessions`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto-generated |
| user_id | uuid NOT NULL | References auth.users, the operator |
| station_id | uuid NOT NULL | References stations |
| organization_id | uuid | Auto-populated from station |
| checked_in_at | timestamptz | Default now() |
| checked_out_at | timestamptz | NULL while active |
| shift | text | Day / Swing / Night |
| is_active | boolean | Default true |

- RLS: Operators can INSERT/SELECT their own sessions; supervisors and org admins can see all sessions in their org
- A unique partial index on `(user_id, station_id) WHERE is_active = true` prevents duplicate active check-ins

### 2. Operator Dashboard Page

Create a new component `OperatorDashboard` shown in `Index.tsx` when the user is an operator (not supervisor/admin). This replaces the current all-stations grid.

**Flow:**
1. On load, check for active `operator_station_sessions` for the current user
2. If none exist, show a **Station Check-In Screen** with available stations from their team/org
3. If sessions exist, show the **Operator Work View**

**Station Check-In Screen:**
- List of available stations (filtered to user's team/org)
- Multi-select checkboxes to pick one or more stations
- Current shift auto-detected
- "Start Shift" button to create session records
- Visual card layout grouped by work center type

**Operator Work View (main working screen):**
- Top bar: Checked-in stations as tabs or horizontal chips
- Per-station panel showing:
  - Active work order (in_progress) with elapsed timer
  - Queued work orders (pending/queued) in priority order
  - Start / Complete / Deliver actions
  - Create Handoff shortcut (pre-fills station)
  - Performance Update shortcut
- No access to: Add Work Order creation, Team Management, Admin panel, Work Center Filters for all stations
- "End Shift" button to check out of all stations

### 3. Header Simplification for Operators

The Header already hides admin/testing links for non-privileged users. No changes needed -- the existing role-gating in `Header.tsx` already handles this correctly.

### 4. Updated Index.tsx Routing Logic

```text
if (hasOrgSupervisorAccess) -> SupervisorDashboard (existing)
else if (user is operator)  -> OperatorDashboard (new)
else if (!user)             -> public landing view (existing)
```

## Files to Create

1. **`src/components/dashboard/OperatorDashboard.tsx`** -- Main operator dashboard with check-in flow and station work panels
2. **`src/components/dashboard/StationCheckIn.tsx`** -- Station selection and shift check-in UI
3. **`src/components/dashboard/OperatorStationPanel.tsx`** -- Per-station work panel (active order, queue, actions)
4. **`src/hooks/useOperatorSessions.ts`** -- Hook to manage station check-in/check-out sessions

## Files to Modify

1. **`src/pages/Index.tsx`** -- Add operator dashboard branch in the rendering logic
2. **Database migration** -- Create `operator_station_sessions` table with RLS policies

## Technical Details

### Database Migration

```text
1. Create operator_station_sessions table
2. Add auto-populate trigger for organization_id from station
3. Enable RLS with policies:
   - Operators: SELECT/INSERT/UPDATE own sessions
   - Org admins/supervisors: SELECT all sessions in their org
   - Platform admins: SELECT all
4. Create unique partial index for active sessions
5. Enable realtime for live session tracking
```

### useOperatorSessions Hook

- `activeSessions`: Current user's active station sessions
- `checkIn(stationIds[], shift)`: Create session records for selected stations
- `checkOut(sessionId?)`: End specific or all active sessions
- `isCheckedIn`: Boolean shortcut
- Real-time subscription for session changes

### OperatorStationPanel Component

Reuses logic from existing `StationWorkOrderPicker`:
- Fetches `queue_items` filtered by `station_id`
- Shows active work order with elapsed timer
- Start/Complete/Deliver workflow
- Integrates with existing `NewHandoffForm` and `JobPerformanceUpdateForm`

### Station Check-In Screen

- Queries stations from user's organization (same as existing `useStations` hook)
- Groups by work center type with icons from `workCenterIcons`
- Remembers last checked-in stations via the session table (shows previous selections)
- Auto-detects current shift using existing `getCurrentShift()` from mockData

### Key UX Principles

- Operator sees ONLY their checked-in stations
- No access to create work orders (that is a supervisor function)
- Can start, pause, complete, and deliver work orders
- Can create handoffs and performance updates (scoped to their station)
- Clean, task-focused interface with no management overhead
- "End Shift" clearly visible to close out the day


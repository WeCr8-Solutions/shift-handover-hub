

# System-Wide Review: Org-Scoped Data Flow, Role Views, and Dashboard Status Sync

## Issues Found

### 1. `useShiftStats` missing org-scoping (Critical)
**File**: `src/hooks/useStations.ts` lines 331-404

The `useShiftStats` hook queries `stations` and `handoff_records` without any `organization_id` filter. It only optionally filters by `teamId`. This means the stats shown to unauthenticated-context supervisors could include cross-org data (RLS may block it, but the query is not explicit). All other hooks (`useStations`, `useHandoffRecords`, `useQueue`) properly filter by org — this one is the outlier.

**Fix**: Accept `organizationId` parameter and apply `.eq("organization_id", orgId)` to both station and handoff queries.

### 2. Handoff form does NOT update `current_station_status` after submission (Medium)
**File**: `src/components/NewHandoffForm.tsx`

When a handoff is submitted, the `primary_state` (e.g., "Part Running", "Setup in Progress", "Waiting on Material") is written to `handoff_records` but is **not** synced back to `current_station_status`. This means the supervisor dashboard's KPIs (running/down/setup/waiting counts) and the station status indicators don't reflect the handoff's reported state. The dashboard only updates when an operator starts/completes a queue item.

**Fix**: After successful handoff submission, upsert `current_station_status` with the handoff's `primary_state`, operator names, and part info. This is the missing link between the handoff system and the live dashboard.

### 3. Realtime channel for `current_station_status` not org-scoped (Minor)
**File**: `src/hooks/useStations.ts` lines 148-161

The realtime subscription for `current_station_status` listens to ALL changes on the table without a filter. For a multi-tenant SaaS, this means every org's station updates trigger a re-fetch for every connected user. While RLS prevents data leakage, it wastes bandwidth and causes unnecessary re-renders.

**Fix**: Add an org-scoped filter on the realtime channel or at minimum filter by station IDs the user has access to.

### 4. Operator check-in doesn't set station status (Minor)
**File**: `src/hooks/useOperatorSessions.ts`

When an operator checks in, `operator_station_sessions` is created but `current_station_status` is not updated with the operator's name. The dashboard shows no operator until a work order is started. This creates a gap where a station appears idle even though an operator is checked in.

**Fix**: After successful check-in, upsert `current_station_status` with `current_operator_name` and `current_operator_id` so the supervisor dashboard immediately shows an operator is present.

### 5. Operator check-out doesn't clear station status (Minor)
**File**: `src/hooks/useOperatorSessions.ts`

When an operator ends their shift, `operator_station_sessions.is_active` is set to false, but `current_station_status` still shows the operator's name and any active job state. The dashboard becomes stale.

**Fix**: On checkout, clear the operator name/id from `current_station_status` for all sessions being ended.

## Implementation Plan

### File 1: `src/hooks/useStations.ts` — Fix `useShiftStats` org scoping
- Add `organizationId` parameter to `useShiftStats`
- Import and use `useUserOrganization` to get org context
- Apply `.eq("organization_id", orgId)` to both station count and handoff queries
- Filter realtime channel for `current_station_status` to avoid cross-org noise (add station_id filter if possible, or accept the current approach with a comment)

### File 2: `src/components/NewHandoffForm.tsx` — Sync station status on handoff submit
- After successful `onSubmit`, upsert `current_station_status` for the station with:
  - `current_job_state` = the handoff's `primary_state`
  - `current_operator_name` = incoming operator name
  - `current_job_work_order` = work order from handoff
  - `current_job_part_number` = part number from handoff
- This ensures the dashboard KPIs immediately reflect the new shift state

### File 3: `src/hooks/useOperatorSessions.ts` — Sync station status on check-in/check-out
- **Check-in**: After inserting sessions, upsert `current_station_status` for each station with `current_operator_name` and `current_operator_id`
- **Check-out**: Clear operator fields from `current_station_status` for all station sessions being ended

### File 4: `src/pages/Index.tsx` — Pass org context to `useShiftStats` (if used)
- Currently `useShiftStats` is not called from Index.tsx directly (it's used by `ShiftStats` component for unauthenticated view), but ensure any callers pass the org context

### File 5: `src/components/ShiftStats.tsx` — Update to pass org context
- Pass `organization?.id` to `useShiftStats` so stats are properly scoped


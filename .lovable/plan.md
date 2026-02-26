

# Audit & Fix: Org-Scoped Data Flow + Test Coverage

## Issues Found

### A. Missing `organization?.id` in hook calls (5 files)

These components call `useStations` and/or `useHandoffRecords` with only `teamId`, relying on the hook's internal `useUserOrganization()` fallback. This creates a redundant second call to `useUserOrganization` per component and risks inconsistency if the fallback resolves at a different time than the component's own org context.

| File | Current Call | Fix |
|------|-------------|-----|
| `SupervisorDashboard.tsx` | `useStations(currentTeam?.id)` | `useStations(currentTeam?.id, organization?.id)` |
| `SupervisorDashboard.tsx` | `useHandoffRecords(currentTeam?.id)` | `useHandoffRecords(currentTeam?.id, organization?.id)` |
| `Index.tsx` | `useStations(currentTeam?.id)` | `useStations(currentTeam?.id, organization?.id)` |
| `Index.tsx` | `useHandoffRecords(currentTeam?.id)` | `useHandoffRecords(currentTeam?.id, organization?.id)` |
| `NewHandoffForm.tsx` | `useStations(currentTeam?.id)` | Add `useUserOrganization` and pass `organization?.id` |
| `QueueItemDetailDialog.tsx` | `useStations(currentTeam?.id)` | Same pattern |
| `CreateQueueItemDialog.tsx` | `useStations(currentTeam?.id)` | Same pattern |
| `OperatorDashboard.tsx` | `useHandoffRecords(currentTeam?.id)` | Same pattern |
| `StationDetailView.tsx` | `useHandoffRecords(currentTeam?.id)` | Same pattern |

### B. Missing Tests

1. **SupervisorDashboard** — no test exists. Need test verifying:
   - Org-scoped hook calls with `organization?.id`
   - KPI computation from station states
   - Passes `dbId` (not display `station_id`) to `onViewStation`

2. **useQueue hook** — existing test only validates types/sorting, not org-scoped Supabase calls. Need test verifying:
   - `organization_id` filter applied to query
   - Station filter for operator scope

3. **OperatorDashboard** — no test. Need test verifying:
   - Renders StationCheckIn when not checked in
   - Passes station context to handoff form

4. **Org-scope integration test** — existing test only validates structural contracts. Need to add:
   - Verification that `useStations` uses `.eq("organization_id", ...)` (done in useStations.test.ts but shallow)
   - Queue hook org filter contract
   - Dashboard component hook call signatures

### C. Existing test gaps in current files

- `useStations.test.ts` — doesn't verify `.eq()` is called with `"organization_id"` as first arg
- `useOperatorSessions.test.ts` — doesn't test `checkIn` upserts `current_station_status`
- `OperatorStationPanel.test.tsx` — doesn't test RPC call shape for `pass_work_order_to_next_step`

## Implementation Plan

### 1. Fix org-scoped hook calls (5 component files)
Pass `organization?.id` explicitly to `useStations` and `useHandoffRecords` in all components listed above. Import `useUserOrganization` where not already imported.

### 2. Create `SupervisorDashboard.test.tsx`
- Mock `useStations`, `useHandoffRecords`, `useUserOrganization`, `useCurrentTeam`
- Verify hooks called with org ID
- Verify KPI counts match station states
- Verify `onViewStation` receives `dbId`

### 3. Expand `useStations.test.ts`
- Add test that `.eq` is called with `"organization_id"` and the explicit org ID
- Add test that org fallback from `useUserOrganization` is used when no explicit ID passed

### 4. Expand `useOperatorSessions.test.ts`
- Add test verifying `checkIn` calls `upsert` on `current_station_status`
- Add test verifying `checkOut` clears operator from station status

### 5. Expand `OperatorStationPanel.test.tsx`
- Add test that `supabase.rpc` is called with correct params on delivery confirm
- Add test that supervisor override checkbox appears when `hasOrgSupervisorAccess` is true

### 6. Expand `org-scope-integration.test.ts`
- Add queue item org filter contract test
- Add supervisor dashboard hook signature contract
- Add operator station-scoped queue contract

### 7. Run all tests and verify pass


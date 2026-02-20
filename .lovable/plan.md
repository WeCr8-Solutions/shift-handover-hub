

# Update Process Tests: Autofill, Auth Context, and Quote-to-Ship Workflow Validation

## Overview
Add two new test suites to the Process Tests tab that validate the autofill/pre-population behaviors and the full quote-to-ship workflow. These tests will use the logged-in user's real org, teams, stations, and members to verify that the system correctly auto-populates data and enables fast job tracking.

---

## What Changes

### 1. New Test Suite: "Autofill & User Context" (in `useProcessTests.ts`)
Live tests that verify:
- **User auth context is available** -- profile, display name, and email are populated
- **Operator name auto-fills** from the logged-in user's profile into handoff forms
- **Self-handoff defaults** -- incoming operator defaults to current user for solo shops
- **Station selection triggers WO autofill** -- selecting a station with an active `in_progress` queue item returns work_order, part_number, and operation_number
- **Fallback to current_station_status** -- if no active queue item, station status table is checked
- **Team context is active** -- current user has at least one team membership with stations
- **Organization context populates** -- org_id is available for scoping all queries

### 2. New Test Suite: "Quote-to-Ship Routing" (in `useProcessTests.ts`)
Live tests that validate the full job lifecycle:
- **User has stations available** -- at least one station exists in the user's org for routing
- **Routing steps can be created** -- validates that `work_order_routing` accepts inserts for the user's queue items
- **Operation type maps to station work_center_type** -- tests the smart suggest logic (e.g., `internal` maps to CNC Mill/Lathe stations)
- **Routing step advancement updates queue item** -- completing a step moves the job to the next station
- **Station status updates on routing advance** -- `current_station_status` is upserted with "Waiting on Material"
- **Full quote-to-ship sequence** -- validates operation types cover: quote, engineering, purchasing, receiving, internal, inspection, outside_processing, shipping
- **Team members are visible for assignment** -- verifies team_members query returns assignable operators
- **Queue items can be created with org/team scope** -- validates insert with proper org_id and team_id

### 3. Update ProcessTestRunner UI (`ProcessTestRunner.tsx`)
- Add two new category icons: `UserCog` for autofill tests, `Route` for quote-to-ship tests
- The new suites appear alongside existing ones when "Run Process Tests" is clicked

---

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/useProcessTests.ts` | Add ~16 new test definitions in two new suites appended to `allTestSuites` |
| `src/components/testing/ProcessTestRunner.tsx` | Add icons for new `autofill` and `quote-to-ship` categories |

### New Test Definitions (Summary)

**Autofill & User Context Suite** (8 tests):
1. `af-001`: Authenticated user profile exists with display_name
2. `af-002`: User has operator name for form pre-fill
3. `af-003`: Self-handoff default (incoming = outgoing operator)
4. `af-004`: User belongs to at least one organization
5. `af-005`: User has team membership with accessible stations
6. `af-006`: Station with active WO returns autofill data (work_order, part_number)
7. `af-007`: Fallback to current_station_status when no active WO
8. `af-008`: Organization ID is available for scoping queries

**Quote-to-Ship Routing Suite** (8 tests):
1. `qs-001`: Valid operation types cover full quote-to-ship lifecycle
2. `qs-002`: User's org has at least one station for routing assignment
3. `qs-003`: Smart station suggestion maps operation_type to work_center_type
4. `qs-004`: Routing steps maintain sequential operation numbers
5. `qs-005`: Team members are queryable for work order assignment
6. `qs-006`: Queue items are insertable with org + team scope
7. `qs-007`: Routing step completion logic (status transitions)
8. `qs-008`: Full lifecycle phases present: Quote through Ship

### Test Implementation Pattern
All tests follow the existing pattern: async functions that query the live database using the authenticated user's session, returning `{ success, details?, error? }`. No mock data -- these validate real system state.


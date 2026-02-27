

## Comprehensive Handoff & Dashboard E2E Testing Plan

### Current State
- **2 stations with status data**: Station 1 (Manual Mill, "Part Running", WO-100-100) and Station 2 - CNC Mill ("Waiting on Material", WO-100-100)
- **1 existing handoff record** from previous test (Station 1, "Part Running")
- **Routing**: 3 steps for WO-100-100 — Step 1 completed, Step 2 pending at Station 2, Step 3 pending
- **No active operator sessions** — operator check-in needed
- **Work orders across station types**: CNC Mill, CNC Lathe, TIG Welding, Inspection, Manual Mill

### Test Matrix

#### Test 1: Operator Check-In + Shift Handoff (CNC Mill)
1. Navigate to `/dashboard`, verify StationCheckIn renders
2. Screenshot the station selection grid
3. Check in to **Station 2 - CNC Mill** (STN-002) on Day shift
4. Screenshot the OperatorStationPanel with WO-100-100 queued
5. Click "Handoff" → verify NewHandoffForm opens
6. Screenshot Step 1: station auto-selected, CNC Mill work center type, WO# auto-filled
7. Select job state "Waiting on Material", fill part number
8. Screenshot Step 2: verify **CNC-specific readiness items** (Program Loaded, Tools Installed, etc.)
9. Toggle several readiness items, advance to Step 3
10. Screenshot Step 3: verify **CNC condition fields** (coolant, air pressure, chip condition)
11. Fill handoff summary, screenshot Step 4 summary
12. Submit, screenshot success toast
13. Verify `handoff_records` insert and `current_station_status` update

#### Test 2: Operator Check-In + Shift Handoff (TIG Welding)
1. Check out from CNC Mill, check in to **TIG Station 1** (WELD-001)
2. Screenshot OperatorStationPanel with WO-2024-005 in_progress
3. Click "Handoff" → NewHandoffForm
4. Screenshot Step 1: verify TIG Welding station auto-selected
5. Set job state to "Part Running"
6. Screenshot Step 2: verify **generic equipment readiness items** (not CNC items)
7. Screenshot Step 3: verify **welding-specific condition fields** (gas level, wire level, tip condition)
8. Submit handoff, verify correct welding_condition JSON in record

#### Test 3: Routing Handoff (Complete Op & Advance)
1. Check in to **Station 2 - CNC Mill**, start WO-100-100
2. Screenshot OperatorStationPanel showing "Complete Op & Advance" button with routing Step 2/3
3. Click "Complete Op & Advance", screenshot confirmation dialog
4. Verify dialog says "advance to Station 1" (next station per routing)
5. Confirm advance, screenshot success toast
6. Verify work_order_routing step 2 → completed, step 3 → in_progress
7. Verify queue_items station_id moved to Station 1

#### Test 4: Supervisor Dashboard Accuracy
1. Navigate to `/dashboard` as supervisor/admin
2. Screenshot the full SupervisorDashboard
3. Verify KPI cards reflect real data (Running/Down/Setup/Waiting counts)
4. Verify Active Stations table shows correct operators, work orders, progress bars
5. Verify Attention Required panel shows "Waiting" stations
6. Verify Recent Handoffs sidebar shows submitted records
7. Verify Shift Utilization donut chart percentages match station states

#### Test 5: Queue-to-Handoff Auto-Open Flow
1. Navigate to `/queue`, open a work order detail dialog
2. Click "Create Handoff"
3. Verify redirect to `/dashboard` with NewHandoffForm auto-opened
4. Screenshot all 4 pre-filled fields (WO#, Part#, Op#, Station)
5. Walk through and submit

### Implementation Steps
1. Use browser automation: `navigate_to_sandbox`, `observe`, `act`, `screenshot`
2. Take screenshots at every checkpoint listed above
3. After each screenshot, review for data accuracy
4. Query database after each handoff submit to verify inserts
5. If any UI shows wrong data or form fails, stop, diagnose the code, fix it, then re-test
6. Log all findings in task notes for traceability

### Potential Issues
- Operator must check out before checking in to a different station (no concurrent sessions for same test)
- WO-100-100 is currently `queued` at Station 2 — needs to be started before "Complete Op & Advance" shows
- TIG Station already has WO-2024-005 `in_progress` — handoff should auto-fill from active queue item
- Welding condition fields only render when `workCenterType` includes "Welding"
- `organization_id` NOT NULL constraint on `handoff_records` requires org context


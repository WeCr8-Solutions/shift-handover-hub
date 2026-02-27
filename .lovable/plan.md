

## End-to-End Handoff Testing Plan

There are two distinct handoff flows to test:

1. **Routing Handoff** (Queue > Complete Op & Advance > next station)
2. **Shift Handoff** (Operator Dashboard > New Handoff Form > submit)

Both need browser-based E2E testing with screenshots to verify auto-population, form rendering, and data flow.

### Pre-requisites
- User must be logged in to the preview
- At least one station with an active/queued work order that has routing steps configured

---

### Test 1: Routing Handoff (Work Order Advance to Next Station)

**Steps:**
1. Navigate to `/queue`, find a work order with routing steps
2. Screenshot the queue list showing the work order
3. Click into the work order detail dialog
4. Screenshot the dialog showing routing tab with steps
5. Click "Complete Op & Advance" or the complete action
6. Screenshot the confirmation dialog (verify routing-aware messaging: "advance to [next station]")
7. Confirm the advance
8. Screenshot the success toast and verify the work order moved to the next station
9. Click "Create Handoff" from the queue detail dialog
10. Verify `sessionStorage` prefill data is set and user is redirected to `/dashboard`
11. Screenshot the auto-opened NewHandoffForm — verify work_order, part_number, operation_number, and station are pre-filled

### Test 2: Shift Handoff (End-of-Shift via Operator Dashboard)

**Steps:**
1. Navigate to `/dashboard` (as operator)
2. If not checked in, check in to a station
3. Screenshot the OperatorStationPanel showing the active station
4. Click "Handoff" button on the station panel
5. Screenshot Step 1 (Job Info) — verify station auto-selects, operator name pre-fills
6. Fill required fields (job state, part number) if not pre-filled
7. Click Next, screenshot Step 2 (Readiness) — verify CNC vs generic items render correctly
8. Click Next, screenshot Step 3 (Condition) — verify work-center-specific fields
9. Fill handoff summary, screenshot Step 4 (Summary)
10. Submit and screenshot success toast
11. Verify station status updated in current_station_status table

### Test 3: Queue-to-Handoff Auto-Open Flow

**Steps:**
1. Navigate to `/queue`, open a work order detail
2. Click "Create Handoff" button in the detail dialog
3. Verify redirect to `/dashboard`
4. Screenshot the NewHandoffForm that auto-opens
5. Verify all 4 fields are pre-filled from the queue item (WO#, Part, Op, Station)
6. Walk through all 4 steps and submit

### Implementation Approach

- Use browser automation tools: `navigate_to_sandbox`, `observe`, `act`, `screenshot`
- Take screenshots at each critical checkpoint
- After each test, verify the result by checking network requests or re-querying the UI
- If any step fails or shows incorrect data, stop, diagnose, and fix the code before continuing

### Potential Issues to Watch For
- NewHandoffForm may not auto-populate if `stations` array hasn't loaded yet (race condition)
- `sessionStorage` prefill might not persist across navigation if the page re-renders
- CNC-specific readiness items should only show for CNC Mill/Lathe work center types
- Validation errors on Step 1 (station, job state, part number required) must block forward navigation
- The `organization_id` NOT NULL constraint on handoff_records could cause insert failures if org context is missing


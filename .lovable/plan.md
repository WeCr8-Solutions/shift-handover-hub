## Quote-to-Work-Order Full E2E Browser Test Plan

### Current State

- **13 work orders** in system across various statuses (pending, queued, in_progress, completed)
- **5 work orders** have routing steps (3 steps each, some partially completed)
- Full routing editor supports 30-step ISO9001 template (Quote → Engineering → Purchasing → Receiving → Internal → Outside Processing → Inspection → Shipping)
- No work order currently has a full quote-to-ship routing applied — existing routings are 3-step abbreviated sequences

### Test Flow

#### Phase 1: Create New Work Order from Queue Page

1. Navigate to `/queue`
2. Screenshot the Kanban board showing current work orders
3. Click "Add Item" → fill CreateQueueItemDialog:
  - Title: `Precision Valve Body`
  - WO#: `WO-2026-QTS-001`
  - Part#: `VLV-001`
  - Type:  quote →`work_order` 
  - Qty: `15`, Priority: `high`, Due date: future
4. Submit → screenshot success and new card on board

#### Phase 2: Apply Full Quote-to-Ship Routing Template

1. Click the new work order card to open QueueItemDetailDialog
2. Screenshot the detail dialog (Overview, Routing, Qty tabs)
3. Click "Edit Routing" to open WorkOrderRoutingEditor
4. Screenshot the template mode with 30 default steps, toggle checkboxes
5. Verify auto-suggested stations match org stations (CNC Mill, Inspection, etc.)
6. Enable key lifecycle steps: Quote Review, Engineering, Purchasing, Receiving, Incoming Inspection, First Article Setup, Production Run Op 10, Deburr, Final Inspection, Ship
7. Disable unnecessary steps (Assembly, Hardware, extra OPs)
8. Save routing → screenshot saved routing in detail dialog Routing tab

#### Phase 3: Walk the Routing (Quote → Engineering → Internal → Inspection → Ship)

1. Verify Step 1 (Quote Review) shows as `pending` in Routing tab
2. Use supervisor dashboard or detail dialog to advance through steps:
  - Manually update step statuses via the detail dialog or `pass_work_order_to_next_step` RPC
3. Screenshot after each step advance showing the routing timeline with completed/pending indicators
4. Verify `queue_items.station_id` moves to the correct station at each advance
5. Verify `current_station_status` updates for receiving stations

#### Phase 4: Verify Queue Views Reflect Routing State

1. Switch to List view → screenshot showing WO-2026-QTS-001 status and assigned station
2. Switch to Calendar view → screenshot due date placement
3. Return to Kanban → verify card moved to correct status column after advances

#### Phase 5: Verify Supervisor Dashboard Reflects New WO

1. Navigate to `/dashboard`
2. Screenshot Production Analytics charts — new WO should appear in output/status data
3. Verify KPI cards updated with correct Running/Queued counts

#### Phase 6: Outside Processing Step (if enabled in routing)

1. Navigate to Queue → Outside Processing tab
2. Screenshot to verify any OP steps appear with vendor tracking fields
3. Verify PO#, vendor name, expected return date fields render

### Fix-as-you-go Protocol

- After each screenshot, compare UI state against database queries
- If any data mismatch, console error, or rendering issue: stop, read logs, fix code, re-test
- Log all findings via task notes
- Address the duplicate key warning (`LATHE-001`, `WELD-001`) in SupervisorDashboard during testing

### Expected Issues to Watch

- Duplicate React key errors in SupervisorDashboard station list (already in console logs)
- Template mode may not auto-suggest stations if station `work_center_type` names don't match the `autoSuggestStation` mapping
- `pass_work_order_to_next_step` RPC requires active operator session — may need supervisor override for non-station steps (Quote, Engineering, Purchasing)
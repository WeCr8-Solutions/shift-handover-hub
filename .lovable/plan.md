

## Plan: Connect Org Routing Templates to Work Order Routing Editor

### Current State
- **RoutingTemplateManagement** (admin): Creates/edits/deletes reusable routing templates with steps, work center types, and time estimates. Currently 2 templates exist: "ISO9001 Standard Machining" (3 steps) and "Weldment Assembly" (3 steps).
- **WorkOrderRoutingEditor**: When a WO has no routing, it shows the hardcoded 30-step `DEFAULT_ROUTING_STEPS` template. There is **no way to load a saved org template** into a work order.
- Org has stations covering: Quoting, Purchasing, Engineering, CAM Programming, CNC Mill (×8), CNC Lathe (×3), Inspection, Manual Mill, plus others.

### Gap
The routing template system is disconnected from work order routing. A supervisor creating a work order routing cannot select from their saved org templates. Templates also don't map `work_center_type` → actual station IDs.

### Implementation

#### 1. Add Template Selector to WorkOrderRoutingEditor
At the top of the editor (when in template mode / no existing routing), add a dropdown:
- "Start from scratch" (current 30-step default)
- "Load from template: [ISO9001 Standard Machining]"
- "Load from template: [Weldment Assembly]"
- Any other org templates

When a saved template is selected:
- Fetch its `routing_template_steps` from the database
- Map each step's `work_center_type` → an actual station using the existing `autoSuggestStation` logic
- Replace the current steps list with the template's steps
- Show all steps as enabled (since saved templates only contain the steps the org wants)

#### 2. Update Template Step → Routing Step Mapping
The saved template steps use `work_center_type` (e.g., "CNC Mill", "Incoming Inspection") while the routing editor uses `station_id` (actual UUID). The mapping:
```text
Template Step                  →  Routing Step
─────────────────────────────────────────────
operation_name                 →  operation_name
operation_type                 →  operation_type  
work_center_type: "CNC Mill"   →  station_id: autoSuggestStation() match
setup_time_minutes             →  (preserved)
first_article_minutes          →  (preserved)
cycle_time_minutes             →  (preserved)
instructions                   →  instructions
```

#### 3. Add "Save as Template" from WorkOrderRoutingEditor
After a supervisor customizes routing for a specific WO, add a "Save as Template" button that:
- Opens a small dialog asking for template name and optional part number pattern
- Saves the current enabled steps as a new `routing_template` + `routing_template_steps`
- This creates a feedback loop: customize once → reuse everywhere

#### 4. Files to Modify
- **`src/components/routing/WorkOrderRoutingEditor.tsx`**: Add template selector dropdown at top, "Save as Template" button, fetch org templates on mount
- **`src/components/queue/QueueItemDetailDialog.tsx`** (minor): No changes needed — already opens WorkOrderRoutingEditor

#### 5. E2E Browser Test Plan
1. Navigate to `/admin` → Routing Templates tab → verify existing 2 templates
2. Create a new template "Valve Body Standard" with 6 steps: Quote → Engineering → CNC Mill Op 10 → CNC Mill Op 20 → Final Inspection → Ship
3. Navigate to `/queue` → create a new work order
4. Open detail → Edit Routing → verify template selector shows "Valve Body Standard"
5. Select it → verify steps load with auto-suggested stations
6. Save routing → verify steps persisted in `work_order_routing` table
7. Customize routing → use "Save as Template" → verify new template appears in admin list
8. Verify the full flow visually with screenshots at each step


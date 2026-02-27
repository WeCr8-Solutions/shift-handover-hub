

## AI Capabilities Audit — To-Do List

After reviewing all AI-related features, edge functions, hooks, and UI components, here is the status and action items:

---

### What's Working

| Feature | Edge Function | Hook | UI | Status |
|---|---|---|---|---|
| AI Planning Assistant chat | `ai-planning-assistant` | `usePlanningAssistant` | `PlanningAssistantModal` (FAB on Dashboard + Queue) | **Working** |
| Usage limits (daily tier caps) | `increment_ai_chat_usage` RPC | `useAiChatUsage` | Badge in modal + upgrade card | **Working** |
| Machine Library (verified, $0.99) | `activate-station-context` / `verify-station-context-payment` | `useMachineLibrary` | `StationManufacturerAttach` | **Working** |
| Manual Machine Entry (free) | N/A (direct DB) | `useStationMachineProfile` | `StationManualMachineEntry` | **Working** |
| Machine Context Dialog (dual path) | N/A | N/A | `StationMachineContextDialog` | **Working** |
| AI system prompt: machine-aware routing | Reads `station_machine_assignments` + `station_manual_machine_profiles` | — | — | **Working** |
| AI system prompt: part-aware validation | Reads `queue_items` part spec fields | — | — | **Backend only — no UI to populate data** |

---

### What's Missing (Action Items)

#### 1. Add Part Specs UI to Work Order Creation
**Problem**: `queue_items` has `material_type`, `part_length_inches`, `part_width_inches`, `part_height_inches`, `part_weight_lbs`, and `part_shape` columns, but `CreateWorkOrderDialog` does not expose any of these fields. Users cannot enter part data, so the AI's part-aware routing validation never fires.

**Fix**: Add a collapsible "Part Specifications" section to `CreateWorkOrderDialog` with fields for material type (dropdown), dimensions (L/W/H in inches), weight (lbs), and shape (dropdown: prismatic, cylindrical, complex, flat, tubular).

#### 2. Add Part Specs UI to Work Order Detail/Edit
**Problem**: `QueueItemDetailDialog` does not display or allow editing of part spec fields. Even if specs were entered at creation, users can't see or update them.

**Fix**: Add a "Part Specs" section in `QueueItemDetailDialog` that displays existing specs and allows editing (for supervisors/admins).

#### 3. Build Part Catalog Management UI
**Problem**: The `part_catalog` table exists in the database (with part_number, description, material_type, dimensions, shape, weight, org-scoped) but there is **zero UI** to manage it. No CRUD, no browser, no search.

**Fix**: Create a `PartCatalogManager` component accessible from Settings or Queue page that lets org admins create, view, edit, and delete reusable part profiles. Include search/filter by part number and material.

#### 4. Add Part Catalog Lookup to Work Order Creation
**Problem**: `queue_items.part_catalog_id` FK exists but the `CreateWorkOrderDialog` has no way to select from the part catalog. The "auto-fill from catalog" flow is entirely missing.

**Fix**: Add an optional "Select from Part Catalog" picker in `CreateWorkOrderDialog` that, when a catalog entry is selected, auto-fills material_type, dimensions, weight, and shape fields.

#### 5. AI Planning Assistant — Missing Part Spec Feedback in UI
**Problem**: The AI system prompt says "Recommend adding material/dimension data to the work order for better AI routing" when part specs are missing, but there's no inline action from the chat to navigate the user to the work order to add specs.

**Fix**: Low priority — this works via text advice already. Consider adding a deep-link or action button in the future.

---

### Implementation Order

1. **Part Specs fields in CreateWorkOrderDialog** — unblocks data entry
2. **Part Specs display/edit in QueueItemDetailDialog** — unblocks viewing/editing
3. **Part Catalog CRUD UI** — enables reusable part profiles
4. **Part Catalog picker in CreateWorkOrderDialog** — auto-fill from catalog

### Technical Notes
- Part shape values: `prismatic`, `cylindrical`, `complex`, `flat`, `tubular` (matches AI system prompt)
- Material types should reuse the same list from `StationManualMachineEntry`: Aluminum, Steel, Stainless Steel, Titanium, Inconel, Copper, Brass, Plastics, Composites, Cast Iron, Tool Steel
- Part catalog is org-scoped via `organization_id` + RLS policies already in place
- No new database migrations needed — all tables and columns already exist


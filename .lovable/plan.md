# Work Order Groups — Assembly / Package Convergence

Let users bundle multiple work orders and quotes into a single **Package** (a.k.a. assembly group / job bundle) with one shared due date, customer, and ship event. When the package due date moves, every child WO inherits it. When all children complete, the package is ready to ship.

This is targeted at assembly builders and tooling shops where a single delivery is composed of 3–20 small WOs, not large repeat-runs.

---

## 1. User-facing behavior

**Create a package**
- From the Queue page: "New Package" button (next to "New Work Order").
- From an existing WO/Quote: "Add to Package…" action → pick existing package or create new.
- Package fields: package number (auto, prefix `PKG-` configurable in org settings), title, customer (reuses CustomerCombobox), required ship date, priority, notes.

**Convergent due date**
- The package's `required_ship_date` is the source of truth.
- Child WO `due_date` defaults to package date but can be pulled earlier (sub-assembly needs to finish first). It cannot be later than the package date — UI blocks and warns.
- Moving the package date offers "cascade to all children" (default on).

**Quote → Package conversion**
- Quotes can be grouped into a Package Quote. On approval, all child quotes convert to WOs atomically and stay linked to the package.

**Status & readiness**
- Package status derived: `draft` → `in_progress` (any child active) → `ready_to_ship` (all children completed) → `shipped` (manual mark) → `closed`.
- Package card shows: X of Y parts complete, earliest at-risk child, days to ship.

**Views**
- New `/packages` hub page: list + detail view with child WO table, customer info, timeline.
- Queue Kanban: child WOs show a small package chip; filter "Group by package".
- Customer detail page: packages tab alongside parts/work orders.

---

## 2. Data model

New table `work_order_packages`:
- `organization_id`, `customer_id` (FK customers, nullable)
- `package_number` (unique per org, generated via existing `org_numbering_counters` with new kind `package`)
- `title`, `description`, `notes`
- `required_ship_date`, `promised_ship_date`, `actual_ship_date`
- `status` enum: `draft | in_progress | ready_to_ship | shipped | closed | cancelled`
- `priority`, `is_quote` (bool — package of quotes vs WOs)
- `created_by`, timestamps
- Multi-tenant: NOT NULL `organization_id`, RLS via `is_org_member`, GRANTs for authenticated + service_role.

Modify `queue_items`:
- Add `package_id uuid REFERENCES work_order_packages(id) ON DELETE SET NULL`
- Add `package_sequence int` (build order within package, optional)
- Index on `(package_id, package_sequence)`.

New trigger `sync_package_status()`:
- AFTER UPDATE on `queue_items.status` → recompute parent package status (any active → in_progress; all completed → ready_to_ship; any cancelled doesn't auto-cancel package).

New RPC `add_items_to_package(package_id, item_ids[])` and `cascade_package_due_date(package_id, new_date, cascade boolean)`.

Extend org numbering settings UI: add `Package Prefix` and `Package Starting Number` next to existing WO/Quote fields.

Extend `convert_quote_to_work_order` flow: when a package of quotes is approved, run conversion in a single transaction preserving `package_id`.

---

## 3. Frontend changes

New:
- `src/pages/Packages.tsx` — hub list with filters (status, customer, ship-date window).
- `src/pages/PackageDetail.tsx` — header, child WO table (drag-reorder for build sequence), add/remove items, ship action.
- `src/components/queue/CreatePackageDialog.tsx`
- `src/components/queue/AddToPackageDialog.tsx` (used from WO row actions)
- `src/components/packages/PackageStatusBadge.tsx`, `PackageProgress.tsx`
- `src/hooks/usePackages.ts`, `usePackage.ts`

Edited:
- `src/components/queue/CreateWorkOrderDialog.tsx` — optional "Add to package" field; if set, prefill due date from package and disable later dates.
- `src/components/queue/QueueItemActions.tsx` — "Add to Package…" action; quote approval respects package grouping.
- `src/components/queue/QueueKanbanView.tsx` / list view — package chip + "Group by package" toggle.
- `src/components/settings/ManufacturingSettings.tsx` — package numbering settings.
- `src/components/Header.tsx` + `src/App.tsx` — `/packages` route and nav link.
- `src/pages/Customers.tsx` — packages tab in customer expand.

---

## 4. Tests
- Unit: `usePackages` CRUD, due-date cascade logic, status derivation.
- RPC tests: package number generation, atomic quote→WO bulk conversion.
- E2E `e2e/work-order-packages.spec.ts`: create package, add 3 WOs, complete all → package goes ready_to_ship; cascade date change; supervisor permissions; operator read-only.

---

## 5. Out of scope (call out, don't build)
- BOM explosion / parent-child part hierarchy (separate from package grouping).
- Multi-package shipments / consolidated shipping manifests.
- Inventory reservation against packages.
- Integration with the future Manufacturing Document Package model (PRD 10) — these are orthogonal: one is execution documents, this is delivery grouping. We'll keep naming distinct (`work_order_packages` vs `manufacturing_document_packages`).

---

## 6. Open question
Should a package allow **mixed customers** (rare, but happens for tooling shops doing internal+external in one build) or strictly enforce one customer per package? Default proposed: **strict one customer**, with an override toggle in org settings.

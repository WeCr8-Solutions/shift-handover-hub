

# Work Order Quantity Control and NCR Governance System

## Scope Assessment

This is a **major subsystem addition** touching database schema, business logic enforcement, authorization controls, UI components, and reporting. I've organized it into the implementation order that minimizes risk and maximizes incremental value.

---

## Database Changes

### 1. New columns on `queue_items`

Add quantity tracking fields alongside the existing `quantity` (which becomes `qty_original`) and `parts_completed` columns:

```text
qty_original      INTEGER   -- Locked after release (copied from quantity)
qty_completed     INTEGER DEFAULT 0
qty_scrap         INTEGER DEFAULT 0
qty_rework        INTEGER DEFAULT 0
qty_open          INTEGER   -- Computed: qty_original - qty_completed - qty_scrap - qty_rework
quantity_locked   BOOLEAN DEFAULT false   -- Set true after first "in_progress"
parent_work_order_id  UUID REFERENCES queue_items(id)  -- For rework child WOs
is_rework         BOOLEAN DEFAULT false
```

**Design decision:** The existing `quantity` column stays as-is (used for routing/time calculations). We add `qty_original` that gets locked. A trigger keeps `qty_open` in sync: `qty_open = qty_original - qty_completed - qty_scrap - qty_rework`. The `parts_completed` column (already exists) will be aliased/synced with `qty_completed`.

**Tradeoff:** We could reuse `parts_completed` as `qty_completed` directly. However, `parts_completed` is currently used by `current_station_status` sync logic in `useQueue.ts`. To avoid breaking that, we'll add `qty_completed` as the source of truth and sync `parts_completed` from it via trigger.

### 2. New `ncr_reports` table

```sql
CREATE TABLE public.ncr_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  queue_item_id     UUID NOT NULL REFERENCES queue_items(id),
  ncr_number        TEXT NOT NULL,  -- Auto-generated: NCR-YYYYMMDD-XXXX
  work_order_number TEXT NOT NULL,
  part_number       TEXT,
  serial_or_lot     TEXT NOT NULL,       -- Free-text per user preference
  operation_number  TEXT NOT NULL,
  defect_type       TEXT NOT NULL,
  disposition       TEXT NOT NULL,       -- CHECK: scrap, rework, use_as_is, return_to_vendor
  description       TEXT NOT NULL,
  authorized_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  authorized_by_name TEXT,
  authorized_at     TIMESTAMPTZ,
  authorization_status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  quantity_affected INTEGER NOT NULL DEFAULT 1,
  rework_wo_id      UUID REFERENCES queue_items(id),  -- Child WO if rework
  quality_signoff   BOOLEAN DEFAULT false,
  customer_approval BOOLEAN DEFAULT false,
  metadata          JSONB DEFAULT '{}',
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3. New `ncr_audit_log` table (immutable)

```sql
CREATE TABLE public.ncr_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL,
  ncr_id            UUID NOT NULL REFERENCES ncr_reports(id),
  queue_item_id     UUID NOT NULL,
  action            TEXT NOT NULL,
  performed_by      UUID NOT NULL,
  performed_by_name TEXT NOT NULL,
  old_values        JSONB,
  new_values        JSONB,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

This table has **INSERT-only RLS** -- no UPDATE or DELETE policies. Immutable audit trail.

### 4. Database triggers and functions

**a. Quantity integrity trigger** on `queue_items`:
- On UPDATE: validate `qty_completed + qty_scrap + qty_rework + qty_open = qty_original`
- Prevent `qty_completed` from exceeding `qty_original` (quantity lock)
- Auto-compute `qty_open`
- If quantity is locked and someone tries to increase `qty_original`, reject unless caller is org owner (checked via `is_org_admin`)

**b. Quantity lock trigger**: When `qty_completed >= qty_original`, auto-set `quantity_locked = true` and prevent further completions without supervisor override.

**c. NCR auto-numbering**: `BEFORE INSERT` trigger generates `ncr_number` as `NCR-YYYYMMDD-XXXX`.

**d. NCR disposition effects**: `AFTER UPDATE` trigger on `ncr_reports` -- when `authorization_status` changes to `approved`:
- If `disposition = 'scrap'`: increment parent WO's `qty_scrap`, decrement `qty_open`
- If `disposition = 'rework'`: increment parent WO's `qty_rework`, create child WO
- If `disposition = 'use_as_is'`: increment parent WO's `qty_completed`

**e. Activity type expansion**: Add `ncr_created`, `ncr_approved`, `ncr_rejected`, `quantity_override`, `rework_wo_created`, `work_order_quantity_adjusted` to the `activity_type` enum.

### 5. RLS policies

- `ncr_reports`: org-member can SELECT; operator can INSERT (with `authorization_status = 'pending'`); supervisor/org-admin can UPDATE (approve/reject); no DELETE
- `ncr_audit_log`: org-member can SELECT; INSERT via SECURITY DEFINER functions only; no UPDATE; no DELETE
- Child work orders inherit parent's RLS (same `organization_id`)

### 6. Helper functions

```sql
-- Check if user can approve NCRs (supervisor or org admin)
CREATE FUNCTION can_approve_ncr(_user_id UUID, _org_id UUID) RETURNS BOOLEAN
-- Check if user can adjust WO quantity (org owner only)  
CREATE FUNCTION can_adjust_wo_quantity(_user_id UUID, _org_id UUID) RETURNS BOOLEAN
-- Create rework child WO (SECURITY DEFINER)
CREATE FUNCTION create_rework_work_order(_ncr_id UUID, _approver_id UUID) RETURNS UUID
-- Apply NCR disposition effects (SECURITY DEFINER)
CREATE FUNCTION apply_ncr_disposition(_ncr_id UUID, _approver_id UUID) RETURNS VOID
-- Auto-generate NCR number
CREATE FUNCTION generate_ncr_number(_org_id UUID) RETURNS TEXT
```

---

## Frontend Changes

### 1. New hook: `src/hooks/useNCR.ts`

Provides:
- `createNCR(input)` -- operator creates pending NCR
- `approveNCR(ncrId, notes?)` -- supervisor approves
- `rejectNCR(ncrId, reason)` -- supervisor rejects
- `fetchNCRs(filters)` -- list NCRs for a work order or organization
- `fetchNCRAuditLog(ncrId)` -- immutable history
- Real-time subscription on `ncr_reports`

### 2. New component: `src/components/ncr/CreateNCRDialog.tsx`

Form fields per spec:
- Work Order Number (auto-populated from parent WO)
- Part Number (auto-populated)
- Serial/Lot Number (free text, required)
- Operation Number (dropdown from routing steps)
- Defect Type (text input)
- Disposition Type (select: Scrap, Rework, Use As Is, Return to Vendor)
- Quantity Affected (number input, validated against `qty_open`)
- Description (textarea, required)
- File attachments (optional, using existing storage bucket)

Accessible from: Work Order Detail Dialog (new "Report NCR" button in the quick actions bar).

### 3. New component: `src/components/ncr/NCRApprovalPanel.tsx`

Supervisor/admin view showing pending NCRs:
- NCR details with disposition
- Approve / Reject buttons
- For rework: preview of child WO that will be created
- For scrap: warning if qty shortfall triggers ship-quantity alert
- For use-as-is: quality signoff + customer approval checkboxes

### 4. New component: `src/components/ncr/NCRListView.tsx`

Table view of all NCRs for an organization, filterable by:
- Status (pending, approved, rejected)
- Disposition type
- Work order number
- Date range

### 5. Updated: `QueueItemDetailDialog.tsx`

- New "NCR" tab alongside Details/Routing/Comments/History (5 tabs total)
- Shows linked NCRs for this work order
- "Report NCR" button (available to all authenticated users)
- Quantity summary card showing: Original | Completed | Scrap | Rework | Open
- Visual progress bar for quantity breakdown

### 6. Updated: `Queue.tsx`

- New tab: "NCR Queue" alongside Work Queue / Outside Processing / History
- Shows pending NCRs requiring approval (supervisor/admin only)

### 7. New component: `src/components/ncr/QuantitySummaryCard.tsx`

Reusable card showing the quantity breakdown with color-coded segments:
- Green: Completed
- Red: Scrap
- Amber: Rework
- Blue: Open
- Shows lock icon when `quantity_locked = true`

### 8. Updated: `QueueStatsCards.tsx`

Add new metrics:
- First Pass Yield % = `(qty_completed - qty_rework_completed) / qty_original * 100`
- Scrap Rate % = `qty_scrap / qty_original * 100`
- Rework Rate % = `qty_rework / qty_original * 100`

### 9. New component: `src/components/ncr/QualityMetricsDashboard.tsx`

Dedicated dashboard cards for:
- First Pass Yield %
- Scrap Rate %
- Rework Rate %
- Cost of Poor Quality (requires cost data -- placeholder for now)
- Rework Hours vs Production Hours
- Supplemental Work Order Count
- Average Rework Cycle Time

Accessible from Queue page stats section for supervisors/admins.

### 10. Updated: Work order completion flow

When operator clicks "Complete" on a work order:
- If `qty_completed >= qty_original`: show quantity lock warning, require supervisor override
- If `qty_open > 0`: prompt "Mark remaining X open parts as complete?"
- Prevent completion if NCRs are pending approval

### 11. Child Work Order display

- Parent WOs show a "Rework Orders" section listing child WOs with `-R1`, `-R2` suffix
- Child WOs display a "Parent WO" link badge
- Child WOs use the same routing template but flagged as rework routing

---

## Authorization Matrix Implementation

| Action | Operator | Supervisor | Org Owner |
|--------|----------|------------|-----------|
| Log NCR | Yes | Yes | Yes |
| Approve scrap | No | Yes | Yes |
| Approve rework | No | Yes | Yes |
| Approve use-as-is | No | Yes | Yes |
| Increase WO qty | No | No | Yes |
| Create supplemental WO | No | No | Yes |
| Close WO below target | No | No | Yes |
| Override quantity lock | No | Yes | Yes |

Enforced at both DB level (RLS + triggers) and UI level (button visibility).

---

## Files to Create

1. `supabase/migrations/XXXXXXXX_ncr_governance.sql` -- All schema changes
2. `src/hooks/useNCR.ts` -- NCR CRUD + approval logic
3. `src/components/ncr/CreateNCRDialog.tsx` -- NCR creation form
4. `src/components/ncr/NCRApprovalPanel.tsx` -- Supervisor approval UI
5. `src/components/ncr/NCRListView.tsx` -- NCR table view
6. `src/components/ncr/QuantitySummaryCard.tsx` -- Qty breakdown display
7. `src/components/ncr/QualityMetricsDashboard.tsx` -- Metrics cards
8. `src/components/ncr/index.ts` -- Barrel export
9. `src/lib/ncrUtils.ts` -- Shared utility functions (NCR number formatting, qty validation)
10. `src/lib/ncrUtils.test.ts` -- Unit tests for utilities

## Files to Modify

1. `src/hooks/useQueue.ts` -- Add qty fields to types, update completion logic
2. `src/components/queue/QueueItemDetailDialog.tsx` -- NCR tab, qty summary, Report NCR button
3. `src/pages/Queue.tsx` -- NCR Queue tab
4. `src/components/queue/QueueStatsCards.tsx` -- Quality metrics
5. `src/components/queue/CreateWorkOrderDialog.tsx` -- Qty fields
6. `src/components/admin/SeedTestDataButton.tsx` -- NCR test data

---

## Technical Notes

- The `ncr_audit_log` table is INSERT-only with no UPDATE/DELETE policies. This is intentional for aerospace-grade traceability.
- Quantity validation runs in a `BEFORE UPDATE` trigger so invalid states never persist.
- The `apply_ncr_disposition` function is `SECURITY DEFINER` to allow the NCR approval to modify parent WO quantities through RLS.
- Child WO creation copies routing steps from parent but flags them as rework routing.
- All authorization checks use existing helper functions (`is_org_admin`, `has_role`, `is_supervisor_in_org`) to stay consistent with the role architecture.
- The `activity_type` enum expansion requires an `ALTER TYPE ... ADD VALUE` migration.


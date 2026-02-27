# ERP Connector — Implementation Status & Testing Checklist

> Last verified: 2026-02-27

---

## Phase 1: Database Schema ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| `erp_connections` table | ✅ Done | One per org, UNIQUE on org_id, RLS for org admins + dev read |
| `erp_sync_logs` table | ✅ Done | Audit trail per sync run, RLS org-scoped |
| `erp_sync_errors` table | ✅ Done | Per-record error capture, FK to sync_logs |
| `erp_work_center_mappings` table | ✅ Done | UNIQUE(org_id, erp_work_center_id), FK to stations |
| `erp_status_mappings` table | ✅ Done | UNIQUE(org_id, erp_status) |
| Trigger: `auto_populate_org_id_for_erp_sync_log` | ✅ Done | Populates org_id from erp_connection_id |
| Trigger: `auto_populate_org_id_for_erp_sync_error` | ✅ Done | Populates org_id from sync_log_id |
| Trigger: `update_updated_at` on erp_connections | ✅ Done | Standard timestamp trigger |
| Trigger: `update_updated_at` on erp_work_center_mappings | ✅ Done | Standard timestamp trigger |
| `queue_items.erp_job_id` column | ✅ Done | Text, nullable |
| `queue_items.erp_source` column | ✅ Done | Text, nullable |
| `queue_items.erp_last_synced_at` column | ✅ Done | Timestamptz, nullable |
| Partial unique index on `(org_id, erp_job_id)` | ✅ Done | WHERE erp_job_id IS NOT NULL |
| `work_order_routing.erp_operation_id` column | ✅ Done | Text, nullable |
| `work_order_routing.erp_sequence_number` column | ✅ Done | Integer, nullable |

### Phase 1 Testing Needed

- [ ] **RLS: erp_connections** — Verify org admin can CRUD, non-member blocked, developer can read
- [ ] **RLS: erp_sync_logs** — Verify org admin can read own org logs only
- [ ] **RLS: erp_sync_errors** — Verify org admin can read own org errors only
- [ ] **RLS: erp_work_center_mappings** — Verify org admin can read/write, non-member blocked
- [ ] **RLS: erp_status_mappings** — Verify org admin can read/write, non-member blocked
- [ ] **Trigger: org_id auto-populate** — Insert sync_log with erp_connection_id, verify org_id filled
- [ ] **Trigger: org_id auto-populate** — Insert sync_error with sync_log_id, verify org_id filled
- [ ] **Partial unique index** — Insert two queue_items with same org_id + erp_job_id, verify conflict
- [ ] **Cross-org isolation** — Org A cannot see Org B's erp_connections, sync_logs, or mappings

---

## Phase 2: Edge Function (`erp-sync`) ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| File: `supabase/functions/erp-sync/index.ts` | ✅ Done | 613 lines |
| CORS headers | ✅ Done | Standard Lovable CORS |
| JWT auth check (manual) | ✅ Done | Extracts Bearer token, verifies via getClaims |
| Org admin authorization | ✅ Done | Checks organization_members role in (owner, admin) |
| Test connection mode | ✅ Done | `test_connection: true` → OAuth token fetch only |
| OAuth client_credentials flow | ✅ Done | `fetchOAuthToken()` helper |
| Fetch work orders | ✅ Done | Generic REST adapter with field mapping |
| Fetch operations/routing | ✅ Done | Maps to work_order_routing |
| Fetch work centers | ✅ Done | Upserts into erp_work_center_mappings |
| Incremental sync (modified_since) | ✅ Done | Uses last successful sync timestamp |
| Status mapping application | ✅ Done | Maps ERP status → JobLine status via erp_status_mappings |
| Work center mapping application | ✅ Done | Maps ERP WC → station_id via erp_work_center_mappings |
| Sync log creation + finalization | ✅ Done | Creates running → updates to success/partial/failed |
| Per-record error logging | ✅ Done | Inserts into erp_sync_errors per failed record |
| Connection status update | ✅ Done | Updates erp_connections.connection_status |
| Config: `verify_jwt = false` | ✅ Done | In supabase/config.toml |
| Deployed | ✅ Done | Auto-deployed via Lovable Cloud |

### Phase 2 Testing Needed

- [ ] **Auth: unauthenticated request** — Returns 401
- [ ] **Auth: non-org-admin request** — Returns 403
- [ ] **Test connection: valid OAuth endpoint** — Returns success + updates connection_status
- [ ] **Test connection: invalid OAuth endpoint** — Returns error + updates connection_status to "error"
- [ ] **Full sync: work orders upserted** — Creates queue_items with erp_job_id, erp_source
- [ ] **Full sync: operations upserted** — Creates work_order_routing with erp_operation_id
- [ ] **Full sync: work centers upserted** — Creates erp_work_center_mappings
- [ ] **Incremental sync** — Only fetches records modified since last successful sync
- [ ] **Error handling** — Individual record failures logged without aborting entire sync
- [ ] **Sync log** — Verify records_fetched, records_created, records_updated, errors_count accurate
- [ ] **Edge case: no ERP connection** — Returns 404
- [ ] **Edge case: empty response from ERP** — Sync completes with 0 records

---

## Phase 3: Settings UI + Integration ✅ MOSTLY COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| `ERPConnectorSettings.tsx` | ✅ Done | Full component with 5 cards |
| — Connection Setup card | ✅ Done | Vendor selector, OAuth fields, Test/Save buttons |
| — Sync Configuration card | ✅ Done | Interval, enable/disable, Run Sync Now |
| — Work Center Mapping card | ✅ Done | Table with station dropdown, unmapped highlighting |
| — Status Mapping card | ✅ Done | Table with add/delete, JobLine status dropdown |
| — Sync History card | ✅ Done | Accordion with last 20 runs, error details |
| Settings.tsx: ERP tab added | ✅ Done | Plug icon, visible to devs + billing managers |
| `useERPConnector.ts` hook | ✅ Done | CRUD connections, sync logs, mappings, invoke sync |
| `useQueue.ts` QueueItem interface | ✅ Done | erp_job_id, erp_source, erp_last_synced_at added |
| QueueKanbanBoard: ERP badge | ✅ Done | Purple "ERP" badge on synced cards |
| QueueItemDetailDialog: ERP section | ✅ Done | Shows source, job ID, last sync time |
| **QueueListView: ERP badge** | ❌ Missing | Plan specifies badge in list view too |
| **OrganizationOversight: ERP card** | ❌ Missing | Plan specifies ERP status overview per org |

### Phase 3 Testing Needed

- [ ] **UI: Connection setup form** — Save creates erp_connections row, fields persist on reload
- [ ] **UI: Test Connection button** — Invokes edge function with test_connection=true, shows toast
- [ ] **UI: Sync interval change** — Updates erp_connections.sync_interval_minutes
- [ ] **UI: Enable/disable toggle** — Updates erp_connections.is_active
- [ ] **UI: Run Sync Now** — Invokes edge function, sync log appears in history
- [ ] **UI: Work center mapping** — Dropdown updates erp_work_center_mappings.jobline_station_id
- [ ] **UI: Status mapping** — Add/delete/update works, persists on reload
- [ ] **UI: Sync history** — Shows last 20 runs, expandable error details
- [ ] **UI: ERP badge on Kanban** — Visible on cards with erp_source set
- [ ] **UI: ERP section in detail dialog** — Shows source, job ID, last sync timestamp
- [ ] **UI: ERP tab visibility** — Only shows for devs and org admins/owners
- [ ] **UI: Client secret not exposed** — Secret field shows placeholder on reload, not actual value

---

## Implementation Gaps (TODO)

### 1. QueueListView ERP Badge
- **File**: `src/components/queue/QueueListView.tsx`
- **Task**: Add purple ERP badge (same as KanbanBoard) for items with `erp_source`
- **Priority**: Low — cosmetic parity with Kanban view

### 2. OrganizationOversight ERP Card
- **File**: `src/components/admin/OrganizationOversight.tsx`
- **Task**: Add card showing ERP connection status per org (connected/pending/error/none)
- **Priority**: Medium — admin visibility into which orgs have ERP connected

### 3. Test Coverage
- **No test files exist** for any ERP connector code
- **Recommended tests**:
  - `src/hooks/useERPConnector.test.ts` — Hook CRUD operations
  - `supabase/functions/erp-sync/index.test.ts` — Edge function auth, sync flow
  - `src/test/erp-rls.test.ts` — RLS policy verification for all 5 ERP tables

---

## Security Checklist

| Check | Status |
|-------|--------|
| Client secrets stored server-side only | ✅ In erp_connections table |
| Secrets not returned to frontend after save | ⚠️ Partial — UI clears field but SELECT * returns encrypted value |
| RLS on all 5 ERP tables | ✅ Done |
| Edge function validates org membership | ✅ Done |
| Read-only scopes enforced | ✅ Configurable via scopes field |
| Sync logs provide audit trail | ✅ Done |
| No write-backs to ERP | ✅ MVP is read-only |
| Cross-org isolation | ✅ RLS + org_id scoping |

---

## Files Inventory

### Created
| File | Lines | Purpose |
|------|-------|---------|
| `supabase/functions/erp-sync/index.ts` | 613 | Edge function: OAuth, fetch, upsert, logging |
| `src/hooks/useERPConnector.ts` | 257 | Hook: CRUD connections, mappings, invoke sync |
| `src/components/settings/ERPConnectorSettings.tsx` | 373 | UI: 5-card settings panel |

### Modified
| File | Change |
|------|--------|
| `supabase/config.toml` | Added `[functions.erp-sync] verify_jwt = false` |
| `src/pages/Settings.tsx` | Added ERP tab with Plug icon |
| `src/hooks/useQueue.ts` | Added erp_job_id, erp_source, erp_last_synced_at to QueueItem |
| `src/components/queue/QueueKanbanBoard.tsx` | Added ERP badge on cards |
| `src/components/queue/QueueItemDetailDialog.tsx` | Added ERP source info section |

### Database Migration
| Object | Type |
|--------|------|
| `erp_connections` | Table + RLS |
| `erp_sync_logs` | Table + RLS |
| `erp_sync_errors` | Table + RLS |
| `erp_work_center_mappings` | Table + RLS |
| `erp_status_mappings` | Table + RLS |
| `queue_items` | 3 columns + partial unique index |
| `work_order_routing` | 2 columns |
| `auto_populate_org_id_for_erp_sync_log` | Trigger function |
| `auto_populate_org_id_for_erp_sync_error` | Trigger function |

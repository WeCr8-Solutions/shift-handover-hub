

## Plan: Cloud ERP Connector — MVP Read-Only Integration

This is a large, multi-layer feature. The plan is structured into **3 phases** to ship incrementally.

---

### Phase 1: Database Schema + Edge Function Infrastructure

**Migration: Create 5 new tables**

1. **`erp_connections`** — One per org, stores ERP vendor config
   - `id`, `organization_id` (FK, NOT NULL, UNIQUE), `erp_vendor` (text), `instance_type` (text default 'cloud'), `api_base_url` (text), `oauth_token_endpoint` (text), `client_id_encrypted` (text), `client_secret_encrypted` (text), `scopes` (text), `tenant_identifier` (text), `sync_interval_minutes` (int default 10), `is_active` (bool default false), `last_tested_at` (timestamptz), `connection_status` (text default 'pending'), `created_by` (uuid), `created_at`, `updated_at`
   - RLS: org admins/owners only (read + write), developers read all

2. **`erp_sync_logs`** — Audit trail per sync run
   - `id`, `organization_id` (FK, NOT NULL), `erp_connection_id` (FK), `sync_type` (text: 'full'|'incremental'), `started_at`, `completed_at`, `status` (text: 'running'|'success'|'partial'|'failed'), `records_fetched` (int), `records_created` (int), `records_updated` (int), `errors_count` (int), `error_details` (jsonb), `duration_ms` (int), `triggered_by` (text: 'schedule'|'manual')
   - RLS: org admins read their own org's logs

3. **`erp_sync_errors`** — Per-record error capture
   - `id`, `organization_id` (FK, NOT NULL), `sync_log_id` (FK), `erp_record_type` (text: 'work_order'|'operation'|'work_center'), `erp_record_id` (text), `error_message` (text), `retry_count` (int default 0), `resolved` (bool default false), `created_at`
   - RLS: org admins read

4. **`erp_work_center_mappings`** — Maps ERP work centers to JobLine stations
   - `id`, `organization_id` (FK, NOT NULL), `erp_work_center_id` (text), `erp_work_center_name` (text), `jobline_station_id` (uuid FK to stations, nullable), `created_at`, `updated_at`
   - UNIQUE(`organization_id`, `erp_work_center_id`)
   - RLS: org admins read/write

5. **`erp_status_mappings`** — Maps ERP statuses to JobLine statuses
   - `id`, `organization_id` (FK, NOT NULL), `erp_status` (text), `jobline_status` (text — maps to queue_status enum values), `created_at`
   - UNIQUE(`organization_id`, `erp_status`)
   - RLS: org admins read/write

**Triggers:**
- `auto_populate_org_id` triggers on `erp_sync_logs`, `erp_sync_errors` (from `erp_connection_id`)
- `update_updated_at_column` on `erp_connections`, `erp_work_center_mappings`

**Add columns to `queue_items`:**
- `erp_job_id` (text, nullable) — external ERP reference
- `erp_source` (text, nullable) — which ERP vendor synced this
- `erp_last_synced_at` (timestamptz, nullable)
- Add partial unique index: `UNIQUE(organization_id, erp_job_id)` WHERE `erp_job_id IS NOT NULL`

**Add columns to `work_order_routing`:**
- `erp_operation_id` (text, nullable)
- `erp_sequence_number` (int, nullable)

---

### Phase 2: Edge Function — `erp-sync`

**New edge function: `supabase/functions/erp-sync/index.ts`**

- JWT-verified, org-admin authorization required
- Accepts POST with `{ organization_id, sync_type: 'full' | 'incremental' }`
- Flow:
  1. Load `erp_connections` for the org
  2. Authenticate to ERP via OAuth client_credentials flow
  3. Fetch work orders (with `modified_since` for incremental)
  4. Fetch operations/routing per work order
  5. Fetch work center master list
  6. Upsert into `queue_items` (matching on `erp_job_id`), `work_order_routing`, and `erp_work_center_mappings`
  7. Apply `erp_status_mappings` to set `queue_status`
  8. Apply `erp_work_center_mappings` to set `station_id`
  9. Log everything to `erp_sync_logs` and `erp_sync_errors`
- MVP: Generic REST adapter with configurable field mapping (stored in `erp_connections.metadata` jsonb)
- Config in `supabase/config.toml`: `verify_jwt = false` (manual JWT check in code)

---

### Phase 3: Settings UI + Admin Observability

**New settings tab: "ERP Connector" in Settings page**

1. **`src/components/settings/ERPConnectorSettings.tsx`** — New component
   - Only visible to org admins/owners
   - **Connection Setup Card:**
     - ERP vendor selector (JobBOSS, Epicor, Plex, ProShop, E2, Other)
     - API Base URL, OAuth Token Endpoint, Client ID, Client Secret (password input)
     - Scopes (pre-filled "read-only"), Tenant ID
     - "Test Connection" button (calls edge function with test mode)
     - Connection status badge (Pending / Connected / Error)
   - **Sync Configuration Card:**
     - Sync interval dropdown (5, 10, 15, 30, 60 min)
     - Enable/disable toggle
     - "Run Sync Now" button
     - Last sync timestamp + result summary
   - **Work Center Mapping Card:**
     - Table: ERP Work Center Name | JobLine Station (dropdown of org stations)
     - Auto-populated after first sync with unmapped centers highlighted
   - **Status Mapping Card:**
     - Table: ERP Status | JobLine Status (dropdown: pending, queued, in_progress, on_hold, completed, cancelled)
     - Pre-filled defaults for common patterns
   - **Sync History Card:**
     - Table of last 20 sync runs: timestamp, type, records fetched/created/updated, errors, duration
     - Expandable error details per run

2. **Update `src/pages/Settings.tsx`:**
   - Add "ERP" tab (with `Plug` icon) visible to org admins + developers
   - Import and render `ERPConnectorSettings`

3. **New hook: `src/hooks/useERPConnector.ts`**
   - CRUD for `erp_connections` (scoped to user's org)
   - Fetch sync logs, sync errors, work center mappings, status mappings
   - Invoke `erp-sync` edge function
   - Test connection method

4. **Update `src/hooks/useQueue.ts` QueueItem interface:**
   - Add `erp_job_id`, `erp_source`, `erp_last_synced_at` optional fields

5. **Queue UI indicators:**
   - In `QueueKanbanBoard.tsx` and `QueueListView.tsx`: show small ERP badge on cards synced from ERP
   - In `QueueItemDetailDialog.tsx`: show "ERP Source" section with job ID and last sync time

6. **Admin panel addition:**
   - Add ERP overview card in `OrganizationOversight.tsx` showing connection status per org

---

### Security Considerations

- Client secrets stored server-side only (in `erp_connections` table, never sent to frontend after initial save)
- RLS ensures org isolation on all ERP tables
- Edge function validates org membership before any ERP operation
- Read-only scopes enforced at the ERP API level
- Sync logs provide full audit trail
- No write-backs to ERP in MVP

### Files Created
- `src/components/settings/ERPConnectorSettings.tsx`
- `src/hooks/useERPConnector.ts`
- `supabase/functions/erp-sync/index.ts`

### Files Modified
- `src/pages/Settings.tsx` (add ERP tab)
- `src/hooks/useQueue.ts` (add ERP fields to interface)
- `src/components/queue/QueueKanbanBoard.tsx` (ERP badge)
- `src/components/queue/QueueItemDetailDialog.tsx` (ERP source section)
- `src/components/admin/OrganizationOversight.tsx` (ERP status card)
- 1 database migration (tables + columns + RLS + triggers)


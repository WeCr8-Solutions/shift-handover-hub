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
| `erp_usage_metering` table | ✅ Done | UNIQUE(org_id, period_start), monthly sync counter |
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
| `increment_erp_sync_usage()` function | ✅ Done | Upserts monthly counter, returns limit_reached |

---

## Phase 2: Edge Function (`erp-sync`) ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| File: `supabase/functions/erp-sync/index.ts` | ✅ Done | ~650 lines |
| CORS headers | ✅ Done | Standard Lovable CORS |
| JWT auth check (getUser) | ✅ Done | Uses `getUser()` |
| Org admin authorization | ✅ Done | Checks organization_members role in (owner, admin) |
| **Enterprise plan gate** | ✅ Done | Returns 403 if entitlements.plan !== 'enterprise' |
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
| Usage metering enforcement | ✅ Done | Calls `increment_erp_sync_usage`, returns 429 at limit |
| Config: `verify_jwt = false` | ✅ Done | In supabase/config.toml |

---

## Phase 3: Settings UI + Integration ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| `ERPConnectorSettings.tsx` | ✅ Done | Full component with enterprise gate + tier selection |
| — **Enterprise plan gate** | ✅ Done | Non-enterprise orgs see upgrade prompt instead of ERP tiers |
| — Connection Setup card | ✅ Done | Vendor selector, OAuth fields, Test/Save buttons |
| — Sync Configuration card | ✅ Done | Interval, enable/disable, Run Sync Now |
| — Work Center Mapping card | ✅ Done | Table with station dropdown, unmapped highlighting |
| — Status Mapping card | ✅ Done | Table with add/delete, JobLine status dropdown |
| — Sync History card | ✅ Done | Accordion with last 20 runs, error details |
| — ERP Tier Selection | ✅ Done | 3-card layout for Starter/Pro/Unlimited (enterprise only) |
| — Usage Progress Bar | ✅ Done | Shows sync count vs limit with 80% warning |
| `useERPConnector.ts` hook | ✅ Done | CRUD connections, sync logs, errors, mappings, invoke sync |

---

## Phase 4: Tiered Billing Integration ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| Stripe Products Created | ✅ Done | Starter ($100), Pro ($150), Unlimited ($200) |
| `useSubscription.ts` ERP_ADDON_TIERS | ✅ Done | Price IDs, product IDs, sync limits, features |
| Stripe webhook: ERP product detection | ✅ Done | `ERP_PRODUCT_TIERS` mapping in stripe-webhook |
| Webhook: checkout.session.completed | ✅ Done | Sets erp_tier via `updateErpTierOnly()` |
| Webhook: subscription.updated | ✅ Done | Activates/deactivates erp_tier separately from base plan |
| Webhook: subscription.deleted | ✅ Done | Revokes erp_tier without affecting base plan |
| `erp-sync`: usage metering call | ✅ Done | Calls `increment_erp_sync_usage` before sync, 429 at limit |
| ERP tier preserved on base plan change | ✅ Done | `updateOrgEntitlements` reads existing erp_tier before overwriting |

---

## Phase 5: Enterprise Seat Management & ERP Gate ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| **ERP gated to Enterprise-only (server)** | ✅ Done | `erp-sync` returns 403 if plan !== 'enterprise' |
| **ERP gated to Enterprise-only (UI)** | ✅ Done | ERPConnectorSettings shows upgrade prompt for non-enterprise |
| **Enterprise checkout with quantity** | ✅ Done | `create-checkout` passes quantity for enterprise price ID |
| **update-seats edge function** | ✅ Done | Auth + can_manage_billing + Stripe quantity update with proration |
| **Webhook syncs seat quantity** | ✅ Done | `updateOrgEntitlements` accepts seatQuantity, syncs to limits.users |
| **useSubscription.updateSeats()** | ✅ Done | Frontend function to invoke update-seats |
| **BillingSettings: seat management card** | ✅ Done | Enterprise-only card with member count, seat input, update button |
| **BillingSettings: real usage counts** | ✅ Done | Fetches organization_members, queue_items, stations counts |
| **BillingSettings: seat limit warnings** | ✅ Done | 80% and 100% warnings with visual indicators |
| **Additional seat cost display** | ✅ Done | Shows +N seats × $7.99 = $X.XX/mo calculation |

### Phase 5 Technical Flow

```text
Enterprise Checkout:
  User subscribes → create-checkout (quantity=10) → Stripe session
  → webhook: checkout.session.completed → updateOrgEntitlements(plan, seatQuantity=10)
  → entitlements.limits.users = 10

Seat Management:
  Admin clicks "Update Seats" → update-seats edge function → Stripe subscription.update(quantity=15)
  → webhook: subscription.updated → updateOrgEntitlements(plan, seatQuantity=15)
  → entitlements.limits.users = 15

ERP Gate:
  erp-sync request → check entitlements.plan === 'enterprise' → 403 or proceed
  ERPConnectorSettings → check plan !== 'enterprise' → show upgrade card
```

---

## Phase 6: Production Readiness & Forethought ⬜ PLANNED

| Item | Status | Priority | Notes |
|------|--------|----------|-------|
| **Automated scheduled sync** | ⬜ Planned | P1 | Needs client-side polling or external cron trigger |
| **Sync debounce / rate limit** | ⬜ Planned | P2 | Prevent manual sync spam; add cooldown |
| **ERP API response pagination** | ⬜ Planned | P2 | Cursor-based pagination for large datasets |
| **OAuth token caching** | ⬜ Planned | P3 | Cache token with TTL in connection metadata |
| **Connection health monitoring** | ⬜ Planned | P3 | Alert via notification_queue on persistent failures |
| **Sync conflict resolution** | ⬜ Planned | P3 | Define merge strategy for local vs ERP edits |
| **Webhook push support** | ⬜ Planned | P3 | Allow ERPs to push changes instead of polling |
| **Field mapping UI editor** | ⬜ Planned | P3 | Visual editor for custom ERP APIs |
| **Secrets column-level security** | ⬜ Planned | P2 | Prevent client_secret_encrypted from SELECT |
| **Retry failed records** | ⬜ Planned | P2 | UI button to retry unresolved sync errors |

---

## Files Inventory

### Created
| File | Purpose |
|------|---------|
| `supabase/functions/erp-sync/index.ts` | Edge function: OAuth, fetch, upsert, metering, enterprise gate |
| `supabase/functions/update-seats/index.ts` | Edge function: Enterprise seat quantity management |
| `src/hooks/useERPConnector.ts` | Hook: CRUD connections, mappings, errors, invoke sync |
| `src/components/settings/ERPConnectorSettings.tsx` | UI: Enterprise gate + tier selection + usage progress |

### Modified
| File | Change |
|------|--------|
| `supabase/functions/create-checkout/index.ts` | Added quantity parameter for enterprise per-seat billing |
| `supabase/functions/stripe-webhook/index.ts` | Seat quantity sync to entitlements.limits.users |
| `src/hooks/useSubscription.ts` | Added updateSeats(), quantity param to createCheckout() |
| `src/components/settings/BillingSettings.tsx` | Real usage counts + enterprise seat management card |
| `supabase/config.toml` | Added update-seats function config |

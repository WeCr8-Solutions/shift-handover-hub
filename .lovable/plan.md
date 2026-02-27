

## Phase 6 Implementation + Seat/Invite Integration

### Problem: Seat Manager & Invite System Disconnect
The invite code generator has no awareness of seat limits. An admin can generate unlimited invites even when seats are full. Redemption will fail at the RLS level (`check_limit_access`) with an opaque DB error instead of a clear message. The seat management UI and invite UI live in separate silos.

### Plan

#### 1. Add seat-awareness to InviteCodeGenerator
- **`InviteCodeGenerator.tsx`**: Fetch current member count + seat limit from entitlements. Display a seat availability banner at the top (e.g., "3 of 10 seats used"). When seats are full, disable "Create Invite" button and show "Add more seats in Billing Settings" prompt. When seats are nearly full (≥80%), show a warning.

#### 2. Add seat-awareness to invite redemption
- **`useOrganizationInvites.ts` → `redeemInviteCode()`**: Before inserting into `organization_members`, query entitlements limits and current member count. If at capacity, return a clear error: "This organization has reached its seat limit. Please ask an admin to add more seats." This prevents the cryptic RLS error.

#### 3. Add seat-awareness to InviteCodeRedemption UI
- **`InviteCodeRedemption.tsx`**: After validation succeeds, show remaining seats in the org preview card. If seats are full, show a clear message instead of the Join button.

#### 4. Phase 6: Sync debounce / cooldown
- **`erp-sync` edge function**: Add cooldown check — query `erp_sync_logs` for the last successful sync. If < 5 minutes ago and not `test_connection`, return 429 with a message. This prevents manual sync spam.

#### 5. Phase 6: OAuth token caching
- **`erp-sync` edge function**: After fetching an OAuth token, store it in `erp_connections.connection_metadata` with a TTL timestamp. On next sync, check if cached token is still valid (TTL not expired) before requesting a new one.

#### 6. Phase 6: Connection health monitoring
- **`erp-sync` edge function**: After 3 consecutive sync failures, insert a notification into `notification_queue` alerting org admins of persistent ERP connection issues.

#### 7. Phase 6: Retry failed sync records
- **`ERPConnectorSettings.tsx`**: Add a "Retry Failed" button on sync error rows. When clicked, re-invoke `erp-sync` with a `retry_error_ids` parameter.
- **`erp-sync` edge function**: Accept optional `retry_error_ids` array. When present, re-process only those specific records and mark errors as resolved on success.
- **`useERPConnector.ts`**: Add `retryFailedRecords(errorIds)` function.

#### 8. Phase 6: Secrets column-level security
- **Database migration**: Create a view `erp_connections_safe` that excludes `client_secret_encrypted`. Update RLS so only the `erp-sync` edge function (service role) can read the actual secret column. Frontend queries use the safe view.

#### 9. Update checklist documentation
- Mark Phase 6 items as complete in `.lovable/prd/10-erp-connector-implementation.md`.

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/InviteCodeGenerator.tsx` | Edit — seat availability banner, disable when full |
| `src/components/InviteCodeRedemption.tsx` | Edit — show remaining seats, block join when full |
| `src/hooks/useOrganizationInvites.ts` | Edit — pre-check seat limits in `redeemInviteCode()` |
| `supabase/functions/erp-sync/index.ts` | Edit — add debounce, token caching, health monitoring, retry |
| `src/components/settings/ERPConnectorSettings.tsx` | Edit — retry failed button |
| `src/hooks/useERPConnector.ts` | Edit — add retryFailedRecords function |
| Migration SQL | Create — `erp_connections_safe` view + RLS |
| `.lovable/prd/10-erp-connector-implementation.md` | Edit — mark Phase 6 items done |

### Technical Details

```text
Invite + Seat flow:
  Admin opens InviteCodeGenerator → fetch member count & limits.users
  → Display "7/10 seats used" banner
  → If 10/10: disable Create Invite, show "Add seats" link
  
  User redeems code → redeemInviteCode checks count vs limit
  → If full: return "Seat limit reached" before INSERT attempt
  → If ok: proceed → RLS double-checks via check_limit_access

Sync debounce:
  Manual sync request → query last sync timestamp
  → If < 5min ago → 429 "Please wait X minutes"
  
Token cache:
  Sync starts → check connection_metadata.cached_token + .token_expires_at
  → If valid → skip OAuth request
  → If expired → fetch new token → cache in metadata

Health monitor:
  Sync fails → count consecutive failures from erp_sync_logs
  → If >= 3 → insert notification_queue alert
```


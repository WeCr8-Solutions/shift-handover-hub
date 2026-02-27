

## Phase 5: Enterprise Seat Management & ERP Gate Enforcement

### Current State
- Enterprise plan: $49.99/mo base for 10 users, $7.99/additional user
- ERP Connector add-on ($100-200/mo) is labeled "Enterprise only" in UI text but **not actually gated** — any plan can purchase it
- Seat limits enforced via `check_limit_access` RLS on `organization_members` INSERT, but enterprise "additional users" at $7.99/seat has **no Stripe quantity integration** — the checkout always sends `quantity: 1`
- `BillingSettings` shows user count progress bar but always shows "0 used" (hardcoded)
- No mechanism to update Stripe subscription quantity when members are added/removed

### Plan

#### 1. Gate ERP Connector to Enterprise-only
- **ERPConnectorSettings.tsx**: When org plan is not `enterprise`, show an upgrade prompt pointing to the Enterprise plan instead of the ERP tier selector. Only show the ERP add-on tier cards when `plan === 'enterprise'`
- **erp-sync edge function**: Add a server-side check that the org's entitlements plan is `enterprise` before proceeding with sync; return 403 otherwise

#### 2. Enterprise per-seat checkout with quantity support
- **create-checkout edge function**: When `priceId` matches the Enterprise tier, accept a `quantity` parameter (default: 10). Pass `quantity` to `line_items` so Stripe bills per-seat ($49.99 base covers 10 seats; each additional seat is $7.99)
- Create a **separate Stripe price** for the per-seat add-on ($7.99/mo recurring) — the Enterprise base price stays at $49.99 for the first 10 users, and additional seats use the per-seat price as a second line item
- Alternative simpler approach: Use the existing Enterprise price with quantity = total seats, where the Stripe product is configured as per-unit pricing at $7.99/seat with the first 10 included in the $49.99 base (this matches the current `additionalUserPrice: 7.99` config)

#### 3. Seat management UI in BillingSettings
- Add a **"Manage Seats"** card (Enterprise only) showing:
  - Current member count vs entitled seats
  - "Add Seats" button that updates the Stripe subscription quantity via `customer-portal` or a new edge function
  - Warning when approaching seat limit
- Wire `BillingSettings` usage cards to show **real counts** from `organization_members`, `queue_items` (this month), and `stations`

#### 4. Enforce seat limits dynamically
- **stripe-webhook**: When Enterprise subscription quantity changes, update `entitlements.limits.users` to match the new quantity
- **check_limit_access** RLS function already blocks INSERT on `organization_members` when limit exceeded — this just needs the limit value to stay in sync with Stripe

#### 5. Add seats edge function
- Create `supabase/functions/update-seats/index.ts`:
  - Auth + billing authorization check (`can_manage_billing`)
  - Accepts `{ quantity: number }` (new total seat count, minimum 10)
  - Calls `stripe.subscriptions.update()` with the new quantity and proration
  - Updates `entitlements.limits.users` in DB
  - Returns updated seat count

#### 6. Update checklist documentation
- Update `.lovable/prd/10-erp-connector-implementation.md` Phase 5 with seat management items marked as done

### Technical Details

```text
Enterprise billing flow:
  User subscribes → Stripe checkout (quantity=10) → webhook sets limits.users=10
  Org grows → Admin clicks "Add Seats" → update-seats function → Stripe quantity=15
  → webhook fires subscription.updated → limits.users updated to 15
  
ERP gate enforcement:
  erp-sync request → check entitlements.plan === 'enterprise' → proceed or 403
  ERPConnectorSettings → check plan !== 'enterprise' → show upgrade card
```

### Files to Create/Edit
| File | Action |
|------|--------|
| `supabase/functions/update-seats/index.ts` | Create — seat quantity management |
| `supabase/functions/erp-sync/index.ts` | Edit — add enterprise plan gate |
| `supabase/functions/create-checkout/index.ts` | Edit — pass quantity for enterprise |
| `supabase/functions/stripe-webhook/index.ts` | Edit — sync seat quantity to entitlements |
| `src/components/settings/ERPConnectorSettings.tsx` | Edit — enterprise-only gate |
| `src/components/settings/BillingSettings.tsx` | Edit — seat management UI + real usage counts |
| `src/hooks/useSubscription.ts` | Edit — add seat management functions |
| `.lovable/prd/10-erp-connector-implementation.md` | Edit — update Phase 5 checklist |


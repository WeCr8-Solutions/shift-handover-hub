

# JobLine.ai ↔ Stripe Integration Plan

## Current State Analysis

After analyzing your codebase, here's what already exists:

### What's Already Implemented
1. **Edge Functions**:
   - `create-checkout` - Creates Stripe checkout sessions for subscriptions
   - `check-subscription` - Verifies subscription status against Stripe
   - `customer-portal` - Opens Stripe billing portal for subscription management

2. **Frontend Hook** (`useSubscription.ts`):
   - Manages subscription state (tier, status, expiry)
   - Auto-refreshes every 60 seconds
   - Checkout and portal integration

3. **Pricing Page** (`Pricing.tsx`):
   - Displays 3 tiers: Single ($8.99), Team ($24.99), Enterprise ($49.99)
   - Checkout flow integrated
   - Subscription management button

4. **Database Schema (Partial)**:
   - `organizations` table has: `subscription_tier`, `subscription_status`, `billing_email`
   - `organization_members` table links users to orgs
   - Missing: dedicated `subscriptions` table and `entitlements` table

5. **Stripe Secret**: Already configured in environment

### What's Missing (Gap Analysis)

| Requirement | Status | Action Needed |
|-------------|--------|---------------|
| Dedicated subscriptions table | Missing | Create table |
| Entitlements table | Missing | Create table |
| Stripe webhook handler | Missing | Create edge function |
| Org-based billing (not user) | Partial | Update checkout to use org |
| stripe_customer_id on orgs | Missing | Add column |
| Subscription sync from webhooks | Missing | Implement webhook handler |
| Past due/canceled banners | Missing | Add UI components |
| Entitlement enforcement | Missing | Add access control |

---

## Implementation Plan

### Phase 1: Database Schema Updates

Create migration to add missing tables and columns:

```sql
-- Add stripe_customer_id to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create subscriptions table for local sync
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- trialing, active, past_due, canceled, unpaid
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  quantity INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create entitlements table for feature flags/limits
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  features JSONB DEFAULT '{}',  -- {"handoff_hub": true, "work_orders": true}
  limits JSONB DEFAULT '{}',    -- {"work_orders_per_month": 50, "users": 1}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stripe webhook events log (for idempotency & debugging)
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,  -- Stripe event ID
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Org members can view subscriptions" ON subscriptions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view entitlements" ON entitlements
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all" ON stripe_events
  FOR ALL USING (auth.role() = 'service_role');
```

### Phase 2: Stripe Webhook Edge Function

Create `supabase/functions/stripe-webhook/index.ts`:

Key events to handle:
- `checkout.session.completed` - Create subscription record
- `customer.subscription.created` - Sync subscription
- `customer.subscription.updated` - Update status, period, cancel_at_period_end
- `customer.subscription.deleted` - Mark canceled, update org to free
- `invoice.payment_succeeded` - Set billing_status = active
- `invoice.payment_failed` - Set billing_status = past_due

The webhook will:
1. Verify Stripe signature using `STRIPE_WEBHOOK_SECRET`
2. Check idempotency via `stripe_events` table
3. Update `organizations`, `subscriptions`, and `entitlements` tables
4. Return 200 immediately after processing

### Phase 3: Update Checkout Flow to Organization-Based

Modify `create-checkout` edge function:
1. Accept `org_id` parameter (optional, defaults to user's org)
2. Look up or create `stripe_customer_id` on organization
3. Store `org_id` in Stripe metadata for webhook correlation
4. Support quantity parameter for per-seat billing

### Phase 4: Update Subscription Hook

Enhance `useSubscription.ts`:
1. Read from local `subscriptions` table (not just Stripe API)
2. Fall back to Stripe API check if no local record
3. Add `pastDue`, `cancelAtPeriodEnd` states
4. Add entitlements loading for feature gating

### Phase 5: Entitlement Enforcement

Create `src/hooks/useEntitlements.ts`:
```typescript
// Returns current org's feature flags and limits
// getEntitlements() → { features: {...}, limits: {...} }
// canAccess('analytics') → boolean
// isWithinLimit('work_orders_per_month', currentCount) → boolean
```

Create `src/components/EntitlementGate.tsx`:
- Wrapper component that shows children only if entitled
- Shows upgrade prompt otherwise

### Phase 6: UI Enhancements

1. **Billing Status Banners** (`src/components/BillingBanner.tsx`):
   - Past due warning with "Update Payment" CTA
   - Cancellation pending notice with renewal date
   - Trial expiring reminder

2. **Upgrade CTAs**:
   - Add upgrade buttons when hitting limits
   - Show feature lock icons for gated features

3. **Dashboard Integration**:
   - Show subscription status in header/settings
   - Add billing section to Settings page

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/stripe-webhook/index.ts` | Handle Stripe webhook events |
| `src/hooks/useEntitlements.ts` | Feature gating & limits |
| `src/components/BillingBanner.tsx` | Payment status alerts |
| `src/components/EntitlementGate.tsx` | Feature access wrapper |

### Modified Files
| File | Changes |
|------|---------|
| `supabase/functions/create-checkout/index.ts` | Add org_id support, store customer on org |
| `supabase/functions/check-subscription/index.ts` | Read from local DB first |
| `src/hooks/useSubscription.ts` | Add pastDue, cancelAtPeriodEnd, entitlements |
| `src/pages/Pricing.tsx` | Show org billing status, annual toggle |
| `src/components/Header.tsx` | Show billing status indicator |
| `src/pages/Settings.tsx` | Add billing tab |
| `supabase/config.toml` | Add stripe-webhook function config |

### Database Migrations
- Add `stripe_customer_id` to organizations
- Create `subscriptions` table
- Create `entitlements` table
- Create `stripe_events` table
- RLS policies for all new tables

---

## Environment Configuration

A new secret is required:

| Secret | Purpose |
|--------|---------|
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures |

Stripe price IDs are already hardcoded in `useSubscription.ts`. For flexibility, these can be moved to environment variables later.

---

## Testing Checklist

1. Subscribe to Single plan via checkout → org.plan = single, status = active
2. Upgrade Single → Team → subscription updated, entitlements change
3. Downgrade Team → Single → takes effect at period end
4. Cancel subscription → cancel_at_period_end = true, access until expiry
5. Payment fails → past_due banner appears, portal link works
6. Fix payment → status returns to active
7. Check feature gates work (e.g., analytics blocked for lower tiers)
8. Check user limits enforced (e.g., team member count)

---

## Recommended Order of Implementation

1. **Database migration** (schema changes)
2. **Stripe webhook function** (enables sync)
3. **Update create-checkout** (org-based billing)
4. **Entitlements hook** (feature gating)
5. **Billing banner component** (status visibility)
6. **Settings billing tab** (centralized management)
7. **Feature gate components** (access control UI)
8. **Testing in Stripe test mode**

This plan bridges the gap between your current implementation and the full Stripe integration requirements, focusing on organization-based billing with proper webhook sync and entitlement enforcement.


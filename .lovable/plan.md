

# Free Trial Enforcement and Billing Access Control

## Current State

- Organizations are created with `subscription_status: 'trial'` and `subscription_tier: 'free'` by default
- **No trial end date** exists in the database -- there is no `trial_ends_at` column on `organizations`
- No enforcement anywhere: trial users can use the system indefinitely without paying
- Billing Settings tab is only visible to `isDeveloper` (platform developer role)
- `BillingBanner` only shows to developers
- Org admins/supervisors/operators cannot see billing info or be prompted to pay

## What Needs to Change

### 1. Database: Add `trial_ends_at` column to `organizations`

Add a `trial_ends_at` timestamp column defaulting to `now() + interval '14 days'`. Update the `auto_create_org_entitlements` trigger (or add a new trigger) to automatically set this on org creation.

### 2. Database: Add a `manage_free_subscriptions` check function

Create a `can_manage_billing(uuid, uuid)` function that returns true only for:
- Platform admins (`has_role(uid, 'admin')`)
- Platform developers (`has_role(uid, 'developer')`)
- Org owners (the person who created and owns the org)

This enforces the rule: only SDK admin/developers and the org owner can manage subscriptions. Regular org admins, supervisors, and operators cannot.

### 3. Frontend: Trial expiration awareness in `useSubscription` or a new `useTrialStatus` hook

Compute days remaining from `organization.trial_ends_at`. Expose `isTrialExpired`, `trialDaysRemaining`, and `isInTrial` flags.

### 4. Frontend: Show billing banner to org owners (not just developers)

Update `BillingBanner.tsx`:
- Show trial-expiring and trial-expired banners to **org owners** (not just developers)
- When trial is expired and no active subscription: show a blocking banner or redirect to pricing
- Developers still see all billing banners (for platform oversight)

### 5. Frontend: Trial paywall gate component

Create an `ExpiredTrialGate` component that wraps the main dashboard. When `isTrialExpired && !subscribed`:
- Show a full-page overlay/modal: "Your 14-day free trial has ended. Subscribe to continue using JobLine."
- Provide a "Choose a Plan" button linking to `/pricing`
- Allow org owners to manage billing; other roles see "Contact your organization admin"
- SDK admins/developers can bypass (they manage the platform)

### 6. Frontend: Billing tab visibility in Settings

Currently billing tab is restricted to `isDeveloper` only. Expand to also show for `isOrgOwner` so org owners can manage their own subscription. Keep it hidden from supervisors/operators.

### 7. Edge function: `create-checkout` -- add authorization check

Verify that the caller is either:
- The org owner
- A platform admin/developer

Reject checkout creation for supervisors/operators (they shouldn't initiate billing changes).

### 8. Stripe webhook: Handle `trial` → `expired` transition

When `trial_ends_at` passes and no active subscription exists, the system should transition `subscription_status` from `'trial'` to `'expired'`. Options:
- **Option A**: A scheduled database function (pg_cron) that runs daily, finds orgs past trial with no subscription, and sets status to `'expired'`
- **Option B**: Check trial expiration at read-time in the frontend hook (no DB write needed, just compute `isTrialExpired` from `trial_ends_at < now()`)

**Recommendation**: Option B for now (compute client-side from `trial_ends_at`), since pg_cron requires additional infrastructure. The status field remains `'trial'` but the UI enforces the gate. Optionally, the `check-subscription` edge function can also update the org status to `'expired'` when it detects the trial has lapsed.

## Files to Create/Modify

| File | Change |
|------|--------|
| **Migration** | Add `trial_ends_at` column to `organizations`, default `now() + interval '14 days'`, backfill existing orgs |
| `src/hooks/useTrialStatus.ts` | New hook: compute trial state from org's `trial_ends_at` |
| `src/components/ExpiredTrialGate.tsx` | New: paywall overlay when trial expired + no subscription |
| `src/components/BillingBanner.tsx` | Show trial-ending banners to org owners, not just developers |
| `src/pages/Settings.tsx` | Show Billing tab for org owners (not just developers) |
| `src/pages/Index.tsx` | Wrap dashboard with `ExpiredTrialGate` |
| `supabase/functions/create-checkout/index.ts` | Add org owner / platform admin authorization check |
| `supabase/functions/check-subscription/index.ts` | Optionally update org status to `expired` when trial lapsed |
| `src/hooks/useUserOrganization.ts` | Ensure `trial_ends_at` is fetched with organization data |

## Access Control Summary

```text
Who can see billing info:
  - Platform Admin ✓
  - SDK Developer ✓  
  - Org Owner ✓
  - Org Admin ✗
  - Supervisor ✗
  - Operator ✗

Who can initiate checkout / manage subscription:
  - Platform Admin ✓
  - SDK Developer ✓
  - Org Owner ✓
  - Everyone else ✗

Who can grant free subscriptions:
  - Platform Admin ✓
  - SDK Developer ✓
  - Everyone else ✗ (must pay via Stripe)

Who is blocked by expired trial:
  - All org members (unless org has active subscription)
  - Platform Admin/Developer: bypass (platform oversight)
```


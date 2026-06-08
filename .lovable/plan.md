# Admin: Concierge vs Onboarding distinction + customer assist views

## Problem
Today `/admin` → **Onboarding** tab only shows `onboarding_engagements` (paid concierge customers). There's no way to see:
- Self-serve orgs that signed up and are working through their own checklist
- A unified "all customers" launchpad to jump into any account and help with setup
- Which engagement is concierge-paid vs free trial vs complimentary

The two flows are genuinely different and need to live side-by-side, not be conflated.

## What you'll see in the admin dashboard after this

Rename the existing **Onboarding** tab to **Customer Success** with three sub-tabs:

```text
/admin → Customer Success
  ├── Customers          ← NEW launchpad: every org, filter by status, jump in
  ├── Concierge          ← existing EngagementsList (paid setup engagements)
  └── Self-Serve Setup   ← NEW: orgs without an engagement, with their progress
```

### 1. Customers (launchpad)
Single table of every organization with columns:
- Org name + ITAR badge
- **Setup path**: `Concierge` / `Self-serve` / `Complimentary` (derived)
- Subscription status + tier
- Setup progress % (from engagement OR from `user_onboarding`/readiness)
- Owner email
- Last activity
- Actions: **Assist setup** (opens the right detail view), **Act-as** (existing impersonation), **Open billing**

Filters: setup path, status, ITAR, has-blockers, no-activity-7d.

### 2. Concierge (unchanged)
Existing `EngagementsList` + `EngagementDetail`. Just relabeled and scoped to engagements where `purchased_via in ('stripe','offline')` or `payment_status='paid'`.

Add a small header KPI strip: # active engagements, # awaiting payment, # awaiting contract, # ready to activate, MRR-equivalent.

### 3. Self-Serve Setup (NEW)
For orgs that signed up without buying concierge. Shows:
- Org + owner
- Welcome modal completed? (from `user_onboarding`)
- Checklist completion % (derived from same `useProductionReadiness` hook the concierge panel already uses against the org)
- Trial days remaining
- Blockers list (no equipment, no stations, no users invited, no routing, etc.)
- Action: **Open assist drawer** — re-uses `ReadinessPanel` + a lightweight version of the checklist modules so an admin can fill gaps for the customer without converting them to a paid engagement
- Action: **Convert to concierge** — creates an `onboarding_engagements` row pre-populated for the org (uses existing `NewEngagementDialog` with org pre-selected)

## Technical sketch

**New files**
- `src/components/admin/customer-success/CustomerSuccessPanel.tsx` — top-level with the 3 sub-tabs; replaces direct render of `EngagementsList` in `OnboardingServicesPanel`
- `src/components/admin/customer-success/CustomersLaunchpad.tsx` — unified org table
- `src/components/admin/customer-success/SelfServeList.tsx` — orgs without engagements
- `src/components/admin/customer-success/SelfServeAssistDrawer.tsx` — wraps `ReadinessPanel` + reusable readiness gaps; "Convert to concierge" button
- `src/components/admin/customer-success/ConciergeKpiStrip.tsx` — small KPI cards above existing list
- `src/hooks/useAdminCustomers.ts` — joins `organizations` + `onboarding_engagements` + `user_onboarding` + `subscriptions` into one row per org; classifies setup_path

**Edited**
- `src/components/admin/onboarding/OnboardingServicesPanel.tsx` — render `CustomerSuccessPanel` instead of `EngagementsList`
- `src/pages/Admin.tsx` — rename the "Onboarding" tab label to "Customer Success" (route key unchanged so deep links still work)

**Data**
No schema changes. All needed tables already exist: `organizations`, `onboarding_engagements`, `user_onboarding`, `subscriptions`, `organization_members`. Platform-admin RLS already grants global SELECT.

**Setup-path derivation (in the hook)**
- engagement exists AND `payment_status in ('paid','waived')` → `Concierge`
- engagement exists AND `payment_status='pending'` → `Concierge (unpaid)`
- no engagement AND `subscription_status='complimentary'` → `Complimentary`
- otherwise → `Self-serve`

**Access**
Platform-admin + developer only — same gate as today's `OnboardingServicesPanel`.

## Out of scope
- No changes to the customer-facing concierge flow, intake wizard, billing tab, or splash screens
- No DB migrations
- No changes to Aymar Engineering's existing engagement record

## How to verify
1. `/admin` → tab now reads **Customer Success**
2. **Customers** sub-tab lists Aymar Engineering as `Concierge` and any other test orgs as `Self-serve` / `Complimentary`
3. Click **Assist setup** on a self-serve org → drawer opens with readiness gaps; **Convert to concierge** creates an engagement and jumps to existing `EngagementDetail`
4. **Concierge** sub-tab still shows the existing engagements table with the new KPI strip on top
5. Deep link `/admin/concierge/reporting` still works

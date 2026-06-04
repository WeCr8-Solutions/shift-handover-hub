# Finalize Concierge Service — Wiring & Final Audit

The schema, RPCs, storage bucket, Stripe webhook, `PaymentPanel`, and `ConciergeSalesPack` exist but are not wired in. This plan closes the remaining gaps so a salesperson can run a full paper flow end-to-end, and a customer can transition cleanly to production.

## 1. Route the printable sales pack
- Add `/admin/concierge/print/:engagementId` route in `src/App.tsx`, lazy-loading `ConciergeSalesPack`.
- Render outside the dashboard chrome (no nav, no `ConciergeInProgressSplash` wrap) so `window.print()` produces clean pages.
- Guard with platform-admin check; redirect non-admins to `/admin`.

## 2. Wire `PaymentPanel` + "Print sales pack" into `EngagementDetail`
- Add `PaymentPanel` above `ReadinessPanel` so payment/contract state is visible before readiness.
- Add a header action group: **Print sales pack** (opens `/admin/concierge/print/:id` in new tab) and **New offline engagement** (already exists in `OnboardingServicesPanel`, leave it there).
- Disable the **Mark ready** / **Activate** buttons with tooltip text when `payment_status ∉ ('paid','waived')` or (non-stripe AND `contract_signed_at IS NULL`), mirroring the RPC gate so admins see *why* before they click.

## 3. Surface payment/contract gating in `ReadinessPanel`
- Extend `useProductionReadiness` consumer to also read `payment_status`, `payment_method`, `contract_signed_at`, `purchased_via` from the engagement (passed in as a prop, no new query).
- Add two tiles: **Payment** (paid / invoiced / unpaid / waived) and **Signed contract** (on file / required / N/A for Stripe).
- Add these as blockers in the on-screen list when missing.

## 4. Marketing: secondary "Pay by check / Talk to sales" path
- In `ConciergeCTA` (all three variants), add a small secondary link under the primary button: *"Prefer to pay by check or talk to a human? Contact sales →"* linking to `/concierge/sales`.
- Create `src/pages/ConciergeSales.tsx` — short landing with: what's included, accepted offline payment methods (check, ACH, wire, PO), and a lead-capture form that writes to `email_leads` with `source='concierge_sales'` and includes company, contact name, phone, estimated shop size, ITAR posture. Add route in `App.tsx`.

## 5. Onboarding → production transition UX
- `ConciergeInProgressSplash` already gates customer login during setup. Add two states it doesn't yet handle:
  - **Awaiting payment** (offline engagement, unpaid) → show "Your concierge setup is reserved. We'll begin once payment clears. Questions? sales@jobline.ai"
  - **Awaiting signed contract** → show "We're waiting on your signed agreement. A sales rep will follow up."
- On successful `activate_org_for_production`, fire the existing welcome email + show a one-time "Welcome to production" toast on first login (flag in `user_onboarding`).

## 6. Final audit checklist (verification, no code)
Run through these manually before declaring production-ready:

1. **Stripe path**: purchase → webhook stamps `payment_status='paid'`, `payment_method='stripe'`, `payment_received_at` → engagement appears in admin → checklist completes → ReadinessPanel green → Activate succeeds → customer logs in.
2. **Offline path**: create offline engagement → print sales pack (11 pages render cleanly, no clipped text) → record check payment with proof upload → record signed contract with proof upload → checklist completes → Activate succeeds.
3. **Negative gates**:
   - Unpaid offline engagement → Mark ready blocked, button disabled with tooltip, RPC also rejects.
   - Paid but no signed contract (non-stripe) → Activate blocked.
   - ITAR org → `erp_persistence_mode` forced to `read_through`, US-Person declaration required tile shows.
4. **RLS / multi-tenant**:
   - Non-platform-admin cannot hit `/admin/concierge/print/:id`.
   - Org admins can only read their own `concierge-contracts/<orgId>/` storage paths.
   - `record_concierge_payment` / `record_concierge_contract_signature` reject non-platform-admin callers.
5. **Audit trail**: each payment + contract action writes an `admin_audit_events` row tying actor → org → engagement → amount → method.
6. **Marketing CTAs**: `ConciergeCTA` renders on `/pricing` (banner) and any other surface that imports it; secondary sales link routes to `/concierge/sales`; lead form writes to `email_leads`.
7. **Print QA**: open the sales pack in Chrome print preview at Letter size — confirm MSA fits, signature blocks aren't split across pages, ITAR declaration is on its own page, worksheets have enough blank rows.
8. **Mobile**: `PaymentPanel` and `ReadinessPanel` stack cleanly at 360px; sales pack route is desktop-only (add a print-only banner advising desktop).

## Files touched

**New**
- `src/pages/ConciergeSales.tsx`

**Edited**
- `src/App.tsx` — add `/admin/concierge/print/:engagementId` and `/concierge/sales` routes
- `src/components/admin/onboarding/EngagementDetail.tsx` — mount `PaymentPanel`, add Print button, tooltip-disable gated actions
- `src/components/admin/onboarding/ReadinessPanel.tsx` — accept engagement, render payment + contract tiles, extend blockers
- `src/components/marketing/ConciergeCTA.tsx` — secondary "Contact sales" link in all three variants
- `src/components/onboarding/ConciergeInProgressSplash.tsx` — awaiting-payment / awaiting-contract states

## Out of scope
- E-signature integration (paper wet signature only)
- Accounting-system export (QuickBooks etc.)
- Customer-facing self-serve invoice PDF generator
- Refund flow (handled manually via Stripe dashboard for now)

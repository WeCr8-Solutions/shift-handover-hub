## Goal
Allow JobLine sales to close concierge engagements in person — print a contract + intake pack, accept payment by check, credit card, ACH/wire, or other, and ensure the org cannot enter production until that payment is recorded as **paid**.

## What's missing today
- `onboarding_engagements` only knows about Stripe payment intents (`purchased_via` in `stripe|manual|complimentary`, plus `stripe_payment_intent_id`). There's no payment-state field, no amount, no method, no proof-of-payment artifact.
- `mark_engagement_ready` / `activate_org_for_production` gate on readiness checklist + production readiness RPC but do **not** require payment-paid.
- There's no printable contract/intake packet. `ConciergeCTA` and `OnboardingService` only route through Stripe Checkout.
- No sales-facing "create offline engagement" workflow for platform admins.

## Deliverables

### 1. Schema additions (single migration)
Add to `onboarding_engagements`:
- `payment_status text not null default 'unpaid'` — `unpaid | invoiced | paid | refunded | waived`
- `payment_method text` — `stripe | check | credit_card_offline | ach | wire | other | complimentary`
- `payment_reference text` — check #, auth code, wire confirmation, PO #
- `payment_amount_cents int` (default 150000)
- `payment_received_at timestamptz`
- `payment_recorded_by uuid references auth.users(id)`
- `payment_proof_path text` — Supabase Storage path to scanned check / receipt / signed contract
- `contract_signed_at timestamptz`, `contract_signer_name text`, `contract_signer_title text`
- `sales_rep_id uuid references auth.users(id)` — internal owner

Backfill existing Stripe rows: `payment_status='paid'`, `payment_method='stripe'`, `payment_received_at=created_at`.

Stripe webhook sets the same fields when `concierge_onboarding` checkout completes.

### 2. New RPCs (SECURITY DEFINER, search_path=public, platform-admin only)
- `create_offline_concierge_engagement(p_org_id, p_plan_tier, p_sales_rep_id, p_notes)` — seeds engagement in `intake` with `purchased_via='manual'`, `payment_status='unpaid'`. Calls `seed_onboarding_checklist`. Logs to `admin_audit_events`.
- `record_concierge_payment(p_engagement_id, p_method, p_reference, p_amount_cents, p_received_at, p_proof_path)` — flips `payment_status='paid'`, stores method/reference/proof, writes audit row. Rejects unknown methods.
- `record_concierge_contract_signature(p_engagement_id, p_signer_name, p_signer_title, p_signed_at)` — stamps signed-contract metadata + audit row.

### 3. Gate production on payment
Update `mark_engagement_ready` and `activate_org_for_production`:
- Refuse if `payment_status <> 'paid'` (allow `complimentary` for platform-admin grants).
- Refuse activation if `contract_signed_at is null` (require signed contract on file).
- Existing readiness/blockers checks remain.

`ConciergeInProgressSplash` already blocks ops; no client change needed for the hard gate — UI just needs to show a "Payment required" reason when applicable.

### 4. Storage
New private bucket `concierge-contracts` (org-admin + platform-admin read on rows where `engagement.organization_id = their org`; platform-admin write). Stores signed contracts, scanned checks, wire receipts.

### 5. Printable Concierge Sales Pack
New route `/admin/concierge/print/:engagementId?` (platform-admin only) that renders a print-optimized, single-page-per-section document with these sections, each on its own page (`@media print { page-break-after: always }`):

1. **Cover** — JobLine logo, org name, sales rep, date, plan tier, $1,500.
2. **Master Services Agreement** — concierge SOW: scope, deliverables (equipment/users/routing/ERP/OAP/ITAR/walkthrough), $1,500 fee, payment terms (NET 0 — production access blocked until paid), data handling (ITAR posture acknowledgment), confidentiality, term/termination, signature block (customer name/title/date + JobLine rep).
3. **Payment instructions** — Stripe link (QR to `/onboarding-service`), check payable to "JobLine AI, Inc." with mailing address, ACH/wire routing placeholder, "Other / PO" line. Reminder that production is gated.
4. **ITAR / US-Person declaration** — checkbox + signature (mirrors existing in-app gate).
5. **Equipment intake worksheet** — table to write equipment name, make, model, serial, controller, work-center type (matches `equipment` columns the bulk-importer accepts).
6. **Stations & departments worksheet** — same for `stations` (with department name column).
7. **Users & roles worksheet** — name, email, role (admin/supervisor/operator), shift, primary station.
8. **Routing templates worksheet** — template name + ordered step list with operation type + standard hours.
9. **Quality / inspection notes** — free-form.
10. **ERP integration questionnaire** — JobBOSS / SAP / Native, persistence mode (read-through forced for ITAR).
11. **Go-live checklist** — mirrors the 10 in-app checklist modules so the sales rep can tick alongside the customer.

Implementation: React component using existing print CSS pattern (`window.print()`), no PDF library — the browser handles PDF export. Each worksheet table renders blank rows the salesman can hand-fill, plus a footer note "Return completed sheets to onboarding@jobline.ai or upload via the Concierge workspace."

### 6. Admin UI additions (inside existing `OnboardingServicesPanel` / `EngagementDetail`)
- **"New offline engagement"** button beside existing list → modal: org picker (existing orgs), plan tier, sales rep (defaults to current user), notes. Calls `create_offline_concierge_engagement`. Auto-opens print view on success.
- **"Print sales pack"** button on every engagement detail → opens `/admin/concierge/print/:id` in a new tab.
- **Payment panel** on `EngagementDetail`:
  - Status badge (unpaid / invoiced / paid / waived).
  - "Record payment" form: method dropdown (check/credit/ACH/wire/other), reference field, amount (default $1,500), received date, file upload → `concierge-contracts/{orgId}/{engagementId}/payment-proof-...`.
  - "Record signed contract" form: signer name, title, signed date, upload signed PDF.
  - On save → corresponding RPC; rows appear in `admin_audit_events`.
- **Readiness panel** already exists — extend to surface "Payment outstanding" and "Contract not on file" as blockers alongside the data-readiness ones.

### 7. Marketing surface
- Add a secondary CTA on `ConciergeCTA` (banner + card variants) labeled "Prefer to pay by check or talk to a human?" linking to a new `/concierge/sales` landing page that briefly explains the offline path and exposes a "Request a sales contact" form (writes to existing `email_leads` table with `source='concierge_sales'`).
- Pricing page banner unchanged; the new CTA appears beside the Stripe button.

### 8. End-to-end verification
- Manual flow: create offline engagement → print pack → record check payment + signed contract → fill checklist → readiness green → activation succeeds.
- Negative tests: try to `mark_engagement_ready` with `payment_status='unpaid'` → expect failure; try `activate_org_for_production` without signed contract → expect failure.
- Stripe flow regression: webhook still flips `payment_status='paid'` and `payment_method='stripe'`; activation continues to work.
- Splash gate: org with `concierge_intake` + unpaid still blocks operators; admin sees clear "payment required" messaging.

## Technical notes (for engineering review)
- All new RPCs `SECURITY DEFINER SET search_path = public`; `REVOKE ALL FROM PUBLIC` + explicit grants. Payment/contract RPCs grant to `authenticated` but gate inside on `has_role('admin') OR has_role('developer')` (platform admins only — not org admins, since this is a sales-side action).
- Storage RLS on `concierge-contracts`: platform admin full access; org admins read-only for objects under their `orgId/` prefix.
- Stripe webhook updates: in the existing `productType === 'concierge_onboarding'` branch, also set `payment_status='paid'`, `payment_method='stripe'`, `payment_amount_cents=session.amount_total`, `payment_received_at=now()` on the engagement row.
- No changes to `ConciergeCTA` payment logic; only adds the "talk to sales" secondary CTA.
- Print view uses Tailwind `print:` utilities; no new dependency.

## Out of scope
- No e-signature integration (DocuSign etc.) — wet signature on the printed contract is acceptable for v1.
- No accounting-system push (QuickBooks invoice creation) — sales records the payment manually after deposit.
- No customer-facing invoice generator — `/concierge/sales` lead form is the only customer touchpoint for the offline path in v1.
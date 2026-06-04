## Concierge Gap Closure Plan

User confirmed e-signature stays **paper wet-signature only** (no DocuSign etc.). Focus is on tightening the paper workflow, adding accounting export, customer-facing invoice PDF, refund flow, and a few related gaps surfaced during review.

---

### 1. Wet-signature workflow hardening (no e-sig integration)

Reinforce the existing `contract_proof_path` + `contract_signed_at` flow.

- `ConciergeSalesPack.tsx`: add a clearly labeled **"Wet Signature Required"** banner on the MSA cover page, signature/initial blocks on every page footer, a 2-party signature page (Customer + Jobline rep) with printed name / title / date / witness lines, and a "Contract ID: {engagementId}" + barcode/QR linking back to `/admin/concierge/engagements/:id` so the scanned PDF is traceable.
- `PaymentPanel.tsx` → split into `PaymentPanel` + new `ContractPanel` (cleaner UX): upload scanned signed MSA, capture signer name/title/date, optional witness, validation that file is PDF/image, preview thumbnail.
- New RPC `void_concierge_contract(engagement_id, reason)` for cases where a wrong PDF was uploaded — clears `contract_signed_at`, `contract_signer_*`, `contract_proof_path`, writes `admin_audit_events`.

### 2. Accounting-system export (QuickBooks / generic)

New admin tab **Accounting Export** on the concierge engagement detail page.

- Edge function `concierge-accounting-export` (admin-only, JWT verified) that returns:
  - **QuickBooks IIF** format (`.iif`) — works with QB Desktop import.
  - **QuickBooks Online–compatible CSV** (matches QBO's "Import invoices" template columns: InvoiceNo, Customer, InvoiceDate, DueDate, Item, Description, Qty, Rate, Amount, Tax, ServiceDate, Memo).
  - Generic CSV (xero/wave/freshbooks friendly).
- Export modes: **single engagement** or **date-range batch** (all paid engagements in window).
- Writes `admin_audit_events` row per export (who, when, format, count, hash).
- UI: `AccountingExportPanel.tsx` with format dropdown, date range, download buttons, and "last exported at" indicator per engagement (new column `exported_to_accounting_at timestamptz` on `onboarding_engagements`).

### 3. Customer-facing self-serve invoice PDF

- Route: `/billing/concierge/invoice/:engagementId` (org-admin / billing role gated by RLS on engagement).
- Component: `ConciergeInvoicePdf.tsx` — printable single-page invoice (Jobline header, bill-to org snapshot, line item: "Concierge Onboarding – {plan_tier}", amount, payment status badge, payment method, payment received date, contract status, "Paid" watermark when applicable, remittance instructions when unpaid).
- Uses browser `window.print()` + print CSS (matches existing `ConciergeSalesPack` pattern — no server PDF lib).
- Stripe purchases: link to Stripe-hosted receipt URL (already in `billing_events`).
- Offline purchases: render the printable invoice with computed invoice number `INV-{YYYYMM}-{shortId}`.
- Surfaced in:
  - `EngagementDetail` admin view ("Download invoice" button).
  - Org settings → Billing tab → "Concierge invoices" list.
  - `ConciergeInProgressSplash` (when `payment_status='invoiced'` or `'unpaid'` for offline) → "View / print invoice" CTA.

### 4. Refund flow (manual via Stripe dashboard, tracked in app)

- New RPC `record_concierge_refund(engagement_id, amount_cents, reason, stripe_refund_id?, refund_method, proof_path?)`:
  - Sets `payment_status='refunded'`, stamps `refunded_at`, `refunded_by`, `refund_amount_cents`, `refund_reason`, `refund_method`, `refund_reference`.
  - Writes `admin_audit_events`.
  - Auto-transitions engagement `status='cancelled'` if refund is full; logs partial otherwise.
  - Deactivates org production access via existing `deactivate_org_for_production` helper when full refund + status=live.
- Schema additions on `onboarding_engagements`: `refunded_at`, `refunded_by`, `refund_amount_cents`, `refund_reason`, `refund_method` (check, ach, stripe, wire, other), `refund_reference`, `refund_proof_path`.
- Update `stripe-webhook` to handle `charge.refunded` and `refund.created` events → call `record_concierge_refund` automatically with `refund_method='stripe'` and the Stripe refund ID.
- UI: `RefundPanel.tsx` mounted in admin `EngagementDetail` (platform admin only). Records manual refunds (check sent back, ACH return) with proof upload to existing `concierge-contracts` bucket under `refunds/{engagementId}/`.
- `ReadinessPanel` + `ConciergeInProgressSplash`: surface "Refunded — concierge access revoked" state.

### 5. Additional gaps surfaced during review

a. **Receipt email automation**
   - `send-concierge-receipt` edge function (Resend) triggered on `payment_status → paid` (DB trigger NOTIFY or webhook). Sends PDF-print-friendly HTML receipt to org primary contact + sales rep.

b. **Sales rep attribution & commission tracking**
   - Surface `sales_rep_id` in `EngagementsList` with filter ("My engagements" for sales reps).
   - New view `concierge_sales_performance` (per rep: count, GMV, paid vs outstanding, refund rate) for platform admin reporting at `/admin/concierge/reporting`.

c. **Tax / W-9 capture**
   - Add `customer_tax_id`, `customer_billing_address` JSONB to engagement (needed for invoices & QuickBooks export).
   - Capture on `ConciergeSales` lead form and offline-engagement creation.

d. **Dunning / aging**
   - `concierge_payment_aging` view (engagements with `payment_status IN ('unpaid','invoiced')` and age buckets 0-30/31-60/61-90/90+).
   - `/admin/concierge/aging` page for collections.
   - Optional weekly digest email to platform admins (cron edge function — opt-in, off by default).

e. **Engagement audit timeline**
   - New `ConciergeAuditTimeline.tsx` on `EngagementDetail` reading `admin_audit_events` filtered by `entity_type='onboarding_engagement'`. All RPCs above must write audit rows consistently — verify and backfill missing.

f. **Org-admin self-serve concierge tab**
   - `/settings/billing/concierge` page showing engagement status, payment status, downloadable invoice + receipt, signed contract download (RLS-restricted), refund history. Read-only for org admins; no admin actions exposed.

### 6. End-to-end audit checklist (manual, post-build)

Run each scenario in dev and confirm UI + DB + audit-log state:

1. **Stripe happy path**: purchase → webhook stamps paid + receipt email fires → invoice PDF renders "Paid" → Readiness green → Activate → org goes live → accounting export contains row.
2. **Offline happy path**: sales rep creates offline engagement (captures tax ID/address) → prints sales pack with sig blocks → records check payment + uploads scan → uploads signed MSA → Activate succeeds → invoice PDF available to org admin → accounting export available.
3. **Negative gates**: unpaid offline blocks Mark Ready (tooltip); paid but no signed contract blocks Activate (tooltip); contract voided removes Activate access.
4. **Refund — Stripe**: trigger refund in Stripe dashboard → webhook fires → engagement flips to refunded + cancelled + org deactivated + audit row written.
5. **Refund — offline**: admin records refund check → same end state → proof stored under `concierge-contracts/refunds/`.
6. **Accounting export**: single + date-range exports for QBO CSV, QB IIF, generic CSV all parse and total correctly; `exported_to_accounting_at` updates.
7. **Self-serve invoice**: org admin can view own invoice; cannot view another org's; unauthenticated cannot view.
8. **RLS sweep**: `concierge-contracts` bucket — org admin can read own `payments/`, `contracts/`, `refunds/` paths only; non-admin org members blocked.
9. **Audit completeness**: every state-changing RPC writes exactly one `admin_audit_events` row; timeline renders chronologically.
10. **ITAR sanity**: confirm none of the new exports / invoices leak controlled tech data; PDFs contain only commercial billing info.

---

### Technical details

**New / modified files**
- DB migration: add refund + accounting + tax-id columns to `onboarding_engagements`; new RPCs `record_concierge_refund`, `void_concierge_contract`; views `concierge_sales_performance`, `concierge_payment_aging`; storage policy update for `concierge-contracts/refunds/`.
- Edge functions: `concierge-accounting-export` (new), `send-concierge-receipt` (new), `stripe-webhook` (handle refund events).
- Components: `ContractPanel.tsx`, `AccountingExportPanel.tsx`, `RefundPanel.tsx`, `ConciergeInvoicePdf.tsx`, `ConciergeAuditTimeline.tsx`, org-admin `ConciergeBillingTab.tsx`.
- Pages: `/billing/concierge/invoice/:engagementId`, `/admin/concierge/reporting`, `/admin/concierge/aging`, `/settings/billing/concierge`.
- Updates: `EngagementDetail.tsx`, `EngagementsList.tsx`, `ConciergeSalesPack.tsx`, `ConciergeSales.tsx`, `ConciergeInProgressSplash.tsx`, `ReadinessPanel.tsx`, `useOnboardingEngagements.ts`.
- Memory: update `mem://features/concierge/service-and-sales-flow` with refund + accounting + invoice surfaces.

**Explicitly out of scope** (per user)
- Any e-signature SaaS integration (DocuSign, HelloSign, Adobe Sign). Wet signature only.
- Automatic refund processing from inside the app (refunds initiated in Stripe dashboard or recorded manually).
- Direct QuickBooks API push (file export only).

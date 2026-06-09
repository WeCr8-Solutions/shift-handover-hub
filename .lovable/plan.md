# Plan — Concierge wrap-up + portable profiles + pricing refactor

Five tightly scoped workstreams. All edits respect existing finalization lock (no edits after seal) and multi-tenant RLS.

## 1. Editable Concierge Document Library + cost arrangement re-pricing

**Goal:** After a doc is generated/uploaded, allow the rep to edit the captured "needs" and adjust scope/cost without losing the prior signed/finalized version.

- **DB migration** `concierge_document_records`:
  - `engagement_id`, `document_key`, `version` (int), `format`, `storage_path` (Supabase Storage `concierge-docs/<org>/<engagement>/<doc>-v{n}.<ext>`), `needs_snapshot` jsonb, `cost_snapshot` jsonb, `is_master` bool, `created_by`, `created_at`, `superseded_at`.
  - RLS: org admins + assigned concierge rep can read/write; finalized masters are immutable (trigger blocks update when `is_master=true`).
  - GRANTs to `authenticated` + `service_role`.
  - New private storage bucket `concierge-docs` with org-scoped path RLS.
- **`DocumentLibrary.tsx`**:
  - "Save to record" button per doc → uploads the rendered blob + a `needs_snapshot` (pulled from `EditableField` localStorage by `engagementId`) + `cost_snapshot` (current tier/seats/add-ons from `useSubscription` + `subscriptionTiers.ts`).
  - "Versions" drawer listing prior records (download / preview / mark as master).
  - "Edit needs & re-price" panel: inline `EditableField`s for scope notes + a small `CostEstimator` component that recomputes monthly/annual totals from tier + seat count + ERP add-on + concierge fee. Save creates a new version (v+1), keeps prior version read-only.
- **`CostEstimator.tsx`** (new): pure-function pricing from `subscriptionTiers.ts` + inputs (tier, seats, addons, one-time fees). No Stripe writes — quote only; rep can later push to Stripe via existing flow.

## 2. Finalization: propagate `readOnly={isFinalized}` + gate Email/Export

- Pass `readOnly={isFinalized}` to **every** `SignaturePad` and remaining `EditableField` in `ConciergeSalesPack.tsx` (MSA customer, MSA Jobline rep, ITAR, Go-Live, final, page-907 signer — currently missing the prop).
- `SignaturePad`: when `readOnly` is true + a sealed signature exists, render the saved image only (no clear / re-sign controls). Already partially supported — verify and lock.
- `ConciergeFinalizeBar.tsx`: add **Email** and **Export PDF** buttons next to Print. Both disabled until `isFinalized`. Same tooltip.
  - **Export PDF**: `window.print()` to PDF (existing pattern) — or reuse `documentRegistry` renderer for the master snapshot.
  - **Email**: invokes new edge function below.

## 3. Email send template for finalized pack

- New edge function `send-concierge-pack` (auth-gated, org-admin or assigned rep only):
  - Input: `engagementId`, optional `toOverride` (billing email).
  - Loads `concierge_pack_finalizations` master snapshot + latest `concierge_document_records` for the engagement; refuses if not finalized.
  - Sends via existing `send-transactional-email` infra with a new template `concierge-finalized-pack.tsx` in `_shared/transactional-email-templates/`:
    - Subject: "Your Jobline Concierge package — sealed copy"
    - Body: org name, tier summary, signer names, sealed-on date, secure download link to each doc (signed URL, 7-day expiry).
  - Registry update in `registry.ts`.
- Toast + audit row appended to `onboarding_engagements.notes` on send.

## 4. Portable talent profile + secure org join / re-join

**Goal:** A manufacturing pro keeps their `operator_profiles` row across orgs; when they leave one shop they can join another without losing GCA/OAP credentials. Employer-side data stays org-scoped.

- **QR invite hardening** (existing `organization_invites`):
  - Confirm `redeem_invite` RPC writes `organization_members(org_id, user_id, role)` to the **invite's** org (not the user's previously-active org). Add server-side assertion + audit row in `invite_redemptions`.
  - On redeem, do **not** delete prior `organization_members` rows — user can belong to multiple orgs over time; `useOrganization` already handles active-org switching.
- **Leave org flow** (`/settings/team` for the user):
  - "Leave organization" button → RPC `leave_organization(org_id)` removes the membership row, clears that org from `user_org_preferences.active_org_id` if matched, but **preserves** `operator_profiles`, GCA attempts, OAP credentials (already user-scoped, not org-scoped).
  - Employer-only data (job_performance_updates, handoff_records, queue_items) stays with the org per existing RLS — user can no longer read it after leaving. Confirmed by current policies.
- **Secure activation link fallback** (email never arrived):
  - New RPC `request_activation_link(email)` → generates a single-use token row in `oap_transfer_tokens`-style table (`account_activation_tokens`: `token_hash`, `email`, `expires_at` 24h, `used_at`).
  - Edge function `request-activation-link` (public, rate-limited 3/hr/IP via `email_rate_limits`) sends a transactional email with `/activate?token=...`.
  - `/activate` page validates token via RPC `consume_activation_token(token)` → returns the auth user + redirects to set-password / sign-in. No PII exposed in the URL.
  - Admin button "Resend activation link" on org member list invokes the same function for a specific invited member.

## 5. `/pricing` refactor to `<TierCard>`

- Replace the inline tier grid in `src/pages/Pricing.tsx` with `<TierCard tier={t} />` mapped from `TIERS` (from `subscriptionTiers.ts`).
- Keep current CTA logic (`handleSubscribe`, `currentTier`, "Current plan" badge) by passing it down as props (`ctaLabel`, `onCtaClick`, `highlighted`, `disabled`).
- Add ERP add-on row underneath using the same `TierCard` variant or a dedicated `<AddonCard>`.
- Verify `/pricing`, Sales Pack tier-comparison page, and printable sheets all render identical cards from the same markdown source.

## Technical notes

- New tables → migration with `CREATE TABLE` + `GRANT` + RLS + policies (per project rules).
- Storage bucket `concierge-docs` is **private**; downloads use signed URLs only.
- ITAR orgs: concierge email links use signed URLs with short TTL; no doc content embedded in the email body.
- All new RPCs `SECURITY DEFINER` with `SET search_path = public`.
- No changes to `useSubscription` public API; pricing data already flows from `subscription-tiers.md`.

## Files

**Create**
- `supabase/migrations/<ts>_concierge_doc_records_and_activation.sql`
- `src/components/admin/concierge/CostEstimator.tsx`
- `src/components/admin/concierge/DocumentVersionsDrawer.tsx`
- `src/hooks/useConciergeDocumentRecords.ts`
- `src/hooks/useAccountActivation.ts`
- `src/pages/Activate.tsx` + route entry
- `supabase/functions/send-concierge-pack/index.ts`
- `supabase/functions/request-activation-link/index.ts`
- `supabase/functions/_shared/transactional-email-templates/concierge-finalized-pack.tsx`

**Edit**
- `src/components/admin/concierge/DocumentLibrary.tsx` (save versions, edit needs, re-price)
- `src/components/admin/concierge/ConciergeFinalizeBar.tsx` (Email + Export buttons)
- `src/components/admin/concierge/SignaturePad.tsx` (strict readOnly lock)
- `src/pages/ConciergeSalesPack.tsx` (propagate `readOnly={isFinalized}` everywhere)
- `src/pages/Pricing.tsx` (use `<TierCard>`)
- `src/components/marketing/TierCard.tsx` (CTA props)
- `supabase/functions/_shared/transactional-email-templates/registry.ts`
- `src/App.tsx` (add `/activate` route)
- `src/pages/settings/Team*.tsx` (Leave org + Resend activation buttons)

## Acceptance

- Doc can be edited & saved with new version after generation; prior masters remain immutable.
- Re-pricing reflects in the Cost Estimator and is captured in the new version snapshot.
- Email/Export only enabled after Finalize; email contains signed download links.
- Every signature / editable field on the sales pack locks after seal.
- User can leave Org A and accept Org B's QR invite — their operator profile/credentials persist; Org A data is inaccessible.
- A user who never received the activation email can request a fresh secure link, valid 24h, single-use.
- `/pricing`, Sales Pack tier page, and printable sheets all render the same `<TierCard>` from `subscription-tiers.md`.
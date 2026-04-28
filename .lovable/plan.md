# Plan: OG Image Fix + Certificate Paywall + Employer Console Expansion

Three independent workstreams. Each can ship on its own.

---

## 1. OG image constraints (mobile + desktop, social previews)

**Problem.** Current files are wrong aspect for OG (`og:image` spec is **1200×630, 1.91:1**):

| File | Actual | Used as |
|---|---|---|
| `public/oap-og.jpg` | 1024×1024 (square) | OG tag + inline hero `<img>` |
| `public/profile-og.jpg` | 1024×1024 (square) | OG tag |
| `public/talent-og.jpg` | 1024×1024 (square) | OG tag |
| `public/gcode-academy-og.jpg` | 1920×1080 (16:9) | OG tag + inline hero `<img>` |
| `public/og-image.png` | 1344×768 | Default OG |

Square images get cropped/letterboxed in iMessage, Facebook, LinkedIn. The hero `<img src="/oap-og.jpg">` on `/resources/oap` and `/resources/gcode-academy` also stretches awkwardly on mobile because it's used as a wide hero panel.

**Fix.**
- Re-render the four broken cards at exact **1200×630** using the same Satori pipeline already in place at `api/og-image.ts` (Inter fonts already bundled in `api/_assets/`). Generate one-off scripts (run locally during the migration), then drop the new JPEGs in `public/` overwriting the old filenames so cached URLs continue to work.
  - `oap-og.jpg` — OAP-branded card ("Operator Acceptance Program — AS9100 / ISO 9001 / OSHA-aligned CNC operator certification")
  - `gcode-academy-og.jpg` — GCA-branded card ("G-Code Academy — 10 controller-aware question banks, portable certification")
  - `profile-og.jpg` — Generic JobLine profile fallback (already covered by the dynamic `/api/og-image` for talent, this is the static fallback)
  - `talent-og.jpg` — Talent network landing card
- Stop using OG cards as inline hero `<img>`. Replace the hero `<img src="/oap-og.jpg">` in `src/pages/resources/OperatorAcceptanceProgram.tsx` and the matching block in `src/pages/resources/GCodeAcademy.tsx` with a proper responsive hero block (gradient + headline + icon, no image), or use a real photo asset sized for the layout. This eliminates the "doesn't fit on mobile and desktop" issue.
- Keep OG meta usage unchanged (`ogImage="https://jobline.ai/oap-og.jpg"`) — only the underlying file dimensions change.

---

## 2. Certificate digital view free, PDF + Print paywalled

**Today.** `/verify/:certId` shows the digital certificate AND offers **Print** (`window.print()`) + **Download PDF** to anyone. This bypasses the $12 issuance fee for a holder who got a free internal issue or anyone reading a verify link.

**Goal.** Anyone can always view the digital certificate at `/verify/:certId`. PDF download and Print are gated behind a paid `stripe_session_id` on the cert row. If unpaid, show a "Buy printable certificate ($12)" CTA that launches the existing `BuyCertificateDialog` / `create-cert-checkout` flow.

**Changes.**

1. **DB (RPCs).** Update `verify_oap_certificate(text)` and `verify_gca_certificate(text)` (and the `_by_qr` siblings) to add a single boolean column `is_paid := stripe_session_id IS NOT NULL` in the returned row. No PII added — just the boolean. Migration is `CREATE OR REPLACE FUNCTION ...` so it's idempotent and grants stay intact.

2. **Type + hook.** Add `isPaid: boolean` to `CertificateRecord` in `src/lib/certificates.ts` and wire it through `useCertificates.lookupCertificate` (`src/hooks/useCertificates.ts`).

3. **Verify page (`src/pages/VerifyCertificate.tsx`).**
   - Always render `<CertificateViewer>` (digital view) — unchanged.
   - If `cert.isPaid` → keep existing **Print** button + **Download PDF** button + Diploma/Digital toggle (toggle still free, it's just a view).
   - If `!cert.isPaid` →
     - Hide Print button.
     - Replace `CertificatePdfDownloadButton` with a locked button (`<Button variant="outline"><Lock /> Unlock PDF & Print — $12</Button>`) that opens `BuyCertificateDialog` pre-filled with the cert's program, recipient, and `certId`.
     - Suppress the `<div className="hidden print:block">` wrapper so `Cmd+P` from the browser doesn't render the certificate either — instead print a one-page "This certificate is digital-only. Visit jobline.ai/verify/CERT-ID to view, or unlock printable PDF for $12" stub.
   - Owner self-serve: if the signed-in user IS `cert.user_id`, allow them to launch the same purchase dialog from their own account — `BuyCertificateDialog` already does this.

4. **Webhook side.** `create-cert-checkout` already records `stripe_session_id` on success via `issue-certificate`. For an existing free-issued cert that the holder later pays to "upgrade to printable", add a small server path: extend `issue-certificate` to accept `{ upgrade: true, certId }` — it locates the existing row by `cert_id`, sets `stripe_session_id` + `amount_cents`, and returns. No new row created. `BuyCertificateDialog` passes `upgrade: true` when a `certId` is supplied.

5. **Edge case.** Org-issued bulk certs (e.g. an employer pays once via `create-cert-checkout` for their operator) keep working because the checkout path always sets `stripe_session_id`.

---

## 3. Employer OAP & GCA console expansion

**Today.** `OapEmployer` and `GcaEmployer` pages each render a thin panel. `OapEmployerPanel` (485 lines) already has program builder + enrollment + recert manager. `GcaEmployerPanel` (218 lines) is much thinner — just assign banks. There is no unified view of: who's been assigned what, who has tested, who passed, who needs approval, who needs to retest.

**Goal.** Both consoles get a consistent "tracking dashboard" tab on top of their existing config tab.

### 3a. Shared data model (small, additive)

New table `public.gca_assignments` (mirrors how OAP enrollments already work):
```
id, organization_id NOT NULL, user_id NOT NULL, bank_id NOT NULL,
assigned_by, assigned_at, due_date,
status text CHECK IN ('assigned','in_progress','passed','failed','approved','revoked'),
last_attempt_at, last_score, attempt_count int default 0,
recert_interval_months int, next_recert_due date,
approved_by, approved_at,
notes
```
RLS: org admins/supervisors can CRUD within their org; operator can SELECT their own row only. Indexed on `(organization_id, user_id)` and `(organization_id, status)`.

OAP already has `oap_enrollments` with most of these fields, so for OAP we **add only what's missing**:
- `requires_approval boolean default false` on `oap_role_programs`
- `approval_status` (`pending_approval | approved | rejected`), `approved_by`, `approved_at` on `oap_enrollments`
- `attempt_count`, `last_attempt_at` already exist via mentor sign-off events; surface them.

All migrations idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`).

### 3b. UI — `OapEmployerPanel` becomes a 3-tab layout

```
┌─ Programs ─┐  ┌─ Operators ─┐  ┌─ Tracking & Approvals ─┐
```
- **Programs** (existing) — role program builder.
- **Operators** (existing) — enrollment list.
- **Tracking & Approvals** (new) — table with columns: Operator, Role Program, Status, Last attempt, Next recert, Action.
  - Action column buttons: **Approve** (when `pending_approval`), **Request retest** (resets enrollment to `in_progress`, increments `attempt_count`, optional reason), **Issue certificate** (opens existing `CertificateIssuancePanel`), **Revoke**.
  - Filter chips: All / Pending approval / Passed / Failed / Recert due in 30d / Revoked.
  - Reuses existing `OapRecertDueWidget` data plus a new `useOapTracking(orgId)` query.

### 3c. UI — `GcaEmployerPanel` gets the same shape

```
┌─ Assign Banks ─┐  ┌─ Tracking & Retests ─┐
```
- **Assign Banks** (existing, expanded) — pick operators + banks + due date + recert interval.
- **Tracking & Retests** (new) — table: Operator, Bank, Status (assigned/in_progress/passed/failed), Last score, Attempts, Next recert, Action.
  - Actions: **Request retest** (clears `passed/failed`, sets back to `assigned`, logs reason), **Approve** (manual sign-off when score is borderline), **Issue certificate** (opens `CertificateIssuancePanel` already wired for GCA), **Revoke assignment**.
  - When operator opens `/gca/test/:bankSlug`, `GcaTestPlayer` writes back to `gca_assignments` (status, last_score, attempt_count, last_attempt_at). On pass + paid issuance, `gca_assignments.status = 'passed'` and the certificate row links via `bank_id`.

### 3d. Operator visibility (already partially present)

`OapMyTranscript` and the GCA learning hub get a small "Assigned by your employer" section pulling rows where the signed-in user matches `user_id`. Pending approvals show a "Awaiting supervisor approval" badge. Retest requests show a "Your supervisor asked you to retest — please retake" banner with a deep link into the test.

---

## Technical details

**Files touched (high level).**

OG:
- One-off render scripts under `scripts/_render-og-cards.mjs` (deleted after run).
- Overwrite `public/oap-og.jpg`, `public/gcode-academy-og.jpg`, `public/talent-og.jpg`, `public/profile-og.jpg`.
- Edit `src/pages/resources/OperatorAcceptanceProgram.tsx` and `src/pages/resources/GCodeAcademy.tsx` hero blocks.

Cert paywall:
- New migration: `CREATE OR REPLACE FUNCTION verify_oap_certificate / verify_gca_certificate / *_by_qr` to include `is_paid boolean`.
- `src/lib/certificates.ts` — add `isPaid: boolean`.
- `src/hooks/useCertificates.ts` — populate `isPaid`.
- `src/pages/VerifyCertificate.tsx` — gate Print/PDF buttons behind `isPaid`, show paywall CTA + `BuyCertificateDialog`, replace print stylesheet for unpaid certs.
- `src/components/certificates/BuyCertificateDialog.tsx` — accept optional `upgradeCertId`.
- `supabase/functions/issue-certificate/index.ts` — handle `upgrade: true` path that updates an existing row.

Employer consoles:
- New migration: `gca_assignments` table + RLS policies; additive cols on `oap_enrollments` + `oap_role_programs`.
- New hooks: `src/hooks/useGcaAssignments.ts`, `src/hooks/useOapTracking.ts`.
- Refactor `src/components/oap/OapEmployerPanel.tsx` into `OapPrograms.tsx`, `OapOperators.tsx`, `OapTracking.tsx` (3 files under `src/components/oap/employer/`) + `OapEmployerPanel` becomes a Tabs shell.
- Refactor `src/components/gca/GcaEmployerPanel.tsx` similarly: `GcaAssignBanks.tsx` + `GcaTracking.tsx`.
- Update `src/components/gca/GcaTestPlayer.tsx` to upsert into `gca_assignments` on attempt + pass.

**Out of scope (call out, do not build):**
- Email notifications for "retest requested" / "approval pending" — can be a follow-up using the existing `process-notifications` function.
- Operator-side mobile-optimized retest banner (covered by the existing notifications UI).
- Bulk approve/retest actions (single-row first, bulk later if needed).

**Idempotency.** All migrations use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`. Canonical-data invariants untouched.

**ITAR.** `gca_assignments` and the new OAP approval columns inherit org-scoped RLS. No cross-org leakage. Verify endpoints still hide `recipient_email` and `stripe_session_id` (only the boolean `is_paid` is added).

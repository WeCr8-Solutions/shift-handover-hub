
## Goal

Make the Aymar Engineering concierge handoff actually work end‑to‑end: send the email, let Brandon claim the owner account, view & sign all required docs, complete remaining setup (alone or via a delegate), and then operate JobLine.ai. Findings below are based on the live DB state for org `41f0e268…` and the current edge functions.

## What I found (current Aymar state)

- Engagement `631b1d16…`: `in_progress`, `unpaid`, 44% complete, no payment, no MSA signature, no `ready_at`.
- Checklist: 6/10 done; `org_profile` is **blocked**; `users_roles` in progress; `training`, `documents`, `review` still todo.
- Intake responses submitted: only `equipment` + `users_roles` (8 missing).
- `concierge_document_records`: **0 rows** — nothing uploaded for him to view/sign.
- `concierge_pack_finalizations`: **0 rows** — pack never sealed.
- `organization_members` for Aymar: **0 rows** — no owner exists yet.
- `organization_invites` + `account_activation_tokens` for Aymar: **0 rows** — no claim link/QR has been generated.
- `organizations.billing_email` is NULL — no destination for pack/receipts.
- `activation_state = 'claimed'` was set without any claim audit (no `claimed_at` / `claimed_by_user_id` columns exist on `organizations`).

## Real bugs that will break the email/claim flow

1. **`send-concierge-pack` queries columns that don't exist** on `onboarding_engagements`: `customer_billing_email`, `customer_name`, `assigned_rep_id`. Actual columns are `customer_billing_address`, `assigned_admin_id`, and there is no per‑engagement billing email — it must come from `organizations.billing_email`. Function will 500 today.
2. **No way to address the email** — `organizations.billing_email` is null for Aymar and there's no UI to capture it on the engagement before sending the pack.
3. **No documents, no finalization** — even if (1) were fixed, the pack send refuses because finalization status ≠ `finalized` and there are no `concierge_document_records` to sign.
4. **No claim artifact** for Brandon — neither an `account_activation_tokens` row (for `/claim/account-owner`) nor an `organization_invites` row (for `/invite/{code}`) exists, so neither the QR claim nor the URL fallback works.
5. **Activation audit gap** — `org_activation_state` was flipped to `claimed` with nothing recorded; the welcome/owner‑setup gate can't reliably distinguish "needs to claim" vs "already claimed but no member".
6. **MSA/contract signing has no surface** — `contract_signed_at` exists on the engagement but nothing in the claim or welcome flow lets the owner/delegate actually e‑sign and stamp it.

## Plan

### 1. Repair `send-concierge-pack` and recipient resolution
- Replace the broken column list with a join: fetch `organizations(name, billing_email)` and `assigned_admin_id`.
- Recipient priority: `body.toOverride` → `organizations.billing_email` → first org admin's auth email; 400 with a clear message if none.
- Keep the "must be finalized" guard; on send, write a `concierge_activity_log` row (`pack_sent`) and an `organization_audit_events` row.

### 2. Capture billing/MSA contact during engagement setup
- Add a small "Concierge contact" panel in the admin engagement view that writes `organizations.billing_email`, `organizations.billing_address`, and `onboarding_engagements.customer_billing_address` in one form.
- Block "Send pack" until billing email + finalization both exist; show inline reasons.

### 3. Generate & verify Aymar's claim artifacts
- One‑shot RPC / admin action: create both
  - an `account_activation_tokens` row (QR/email link → `/claim/account-owner?token=…`), and
  - a backup `organization_invites` row with `setup_delegate=false`, `org_role='owner'`, 15‑day expiry, returning `/invite/{code}` URL.
- Email template `claim-account` already exists; ensure it includes both the primary token link **and** the fallback URL string so Brandon can paste it if QR fails.
- Add a `claimed_at` + `claimed_by_user_id` audit column pair on `organizations` (nullable) and stamp them inside `redeem_invite_code` / activation‑token redemption, plus a `concierge_activity_log` `owner_claimed` row.

### 4. Make documents truly viewable, signable, and saved
- Welcome stepper gains a **"Review & sign documents"** step that lists every `concierge_document_records` row for the engagement with a signed URL viewer (PDF/inline) and an "I have read & accept" checkbox per doc.
- For the MSA specifically: capture `contract_signer_name`, `contract_signer_title`, typed‑signature canvas, store the signed PDF back to the `concierge-docs` bucket as a new version, stamp `contract_signed_at` + `contract_proof_path`, log to `concierge_activity_log`.
- Surface a read‑only "Signed documents" tab on `/welcome` and in the admin engagement view so both sides see the same record.

### 5. Owner OR delegate can finalize and go live
- Reuse existing `DelegateSetupCard` + `invite_setup_delegate`; ensure delegate invites:
  - Inherit the same document‑signing step (delegates can sign on behalf only if owner toggled "delegate may sign MSA" — default off).
  - Are surfaced in `concierge_activity_log` with `actor_role='delegate'`.
- `mark_org_open_for_operations` already exists — extend its precondition check to also require: payment status ∈ {paid, waived, complimentary}, MSA signed, every required checklist item `done`, and pack finalized. Return structured `missing[]` so the UI shows exactly what's blocking.

### 6. Aymar‑specific data fix (one‑off, after code is right)
- Set `organizations.billing_email` to Brandon's confirmed address (will ask before writing).
- Generate the activation token + backup invite via the new admin action.
- Re‑send `claim-account` email via `send-transactional-email` and verify a row lands in `email_send_log` with `status='sent'`.

### 7. E2E verification
- Add a `concierge-smoke-test` extension (function already exists) that, against a throwaway org, runs: create engagement → set billing email → seed checklist → upload 2 docs → finalize pack → send pack → claim token → sign MSA → mark open for operations, asserting `email_send_log`, `concierge_activity_log`, and `organization_audit_events` rows at each step.
- Run it in dev before touching Aymar; document expected log entries in `docs/concierge/e2e-checklist.md`.

### 8. Documentation
- Update `docs/concierge/` (or create it) with: the corrected flow diagram, recipient resolution order, claim vs delegate paths, MSA signature handling, and the "open for operations" gate. Cross‑link from the admin engagement view via a "Concierge playbook" link.

## Technical notes

- All new columns/RPCs ship in a single migration with GRANTs to `authenticated` + `service_role`; `claimed_at` / `claimed_by_user_id` default NULL so existing orgs aren't disturbed.
- Document viewer uses 7‑day signed URLs from `concierge-docs` (matches current `send-concierge-pack` behavior).
- Signature capture stays client‑side (canvas → PNG → merged into PDF via `pdf-lib` in an edge function `sign-concierge-document`) so we never ship a third‑party e‑sign vendor.
- No schema rename of existing columns; only additive changes.
- Email goes through the existing `send-transactional-email` queue path (no new provider, no new secrets).

## Open questions before I build

1. Brandon's confirmed billing/owner email to seed `organizations.billing_email` and address the claim email to — do you want me to use the address already on file with concierge sales, or a different one?
2. Should delegates be allowed to sign the MSA on the owner's behalf by default, or only when the owner explicitly enables it per‑engagement?
3. For Aymar specifically: do you want me to also pre‑fill the remaining intake modules (`org_profile`, `training`, `documents`, `review`) with placeholder rows so the welcome stepper has something to show, or leave those for Brandon/delegate to fill in?

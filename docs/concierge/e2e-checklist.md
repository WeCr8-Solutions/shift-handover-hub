# Concierge Onboarding — End-to-End Checklist

This is the **reusable** runbook for taking a concierge customer (Aymar Engineering,
then everyone after) from signed engagement → owner-claimed account → fully
operational org. Run the dev-side E2E **first**, then execute the production steps
for the actual customer.

Last verified in dev: 2026-06-09 against migration
`mark_org_open_for_operations` fix (text-array literal bug) and the
`has_role('platform_admin')` enum fix in `generate_owner_claim_artifacts` and
`materialize_intake_invites`.

---

## 0. One-time sanity check (dev)

Run these in dev *before* touching a real customer to be sure nothing has
regressed. The reusable script is in `/tmp/e2e_concierge2.sql` (regenerate with
the SQL block at the bottom of this doc if it's not there).

```bash
psql -f /tmp/e2e_concierge2.sql
```

Expected `NOTICE` output (verbatim — only the IDs/codes/timestamps differ):

```
STEP 1 materialize_intake_invites: {"ok": true, "created": 1, "skipped_existing": 0}
STEP 2 generate_owner_claim_artifacts ok=true invite=E2E-OWN-…
STEP 3 owner redeems: {"success": true, "team_id": null, "organization_id": "…"}
STEP 4 stamp_owner_claimed: {"ok": true, "claimed_at": "…"}
STEP 5 invite_setup_delegate: {"ok": true, "claim_url": "https://jobline.ai/invite/…", "invite_code": "…", "invited_email": "…"}
STEP 6 delegate redeems: {"success": true, "team_id": null, "organization_id": "…"}
STEP 7 delegate completed 5 setup steps
STEP 8 open BEFORE payment: {"ok": false, "error": "Setup incomplete", "missing": ["concierge:payment", "concierge:contract_signature"]}
STEP 9 (UI-only): see "Manual smoke after dev E2E" below
```

Any deviation from `ok:true` (or any error message instead of the expected
`missing` array in step 8) means a regression — stop and fix before touching a
customer org.

---

## 1. Pre-flight (per customer)

| Check | Where | Pass condition |
|---|---|---|
| `organizations.billing_email` is the owner's real inbox | `/admin/onboarding/engagements/:id` → "Customer billing" | Address Brandon/owner actually reads |
| `users_roles` intake module submitted with `invite_code` per row | Engagement → "Users & Roles" tab | At least one owner row with `role=owner, email, invite_code` |
| `assigned_admin_id` set on the engagement | Engagement header | A real concierge rep, not null |
| `payment_amount_cents` matches the signed quote | "Payment" panel | Default 150000 ($1,500); change if discounted |
| MSA PDF uploaded to `concierge-docs` | "Documents" panel | At least 1 file with `category='msa'` |

If any row fails, fix it before clicking **Send claim-account to owner** —
otherwise the email will either be addressed to the wrong inbox or the
post-claim stepper will block on a missing step.

---

## 2. Send the claim email — what the click does

Clicking **Send claim-account to owner** in the *Owner-first invite chain*
panel runs (in order):

1. `materialize_intake_invites(engagement_id)` — converts every intake row's
   `invite_code` into a real `organization_invites` row so the link redeems.
2. `generate_owner_claim_artifacts(engagement_id, owner_email)` — ensures an
   `owner` invite for that email, then mints a single-use 24-hour
   `account_activation_tokens` row.
3. `send-transactional-email` with template `claim-account`, populated with
   `inviteUrl` (primary QR/button) + `activationUrl` (paste backup) +
   `backupClaimUrl` (`/claim/account-owner`).

### Expected log rows (concierge_activity_log, in order)

| `action` | `actor_role` | `summary` |
|---|---|---|
| `invites.materialized` | `concierge` | `Materialized N intake invite codes into organization_invites` |
| `owner.claim_artifacts_generated` | `concierge` | `Generated owner claim token + invite for <email>` |

### Expected log rows (email_send_log)

| `template_name` | `status` | `recipient` |
|---|---|---|
| `claim-account` | `pending` then `sent` | the owner email |

If `status='failed'`, check the `error_message` column — most common cause is a
bounced domain or a stale `SENDER_DOMAIN` env on `send-transactional-email`.

---

## 3. Owner claims the account

Owner clicks the email button → `/auth?invite=<CODE>` → signs up or signs in →
`useOrganizationInvites.redeemInviteCode` runs → on success calls
`stamp_owner_claimed(org_id)`.

### Expected log rows

| Table | Row |
|---|---|
| `organization_members` | `(org_id, owner_user_id, role='owner')` |
| `invite_redemptions` | `(invite_id, owner_user_id)` |
| `concierge_activity_log` | `action='owner.claimed', actor_role='owner'` |
| `organization_audit_events` | `event_type='org.claimed', actor_type='user'` |
| `organizations` | `claimed_at` and `claimed_by_user_id` populated |

**Failure mode to watch for**: `activation_state='claimed'` but `claimed_at IS NULL` —
that means redemption ran on an older codebase that lacked `stamp_owner_claimed`.
Backfill with a single update; the function already short-circuits if
`claimed_at` is already set, so re-running is safe.

---

## 4. Setup (owner or delegate)

Owner lands on `/welcome` (gated by `OwnerSetupRedirect`). Two paths:

- **Self-serve**: complete the 6-step stepper. Each "Mark complete" button
  invokes `record_owner_setup_step(org, step)`.
- **Delegate**: click "Invite a setup admin" on `DelegateSetupCard` →
  `invite_setup_delegate(org, email, full_name)` → 15-day single-use invite
  with `setup_delegate=true, org_role='admin', app_role='admin'`.

### Expected log rows per setup step

| Table | Row |
|---|---|
| `organization_setup_steps` | `(org_id, step, completed=true, completed_by, completed_at)` |
| `user_onboarding.owner_setup_steps` | JSON merged with `{<org_id>: {<step>: true}}` |
| `concierge_activity_log` | `action='setup_step.completed', actor_role IN ('owner','admin')` |

After the first completed step, `organizations.activation_state` flips from
`claimed` → `in_setup`.

### Expected log rows for delegate invite

| Table | Row |
|---|---|
| `organization_invites` | `(setup_delegate=true, max_uses=1, expires_at=now()+15d, org_role='admin', app_role='admin')` |
| `concierge_activity_log` | `action='setup_delegate.invited', summary='Owner invited <email> to complete setup as admin'` |
| `organization_audit_events` | `event_type='org.setup_delegate.invited'` |

When delegate redeems, same rows as section 3 except the `owner.claimed` /
`org.claimed` pair is **not** written — only the membership + invite redemption.

---

## 5. Documents + MSA

| Step | Where | Expected log |
|---|---|---|
| Concierge uploads documents | `/admin/onboarding/engagements/:id` → "Documents" | New `concierge_document_records` row, file in `storage.objects` bucket `concierge-docs/<engagement_id>/…` |
| Concierge finalizes the pack | "Documents" → "Finalize pack" | `concierge_pack_finalizations.status='finalized'`, `finalized_at`, `finalized_by` |
| `send-concierge-pack` mails 7-day signed URLs | Same panel → "Send pack" | `email_send_log` row template `concierge-pack`, `status='sent'`; recipient = `organizations.billing_email` (or `toOverride`) |
| Owner/delegate signs MSA | Welcome stepper "Review & Sign" | `onboarding_engagements.contract_signed_at`, `contract_signer_name`, `contract_signer_title`, `contract_proof_path` populated |

If `send-concierge-pack` returns 500, the most common cause used to be that it
queried `customer_billing_email` / `customer_name` columns that don't exist —
it now joins `organizations` for billing info. Re-deploy
`send-concierge-pack` from latest if logs show the old column error.

---

## 6. Open for operations

Owner or admin clicks **Open for operations** on the welcome stepper →
`mark_org_open_for_operations(org_id)`.

### Pass condition

```json
{ "ok": true }
```

### Fail condition

```json
{ "ok": false, "error": "Setup incomplete",
  "missing": [
    "setup:profile", "setup:organization", "setup:data_source",
    "setup:shop_floor", "setup:billing",
    "concierge:payment", "concierge:contract_signature"
  ] }
```

The UI should render each `missing[]` entry as a callout linking to the
relevant section. Stripe-checkout engagements skip `concierge:contract_signature`;
`waived` engagements skip both `concierge:payment` and `concierge:contract_signature`.

### Expected log rows on success

| Table | Row |
|---|---|
| `organizations` | `activation_state='open_for_operations'`, `opened_for_operations_at`, `opened_for_operations_by` |
| `organization_audit_events` | `event_type='org.opened_for_operations', metadata.engagement_id=…` |
| `concierge_activity_log` | `action='org.opened_for_operations', summary='Organization opened for operations by <role>'` |

After this, the org owner can invite team members and create work orders.

---

## 7. Manual smoke after dev E2E

The dev SQL script cannot exercise the React UI or the email pipeline, so run
this against a throwaway org (or the customer-prep org pre-payment):

1. Click **Send claim-account to owner** in the admin panel. Confirm:
   - Toast says "Claim email sent".
   - `email_send_log` has a `claim-account` row with `status='sent'` within
     ~10 s.
   - A copy of the email actually lands in the test inbox.
2. Open the email's primary button on a phone. It should:
   - Redirect to `/auth?invite=…`, prompt sign-up, and land on `/welcome`.
3. Open the email's backup link on desktop. It should:
   - Land on `/claim/account-owner` with the token pre-filled.
4. As the owner, click **Invite a setup admin**, enter a second test email,
   and confirm the delegate can sign in and continue the stepper from where
   the owner left off (proves `organization_setup_steps` is org-scoped, not
   per-user).
5. Click **Open for operations** with payment unpaid — confirm the UI shows
   the structured `missing[]` callouts. Mark paid + signed in the admin panel
   and try again — confirm it succeeds and the dashboard becomes available.

---

## Bugs fixed during this audit (2026-06-09)

| Bug | Symptom | Fix |
|---|---|---|
| `generate_owner_claim_artifacts` called `has_role(_, 'platform_admin')` | "Send claim-account to owner" button errored with `invalid input value for enum app_role: "platform_admin"`; no email could ever be sent | Replaced with `has_role(_, 'admin')` (the real platform-admin role) |
| `materialize_intake_invites` had the same call | Even if the email step worked, the intake codes would never be turned into invites and every team link 404'd on redemption | Same fix |
| `stamp_owner_claimed` compared `activation_state = 'unclaimed'` | Owner could redeem the invite but the audit stamping crashed (`'unclaimed'` is not an `org_activation_state`); `claimed_at` stayed NULL forever | Removed the bad comparison; the function now stamps `claimed_at` unconditionally and leaves `activation_state` alone |
| `mark_org_open_for_operations` appended bare string literals to a `text[]` | `_missing := _missing || 'concierge:payment'` errored at runtime; the owner saw a generic 500 instead of the missing-steps list | Switched to `array_append(_missing, …)` and `to_jsonb(_missing)` on return |
| Aymar Engineering had `activation_state='claimed'` but `claimed_at IS NULL` | Pre-stamp redemption; nothing in the audit trail for when the owner claimed | One-time backfill in the same migration; safe to leave because future redemptions go through the fixed stamping path |

---

## Reusable dev seed script

Saved as `/tmp/e2e_concierge2.sql` after the audit. Regenerate from the SQL
block in the audit notes if missing. It uses three existing dev user IDs as
the synthetic admin / owner / delegate, creates a throwaway org +
engagement + intake response inside a transaction, walks the full chain
end-to-end, and `ROLLBACK`s — leaving zero state behind.

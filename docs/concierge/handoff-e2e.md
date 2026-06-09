# Concierge handoff — end-to-end (current, working)

This is the verified flow for getting a concierge customer (e.g. Aymar Engineering)
from sales → claimed owner account → fully operational org.

## 1. Engagement setup (admin / concierge rep)
1. Open the engagement in `/admin/onboarding/engagements/:id`.
2. Fill the **Users & Roles** intake module with owner + supervisors + operators.
   Each row gets a human-readable `invite_code` (e.g. `AYMAR-OWNER-BA01`).
3. Set `organizations.billing_email` for the org (used as the recipient
   fallback when no `toOverride` is passed to the pack-send function).

## 2. Send the claim email
In the **Owner-first invite chain** panel, click **Send claim-account to owner**.
This now does three things atomically:

1. `materialize_intake_invites(engagement_id)` — converts every intake
   `invite_code` into a real `organization_invites` row so the link redeems.
2. `generate_owner_claim_artifacts(engagement_id, owner_email)` — ensures
   an `owner`-role invite exists for that email and creates a single-use
   24-hour `account_activation_tokens` row.
3. Sends the `claim-account` template with both:
   - `inviteUrl` → primary QR / button link (`/auth?invite=CODE`)
   - `activationUrl` → backup paste link (`/activate?token=…`)
   - `backupClaimUrl` → `/claim/account-owner` fallback page

If the owner's QR/inbox fails, they paste the `activationUrl` (or just the
raw token) plus their email into `/claim/account-owner` and continue.

## 3. Owner claims, audit gets stamped
On a successful `redeemInviteCode` call (auth flow) we call
`stamp_owner_claimed(org_id)` which:
- sets `organizations.claimed_at` + `claimed_by_user_id`
- ensures `activation_state` is at least `claimed`
- writes a `concierge_activity_log` row (`owner.claimed`)
- writes an `organization_audit_events` row (`org.claimed`)

## 4. Setup + delegation
- Owner lands on `/welcome` (gated by `OwnerSetupRedirect`).
- Owner can either complete the 6-step stepper themselves OR use
  `DelegateSetupCard` → `invite_setup_delegate` to invite a supervisor as
  setup admin (15-day single-use invite, `setup_delegate=true`).

## 5. Documents + MSA
- Concierge uploads documents into `concierge_document_records`
  (bucket `concierge-docs`).
- Admin finalizes the pack (`concierge_pack_finalizations.status = 'finalized'`).
- `send-concierge-pack` mails 7-day signed URLs to
  `organizations.billing_email` (or `toOverride`).
- MSA signature is recorded by stamping `onboarding_engagements.contract_signed_at`,
  `contract_signer_name`, `contract_signer_title`, `contract_proof_path`.

## 6. Open for operations
`mark_org_open_for_operations(org_id)` now returns a structured
`missing[]` array if any of these are incomplete:
- All 5 required `organization_setup_steps` (profile, organization,
  data_source, shop_floor, billing)
- Engagement payment status ∈ {paid, waived}
- Engagement contract signed (skipped for `purchased_via='stripe'` or `waived`)

Success flips `activation_state` to `open_for_operations`, stamps
`opened_for_operations_at` + `opened_for_operations_by`, and logs to both
audit tables. After this the org can invite team members and create work
orders.

## Bugs that were fixed
- `send-concierge-pack` queried non-existent columns
  (`customer_billing_email`, `customer_name`, `assigned_rep_id`).
- `request-activation-link` queried non-existent columns
  (`organization_invites.email`, `accepted_at`).
- Intake `invite_code` values were never materialized into
  `organization_invites`, so owner / team links 404'd on redemption.
- No claim audit columns (`claimed_at` / `claimed_by_user_id`).
- `mark_org_open_for_operations` stopped on the first missing step and
  didn't validate payment / signed contract.

## Aymar Engineering — to actually send the email
1. Confirm Brandon's owner email (intake currently has `brandon@revgrips.com`).
2. Set `organizations.billing_email` for org `41f0e268-…` to that address
   (an admin can do this via the Engagement panel or directly).
3. Click **Send claim-account to owner** in the Owner-first invite chain.
4. Verify a row appears in `email_send_log` with `status='sent'`.

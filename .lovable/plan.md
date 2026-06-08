## Goal
Turn the Production Readiness block in the Concierge workspace into a control surface — every count tile, badge, and blocker becomes a clickable remediation button — and add a dedicated **Invites & Roles** status board so concierge can see exactly who has been invited, whether their email was queued/sent/bounced, and who has signed in with which role.

## 1. Interactive Production Readiness tiles
Update `src/components/admin/onboarding/ReadinessPanel.tsx`:

- Render each count tile (`COUNT_LABELS`) as a button. When `count === 0` or `false`, the button is destructive and runs/scrolls to the matching remediation; when `>0` it's a secondary button that scrolls to the relevant section so admins can verify or edit.
- Mapping (tile → action):
  - departments / stations / equipment / stations_with_equipment → scroll to **Shop structure** (and offer "Seed basic shop" if zero).
  - admins → scroll to **Owner invite panel** + open "Send owner email" action.
  - operators / members_signed_in → scroll to new **Invites & Roles** board.
  - routing_templates / queue_items_with_routing → scroll to **Routing** intake module.
  - branding → triggers the existing logo upload flow inline (reuse `BlockerActions` logic, lifted into a shared hook `useReadinessRemedies`).
  - subscriptions → opens existing "Grant complimentary" confirm + scroll to payment.
  - erp_connections / ERP persistence → scroll to **ERP** tab.
  - Payment / Contract badges → already actionable, keep the click-through to their panels and add "Mark waived / Mark paid" admin overrides (already supported by existing engagement RPCs).
  - ITAR posture badge → opens read-only popover explaining the lock (no remedy — customer-controlled).
- Each blocker row in `BlockerActions` already has actions; extend it so any blocker without a wired action shows a "Mark as customer-pending" toggle (writes to `onboarding_engagements.notes` so the row no longer flags as unaddressed). Persistence reuses existing `engagement.notes` JSON.
- Re-check button stays. After any remediation, invalidate `production-readiness` + `concierge-owner-status` + `concierge-team-status` queries automatically.

## 2. New Invites & Roles board
New component `src/components/admin/onboarding/InvitesRolesBoard.tsx` mounted inside `EngagementDetail.tsx` directly under `OwnerInvitePanel` (also linked from the Readiness tile click-throughs and the `users_roles` tab).

Data sources joined client-side:
- `onboarding_intake_responses` (`users_roles`) → captured roster (owner + supervisors + operators).
- `organization_invites` → invite_code, created_at, uses_count, is_active, invited_email.
- `profiles` (by email) → signed-up users, last_sign_in proxy via `auth.users` is unavailable; use existing `profiles.rob_accepted_at` + `organization_members.role` as today.
- `email_send_log` (existing table) deduplicated by `message_id` → latest status per `recipient_email` for template `claim-account`. The idempotency keys we already write (`concierge-owner-…`, `concierge-team-…`) become the correlation key so we can show **Queued / Sent / Failed / Bounced / Suppressed / Not sent** per row.
- `suppressed_emails` → if email is on the suppression list, show a red "Suppressed — cannot deliver" badge with the reason.

Columns per row:
| Name | Email | Intended role | App role | Invite code | Email status (with timestamp) | Account status | Actions |
The Actions cell exposes: **Send / Resend invite**, **Copy share link**, **Show QR**, **Open Mailgun log** (links to /admin emails dashboard pre-filtered to that recipient), **Mark customer-pending**.

Bulk header actions:
- Resend to all "Not sent" or "Failed".
- Export CSV of the roster + statuses.
- "Add member" button opens the existing `IntakeMembersEditor` inline (so manual additions work without leaving the board).

## 3. Plumbing & invalidation
- Add a small shared hook `useConciergeRefresh(engagementId, organizationId)` that invalidates `production-readiness`, `concierge-owner-status`, `concierge-team-status`, `intake-users-roles`, and the new `concierge-invite-email-status`. All remediation actions call it.
- Add `concierge-invite-email-status` React Query that pulls the latest `email_send_log` row per `recipient_email` for `template_name='claim-account'`, scoped to the roster's email list (no full-table scan).

## 4. Anything that was missing
- **Mobile layout** (the user is on a 488px viewport): make all readiness tiles and the new board collapse to a single column < 640px with sticky action bar.
- **Audit trail**: every admin remediation (logo upload, complimentary grant, waive payment, resend invite, mark customer-pending) writes to `admin_audit_events` with engagement_id + action — uses the existing table, no schema change.
- **Empty-state guidance**: if the roster is empty, the board renders a clear CTA to open the upload utility or the manual editor (matches the upload+edit flow already shipped).
- **No backend schema changes required** — all data already exists in `email_send_log`, `suppressed_emails`, `organization_invites`, `organization_members`, `profiles`, and `onboarding_intake_responses`.

## Files touched
- edit `src/components/admin/onboarding/ReadinessPanel.tsx`
- edit `src/components/admin/onboarding/BlockerActions.tsx` (add "Mark customer-pending" + extract shared remedy helpers)
- new `src/components/admin/onboarding/InvitesRolesBoard.tsx`
- new `src/hooks/useConciergeRefresh.ts`
- new `src/hooks/useInviteEmailStatus.ts`
- edit `src/components/admin/onboarding/EngagementDetail.tsx` (mount the new board + wire scroll IDs the readiness tiles target)

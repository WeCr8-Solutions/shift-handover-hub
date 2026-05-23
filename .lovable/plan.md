# Terms & Policy Change Notification System

Build an admin-managed system to notify all users when Terms of Service, Privacy Policy, Cookie Policy, or Payment/Billing terms change. These are legally-required transactional notifications (per CAN-SPAM / GDPR / our own ToS), not marketing — each user receives one notification per published change because they have an active account governed by those terms.

## 1. Database

New migration adds two tables:

**`policy_change_announcements`** — admin-authored announcement records
- `id`, `policy_type` (enum: `terms`, `privacy`, `cookies`, `billing`, `combined`)
- `version_label` (e.g. "v2.3 — 2026-05-23"), `effective_date`
- `title`, `summary` (short blurb shown in email), `change_highlights` (bullet list / markdown of what changed), `full_policy_url`
- `status` (`draft`, `scheduled`, `sending`, `sent`, `cancelled`), `scheduled_for`, `sent_at`
- `created_by`, `created_at`, `updated_at`
- RLS: platform admins + developers full CRUD; org admins read-only (so they can see what was sent to their users)

**`policy_change_email_log`** — per-recipient send log (dedupe + audit)
- `id`, `announcement_id`, `user_id`, `recipient_email`
- `status` (`pending`, `sent`, `failed`, `suppressed`), `error`, `sent_at`
- Unique constraint on `(announcement_id, user_id)` → idempotency

## 2. Transactional Email Template

`supabase/functions/_shared/transactional-email-templates/policy-change-notification.tsx` — React Email component, brand-styled (white body, JobLine blue CTAs, logo header), registered in `registry.ts`.

Props: `recipientName`, `policyType`, `versionLabel`, `effectiveDate`, `title`, `summary`, `changeHighlights[]`, `fullPolicyUrl`, `manageAccountUrl`.

Subject: `Important update to our {policyType} — effective {effectiveDate}`.

## 3. Edge Functions

**`send-policy-change-notification`** (verify_jwt = true, admin-only)
- Input: `{ announcementId }`
- Verifies caller is platform admin / developer
- Loads announcement, sets status → `sending`
- Queries all active users (`profiles` joined with org filter — every user with a verified email)
- For each user: insert `policy_change_email_log` row (unique constraint → skip duplicates), then invoke `send-transactional-email` with template `policy-change-notification` and `idempotencyKey = policy-${announcementId}-${userId}`
- On completion sets status → `sent`, `sent_at = now()`
- Streams progress back via response

**`scheduled-policy-change-cron`** (verify_jwt = false, called by pg_cron daily)
- Finds announcements with `status='scheduled'` and `scheduled_for <= now()`
- Invokes `send-policy-change-notification` for each

## 4. Admin UI

New tab/section in admin dashboard: **Policy Notifications** (`/admin/policy-notifications`), gated to platform admin + developer.

- **List view**: table of announcements (status badges, recipient count, sent date), filter by policy type
- **Create/edit form**:
  - Policy type selector
  - Version label, effective date pickers
  - Title, summary (textarea), change highlights (repeatable bullet list)
  - Link to full policy page
  - Schedule (now / specific date)
  - Live preview pane (renders the React Email template with sample props)
- **Actions**: Save Draft, Send Test (to current admin), Schedule, Send Now, Cancel Scheduled
- **Detail view**: per-recipient send log table (filter pending/sent/failed/suppressed), retry-failed button

## 5. Triggers from Existing Policy Pages

Optional convenience: on `/terms`, `/privacy`, `/cookies` admin edit views (if they exist as CMS-style content) add a "Create Policy Change Notification" button that pre-fills the form. If those pages are static MDX/TSX, skip this — admins create announcements manually.

## 6. Wiring

- Add route in `App.tsx` (lazy-loaded) for `/admin/policy-notifications`
- Add nav link in admin sidebar gated by `useAdminAccess().isPlatformAdmin`
- Update memory index with the new feature reference

## Technical Notes

- Uses the existing Lovable Email infrastructure (`send-transactional-email` + pgmq queue) — no new email provider
- Each send is individually enqueued with a unique `idempotencyKey` → safe to retry, no duplicate emails per user
- Suppression list is automatically honored (users who unsubscribed from transactional ≠ legal notices, but the queue checks `suppressed_emails` regardless; we may flag policy notices as "legally required" and bypass — TBD)
- All emails are logged in both `policy_change_email_log` (our table) and `email_send_log` (system table)
- Unique `(announcement_id, user_id)` constraint guarantees one email per user per announcement even if "Send Now" is clicked twice

## Open Questions

1. Should policy-change emails bypass the user-level suppression list? (My recommendation: **yes** — these are legally required account notifications, same as password reset.)
2. Scope: send to **all platform users**, or per-org (org admin can send to their own org members)? My recommendation: **platform-wide only**, controlled by platform admin / developer — these are JobLine policy changes, not per-tenant terms.
3. Should we also notify via in-app banner (using the existing `global_updates` acknowledgement modal) in addition to email? Recommended for major changes.

Confirm and I'll build it.

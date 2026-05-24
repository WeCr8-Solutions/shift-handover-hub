# Send Policy Change Notification Function

## Purpose

This directory owns the Supabase Edge Function responsible for sending policy-change notifications to users.

It supports legal and compliance operations by sending Terms, Privacy, Cookies, Billing, and combined policy-change notices while recording delivery attempts through related logging tables.

## What Belongs Here

- The edge function entrypoint for policy-change email delivery
- Email rendering support for this function
- Local implementation notes specific to policy-change notification behavior

## What Does Not Belong Here

- General-purpose notification infrastructure not specific to policy-change operations
- UI code for drafting or reviewing policy announcements
- Unrelated email templates or notification handlers

## Key Contents

- `index.ts` — main function entrypoint and orchestration logic for policy-change sends
- `_template.tsx` — email template renderer for policy-change notification emails

## Operating Rules

- Treat this function as a regulated communications path, not a marketing send.
- Keep dedupe and delivery logging behavior explicit and auditable.
- Preserve admin authorization checks for policy-notice sends.
- Update the local `CHANGELOG.md` whenever delivery rules, audience logic, template behavior, or audit expectations change.

## Relationship To Adjacent Directories

- Admin drafting and send initiation live in `src/components/admin/PolicyNotificationsManager.tsx`.
- Related schema and logging expectations live in Supabase tables referenced by this function.
- This directory is part of the broader legal-and-policy workstream in the admin-platform roadmap.

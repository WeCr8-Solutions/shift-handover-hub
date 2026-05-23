# Monthly Billing Reminder System

Build a complete billing reminder pipeline using Lovable Emails (already configured on `noreply@jobline.ai`) and Stripe webhooks, with a daily cron fallback and e2e coverage.

## 1. Email Templates (Lovable Emails — transactional)

Create three branded React Email templates under `supabase/functions/_shared/transactional-email-templates/`:

- `trial-ending.tsx` — fires 3 days before trial end. Props: `name`, `daysRemaining`, `trialEndsAt`, `manageUrl`.
- `renewal-upcoming.tsx` — fires 7 days before next invoice. Props: `name`, `planName`, `amount`, `currency`, `renewalDate`, `manageUrl`.
- `payment-failed.tsx` — fires on failed charge. Props: `name`, `amount`, `currency`, `attemptCount`, `nextAttemptAt`, `updatePaymentUrl`.

All use JobLine brand tokens (white body, primary blue CTAs, footer w/ logo). Register in `registry.ts`. Scaffold transactional infra if not yet present, then deploy.

## 2. Stripe Webhook Handler

New edge function `stripe-billing-webhook` (verify_jwt = false, signature-verified):

- `customer.subscription.trial_will_end` → enqueue `trial-ending`
- `invoice.upcoming` → enqueue `renewal-upcoming`
- `invoice.payment_failed` → enqueue `payment-failed`
- `invoice.payment_succeeded` → clear any `past_due` flag, log
- Idempotency via existing `stripe_events` table (insert event id; skip if exists)
- Logs to new `billing_reminder_log` table (org_id, user_email, reminder_type, stripe_event_id, status, sent_at)

Required secret: `STRIPE_BILLING_WEBHOOK_SECRET` (separate from any existing webhook). User adds endpoint in Stripe Dashboard pointed at the deployed function URL.

## 3. Daily Cron Fallback

`billing-reminder-cron` edge function + `pg_cron` job (daily 14:00 UTC):

- Scan `subscriptions` for `current_period_end` between now+6d and now+8d → send `renewal-upcoming` if not already logged for that period
- Scan `organizations.trial_ends_at` between now+2d and now+4d → send `trial-ending` if not already logged
- Dedupe via `billing_reminder_log` unique `(stripe_subscription_id, reminder_type, period_anchor)` index

Catches anything webhooks miss (replay safety net).

## 4. Database

Migration:

```text
billing_reminder_log
  id, organization_id, user_email, reminder_type,
  stripe_event_id (nullable for cron-sent), stripe_subscription_id,
  period_anchor (date — period_end or trial_end),
  status, error, sent_at
unique (stripe_subscription_id, reminder_type, period_anchor)
RLS: org admins can SELECT own org rows; service role full access
```

## 5. Admin UI

Add **Billing Reminders** tab to existing `BillingSettings`:
- Recent reminder activity table (filter by type/status)
- "Send test reminder" button (org owners only) → invokes function with sample data to current user
- Status indicators: webhook connected ✓, cron last run timestamp

## 6. E2E Tests

`e2e/billing-reminders.spec.ts`:
- Seed a fake subscription via `seed-e2e` with trial ending in 3 days
- Invoke cron function directly → assert `billing_reminder_log` row created, assert one `email_send_log` row with template `trial-ending`
- Re-invoke cron → assert no duplicate (idempotency)
- Mock-fire Stripe webhook with `invoice.upcoming` signed payload → same assertions for `renewal-upcoming`
- Verify admin UI tab renders the rows

Deno tests for the two edge functions:
- `stripe-billing-webhook/index.test.ts` — signature verification, idempotency, each event type
- `billing-reminder-cron/index.test.ts` — window selection, dedupe, error handling

## 7. Deployment & Verification

1. Run migration
2. Scaffold transactional emails (if needed) + register 3 templates
3. Deploy `stripe-billing-webhook`, `billing-reminder-cron`, `send-transactional-email`
4. Request `STRIPE_BILLING_WEBHOOK_SECRET` from user with copy-paste-ready Stripe Dashboard instructions
5. Schedule pg_cron job
6. Run e2e suite
7. Send a live test reminder to confirm delivery

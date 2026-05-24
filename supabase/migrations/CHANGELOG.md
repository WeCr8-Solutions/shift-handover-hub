# supabase/migrations/ Changelog

## 2026-05-23 — Admin Platform Operations Phase 2–5

### 20260523120001_admin_policy_acceptance_ledger.sql
- Creates `policy_versions` (type, version label, approval state, effective/published dates, linked announcement)
- Creates `policy_acceptances` (version FK, user FK, org FK, accepted_at, acceptance method)
- UNIQUE index on `(policy_version_id, user_id)`
- RLS: platform admins ALL; users INSERT own + SELECT own; users SELECT published versions

### 20260523120002_admin_billing_backoffice.sql
- Creates `billing_events` (org FK, event type, amount cents, seat delta, reason, performed_by)
- Creates `billing_notes` (org FK, note type, body, is_pinned, authored_by)
- RLS: platform admins ALL on both tables

### 20260523120003_admin_email_operations.sql
- Creates `email_templates` (slug UNIQUE, category, subject, body_html/text, version, active flag, approval flag)
- Creates `email_delivery_events` (message_id, recipient, template FK, status, provider, error, occurred_at)
- Creates `email_suppressions` (email UNIQUE, reason, suppressed_by, notes)
- RLS: platform admins ALL on all three tables

### 20260523120004_admin_audit_events.sql
- Creates `admin_audit_events` append-only audit log (actor, email, category, action, target, prev/new state JSON, reason, org)
- RLS: authenticated INSERT own rows; platform admins SELECT

### 20260523120005_admin_talent_governance.sql
- Creates `talent_outreach_consents` (user FK, consent_type, consented bool, timestamps)
- Creates `recruiter_messaging_limits` (org FK UNIQUE, daily/weekly limits, is_suspended, suspension metadata)
- Creates `talent_abuse_reports` (reported_by, reported_org, report_type, status, resolution_notes)
- RLS: platform admins ALL; users ALL own consents; users INSERT own abuse reports

### 20260523120006_admin_org_support_and_health.sql
- Creates `org_support_notes` (org FK, note_type, body, is_pinned, authored_by)
- Creates `org_health_snapshots` (org FK, snapshot_date, active users, work orders 30d, seat utilization %, past due flag, policy acceptance %, risk flags text[], health score numeric)
- UNIQUE index on `(organization_id, snapshot_date)`
- RLS: platform admins ALL on both tables

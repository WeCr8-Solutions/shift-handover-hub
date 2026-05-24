# supabase/ Changelog

## 2026-05-23 — Admin Platform Operations Phase 2–5 migrations

### Added 6 new migration files

| File | Phase | Purpose |
|---|---|---|
| `20260523120001_admin_policy_acceptance_ledger.sql` | 2 Legal | `policy_versions`, `policy_acceptances` tables |
| `20260523120002_admin_billing_backoffice.sql` | 2 Billing | `billing_events`, `billing_notes` tables |
| `20260523120003_admin_email_operations.sql` | 2 Email | `email_templates`, `email_delivery_events`, `email_suppressions` tables |
| `20260523120004_admin_audit_events.sql` | 3 Security | `admin_audit_events` append-only audit log |
| `20260523120005_admin_talent_governance.sql` | 4 Talent | `talent_outreach_consents`, `recruiter_messaging_limits`, `talent_abuse_reports` tables |
| `20260523120006_admin_org_support_and_health.sql` | 5 Executive | `org_support_notes`, `org_health_snapshots` tables |

All tables use `has_role(auth.uid(), 'admin')` for platform-admin RLS policies.

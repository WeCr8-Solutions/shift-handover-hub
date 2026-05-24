# Admin Components Directory Changelog

## 2026-05-23 — Admin Platform Operations Phase 2–5

### Added 6 new platform-admin components (Phases 2–5)

**PolicyAcceptanceLedger.tsx** (Phase 2 Legal)
- Lists all policy versions with per-version acceptance counts
- Detail drill-down dialog shows individual user acceptance records
- CSV export of acceptance data

**BillingBackOffice.tsx** (Phase 2 Billing)
- Billing event history with event-type badges and amount display
- Account notes with pin support; add note via inline form
- Scoped to `access.organizationId` when provided

**EmailOperationsCenter.tsx** (Phase 2 Email)
- Template library with category and active-state display
- Delivery event log with status-icon summary (delivered/bounced/complained/failed)
- Suppression management: add manual suppressions via dialog

**AdminAuditLog.tsx** (Phase 3 Security)
- Filterable, searchable table of `admin_audit_events`
- Category filter dropdown; free-text search across action, actor, target
- Row click → detail dialog with previous/new state JSON
- CSV export

**TalentGovernance.tsx** (Phase 4 Talent)
- Tabbed: Abuse Reports | Recruiter Limits
- Open abuse reports highlighted with red badge count; resolve/dismiss via dialog
- Recruiter suspend/unsuspend with reason capture

**ExecutiveOverview.tsx** (Phase 5 Executive)
- KPI stat cards: org count, avg health score, at-risk orgs, email delivery rate, policy acceptances, open abuse reports
- At-risk org table (past-due invoice, risk flags, health score < 5)
- Full org health snapshot table with tier, active users, seat utilization

**Admin.tsx wiring**
- Added lazy imports for all 6 new components
- Added icons: `BarChart3`, `ClipboardCheck`, `CreditCard`, `UserCheck`
- Added `executive-overview` tab trigger in General group (desktop + mobile)
- Added "Operations" tab group: `policy-acceptance`, `billing-ops`, `email-ops`
- Added "Governance" tab group: `audit-log`, `talent-governance`
- Added mobile Select items for all new tabs
- Added 6 TabsContent blocks inside `hasPlatformAccess` section

---

## 2026-05-23

### Established local admin directory documentation baseline

What changed:

- Added `README.md` for `src/components/admin/`.
- Added `CHANGELOG.md` for `src/components/admin/`.

Why it changed:

- The admin platform is entering phased implementation work.
- The repo now requires each actively worked directory to explain its purpose and maintain a quick local history of changes.

Impact:

- Contributors can orient themselves in the admin component surface faster.
- The directory now has local documentation that can be updated as billing, legal, compliance, support, and talent-governance features evolve.

# JobLine AI — Testing & Production Checklist

**Version:** 1.0.0
**Date:** 2026-02-28
**Audience:** Engineering, QA, Release Manager

---

## Part 1 — Automated Test Suite

### 1.1 Vitest Unit & Integration Tests

Run from the workspace root:

```bash
cd C:\Users\Zach\.cursor\worktrees\shift-handover-hub\dvc
npm test
```

**Expected result:** `23 passed (23)` with `219 tests passed`

| Test File | Category | Tests | Status |
|-----------|----------|-------|--------|
| `src/test/example.test.ts` | Smoke | 1 | |
| `src/test/org-scope-integration.test.ts` | Structural Contract | ~10 | |
| `src/lib/utils.test.ts` | Unit | ~8 | |
| `src/lib/ncrUtils.test.ts` | Unit | ~15 | |
| `src/lib/machineTime.test.ts` | Unit | ~12 | |
| `src/hooks/useStations.test.ts` | Hook Contract | ~8 | |
| `src/hooks/useQueue.test.ts` | Hook Contract | ~12 | |
| `src/hooks/useOperatorSessions.test.ts` | Hook Contract | ~6 | |
| `src/hooks/useEmail.test.ts` | Hook Contract | ~10 | |
| `src/hooks/useERPConnector.test.ts` | Hook Integration | ~20 | |
| `src/components/queue/QueueItemPreAdvanceValidation.test.ts` | Pure Function | ~18 | |
| `src/components/NewHandoffForm.test.ts` | Logic | ~25 | |
| `src/components/ui/button.test.tsx` | RTL Component | ~8 | |
| `src/components/StatusBadge.test.tsx` | RTL Component | ~10 | |
| `src/components/ShiftStats.test.tsx` | RTL Component | ~8 | |
| `src/components/settings/PartCatalogManager.test.tsx` | RTL Component | ~5 | |
| `src/components/queue/QueueStatsCards.test.tsx` | RTL Component | ~5 | |
| `src/components/queue/QueueItemDetailDialog.handoff.test.tsx` | Session Storage | ~10 | |
| `src/components/queue/QueueFilters.test.tsx` | RTL Interaction | ~8 | |
| `src/components/queue/QueueCalendarView.test.tsx` | RTL Interaction | ~12 | |
| `src/components/queue/PartSpecsSection.test.tsx` | RTL Component | ~8 | |
| `src/components/dashboard/SupervisorDashboard.test.tsx` | RTL Component | ~12 | |
| `src/components/dashboard/OperatorStationPanel.test.tsx` | RTL Component | ~8 | |

**Pass criteria:**
- [ ] Exit code 0
- [ ] 23 test files reported as passed
- [ ] 0 failing tests
- [ ] No unexpected TypeScript compilation errors

### 1.2 Deno Edge Function Tests (Live Environment Required)

These tests run against the deployed Supabase edge functions and require a live environment. Run separately from the Vitest suite.

```bash
# ERP sync edge function
cd supabase/functions/erp-sync
deno test --allow-net index.test.ts

# Send email edge function
cd supabase/functions/send-email
deno test --allow-net index.test.ts
```

**Pass criteria:**
- [ ] Auth rejection returns 401 for unauthenticated requests
- [ ] CORS headers present on all responses
- [ ] `org_id` validation rejects missing/invalid org IDs
- [ ] Email type validation rejects unknown email types

---

## Part 2 — Manual Smoke Tests (Web App)

Run against `https://app.jobline.ai` (cloud) or your self-hosted URL.

### 2.1 Authentication Flow

- [ ] Sign up with a new email creates account and redirects to onboarding
- [ ] Sign in with valid credentials succeeds
- [ ] Invalid credentials shows appropriate error message
- [ ] Password reset email sent and link works
- [ ] Logout clears session and redirects to login
- [ ] Session persists on browser refresh (localStorage)

### 2.2 Onboarding

- [ ] New user sees org setup wizard on first login
- [ ] Org creation creates organization and assigns owner role
- [ ] Guided tour steps render correctly
- [ ] Invite code generation works for org owner

### 2.3 Work Order Queue

- [ ] Work orders load and display in list view
- [ ] Kanban board renders correct columns
- [ ] Calendar view shows work orders on correct dates
- [ ] Create new work order dialog opens and saves
- [ ] Work order filters (status, date, work center) apply correctly
- [ ] Bulk upload via Excel template imports work orders

### 2.4 Shift Handoff

- [ ] New handoff form opens with correct prefill from work order
- [ ] CNC type detection sets appropriate defaults
- [ ] TriState toggles (✓ / ✗ / N/A) work correctly
- [ ] Draft auto-saves to localStorage
- [ ] Submitted handoff appears in handoff records

### 2.5 Station & Dashboard

- [ ] Operator dashboard shows assigned stations
- [ ] Supervisor dashboard shows org-wide KPIs
- [ ] Station check-in/check-out records sessions
- [ ] Machine profile can be attached to station
- [ ] Production analytics render charts correctly

### 2.6 Admin Panel

- [ ] Admin can view all organization users
- [ ] Role assignment updates take effect immediately
- [ ] RLS health check runs and shows pass/fail results
- [ ] Issue queue displays reported issues
- [ ] Activity logs show recent events

---

## Part 3 — EXE Build Checklist

### 3.1 Pre-Build Steps

- [ ] `cd desktop && npm install` completes without errors
- [ ] TypeScript compiles: `npm run build:ts` exits 0
- [ ] Icon file present: `assets/icons/icon.ico` (multi-size, including 256x256)
- [ ] Config template present: `assets/config-selfhosted-template.json`
- [ ] `electron-builder.yml` references `icon.ico` (not `icon.png`)

### 3.2 NSIS Installer Build

```bash
cd desktop
npm run build
```

- [ ] Build completes without errors
- [ ] `release/JobLineAI-Setup-1.0.0.exe` exists (~82 MB)
- [ ] `release/JobLineAI-Setup-1.0.0.exe.blockmap` exists
- [ ] `release/builder-debug.yml` shows correct version and metadata

### 3.3 Portable EXE Build

```bash
npm run build:portable
```

- [ ] Build completes without errors
- [ ] `release/JobLineAI-Portable-1.0.0.exe` exists (~74 MB)

### 3.4 Installer Smoke Test (Windows 10/11 x64)

Run on a **clean test machine** that has not previously had JobLine AI installed.

- [ ] Double-click `JobLineAI-Setup-1.0.0.exe`
- [ ] Windows SmartScreen warning appears (expected — no code signing in v1)
- [ ] Click "Run anyway" → installer launches
- [ ] Installation directory page shows (custom path allowed)
- [ ] Installation completes without errors
- [ ] Desktop shortcut created
- [ ] Start menu entry created under "JobLine AI"
- [ ] Launch from desktop shortcut → app window opens (1440×900)
- [ ] App loads `https://app.jobline.ai` correctly
- [ ] Login form renders and accepts credentials
- [ ] Log file created at `%APPDATA%\JobLine AI\logs\jobline-YYYY-MM-DD.log`
- [ ] Config file created at `%APPDATA%\JobLine AI\config.json`
- [ ] Uninstaller (Settings → Apps → JobLine AI → Uninstall) removes app cleanly

### 3.5 Portable EXE Smoke Test

- [ ] Double-click `JobLineAI-Portable-1.0.0.exe`
- [ ] SmartScreen warning appears (expected)
- [ ] App launches without installation
- [ ] App loads `https://app.jobline.ai`
- [ ] Config and logs created at `%APPDATA%\JobLine AI\`

---

## Part 4 — ITAR Self-Hosted Deployment Checklist

### 4.1 Infrastructure Setup

- [ ] Self-hosted Supabase or Supabase Cloud project in US region created
- [ ] All database migrations applied (`supabase db push`)
- [ ] Edge functions deployed (`supabase functions deploy`)
- [ ] Web app built with self-hosted Supabase credentials
- [ ] Built `dist/` folder deployed to org-controlled web server
- [ ] Web server accessible via HTTPS with valid TLS certificate
- [ ] Access restricted to org network (VPN/IP allowlist/firewall)

### 4.2 EXE Configuration for Self-Hosted

- [ ] `config-selfhosted-template.json` copied to `%APPDATA%\JobLine AI\config.json`
- [ ] `appUrl` updated to self-hosted web app URL
- [ ] `apiBaseUrl` updated to self-hosted web app URL
- [ ] `supabaseUrl` updated to private Supabase instance URL
- [ ] `supabaseAnonKey` updated to private Supabase anon key
- [ ] Launch JobLine AI.exe → confirm app loads self-hosted URL (not app.jobline.ai)

### 4.3 Access Control Verification

- [ ] Create test account → confirm created in private Supabase Auth (not cloud)
- [ ] Log in → confirm data reads only from private database
- [ ] Create work order → verify record appears in private PostgreSQL, not cloud
- [ ] Confirm non-org users cannot access the self-hosted URL
- [ ] Confirm access from outside org network is blocked (VPN test)

### 4.4 RLS Health Check

- [ ] Navigate to Admin panel → RLS Health Check
- [ ] Run health check → all tables show PASS for anonymous access restriction
- [ ] Confirm unauthenticated requests cannot read `profiles`, `organizations`, `queue_items`, `handoff_records`

### 4.5 Audit Logging Verification

- [ ] Log in and out several times
- [ ] Check `activity_logs` table in Supabase dashboard
- [ ] Confirm login/logout events recorded with IP address and timestamp
- [ ] Confirm events are scoped to the correct `organization_id`
- [ ] Export activity logs and retain per org data retention policy

### 4.6 User Access Review

- [ ] List all user accounts in Admin → User Management
- [ ] Verify each account belongs to a US Person (or has appropriate export authorization)
- [ ] Remove or suspend any accounts that cannot be verified
- [ ] Document the user access review with date and reviewer name

---

## Part 5 — Release Sign-Off

| Check | Owner | Status | Date |
|-------|-------|--------|------|
| All Vitest tests passing (23 files / 219 tests) | Engineering | | |
| NSIS installer builds and installs cleanly | Engineering | | |
| Portable EXE builds and runs cleanly | Engineering | | |
| Web app smoke test completed | QA | | |
| Self-hosted config verified | DevOps/IT | | |
| RLS health check passing | Engineering | | |
| ITAR deployment checklist completed (if applicable) | Compliance / IT Admin | | |
| Known gaps documented and accepted | Product | | |
| Release notes drafted | Product | | |

---

## Appendix A — Known Issues Accepted for v1.0.0

| Issue | Accepted By | Mitigation |
|-------|-------------|-----------|
| No code signing (SmartScreen warning) | Product | Inform users; documented in install guide |
| No MFA enforcement | Security | Require strong passwords; MFA planned v1.2 |
| `electron-log` unused dependency | Engineering | Remove in v1.1 cleanup |
| OAuth requires manual session refresh | Engineering | Email/password recommended for now |
| No CI/CD pipeline | Engineering | Manual test run required before each release |

## Appendix B — Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-02-28 | Initial production release. NSIS installer + portable EXE. Self-hosted config support. |

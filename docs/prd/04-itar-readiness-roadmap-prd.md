# JobLine AI — ITAR Readiness Roadmap PRD

**Version:** 1.0
**Date:** 2026-02-28
**Status:** Active
**Owner:** Product / Engineering
**Audience:** Engineering, Security, Compliance, Leadership

---

## Overview

This PRD defines the three-phase roadmap to make JobLine AI suitable for ITAR-regulated manufacturing customers. Each phase is a standalone deliverable shipped as a pull request to `main`. No ITAR-related security changes are committed directly to `main` mid-sprint.

| Phase | Branch | Goal | Target |
|-------|--------|------|--------|
| **v1.0** | `feat/itar-v10-selfhosted` | Controlled pilot (no live ITAR data) | Current sprint |
| **v1.1** | `feat/itar-v11-security` | Hardened distribution (signed EXE, no telemetry leaks) | Next sprint |
| **v1.2** | `feat/itar-v12-compliance` | Full ITAR operational use | Sprint +2 |

---

## Background & Problem Statement

JobLine AI targets aerospace and defense manufacturing shops. Many of these operate under **ITAR (International Traffic in Arms Regulations)**, which governs access to controlled technical data (part drawings, CNC programs, specifications for defense articles).

The product is architecturally capable of supporting ITAR customers via a **self-hosted deployment** (private Supabase + self-hosted web app), but currently lacks the access controls, audit capabilities, and distribution hardening required for operational ITAR use.

The goal of this roadmap is to close those gaps phase by phase, with each phase adding measurable compliance value and enabling a new tier of customer engagement.

---

## Phase v1.0 — Controlled Pilot

**Branch:** `feat/itar-v10-selfhosted`
**Status:** Complete (pending PR to main)
**Goal:** ITAR orgs can evaluate the product in a self-hosted environment with no live ITAR data

### What Was Built

- Self-hosted config template (`desktop/assets/config-selfhosted-template.json`)
- Env-var overrides for all config fields (`JOBLINE_SUPABASE_URL`, `JOBLINE_SUPABASE_ANON_KEY`, `JOBLINE_MODE`, `JOBLINE_UPDATE_CHANNEL`)
- NSIS installer (`JobLineAI-Setup-1.0.0.exe`)
- Portable EXE (`JobLineAI-Portable-1.0.0.exe`)
- ITAR deployment guide (`docs/prd/02-itar-self-hosted-deployment.md`)
- Production readiness PRD (`docs/prd/01-production-readiness-prd.md`)
- Testing & production checklist (`docs/prd/03-testing-and-production-checklist.md`)

### Pilot Terms (Non-Technical)

- No ITAR-controlled technical data (drawings, CNC programs, specs) to be entered during pilot
- Customer IT must configure self-hosted Supabase in a US-controlled region
- Customer IT must restrict access to app URL via VPN or firewall
- Pilot is evaluation of workflow fit only

### Acceptance Criteria

- [x] EXE can be configured to load a self-hosted URL via `config.json` or env vars
- [x] All 219 automated tests pass
- [x] NSIS installer and portable EXE build without errors
- [x] ITAR deployment documentation covers end-to-end setup
- [x] Known gaps documented and accepted by Product

---

## Phase v1.1 — Hardened Distribution

**Branch:** `feat/itar-v11-security`
**Status:** Planned
**Goal:** EXE is deployable on locked-down Windows environments; no telemetry leaks from self-hosted instances; JWT auth gaps closed

### Requirements

#### 1. Code-Sign the Windows EXE

**Why:** Defense contractor machines commonly run AppLocker, Windows Defender Application Control (WDAC), or strict SmartScreen policies. An unsigned EXE cannot be silently deployed via SCCM/Intune and may be blocked entirely.

**Technical tasks:**
- [ ] Purchase Extended Validation (EV) or Organization Validation (OV) Windows code signing certificate (DigiCert, Sectigo, or SSL.com recommended)
- [ ] Add `win.signingHashAlgorithms: [sha256]` and `win.certificateSubjectName` to `desktop/electron-builder.yml`
- [ ] Configure signing in CI (store cert as encrypted secret, not on disk)
- [ ] Verify signed EXE passes Windows SmartScreen on a clean machine with no prior trust
- [ ] Verify EXE is deployable via Intune/SCCM silent install (`/S` flag test)

**Files:** `desktop/electron-builder.yml`, CI pipeline (new)

---

#### 2. Disable GA4 Analytics in Self-Hosted Mode

**Why:** Sending user identifiers or usage events to Google Analytics from a classified or restricted network violates common ITAR facility network security policies. Analytics pings are also an uncontrolled data egress vector.

**Technical tasks:**
- [ ] Audit all analytics calls in `src/lib/analytics.ts` and `src/components/AnalyticsProvider.tsx`
- [ ] Add `VITE_DISABLE_ANALYTICS=true` environment variable support
- [ ] Gate all `gtag()`, `GA4`, and analytics provider initialization behind this flag
- [ ] When the Electron app loads a non-`app.jobline.ai` URL (i.e., self-hosted mode), automatically suppress analytics by injecting a CSP header or script blocker in the main process
- [ ] Verify no network calls to `google-analytics.com`, `googletagmanager.com`, or `analytics.google.com` when analytics disabled

**Files:** `src/lib/analytics.ts`, `src/components/AnalyticsProvider.tsx`, `desktop/src/main/index.ts`

---

#### 3. Fix `verify_jwt = false` on Edge Functions

**Why:** Eight Edge Functions bypass Supabase platform-level JWT verification, relying on DIY auth checks. This is weaker than platform enforcement and inconsistent.

**Affected functions:**
- `ai-planning-assistant`
- `auth-email-hook`
- `rls-health`
- `erp-sync`
- `social-agent`
- `update-seats`
- `activate-station-context`
- `verify-station-context-payment`

**Technical tasks:**
- [ ] Audit each function's internal auth logic
- [ ] For functions that should require auth: set `verify_jwt = true` in `supabase/config.toml`
- [ ] For functions with legitimate public access (e.g., `auth-email-hook`): document why and add rate limiting
- [ ] Add integration tests verifying 401 response for unauthenticated requests on all auth-required functions
- [ ] Replace `"Access-Control-Allow-Origin": "*"` on `rls-health` with specific origin allowlist

**Files:** `supabase/config.toml`, `supabase/functions/*/index.ts`

---

#### 4. Remove Unused `electron-log` Dependency

**Why:** Minor but creates confusion — the `electron-log` package is listed in `desktop/package.json` dependencies but is never imported. The custom logger (`logger.ts`) handles logging.

**Technical tasks:**
- [ ] `npm uninstall electron-log` in `desktop/`
- [ ] Verify custom logger still functions after removal

**Files:** `desktop/package.json`

---

#### 5. Add CI/CD Pipeline

**Why:** Currently there is no automated test runner on pull requests. Any PR could break tests without detection.

**Technical tasks:**
- [ ] Create `.github/workflows/test.yml` — runs `npm test` on every PR
- [ ] Add `npm run build:ts` check for Electron TypeScript in CI
- [ ] Add test coverage report (add `--coverage` to vitest config, report via Codecov or similar)
- [ ] Optional: add `electron-builder --win` dry-run in CI (no signing, just verify it compiles)

**Files:** `.github/workflows/test.yml` (new), `vitest.config.ts`

### Phase v1.1 Acceptance Criteria

- [ ] Signed EXE passes SmartScreen on clean machine
- [ ] Signed EXE deploys silently via Intune test
- [ ] Zero analytics network calls when `VITE_DISABLE_ANALYTICS=true`
- [ ] Zero analytics calls from Electron when loading self-hosted URL
- [ ] All 8 previously-`verify_jwt = false` functions either fixed or documented with justification
- [ ] `rls-health` CORS restricted to specific origin
- [ ] `electron-log` removed from dependencies
- [ ] CI pipeline runs tests on every PR with green status on current codebase

---

## Phase v1.2 — Full ITAR Operational Readiness

**Branch:** `feat/itar-v12-compliance`
**Status:** Planned
**Goal:** ITAR orgs can use the product with live controlled technical data under a self-hosted deployment

### Requirements

#### 1. MFA Enforcement Per Organization

**Why:** ITAR requires strong access controls. Password-only authentication is insufficient for access to controlled technical data.

**Technical tasks:**
- [ ] Add `mfa_required` boolean field to `organizations` table (migration)
- [ ] When `mfa_required = true`, enforce TOTP enrollment on first login via Supabase Auth MFA
- [ ] Add MFA enforcement toggle to Admin → Organization Settings
- [ ] Block access to all protected routes until MFA is enrolled and verified
- [ ] Add `mfa_enrolled` field to `profiles` table for audit purposes
- [ ] Test: unenrolled user cannot access dashboard when org has `mfa_required = true`

**Files:** `src/contexts/AuthContext.tsx`, `src/hooks/useEntitlements.ts`, `src/components/settings/OrganizationSettings.tsx`, new migration

---

#### 2. US Person Declaration Gate at Signup

**Why:** ITAR prohibits sharing controlled technical data with non-US persons without an export license. The application has no mechanism to verify or record whether a user is a US Person.

**Technical tasks:**
- [ ] Add `us_person_declaration` boolean and `us_person_declared_at` timestamp to `profiles` table (migration)
- [ ] Add legal acknowledgment screen to signup flow: "I certify that I am a US Person as defined under 22 C.F.R. § 120.15, or that my access to this system has been authorized under an applicable export license."
- [ ] Block access to org data until declaration is made and `us_person_declaration = true`
- [ ] Add admin view to see declaration status for all org members
- [ ] Add `requires_us_person_declaration` toggle to organization settings (can be disabled for non-ITAR orgs)
- [ ] Log declaration event to `activity_logs` with timestamp and IP

**Files:** `src/pages/Auth.tsx`, `src/components/onboarding/OrganizationSetup.tsx`, `src/hooks/useUserOrganization.ts`, new migration

> **Legal note:** This is a self-certification, not verification. ITAR enforcement is the organization's responsibility. The declaration creates an audit record, not a guarantee of compliance.

---

#### 3. Data Access Audit Log

**Why:** ITAR compliance requires demonstrating *who accessed what and when*. Currently only login/logout/signup events are logged — reads and writes to controlled data are not.

**Technical tasks:**
- [ ] Create `data_access_logs` table with columns: `id`, `user_id`, `organization_id`, `table_name`, `record_id`, `operation` (READ/WRITE/DELETE), `created_at`, `ip_address`, `metadata`
- [ ] Add Supabase trigger or Edge Function to log writes to: `queue_items`, `handoff_records`, `stations`, `work_order_routing`, `ncr_reports`
- [ ] Add application-layer logging for reads on the above tables via a `useAuditedQuery` hook wrapper
- [ ] Add Admin panel section: "Data Access Logs" with filtering by user, table, date range
- [ ] Add export to CSV for compliance records
- [ ] Implement log retention policy (configurable, default 2 years)

**Files:** new migration, `src/hooks/` (new `useAuditedQuery.ts`), `src/components/admin/ActivityLogs.tsx`

---

#### 4. Remove All External Telemetry from Self-Hosted Builds

**Why:** In v1.1 we gated analytics behind a flag. In v1.2 we go further — self-hosted deployments should have zero external network calls except to the configured `appUrl` and `supabaseUrl`.

**Technical tasks:**
- [ ] Audit all external URLs referenced in code: Google Fonts, CDN resources, analytics endpoints, Stripe (if self-hosted won't use billing), Sentry (if added)
- [ ] Move Google Fonts to self-hosted / bundled fonts for self-hosted deployments
- [ ] Add a `VITE_SELF_HOSTED=true` build mode that strips all external dependencies
- [ ] Verify with network proxy that zero external calls are made in self-hosted build (except to configured URLs)
- [ ] Update Electron CSP headers to enforce this at the browser level in self-hosted mode

**Files:** `index.html`, `src/index.css` (Google Fonts import), `desktop/src/main/index.ts`, new `vite.config.selfhosted.ts`

---

#### 5. Self-Hosted Installer Verification Wizard

**Why:** Currently nothing stops a user from running the EXE without configuring `config.json`, causing their data to silently go to `app.jobline.ai`. ITAR orgs need a hard stop.

**Technical tasks:**
- [ ] On first launch, check if `config.appUrl === DEFAULT_APP_URL` (i.e., not configured)
- [ ] If unconfigured, show a setup dialog (native Electron dialog) with fields for `appUrl` and optional `supabaseUrl`
- [ ] Validate the entered URL is reachable before saving
- [ ] Write the entered values to `config.json`
- [ ] Add a "This is an ITAR deployment" toggle that enforces: (a) blocks `app.jobline.ai` as a valid URL, (b) sets a `itar_mode` flag in config
- [ ] When `itar_mode = true`, add a persistent visual indicator in the app window title bar or header

**Files:** `desktop/src/main/index.ts`, `desktop/src/main/config.ts`

### Phase v1.2 Acceptance Criteria

- [ ] MFA enforcement blocks access when org requires it and user has not enrolled
- [ ] New users see US Person declaration screen; cannot access org data without completing it
- [ ] Write operations to `queue_items`, `handoff_records`, `stations` create entries in `data_access_logs`
- [ ] Admin can export data access logs to CSV
- [ ] Self-hosted build (`VITE_SELF_HOSTED=true`) makes zero external network calls (verified by proxy)
- [ ] First-launch wizard fires when `config.json` is unconfigured
- [ ] `itar_mode = true` prevents connecting to `app.jobline.ai`

---

## Git Branching Strategy

```
main
├── feat/itar-v10-selfhosted   ← current work, PR to main when tested
├── feat/itar-v11-security     ← start after v1.0 PR merged
└── feat/itar-v12-compliance   ← start after v1.1 PR merged
```

**Rules:**
- Never commit ITAR security changes directly to `main`
- Each phase is a single PR — reviewed, tested, and approved before merge
- Use the worktree at `C:\Users\Zach\.cursor\worktrees\shift-handover-hub\dvc` for current work
- Create a new worktree for v1.1 and v1.2 to avoid conflicts

**To create the v1.0 PR right now:**
```bash
cd C:\Users\Zach\.cursor\worktrees\shift-handover-hub\dvc
git checkout -b feat/itar-v10-selfhosted
git add desktop/src/main/config.ts desktop/electron-builder.yml \
        desktop/assets/config-selfhosted-template.json \
        desktop/assets/icons/icon.ico docs/
git commit -m "feat: add ITAR self-hosted config support and v1.0 docs"
git push -u origin feat/itar-v10-selfhosted
gh pr create --title "feat: ITAR v1.0 — self-hosted config, EXE builds, PRD docs"
```

---

## Effort Estimates

| Phase | Engineering Effort | Key Dependencies |
|-------|-------------------|-----------------|
| v1.0 | Done | None |
| v1.1 | 1–2 week sprint | Code signing cert purchase (~1 week lead time) |
| v1.2 | 3–4 week sprint | v1.1 merged; legal review of US Person declaration language |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Code signing cert takes >1 week to issue | Medium | Blocks v1.1 | Order cert immediately; start other v1.1 tasks in parallel |
| Legal language for US Person declaration requires counsel review | Medium | Delays v1.2 | Engage legal early; use placeholder text in dev |
| Self-hosted Supabase performance differs from cloud | Low | Medium | Test with pilot customer before v1.2 GA |
| Google Fonts removal breaks UI in self-hosted build | Low | Low | Bundle Inter + JetBrains Mono as local assets |
| Audit log volume overwhelms small self-hosted DBs | Low | Medium | Add configurable log verbosity; default to writes only |

---

## Success Metrics

| Metric | v1.0 | v1.1 | v1.2 |
|--------|------|------|------|
| ITAR pilot customers onboarded | 1–2 eval | 2–3 eval | 1+ operational |
| EXE deployment method | Manual | SCCM/Intune capable | SCCM/Intune capable |
| Security gaps (critical) | 5 open | 2 open | 0 open |
| Audit log coverage | Login only | Login only | All data writes |
| External telemetry in self-hosted | Present | Gated | Eliminated |

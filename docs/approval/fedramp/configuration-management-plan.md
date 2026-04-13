# Configuration Management Plan (CMP)
**Organization:** WeCr8 Solutions (JobLine AI)  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** Engineering Lead  
**Approved By:** CEO  
**Review Cycle:** Annual; updated when tooling changes  
**NIST Controls:** CM-1, CM-2, CM-3, CM-4, CM-5, CM-6, CM-7, CM-8, CM-9  

---

## 1. Purpose

This Configuration Management Plan (CMP) defines how WeCr8 Solutions establishes and maintains a known, approved configuration baseline for JobLine AI, controls changes to that baseline, and tracks deviations. It fulfills NIST SP 800-53 Rev. 5 CM controls required for FedRAMP Moderate and will be referenced as SSP Appendix H.

---

## 2. Configuration Baseline (CM-2)

The JobLine AI configuration baseline is defined as the version of the system described by:

| Artifact | Location | Version Control |
|----------|----------|----------------|
| Application source code | `github.com/WeCr8-Solutions/shift-handover-hub` (main branch) | Git (SHA-pinned) |
| Database schema | `supabase/migrations/` | Git + Supabase migration history |
| Edge Function source | `supabase/functions/` | Git |
| Dependency versions | `package.json` + `package-lock.json` | Git |
| Infrastructure configuration | Supabase project settings + Vercel project settings | Platform settings (documented below) |
| Electron desktop app | `desktop/` | Git + versioned releases (`desktop/electron-builder.yml`) |

**Current baseline:** latest tagged release on `main` branch at `github.com/WeCr8-Solutions/shift-handover-hub`.

---

## 3. Configuration Change Control (CM-3)

### 3.1 Change Categories

| Change Type | Examples | Approval Required |
|------------|---------|-----------------|
| **Major** | New database tables, new Edge Functions, external service additions, auth changes | Engineering Lead review + CEO awareness |
| **Minor** | UI changes, non-security dependency updates, copy changes | Engineering Lead review (PR review) |
| **Emergency** | Critical security patches, production incident fixes | Engineering Lead approval; CEO notified post-hoc |
| **Infrastructure** | Supabase plan changes, Vercel config, domain changes | CEO + Engineering Lead |

### 3.2 Change Process

All non-emergency changes follow this process:

1. **Propose:** Open a GitHub Pull Request with a description of the change and reason.
2. **Review:** At least one reviewer approves the PR (currently: Engineering Lead reviews all PRs).
3. **Scan:** Automated Codacy + Trivy scan must pass with no new Critical/High findings.
4. **Test:** Tests pass (Vitest unit tests + TypeScript type check).
5. **Merge:** Squash merge to `main` branch after all checks pass.
6. **Deploy:** Vercel automatically deploys on merge to `main`. Edge Functions deployed via Supabase CLI.
7. **Verify:** Post-deployment smoke test (login, MFA, data access, key features).

**Emergency changes:** May bypass PR review process with CEO verbal/written authorization. Requires a follow-up review PR within 24 hours.

### 3.3 Database Migration Change Control

Database migrations deserve special care as they are irreversible:

1. All migrations are written as `.sql` files in `supabase/migrations/` with timestamp prefix.
2. Migrations must be tested in staging environment before production.
3. Destructive migrations (DROP TABLE, DELETE) require explicit CEO approval.
4. Migrations that remove columns or tables require a corresponding data export first.

---

## 4. Least Functionality (CM-7)

JobLine AI enforces minimal attack surface:

| Area | How Least Functionality is Applied |
|------|-----------------------------------|
| **Database** | RLS restricts every table to org-scoped data; no public schemas accessible |
| **Edge Functions** | Every function requires JWT authentication; service-role key is never exposed to clients |
| **Frontend** | Feature flags disable features not purchased by the org; RBAC restricts admin features |
| **Dependencies** | Only required packages included; devDependencies separated from production |
| **Vercel** | Only `index.html` and static assets served publicly; all auth via Supabase |

---

## 5. Security Configuration Settings (CM-6)

### 5.1 Application Security Settings

| Setting | Value | Where Configured |
|---------|-------|-----------------|
| HTTPS enforcement | All traffic → HTTPS (301 redirect) | `vercel.json` |
| Content Security Policy | Strict CSP headers | `vercel.json` |
| JWT expiration | 1 hour | Supabase Auth settings |
| MFA enforcement | Per-org flag (`mfa_required`) | Supabase DB + Edge Function |
| Session timeout | 1 hour JWT + refresh token | Supabase Auth |
| RLS enabled | All tables | Supabase database |
| Service role key | Server-side only (never in frontend) | Supabase Edge Functions env vars |

### 5.2 Infrastructure Security Settings

| Setting | Value | Where Configured |
|---------|-------|-----------------|
| Database encryption at rest | AES-256 (AWS-managed) | Supabase (inherited from AWS) |
| TLS version | 1.2 minimum | Supabase + Vercel (platform default) |
| Supabase project PITR | Enabled | Supabase Pro plan |
| GitHub branch protection | PR required for main | GitHub repository settings |
| GitHub Actions | All workflows use pinned action versions | `.github/workflows/` |
| Vercel: preview deployments | Enabled for PR review | Vercel project settings |

---

## 6. Configuration Item Inventory (CM-8)

The Configuration Item (CI) inventory is maintained in the Asset Inventory document:
`docs/approval/fedramp/asset-inventory.md`

---

## 7. Configuration Monitoring

| What | How | Frequency |
|------|-----|-----------|
| Dependency vulnerability changes | Trivy scan in CI on every commit + weekly scheduled scan | Per commit + weekly |
| Infrastructure configuration drift | Manual review of Supabase + Vercel settings | Monthly |
| GitHub repository settings | Periodic review of branch protection rules | Quarterly |
| Access permissions | Access roster review | Quarterly |
| Baseline version tracking | Git tag on each production release | Per release |

---

## 8. Document Updates

This CMP is updated when:
- New services or components are added to the authorization boundary (update Section 2)
- Change control process is modified (update Section 3)
- New security settings are configured or changed (update Section 5)
- Infrastructure migration occurs (G-00 — this document will require significant update)

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-20) |

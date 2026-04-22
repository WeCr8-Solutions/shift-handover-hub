# DAST Runbook — OWASP ZAP Automated Scanning
**System:** JobLine AI  
**Organization:** WeCr8 Solutions LLC  
**Version:** 1.0  
**Date:** April 2026  
**FedRAMP Controls:** CA-8 (Penetration Testing), RA-5 (Vulnerability Scanning), SI-4 (System Monitoring)  
**Classification:** Internal — Engineering  
**Related Documents:**
- `.github/workflows/zap-scan.yml` — GitHub Actions workflow
- `.zap/rules.tsv` — Alert suppression configuration
- `docs/approval/fedramp/pentest-rules-of-engagement.md` — Full testing authorization and scope
- `docs/approval/fedramp/continuous-monitoring-plan.md` — ConMon strategy (Section 3.5)
- `docs/approval/fedramp/poam.md` — POA&M for tracking findings

---

## 1. Purpose

This runbook documents the operational procedures for running, interpreting, triaging, and recording findings from the OWASP ZAP Dynamic Application Security Testing (DAST) automated scanner. It serves as:

1. **Operational guide** for engineering staff responsible for DAST execution and triage
2. **FedRAMP evidence artifact** demonstrating continuous DAST scanning per CA-8 and RA-5
3. **Audit trail reference** for 3PAO and agency reviewers

DAST differs from static analysis (SAST/CodeQL/Codacy) in that it actively sends HTTP requests to the running application and observes responses, simulating real attacker behavior without access to source code.

---

## 2. Scan Architecture

### 2.1 Two-Tier Scanning Model

| Scan Type | Target | Trigger | Review Outcome | FedRAMP Mapping |
|-----------|--------|---------|----------------|----------------|
| **Baseline (passive)** | `https://jobline.ai` | Weekly (Mon 09:00 UTC) + every PR to `main` | Findings are uploaded to artifacts, SARIF, and GitHub issues for triage | RA-5, CA-8 passive |
| **Full (active)** | `https://dev.jobline.ai` | Every PR + weekly + `workflow_dispatch` | Findings are uploaded to artifacts and SARIF for triage | CA-8 active |

**Passive scan** (baseline): ZAP crawls the app and records observations — no attack payloads sent. Safe against production.

**Active scan** (full): ZAP sends targeted attack payloads (SQLi, XSS, injection variants, etc.) to the staging environment only. **Never run against `app.jobline.ai`.**

**Important implementation note:** The current GitHub Actions workflow sets `fail_action: false` for both ZAP jobs. That means ZAP findings are surfaced through artifacts, SARIF uploads, and GitHub issues rather than failing the workflow step directly. For FedRAMP review and internal change control, any finding mapped to `FAIL` in `.zap/rules.tsv` is still treated as a release blocker until triaged and resolved.

### 2.2 Workflow Location

```
.github/workflows/zap-scan.yml
```

Three jobs run in sequence:
1. `zap-baseline` — Passive crawl of production
2. `zap-full-scan` — Active attack scan of staging (runs on PR/schedule/dispatch)
3. `scan-summary` — Collects artifacts and posts GitHub Step Summary

---

## 3. How to Trigger a Scan

### 3.1 Automatic Triggers

| Event | Scans That Run |
|-------|---------------|
| Pull request opened/updated targeting `main` | Baseline + Full |
| Weekly schedule (Monday 09:00 UTC) | Baseline + Full |

Note: PRs that modify only `docs/**`, `*.md`, or `.skills/**` paths are excluded from triggering ZAP scans.

### 3.2 Manual Trigger (Workflow Dispatch)

Use this to run an on-demand scan — for example, after a security-relevant deployment or before a customer audit review.

**Via GitHub UI:**
1. Navigate to: `Actions → OWASP ZAP DAST Scan → Run workflow`
2. Leave "Override scan target URL" blank to use `https://jobline.ai` (default)
3. Enter a custom URL only if testing a specific environment (e.g., a branch preview URL)
4. Click `Run workflow`

**Via GitHub CLI:**
```bash
gh workflow run zap-scan.yml
# or with custom target:
gh workflow run zap-scan.yml -f target=https://preview-123.jobline.ai
```

### 3.3 Override Target URL

The `target` input allows re-targeting the baseline scan to any public URL. Use this for:
- Branch preview deployments on Vercel
- Staging environment spot-checks
- Pre-release validation before tagging

> **Warning:** The full scan always targets `dev.jobline.ai` regardless of the `target` override. Do not use the full scan on production URLs — edit the workflow directly if a one-time staging override is needed and restore it immediately.

---

## 4. Reading Results

### 4.1 GitHub Security Tab (Primary Interface)

SARIF reports from both scans are uploaded to GitHub Security → Code Scanning. This is the primary triage interface.

1. Go to `Security → Code scanning`
2. Filter by tool: `ZAP Baseline Scan` or `ZAP Full Scan`
3. Each finding shows: rule ID, severity, URL, description, and evidence

Findings here persist across runs until resolved or dismissed with a reason.

### 4.2 Artifact Reports

Each run uploads two report files retained for **90 days**:

| Artifact Name | Contents |
|--------------|---------|
| `zap-baseline-report-{run_id}` | `report_html.html` — human-readable; `report_json.json` — machine-readable |
| `zap-full-scan-report-{run_id}` | `report_html.html` + `report_json.json` |

To download:
1. Go to the completed workflow run in GitHub Actions
2. Scroll to the Artifacts section
3. Download the relevant report zip

The HTML report is the most readable for manual review and is appropriate for sharing with auditors or including in FedRAMP evidence packages.

### 4.3 GitHub Step Summary

After each run, the `scan-summary` job posts a summary table to the workflow run page:

```
| Scan             | Target                     | Status  |
|------------------|----------------------------|---------|
| Baseline (passive) | https://jobline.ai       | success |
| Full scan (active) | https://dev.jobline.ai   | success |
```

---

## 5. Alert Triage Workflow

### 5.1 Alert Severity Levels

ZAP classifies findings by risk level (High, Medium, Low, Informational). Our `rules.tsv` maps these to review outcomes:

| `rules.tsv` Disposition | Meaning | Build Impact |
|------------------------|---------|-------------|
| `FAIL` | Critical finding — must fix before release approval | Workflow may still succeed; reviewer must treat as release blocker |
| `WARN` | Known issue; tracked for remediation | Workflow may still succeed; finding logged and reviewed |
| `IGNORE` | Acknowledged false positive | Alert suppressed entirely |

### 5.2 Alert Triage Decision Tree

When a new alert appears in GitHub Security, a GitHub issue is created, or a reviewer sees a new finding in the artifact reports:

```
New ZAP Alert
    │
   ├─ Is it in rules.tsv as IGNORE or WARN?
   │       └─ YES → False positive or accepted risk already classified.
   │                 Confirm the rule ID matches exactly and update review notes if needed.
    │
    ├─ Is it a genuine vulnerability in our code?
    │       └─ YES → See §6 (Finding Remediation Lifecycle)
    │
    ├─ Is it a false positive NOT yet in rules.tsv?
    │       └─ YES → See §5.3 (Adding a Suppression Rule)
    │
    └─ Unsure?
            └─ Escalate to Engineering Lead within 24h for FAIL alerts;
               within 5 business days for WARN alerts.
```

### 5.3 Adding a Suppression Rule to `rules.tsv`

Only add suppressions for **confirmed false positives with documented rationale**. Do not suppress FAIL-class rules without engineering lead sign-off.

1. Identify the ZAP rule ID from the finding (shown in GitHub Security as the alert rule)
2. Look up the rule description: https://www.zaproxy.org/docs/alerts/{rule-id}/
3. Verify it is a false positive (e.g., Vercel CDN header behavior, known architectural decision)
4. Add to `.zap/rules.tsv` in the appropriate section:

```
{rule-id}	IGNORE	Reason for suppression — referenced GitHub issue or architectural note
```

5. Commit with a message referencing the rule: `zap: suppress rule 10036 (Vercel Server header FP)`
6. Add a comment in `rules.tsv` explaining the quarterly review obligation

**Review obligation:** All `IGNORE` entries in `rules.tsv` must be reviewed quarterly. Remove entries that are no longer applicable (e.g., after implementing a security header that fixes the underlying finding).

### 5.4 Current Suppressed Rules Summary

| Rule ID | Disposition | Reason | Review Date |
|---------|------------|--------|-------------|
| 10055 | WARN | CSP unsafe-inline — planned fix post-GovCloud migration | Q3 2026 |
| 10015 | IGNORE | Vercel CDN immutable cache headers — by design | Q3 2026 |
| 10036 | IGNORE | Vercel `Server: Vercel` header — not actionable | Q3 2026 |

Rules that are treated as release-blocking when detected (confirming security controls are in place):

| Rule ID | Finding | Expectation |
|---------|--------|-------------|
| 10038 | CSP header not set | FAIL — header must be present |
| 10020 | Missing anti-clickjacking header | FAIL — X-Frame-Options must be present |
| 40018 | SQL Injection | FAIL — must never trigger |
| 40012 | XSS Reflected | FAIL — must never trigger |
| 40014 | XSS Persistent | FAIL — must never trigger |
| 90022 | Application Error Disclosure | FAIL — stack traces must not leak |
| 40003 | CRLF Injection | FAIL — must never trigger |
| 40008 | Parameter Tampering | FAIL — must never trigger |
| 30002 | Format String Error | FAIL — must never trigger |
| 90020 | Remote OS Command Injection | FAIL — must never trigger |

---

## 6. Finding Remediation Lifecycle

### 6.1 When a FAIL-Rule Alert Is Found

1. **Immediately** — Treat the finding as a release blocker and record the workflow run URL
2. **Within 4 hours** — Engineering Lead reviews the finding via GitHub Security tab and HTML report
3. **Within 24 hours** — Severity classification confirmed:
   - **True positive, CVSS ≥ 9.0 (Critical):** Open P1 Incident per IRP; remediate before next deploy
   - **True positive, CVSS 7.0–8.9 (High):** Remediate within 7 days; open POA&M item
   - **True positive, CVSS < 7.0:** Remediate within 30 days; open POA&M item
   - **False positive:** Add IGNORE rule with rationale (see §5.3); re-run scan
4. **After fix:** Re-run workflow manually to confirm alert is resolved before deployment or approval closure
5. **Close POA&M item** with evidence: workflow run URL + commit SHA of fix

### 6.2 When a WARN-Rule Alert Is Found

1. Build passes, but finding is visible in GitHub Security
2. Engineering Lead reviews during weekly security review
3. If still valid: open or update existing POA&M item
4. Remediate within the SLA for its CVSS severity (see ConMon §3.5)

### 6.3 Evidence to Retain Per Finding

For each confirmed vulnerability that enters the remediation lifecycle, retain:

- [ ] Screenshot or link to GitHub Security alert
- [ ] HTML report artifact link (90-day retention — download to `docs/approval/fedramp/evidence/` for long-term retention)
- [ ] POA&M item ID and status
- [ ] Remediation commit SHA
- [ ] Re-scan confirmation (workflow run link showing clean result)

---

## 7. Evidence Collection for FedRAMP

### 7.1 Required Evidence Artifacts (CA-8, RA-5)

For a FedRAMP assessment or annual review, provide:

| Evidence Item | Source | Where to Find |
|--------------|--------|--------------|
| Scan configuration | `.zap/rules.tsv` + `.github/workflows/zap-scan.yml` | Repository root |
| Most recent baseline scan HTML report | GitHub Actions artifact | `Actions → OWASP ZAP DAST Scan → Artifacts` |
| Most recent full scan HTML report | GitHub Actions artifact | `Actions → OWASP ZAP DAST Scan → Artifacts` |
| SARIF findings in Security tab | GitHub Security → Code Scanning | Filter by ZAP tools |
| Any open or closed POA&M items from DAST | `docs/approval/fedramp/poam.md` | POA&M document |
| This runbook | `docs/approval/fedramp/dast-runbook.md` | This document |
| Rules of Engagement | `docs/approval/fedramp/pentest-rules-of-engagement.md` | FedRAMP docs |

### 7.2 DAST Completion Checklist for Reviewer Sign-Off

The DAST package is considered review-ready only when all items below are complete for the current review period:

- [ ] `.github/workflows/zap-scan.yml` matches the approved scan design: passive scan against `https://jobline.ai`, active scan against `https://dev.jobline.ai`, and SARIF upload enabled
- [ ] `.zap/rules.tsv` has a documented quarterly review date in the header and every `IGNORE` or `WARN` entry has current rationale
- [ ] The most recent baseline HTML report has been downloaded from GitHub Actions and archived to `docs/approval/fedramp/evidence/`
- [ ] The most recent full-scan HTML report has been downloaded from GitHub Actions and archived to `docs/approval/fedramp/evidence/`
- [ ] GitHub Security → Code Scanning shows current ZAP findings reviewed for the period under assessment
- [ ] Any confirmed findings are reflected in `docs/approval/fedramp/poam.md` with owner, status, and planned completion date
- [ ] `docs/approval/fedramp/continuous-monitoring-plan.md` references the same scan cadence and evidence-retention process
- [ ] `docs/approval/fedramp/pentest-rules-of-engagement.md` is signed or otherwise approved for the active assessment window
- [ ] A monthly archive or assessment memo records the workflow run IDs used as evidence for the review package

### 7.3 FedRAMP Completion Statement

For JobLine AI, automated ZAP DAST is considered complete for continuous-monitoring evidence when the checklist in §7.2 is satisfied. It is not sufficient by itself to close the broader CA-8 penetration-testing requirement for initial authorization. Independent third-party penetration testing remains separately required and is tracked in the POA&M as G-04.

### 7.4 Long-Term Evidence Archive

GitHub Actions artifacts expire after 90 days. For audits and 3PAO reviews, download and archive reports:

```
docs/approval/fedramp/evidence/
  zap-baseline-YYYY-MM-DD.html
  zap-full-scan-YYYY-MM-DD.html
```

**Archive frequency:** Monthly (on the first Monday of each month, download the most recent run's HTML reports and save to the evidence directory).

### 7.5 Annual Summary for ConMon Reporting

At the end of each year, prepare a DAST summary memo covering:

- Total scans run (baseline + full) for the year
- Total alerts raised by category (FAIL / WARN)
- Confirmed vulnerabilities found and remediated (with POA&M IDs)
- False positives added to `rules.tsv` (with rationale)
- Outstanding WARN items tracked into next year
- Rules.tsv quarterly review dates and outcomes

File as: `docs/approval/fedramp/evidence/dast-annual-summary-YYYY.md`

---

## 8. Quarterly Rules.tsv Review Procedure

**Frequency:** Every 3 months (January, April, July, October)  
**Owner:** Engineering Lead  
**Time required:** ~1 hour

**Review steps:**

1. Open `.zap/rules.tsv` and review each `IGNORE` entry
2. For each entry, answer:
   - Is the underlying issue still present (architectural constraint)?
   - Has a fix been deployed that resolves it (remove suppression)?
   - Is the rationale still accurate?
3. Update or remove suppressed rules as appropriate
4. Run a manual `workflow_dispatch` scan after any changes to `rules.tsv`
5. Confirm the expected alerts FAIL and the removed suppression now shows as an active alert (if applicable)
6. Update the "Last reviewed" comment in `rules.tsv` header
7. Commit with message: `zap: quarterly rules.tsv review YYYY-QN`

---

## 9. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Engineering Lead | Primary triage; POA&M updates; quarterly review; evidence archive |
| All engineers | Monitor ZAP findings and do not release changes with active FAIL alerts |
| ISSO (when designated) | Annual DAST summary review; 3PAO evidence coordination |
| CEO | Sign off on any decision to suppress a FAIL-class rule permanently |

---

## 10. Relationship to Other Security Activities

| Activity | Relationship to DAST |
|----------|-------------------|
| Trivy / npm audit (weekly) | Complements DAST — covers dependency CVEs that DAST won't find |
| CodeQL / Codacy SAST | Complements DAST — finds source-level issues; DAST finds runtime issues |
| CISA CHvS external scan | Complements DAST — external vantage point; different rule set |
| Third-party pen test (G-04, annual) | DAST provides continuous automation; pen test provides human expert validation |
| POA&M (G-29) | All confirmed DAST findings become POA&M items |
| ConMon reporting | DAST results are a required ConMon data source (CA-7, RA-5) |

---

## 11. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 2026 | WeCr8 Solutions Engineering | Initial version |

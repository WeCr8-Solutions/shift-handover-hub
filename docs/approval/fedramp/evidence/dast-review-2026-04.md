# DAST Review Memo - 2026-04

**System:** JobLine AI  
**Organization:** WeCr8 Solutions LLC  
**Review period:** April 2026  
**Prepared by:** Engineering documentation review  
**Reviewed by:** Pending Engineering Lead review  
**Review date:** 2026-04-22  
**Related runbook:** `docs/approval/fedramp/dast-runbook.md`  
**Related controls:** CA-8, RA-5, SI-4

---

## 1. Review Scope

This memo records the monthly FedRAMP DAST evidence review for the current assessment period. As of 2026-04-22, the repository-side review package has been aligned to the implemented OWASP ZAP workflow and the local evidence archive structure has been created, but the latest GitHub Actions artifacts have not yet been downloaded into the workspace.

---

## 2. Workflow Evidence

| Evidence Item | Value | Status |
|---|---|---|
| Baseline workflow run ID | `24758783423` (`ZAP Baseline Scan (Production)` job `72437708260`) | [x] Collected |
| Full-scan workflow run ID | `24758783423` (`ZAP Full Scan (Staging)` job `72437708252`) | [x] Collected |
| Baseline workflow URL | `https://github.com/WeCr8-Solutions/shift-handover-hub/actions/runs/24758783423` | [x] Collected |
| Full-scan workflow URL | `https://github.com/WeCr8-Solutions/shift-handover-hub/actions/runs/24758783423` | [x] Collected |
| GitHub Security review completed by | Pending reviewer action in GitHub Security | [ ] Reviewed |
| Review date in GitHub Security | Pending reviewer action in GitHub Security | [ ] Reviewed |

---

## 3. Archived Files

Place the downloaded HTML reports in this directory using the naming convention from the runbook.

| File | Expected name | Present |
|---|---|---|
| Baseline HTML report | `zap-baseline-YYYY-MM-DD.html` | [ ] |
| Full-scan HTML report | `zap-full-scan-YYYY-MM-DD.html` | [ ] |
| Optional notes or screenshots | `dast-review-supporting-notes-YYYY-MM.md` | [ ] |

Archived files for this period:

- Baseline report: Not yet archived locally
- Full-scan report: Not yet archived locally
- Supporting notes: `docs/approval/fedramp/evidence/dast-review-supporting-notes-2026-04.md`

---

## 4. Reviewer Checklist

Mark each item complete only after evidence has been verified.

- [x] `.github/workflows/zap-scan.yml` still matches the approved scan design
- [x] `.zap/rules.tsv` review date is current and all suppressions have rationale
- [ ] Latest baseline HTML report has been downloaded and stored in `docs/approval/fedramp/evidence/`
- [ ] Latest full-scan HTML report has been downloaded and stored in `docs/approval/fedramp/evidence/`
- [ ] GitHub Security -> Code Scanning findings were reviewed for the current period
- [x] Confirmed findings have corresponding POA&M entries or explicit closure notes
- [x] `docs/approval/fedramp/continuous-monitoring-plan.md` still matches the implemented cadence
- [ ] `docs/approval/fedramp/pentest-rules-of-engagement.md` is approved for the current review window
- [ ] This memo records the workflow run IDs used as evidence

---

## 5. Findings Summary

| Scan | Result summary | Action required |
|---|---|---|
| Baseline (passive) | Latest inspected workflow run is `24758783423`; job never started because GitHub Actions billing/spending is blocked, so no artifact was produced | Restore GitHub Actions billing, rerun workflow, archive artifact, review SARIF |
| Full scan (active) | Latest inspected workflow run is `24758783423`; job never started because GitHub Actions billing/spending is blocked, so no artifact was produced | Restore GitHub Actions billing, rerun workflow, archive artifact, review SARIF |

Open FAIL findings:

- No ZAP FAIL findings were produced in the latest inspected workflow run because the ZAP jobs did not start
- Live production response check on 2026-04-22 shows `jobline.ai` is currently missing `X-Frame-Options`, `Content-Security-Policy`, and `Permissions-Policy`, which would cause ZAP/header checks to fail until the hardened deployment path is restored

Open WARN findings:

- Current WARN suppressions documented in `.zap/rules.tsv`; live GitHub review still pending

False positives reviewed this period:

- `.zap/rules.tsv` entries for `10015`, `10036`, and `10055` remain documented with rationale and quarterly review requirement

---

## 6. POA&M Traceability

| Finding or gap | POA&M ID | Status | Owner | Planned completion |
|---|---|---|---|---|
| Independent third-party penetration test pending | G-04 | IN PROGRESS | CEO (procurement) | Q3 2026 |
| Automated ZAP evidence archive incomplete for April 2026 review cycle | G-04 | IN PROGRESS | Engineering Lead | Next artifact download and review window |
| Production hardening not active on live `jobline.ai` deployment (`release.json` reports `unknown` and required security headers are missing) | G-04 | IN PROGRESS | Engineering Lead | Redeploy hardened Vercel target and rerun ZAP |

---

## 7. Current Blockers

Document anything that prevents full FedRAMP review completion for this period.

- [ ] No blocker
- [x] Latest GitHub Actions artifacts not yet downloaded into local evidence archive
- [x] GitHub Security review not yet completed for the period
- [x] Rules of Engagement approval/signature still pending
- [x] Independent third-party penetration test still pending under G-04
- [x] GitHub Actions billing/spending issue prevented the latest ZAP run from starting any jobs
- [x] Live `jobline.ai` deployment is not serving the hardened header set expected by `vercel.json`
- [ ] Other: __________________

Notes:

- Local repository review completed on 2026-04-22: runbook, ConMon plan, roadmap, and POA&M are aligned to the implemented ZAP workflow.
- Local evidence archive directory now exists, but no `zap-baseline-*.html` or `zap-full-scan-*.html` files are present in the workspace.
- The latest inspected ZAP workflow run is `24758783423` and shows three GitHub Actions annotations stating: "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings".
- The latest inspected workflow run has `Artifacts -` and therefore produced no downloadable baseline or full-scan report.
- A direct production check on 2026-04-22 showed `https://jobline.ai` responding without `X-Frame-Options`, `Content-Security-Policy`, and `Permissions-Policy`, despite those headers being defined in `vercel.json`.
- The live `https://jobline.ai/release.json` response reports `commitSha: unknown` and `deployTarget: local`, which indicates the public domain is not currently serving the repo's expected hardened deployment manifest.
- GitHub CLI is not installed on this machine, so workflow artifact retrieval could not be automated from the terminal.
- Codacy analyze attempts were executed for edited FedRAMP documents but are currently blocked by WSL init and `401` auth failures; see supporting notes.

---

## 8. Reviewer Sign-Off

I confirm that the evidence listed above was reviewed for the stated period and that the DAST package is complete for continuous-monitoring review to the extent marked in this memo.

**Reviewer name:** Pending Engineering Lead sign-off  
**Title:** Pending  
**Signature or approval record:** Pending  
**Date:** Pending artifact review


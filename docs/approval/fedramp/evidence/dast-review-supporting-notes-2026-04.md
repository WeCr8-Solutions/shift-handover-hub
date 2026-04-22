# DAST Review Supporting Notes - 2026-04

## Scope

This supporting note captures the locally verifiable facts established during the April 2026 FedRAMP DAST review preparation.

## Verified Locally

- `.github/workflows/zap-scan.yml` defines a passive baseline scan for `https://jobline.ai` and an active full scan for `https://dev.jobline.ai`.
- `.zap/rules.tsv` is present, documents reviewed suppressions, and includes a `Last reviewed: April 2026` header.
- `docs/approval/fedramp/dast-runbook.md` now includes reviewer completion criteria and an explicit statement that automated ZAP DAST satisfies continuous-monitoring evidence only when archived evidence and review actions are complete.
- `docs/approval/fedramp/continuous-monitoring-plan.md` now matches the implemented ZAP workflow semantics, including reviewer-handled `FAIL` findings and evidence archive references.
- `docs/approval/fedramp/gap-remediation-roadmap.md` and `docs/approval/fedramp/poam.md` now distinguish between completed automated DAST workflow readiness and the still-open independent third-party penetration test under G-04.
- `docs/approval/fedramp/evidence/` now exists as the local archive directory for DAST evidence.

## Not Yet Present Locally

- No archived ZAP HTML reports are present in `docs/approval/fedramp/evidence/`.
- No workflow run IDs or GitHub Security review timestamps are recorded locally yet.
- No signed approval record is attached for `docs/approval/fedramp/pentest-rules-of-engagement.md`.

## Operational Blockers Observed

- The integrated browser session available to the agent still resolves `https://github.com/WeCr8-Solutions/shift-handover-hub` and the ZAP workflow URL to GitHub's public 404/sign-in view, so private Actions pages and artifacts are not reachable from the current browser context.
- GitHub CLI is not installed on this workstation, so `gh`-based workflow and artifact retrieval could not be used.
- Latest GitHub Actions artifacts were not already downloaded into the repository workspace.
- Codacy MCP analyze attempts were made for the edited FedRAMP docs, but the calls failed with WSL initialization issues and `401` authentication errors, so no Codacy findings were available to remediate.

## Immediate Remaining Actions

1. Download the latest `zap-baseline-report-*` and `zap-full-scan-report-*` artifacts from GitHub Actions.
2. Save the extracted HTML reports into `docs/approval/fedramp/evidence/` using the runbook naming convention.
3. Review GitHub Security -> Code Scanning for the same review window and record reviewer name and date in `dast-review-2026-04.md`.
4. Record the workflow run IDs and URLs in `dast-review-2026-04.md`.
5. Obtain Engineering Lead approval or signature for the active Rules of Engagement review window.
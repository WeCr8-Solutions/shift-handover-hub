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
- The latest inspected ZAP workflow run is `24758783423`, with baseline job `72437708260` and full-scan job `72437708252`.
- The latest inspected run shows no artifacts and three GitHub Actions annotations stating that jobs were not started because recent account payments failed or the spending limit needs to be increased.
- A direct production check on 2026-04-22 showed `https://jobline.ai` missing `X-Frame-Options`, `Content-Security-Policy`, and `Permissions-Policy` on the live response.
- The live `https://jobline.ai/release.json` response reports `commitSha: unknown` and `deployTarget: local`, while the repository manifest expects commit `7c59f40229ba`.

## Not Yet Present Locally

- No archived ZAP HTML reports are present in `docs/approval/fedramp/evidence/`.
- No GitHub Security review timestamps are recorded locally yet.
- No signed approval record is attached for `docs/approval/fedramp/pentest-rules-of-engagement.md`.

## Operational Blockers Observed

- GitHub CLI is not installed on this workstation, so `gh`-based workflow and artifact retrieval could not be used.
- Latest GitHub Actions artifacts were not already downloaded into the repository workspace because the latest inspected run produced none.
- GitHub Actions billing/spending issues prevented the latest ZAP jobs from starting.
- The public `jobline.ai` domain is not currently serving the hardened deployment manifest or header set expected by the repository's `vercel.json` and `public/release.json`.
- Codacy MCP analyze attempts were made for the edited FedRAMP docs, but the calls failed with WSL initialization issues and `401` authentication errors, so no Codacy findings were available to remediate.

## Immediate Remaining Actions

1. Restore GitHub Actions billing/spending so the ZAP workflow can start jobs again.
2. Move `jobline.ai` back onto the hardened deployment path so the live site serves the security headers and release manifest expected by the repository.
3. Re-run the ZAP workflow and download the resulting `zap-baseline-report-*` and `zap-full-scan-report-*` artifacts from GitHub Actions.
4. Save the extracted HTML reports into `docs/approval/fedramp/evidence/` using the runbook naming convention.
5. Review GitHub Security -> Code Scanning for the same review window and record reviewer name and date in `dast-review-2026-04.md`.
6. Obtain Engineering Lead approval or signature for the active Rules of Engagement review window.
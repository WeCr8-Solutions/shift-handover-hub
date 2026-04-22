# DAST Completion Instructions

## Purpose

This guide explains exactly how to finish the remaining FedRAMP DAST completion work for the current review cycle.

Use this together with:

- `docs/approval/fedramp/dast-runbook.md`
- `docs/approval/fedramp/evidence/dast-review-2026-04.md`
- `docs/approval/fedramp/evidence/dast-review-supporting-notes-2026-04.md`
- `docs/approval/fedramp/poam.md`
- `docs/approval/fedramp/pentest-rules-of-engagement.md`

## What Is Already Done

- The DAST runbook matches the implemented OWASP ZAP workflow.
- The ConMon plan, roadmap, and POA&M were updated to reflect the real workflow behavior.
- The local evidence archive folder exists.
- The April 2026 review memo exists and already records the current blockers.

## What Is Still Required

To complete the April 2026 DAST review package, you still need to do all of the following:

1. Download the latest OWASP ZAP baseline HTML artifact from GitHub Actions.
2. Download the latest OWASP ZAP full-scan HTML artifact from GitHub Actions.
3. Record the workflow run IDs and URLs in the April review memo.
4. Review GitHub Security code-scanning findings for the same review window.
5. Update the April review memo with the reviewer name and review date.
6. Confirm whether any findings require a POA&M update.
7. Obtain Engineering Lead approval or signature for the active Rules of Engagement review window.

## Step 1 - Open the Correct GitHub Workflow

In GitHub, open the private repository:

- `WeCr8-Solutions/shift-handover-hub`

Then navigate to:

- `Actions`
- Workflow: `OWASP ZAP DAST Scan`

You are looking for the workflow defined by:

- `.github/workflows/zap-scan.yml`

If you cannot see the private repository or workflow runs, stop here and resolve GitHub access first.

## Step 2 - Identify the Latest Review Window Runs

Find the most recent workflow run that includes both of these jobs:

1. `ZAP Baseline Scan (Production)`
2. `ZAP Full Scan (Staging)`

Capture the following values for that run:

- baseline workflow run ID
- full-scan workflow run ID
- workflow run URL
- run date

If baseline and full-scan evidence must come from separate workflow runs, record both run URLs separately in the April review memo.

## Step 3 - Download the GitHub Actions Artifacts

From the selected run page:

1. Scroll to `Artifacts`
2. Download the artifact named like `zap-baseline-report-{run_id}`
3. Download the artifact named like `zap-full-scan-report-{run_id}`
4. Extract each zip file locally

Inside each artifact, locate:

- `report_html.html`
- `report_json.json`

Only the HTML report is required for the local FedRAMP evidence archive, but keep the JSON file available if you need to inspect details.

## Step 4 - Archive the HTML Reports in the Repo

Copy the extracted HTML files into:

- `docs/approval/fedramp/evidence/`

Rename them using this format:

1. `zap-baseline-YYYY-MM-DD.html`
2. `zap-full-scan-YYYY-MM-DD.html`

Example:

1. `zap-baseline-2026-04-22.html`
2. `zap-full-scan-2026-04-22.html`

After copying the files, confirm that this folder contains at least:

- `dast-review-2026-04.md`
- `dast-review-supporting-notes-2026-04.md`
- the baseline HTML report
- the full-scan HTML report

## Step 5 - Review GitHub Security Findings

In GitHub, go to:

- `Security`
- `Code scanning`

Filter by the ZAP tools:

1. `ZAP Baseline Scan`
2. `ZAP Full Scan`

For the review period, verify:

1. whether any active `FAIL` findings exist
2. whether any active `WARN` findings exist
3. whether the suppressed rules in `.zap/rules.tsv` still make sense

Expected currently documented suppressions:

1. `10015`
2. `10036`
3. `10055`

If you see a new confirmed finding:

1. open or update the relevant POA&M item in `docs/approval/fedramp/poam.md`
2. record the finding in `docs/approval/fedramp/evidence/dast-review-2026-04.md`

If no new confirmed findings exist:

1. record that the GitHub Security review was completed
2. note that no additional POA&M changes were required for this review window

## Step 6 - Update the April Review Memo

Open:

- `docs/approval/fedramp/evidence/dast-review-2026-04.md`

Update all remaining placeholders and incomplete checklist items.

At minimum, fill in:

1. `Baseline workflow run ID`
2. `Full-scan workflow run ID`
3. `Baseline workflow URL`
4. `Full-scan workflow URL`
5. `GitHub Security review completed by`
6. `Review date in GitHub Security`
7. archived baseline report filename
8. archived full-scan report filename
9. findings summary
10. reviewer sign-off block

Then flip these checklist items from incomplete to complete when true:

1. latest baseline HTML report downloaded and stored locally
2. latest full-scan HTML report downloaded and stored locally
3. GitHub Security findings reviewed for the period
4. Rules of Engagement approved for the review window
5. workflow run IDs recorded as evidence

## Step 7 - Confirm the Rules of Engagement Approval

Open:

- `docs/approval/fedramp/pentest-rules-of-engagement.md`

Confirm that the current review window has an approval record. That can be one of:

1. a signed version of the document
2. an internal approval record linked in the review memo
3. another formal sign-off record accepted by your review process

If approval exists:

1. mark the Rules of Engagement item complete in `dast-review-2026-04.md`
2. record where the approval is stored

If approval does not exist:

1. leave that blocker checked in the memo
2. route it to the Engineering Lead or approver immediately

## Step 8 - Decide Whether the April DAST Review Is Complete

The April DAST review package is complete for continuous-monitoring evidence only if all of the following are true:

1. both HTML reports are archived locally
2. both workflow run IDs and URLs are recorded
3. GitHub Security review is complete
4. reviewer sign-off is filled in
5. Rules of Engagement approval is documented for the review window

If all five are true:

1. clear the applicable blockers in `dast-review-2026-04.md`
2. update the reviewer sign-off section
3. treat the April DAST evidence package as complete for continuous-monitoring review

If any are still false:

1. leave the blocker section accurate
2. do not mark the review cycle complete
3. carry the missing item forward as an open operational task

## Step 9 - Keep the Boundary Clear

Do not mark G-04 fully complete just because the automated DAST package is complete.

G-04 remains open until the independent third-party penetration test is completed. The automated ZAP review package closes only the continuous-monitoring evidence portion, not the full CA-8 independent testing requirement.

## Quick Completion Checklist

- [ ] GitHub Actions run located
- [ ] Baseline artifact downloaded
- [ ] Full-scan artifact downloaded
- [ ] Baseline HTML archived locally
- [ ] Full-scan HTML archived locally
- [ ] GitHub Security review completed
- [ ] POA&M updated if needed
- [ ] Rules of Engagement approval confirmed
- [ ] `dast-review-2026-04.md` fully updated
- [ ] Reviewer sign-off completed

## Final File Set Expected

When this work is done, `docs/approval/fedramp/evidence/` should contain:

1. `dast-review-2026-04.md`
2. `dast-review-supporting-notes-2026-04.md`
3. `dast-completion-instructions.md`
4. `zap-baseline-YYYY-MM-DD.html`
5. `zap-full-scan-YYYY-MM-DD.html`

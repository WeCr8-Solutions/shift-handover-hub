# Backup & Restore Test Runbook

**Organization:** WeCr8 Solutions (JobLine AI)
**Version:** 1.0
**Date:** May 2026
**Classification:** Internal
**Owner:** Engineering Lead
**Review Cycle:** Quarterly (after every test)
**NIST Controls:** CP-4, CP-9, CP-10
**Companion Doc:** `backup-recovery-plan.md`, `iscp.md`
**POA&M:** Closes operational portion of G-15.

---

## 1. Purpose

The Backup & Recovery Plan (`backup-recovery-plan.md`) defines RTO/RPO targets and technical mechanisms (Supabase Point-In-Time Recovery, Vercel deployment rollback, signed-URL storage retention). This runbook closes the loop required by **CP-4** by defining a recurring **operational test** to prove backups are recoverable.

A backup that has never been restored is theory. CP-4 requires evidence.

---

## 2. Cadence

| Test | Frequency | Owner | Evidence |
|---|---|---|---|
| Database PITR sample restore (Test env) | **Quarterly** | Engineering Lead | `docs/approval/fedramp/evidence/restore-test-YYYY-Qn.md` |
| Database PITR full restore (Live → throwaway project) | **Annual** | Engineering Lead | Same path, marked `(annual)` |
| Storage object spot-restore (signed-URL retrieval of an old asset) | **Quarterly** | Engineering Lead | Embedded screenshot in quarterly evidence file |
| Vercel rollback drill (deploy old build, verify, redeploy current) | **Quarterly** | Engineering Lead | Embedded link to rollback deployment + verification |
| Tabletop walkthrough of full DR procedure | **Annual** | Engineering Lead + CEO | Stored alongside annual evidence file |

**Trigger:** First test = within 30 days of this runbook being approved. Subsequent tests on a calendar reminder (Engineering Lead's Notion).

---

## 3. RTO / RPO Targets (Reminder)

| Asset | RPO | RTO |
|---|---|---|
| Postgres (queue_items, work orders, handoffs, etc.) | 5 min (PITR retention 7 days) | 4 hours |
| Supabase Storage objects (resumes, manuals, attachments) | Immediate (versioned) | 1 hour spot, 8 hours bulk |
| Edge function code | Immediate (git is source of truth) | 30 min (redeploy) |
| Frontend | Immediate (Vercel atomic deploys) | 5 min (rollback) |

A test is **PASS** if recovery is observed within RTO and the restored sample is within RPO of the chosen recovery point.

---

## 4. Quarterly Test — Step-by-Step

### 4.1 Pre-test (T-15 min)

1. Open `backup-recovery-plan.md` and confirm RTO/RPO are unchanged. If changed, halt and update first.
2. Choose a recovery point: `now() - INTERVAL '6 hours'`. Record the exact UTC timestamp.
3. Note the current row count of three canary tables in **Live**:
   ```sql
   SELECT 'queue_items' AS t, count(*) FROM queue_items
   UNION ALL SELECT 'work_orders', count(*) FROM work_orders
   UNION ALL SELECT 'handoff_records', count(*) FROM handoff_records;
   ```

### 4.2 Database Sample Restore (Test env)

1. In Cloud → Lovable Cloud → Database → Backups, choose **Test** environment.
2. Trigger PITR to the recovery point chosen in 4.1.2.
3. Wait for restore to complete; record the elapsed minutes.
4. Connect to the restored Test DB and re-run the canary count query.
5. Confirm row counts are within ±5 minutes of the chosen recovery point's expected values (compare to a `pg_stat_user_tables` snapshot if available, or to the row created/updated timestamps).

**PASS criteria:** Restore completes within 4-hour RTO; canary tables exist and contain rows whose `updated_at` ≤ recovery point.

### 4.3 Storage Object Spot Restore

1. In Storage → `op-files`, locate any file uploaded ≥ 30 days ago.
2. Mint a fresh signed URL via Cloud View.
3. Open the signed URL — confirm the file downloads and renders.
4. Repeat for one file in `machine-manuals` and one in `ncr-attachments`.

**PASS criteria:** All three signed URLs return HTTP 200 with the expected content.

### 4.4 Vercel Rollback Drill

1. In Vercel → Deployments, identify the deployment immediately prior to the current production.
2. Click **Promote to Production**. Capture timestamp.
3. Open `https://www.jobline.ai`. Confirm the build hash in `/release.json` matches the rolled-back deployment.
4. Smoke-test login + landing page load.
5. Re-promote the original deployment. Capture rollback completion timestamp.

**PASS criteria:** Both promotions complete in < 5 min total. App functional after each.

### 4.5 Edge Function Recovery (sanity check)

1. Run `supabase functions list` (or check Cloud → Functions list).
2. Confirm count and names match `supabase/functions/` directory.
3. If any are missing, redeploy from the repo. Capture command output.

**PASS criteria:** All expected functions present and reachable (200/401 on a health probe).

### 4.6 Post-test

1. Write the evidence file `docs/approval/fedramp/evidence/restore-test-YYYY-Qn.md` using the template in §6 below.
2. Open POA&M; if any test failed, add an item with target remediation date ≤ next quarterly test.
3. Notify CEO via Slack #leadership with PASS/FAIL summary.
4. Update `iscp.md` "Last Tested" field with the test date.

---

## 5. Annual Test — Additions

In addition to §4, once per year:

- Restore Live PITR to a throwaway Supabase project (not Test, not Live). Verify schema parity, run canary queries, then delete the throwaway project. Capture screenshots of the restored project's dashboard.
- Conduct a tabletop with CEO + Engineering Lead simulating a full Supabase regional outage. Walk every step of `iscp.md` §5–§8 verbally; note time-to-decision at each branch.
- Update `incident-response-plan.md` if any tabletop assumption proved invalid.

---

## 6. Evidence Template

```markdown
# Restore Test — YYYY Qn

- **Date:** YYYY-MM-DD
- **Conductor:** {name}
- **Recovery point chosen:** YYYY-MM-DDTHH:MM:SSZ
- **Result:** PASS / FAIL
- **Notes:** {free text}

## Database PITR (Test)
- Restore start: HH:MM UTC
- Restore complete: HH:MM UTC
- Elapsed: {n} min
- Canary counts before / after: {numbers}
- Verdict: PASS / FAIL

## Storage spot restore
- Files tested: {3 paths}
- All HTTP 200: yes / no
- Verdict: PASS / FAIL

## Vercel rollback drill
- Rolled back to deployment: {hash}
- Verified live: yes / no
- Re-promoted to: {hash}
- Total elapsed: {n} min
- Verdict: PASS / FAIL

## Edge functions inventory
- Count expected: {n}
- Count present: {n}
- Verdict: PASS / FAIL

## Failures or POA&M items raised
- {none / list}

## Sign-off
- Engineering Lead: {name + date}
```

---

## 7. Failure Handling

If any §4 step FAILS:

1. Capture full error output (screenshots, logs).
2. Open a POA&M item the same day, severity = HIGH, target remediation = next quarterly test.
3. If the failure is a Supabase platform regression: file a Supabase support ticket and link the ticket from the POA&M.
4. If three consecutive quarterly tests fail any single subsystem: trigger a major-finding review with CEO and consider migration acceleration to GovCloud (G-00).

---

## 8. Review & Approval

| Field | Value |
|---|---|
| Author | Engineering Lead |
| Approved by | CEO |
| Initial issue | May 2026 |
| Next review | May 2027 |
| Related controls | CP-4, CP-9, CP-10 |
| Related docs | `backup-recovery-plan.md`, `iscp.md`, `incident-response-plan.md`, `continuous-monitoring-plan.md` |

# Backup and Recovery Plan
**Organization:** WeCr8 Solutions (JobLine AI)  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** Engineering Lead  
**Approved By:** CEO  
**Review Cycle:** Annual; after any recovery event  
**NIST Controls:** CP-9, CP-10, CP-4  

---

## 1. Purpose

This Backup and Recovery Plan defines the procedures for backing up JobLine AI system data, verifying backup integrity, and restoring operations following data loss or system failure. It fulfills NIST SP 800-53 Rev. 5 CP-9 (System Backup) and CP-10 (System Recovery and Reconstitution) controls.

---

## 2. Recovery Objectives

| Objective | Target | Basis |
|-----------|--------|-------|
| **RTO** (Recovery Time Objective) | 4 hours | Time to restore full operation after a disaster |
| **RPO** (Recovery Point Objective) | 24 hours | Maximum acceptable data loss window |
| **MTTR** (Mean Time to Recover) | < 2 hours | Target for standard restore operations |

---

## 3. System Components and Backup Responsibility

| Component | Backup Provider | Method | Frequency | Retention | Offsite? |
|-----------|----------------|--------|-----------|-----------|---------|
| PostgreSQL database (all tables) | Supabase (inherited) | Point-in-Time Recovery (PITR) | Continuous WAL streaming | 7 days (Pro plan) | ✅ Yes — AWS S3 (different AZ) |
| Supabase Storage (file objects) | Supabase (inherited) | S3 replication | Continuous | Per S3 bucket policy | ✅ Yes — AWS S3 |
| Supabase Auth (user accounts) | Supabase (inherited) | Database backup (above) | Per DB backup | 7 days | ✅ Yes |
| Supabase Edge Functions source | WeCr8 Solutions | Git (GitHub) | On every push | Indefinite (git history) | ✅ Yes — GitHub |
| React SPA source code | WeCr8 Solutions | Git (GitHub) | On every push | Indefinite (git history) | ✅ Yes — GitHub |
| Vercel deployment artifacts | Vercel (inherited) | Deployment history | On every deploy | 90 days | ✅ Yes — Vercel infra |
| Environment variables / secrets | WeCr8 Solutions | Supabase secrets + Vercel env | Manual update | N/A — stored in platform | ✅ Platform-managed |

---

## 4. Backup Procedures

### 4.1 Automated Backups (Supabase PITR — no manual action required)

Supabase Pro plan includes continuous WAL (Write-Ahead Logging) streaming to S3:
- **Full backups:** Nightly at 00:00 UTC  
- **WAL shipping:** Continuous (near-real-time for point-in-time recovery)  
- **Retention:** 7 days rolling window  
- **Location:** AWS S3, separate availability zone from primary database  

No manual action is required for daily backups. Verify backup status monthly via Supabase dashboard → Project Settings → Backups.

### 4.2 On-Demand Backups (before major migrations)

Before any database schema migration or major deployment:

```bash
# Create Supabase database backup via CLI
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Upload to secure storage (replace with actual destination)
# Store in a location accessible to at least two team members
```

On-demand backups must be:
- Created before any migration that modifies table structure or deletes data
- Stored for a minimum of 30 days
- Accessible to at least CEO and Engineering Lead

### 4.3 Source Code (GitHub)

All application source code is maintained in Git with full history. No additional backup is required beyond standard GitHub repository redundancy. For critical branches, periodic local clones may be maintained.

---

## 5. Recovery Procedures

### 5.1 Database Point-in-Time Recovery (PITR)

For data corruption or accidental deletion:

1. **Assess scope:** Identify what data was lost/corrupted and the timestamp of the last known-good state.
2. **Initiate PITR:** Via Supabase dashboard → Project → Backups → Point in Time Recovery  
   - Select target timestamp (must be within 7-day retention window)
   - Confirm the time to avoid restoring to an erroneous state
3. **Validate restore:** After restore completes:
   - Verify row counts in key tables (`organizations`, `users`, `handoffs`, `work_orders`)
   - Verify RLS policies are intact (run `/rls-health` Edge Function)
   - Verify auth users match database users
4. **Notify affected customers:** Per the IRP notification procedures if customer data was affected
5. **Document:** Record the incident, cause, restore point selected, and outcome in the POA&M

**Expected restore time:** 30–90 minutes depending on database size and target timestamp.

### 5.2 Full System Recovery (Disaster Scenario)

In the event of catastrophic failure (Supabase project unavailable, migration failure requiring new project):

1. **Create new Supabase project:** New project in same region (AWS us-east-1)
2. **Restore database:** Use most recent PITR backup or on-demand backup SQL file
3. **Restore Edge Functions:** Re-deploy from GitHub repository
4. **Update environment variables:** Re-configure all secrets in new project
5. **Update Vercel:** Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel settings; trigger redeploy
6. **Validate:** Run through smoke test checklist:
   - Authentication works (login, MFA enrollment)
   - Org data visible to org members, not to others
   - Audit logging working (`activity_logs` table populating)
   - Key Edge Functions responding (check-subscription, process-notifications)
7. **DNS / routing:** Update any custom domain settings if applicable

**Expected recovery time:** 2–4 hours.

### 5.3 Frontend-Only Recovery

If only the Vercel deployment fails (not Supabase):

1. Re-deploy from GitHub via Vercel dashboard or `git push` to main branch
2. Vercel redeploys automatically within 2–5 minutes

### 5.4 Electron Self-Hosted Recovery

For customers running the self-hosted Electron path:
- Recovery is the customer's responsibility for their Supabase instance
- WeCr8 Solutions provides recovery documentation in `desktop/docs/`
- Engineering Lead available to assist via support channel

---

## 6. Backup Verification (CP-4)

Backup restores must be tested on the following schedule:

| Test Type | Frequency | Method | Owner |
|-----------|-----------|--------|-------|
| PITR restore test (non-production) | Quarterly | Restore to staging environment; validate row counts | Engineering Lead |
| Full system recovery drill | Annually | Simulate full recovery to new project; measure actual RTO | Engineering Lead + CEO |
| Source code verify | On every backup | Git history integrity — automatic via GitHub | Automatic |

Test results are documented in restore test evidence files at `docs/approval/fedramp/evidence/backup-restore-test-YYYY-QN.md`.

**Next scheduled test:** Q3 2026

---

## 6a. Quarterly Backup Restore Test Procedure (CP-4)

This procedure satisfies CP-4 (Testing of Contingency Plan) by ensuring that JobLine AI's backup and restore capabilities are verified on a quarterly basis. Each completed test produces an evidence file referenced in the POA&M.

### Pre-Test Checklist

Before conducting the test, confirm:

- [ ] Supabase PITR is active on the project (Settings → Database → Point in Time Recovery)
- [ ] Staging environment (`dev.jobline.ai` or a dedicated restore project) is available and isolated from production data
- [ ] You have Supabase project owner access (required to initiate a restore)
- [ ] Lead Engineer is available for the full test window (allow 2 hours)
- [ ] Incident Response team is notified that a scheduled restore test is in progress
- [ ] No production deployments are scheduled during the test window
- [ ] Evidence template is ready: `docs/approval/fedramp/evidence/backup-restore-test-YYYY-QN.md`

### Procedure — Table-Level PITR Restore to Staging

1. **Log in to Supabase dashboard** → select the production project → navigate to **Settings → Backups**.
2. **Select restore point:** Choose a timestamp from 24–72 hours prior to confirm the backup window covers the RPO target (24 hours).
3. **Initiate restore to staging project:**
   - Click **Restore to new project** (or use the Supabase CLI: `supabase db restore --target <staging-project-ref> --timestamp <ISO8601>`)
   - Do NOT restore to the production project ref.
4. **Wait for restore completion** — typically 10–30 minutes depending on database size. Monitor the restore status in the Supabase dashboard.
5. **Validate data integrity:**
   ```sql
   -- Run against the restored staging project
   SELECT table_name, COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public' GROUP BY table_name ORDER BY table_name;

   -- Spot-check row counts on critical tables
   SELECT COUNT(*) FROM handoff_records;
   SELECT COUNT(*) FROM queue_items;
   SELECT COUNT(*) FROM organizations;
   SELECT COUNT(*) FROM profiles;
   ```
6. **Record actual RTO:** Note the elapsed time from restore initiation to confirmed data access.
7. **Verify RLS policies are intact** — connect as a test user and confirm org-scoped data isolation.
8. **Tear down the restore project** after validation is complete to avoid cost accumulation.

### Pass / Fail Criteria

| Criterion | Pass | Fail |
|-----------|------|------|
| Restore completes without error | Supabase reports success | Restore fails or times out |
| Row counts match pre-restore baseline (within 1%) | ✅ | > 1% discrepancy |
| RLS policies enforced on restored data | ✅ | Cross-org data visible |
| Actual RTO ≤ 4 hours | ✅ | Exceeds 4-hour RTO target |
| Restore point was within 24-hour RPO window | ✅ | Earliest available backup > 24h old |

If any **Fail** criterion is hit, open a P2 Incident per the IRP and create a POA&M item for CP-4.

### Post-Test Documentation

After each test, create an evidence file:

```
docs/approval/fedramp/evidence/backup-restore-test-YYYY-QN.md
```

The file must include:
- Date and time of test
- Restore point timestamp selected
- Tester name and role
- Actual elapsed time (RTO measurement)
- Row count comparison table (before vs after)
- Pass/Fail result per criterion above
- Any findings or anomalies
- Signature (or Git commit) of Engineering Lead

Commit the evidence file to the repository with message: `evidence: backup restore test YYYY-QN — pass/fail`

### Quarterly Schedule

| Quarter | Target Month | Due Date |
|---------|-------------|----------|
| Q1 | March | March 31 |
| Q2 | June | June 30 |
| Q3 | September | September 30 |
| Q4 | December | December 31 |

The Engineering Lead is responsible for scheduling and executing each test. Results are reviewed annually as part of the FedRAMP ConMon review cycle.

---

## 7. Offsite Storage Verification

Supabase stores PITR backups in AWS S3 in a separate availability zone. This constitutes offsite storage per NIST CP-9 requirements. Verification steps:
1. Monthly: Confirm via Supabase dashboard that backups are current and within retention window
2. Quarterly: As part of PITR restore test, confirm backup was successfully retrieved from S3

---

## 8. Notification and Escalation

| Event | Notification |
|-------|-------------|
| Backup failure detected | Engineering Lead within 2 hours; CEO within 4 hours |
| Recovery initiated (any reason) | CEO within 1 hour |
| Customer data potentially affected by recovery | Follow IRP notification procedures |
| Recovery complete | CEO + affected customers (if applicable) |

---

## 9. FedRAMP Continuity Notes

After infrastructure migration to AWS GovCloud (G-00):
- The PITR configuration and retention windows must be re-established in the new environment
- RTO/RPO targets remain the same (4h / 24h)
- All backup verification tests must be repeated in the new environment before FedRAMP assessment

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-11) |

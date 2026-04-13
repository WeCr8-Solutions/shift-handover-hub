# Information System Contingency Plan (ISCP)
**Organization:** WeCr8 Solutions (JobLine AI)  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** CEO / Engineering Lead  
**Review Cycle:** Annual; after each contingency event or test  
**NIST Controls:** CP-1, CP-2, CP-3, CP-4, CP-7, CP-9, CP-10  
**SSP Location:** Appendix G  

---

## 1. Purpose and Scope

This Information System Contingency Plan (ISCP) establishes procedures for WeCr8 Solutions to recover the JobLine AI system in the event of an unexpected outage, data disruption, or disaster. It provides:
- Roles and responsibilities for recovery operations
- Prioritized recovery procedures for each system component
- Alternate processing provisions
- Recovery time and recovery point objectives

**System:** JobLine AI (shift-handover-hub)  
**Authorization Boundary:** Vercel-hosted React SPA + Supabase-hosted PostgreSQL + Supabase Edge Functions  
**Date of Last Test:** See Section 8 (test schedule; initial test planned Q3 2026)

---

## 2. Business Impact Analysis (BIA)

### 2.1 Mission-Critical Functions

| Function | Description | Maximum Tolerable Downtime (MTD) |
|----------|-------------|----------------------------------|
| Shift handover note creation | Core workflow — teams log work state between shifts | 24 hours |
| Shift handover note viewing | Operators read prior shift notes | 24 hours |
| Authentication / login | Access to the application | 4 hours |
| Work order management | Create, update, and manage work orders | 48 hours |
| Admin dashboard / org management | Org-level settings, users, billing | 72 hours |

### 2.2 Recovery Objectives

| Objective | Target |
|-----------|--------|
| **Recovery Time Objective (RTO)** | 4 hours (from incident declaration to service restoration) |
| **Recovery Point Objective (RPO)** | 24 hours (maximum acceptable data loss window) |

These objectives are consistent with the Backup and Recovery Plan (`docs/approval/fedramp/backup-recovery-plan.md`), which provides operational PITR procedures.

---

## 3. Roles and Responsibilities (CP-2, CP-3)

| Role | Person | Responsibilities |
|------|--------|-----------------|
| Contingency Plan Coordinator | CEO | Declare contingency, coordinate recovery, customer communications |
| Technical Recovery Lead | Engineering Lead | Execute technical recovery procedures, coordinate with vendors |
| Vendor Liaison | Engineering Lead | Interface with Supabase support, Vercel support |
| Communications Lead | CEO | Notify customers, stakeholders, and (post-ATO) agency POC |

---

## 4. Activation Criteria

The ISCP is activated when any of the following conditions are met:

| Condition | Description |
|-----------|-------------|
| Production database unavailable | Supabase PostgreSQL cluster is down or unreachable |
| Authentication failure | Users cannot log in; Supabase Auth service unresponsive |
| Application unavailable | Vercel deployment is inaccessible; DNS not resolving |
| Data corruption detected | Database data integrity failure; mass data loss detected |
| Security incident requiring isolation | Supabase project isolated due to active breach (see IRP) |
| Extended outage > 2 hours | Any core function unavailable for more than 2 continuous hours |

**Activation Authority:** CEO or Engineering Lead (either may activate independently).

---

## 5. System Description

### 5.1 System Components

| Component | Technology | Hosting | FedRAMP Authorized? |
|-----------|-----------|---------|---------------------|
| Frontend SPA | React 18 / TypeScript / Vite | Vercel | No (G-00 blocker) |
| Database | PostgreSQL 15 | Supabase (AWS us-east-1) | No (G-00 blocker) |
| Authentication | Supabase Auth (JWT + TOTP MFA) | Supabase | No |
| Edge Functions | Deno (TypeScript) | Supabase | No |
| Desktop App | Electron 33.2.0 | Self-hosted / end-user machine | N/A |
| Source Code | GitHub repository | GitHub (FedRAMP Moderate ✅) | Yes |

### 5.2 System Dependencies

| Dependency | Purpose | Criticality | Alternate Available? |
|------------|---------|------------|----------------------|
| Supabase | Database + Auth + Edge Functions | Critical | Yes — see Section 6 |
| Vercel | Frontend hosting + CDN | Critical | Yes — see Section 6 |
| GitHub | Source code + CI/CD | High | Yes (local code copies) |
| Resend / SendGrid | Transactional email | Medium | Yes (backup SMTP) |
| Stripe | Billing / subscription | Medium | No (billing paused during outage) |
| LLM API (OpenAI / Anthropic) | AI features | Low | N/A (non-critical feature) |

---

## 6. Alternate Processing Site (CP-7)

### 6.1 Database and Backend (Supabase)

**Primary:** Supabase project `[project-id]`, AWS us-east-1.  
**Alternate:** A new Supabase project can be provisioned in a different AWS region (e.g., us-west-1) within approximately 2 hours.

**Alternate Activation Steps:**
1. Create new Supabase project in target region.
2. Restore latest database backup (PITR or daily backup file) to new project.
3. Redeploy all Edge Functions via Supabase CLI (`supabase functions deploy --project-ref <new-id>`).
4. Export and re-import Auth users if needed (Supabase Auth export).
5. Update Vercel environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to point to new project.
6. Trigger Vercel redeploy.

**Estimated time:** 2–3 hours.

### 6.2 Frontend (Vercel)

**Primary:** Vercel project `shift-handover-hub` on Vercel's global CDN.  
**Alternate:** The React SPA can be built and deployed to an alternate static host (Netlify, AWS S3 + CloudFront, or any static host) within approximately 1 hour.

**Alternate Activation Steps:**
1. Clone repository to local machine (or use GitHub Actions to build).
2. Run `npm run build` to generate static assets in `dist/`.
3. Deploy `dist/` to alternate static host.
4. Update DNS (CNAME for `jobline.ai`) to point to alternate host.

**Estimated time:** 1 hour from decision to live alternate site.

---

## 7. Recovery Procedures

### 7.1 Scenario A: Full Supabase Outage (Supabase Platform Down)

**Impact:** Login fails, no data access, Edge Functions unavailable.

| Step | Action | Owner | Time |
|------|--------|-------|------|
| 1 | Confirm Supabase outage on status.supabase.com | Engineering Lead | 5 min |
| 2 | Post status update to internal Slack / communication channel | CEO | 15 min |
| 3 | If outage < 4 hours: wait and monitor; implement communication plan | CEO | Ongoing |
| 4 | If outage > 4 hours: begin alternate site activation (Section 6.1) | Engineering Lead | T+4h |
| 5 | Notify customers via email/status page that operations are impaired | CEO | T+30 min |
| 6 | After Supabase recovery: validate data integrity, test auth, test key workflows | Engineering Lead | 30 min |
| 7 | Confirm recovery; update status page; notify customers | CEO | 30 min |

### 7.2 Scenario B: Vercel Frontend Outage

**Impact:** Users cannot access the application; API and data are intact.

| Step | Action | Owner | Time |
|------|--------|-------|------|
| 1 | Confirm Vercel outage on vercel-status.com | Engineering Lead | 5 min |
| 2 | If outage < 2 hours: wait; notify customers | CEO | Ongoing |
| 3 | If outage > 2 hours: deploy to Netlify or AWS S3 (dist/ artifacts) | Engineering Lead | T+2h |
| 4 | Update DNS to alternate host | Engineering Lead | 30 min |
| 5 | Validate application loads and users can log in | Engineering Lead | 15 min |
| 6 | Notify customers of service restoration | CEO | 15 min |

### 7.3 Scenario C: Data Corruption or Mass Data Loss

**Impact:** Database data integrity failure, accidental deletion, or ransomware.

| Step | Action | Owner | Time |
|------|--------|-------|------|
| 1 | Immediately **isolate** — pause Edge Functions, revoke service role key if compromised | Engineering Lead | 15 min |
| 2 | Notify CEO; escalate to Incident Response Plan if security incident involved | Engineering Lead | 15 min |
| 3 | Determine scope of corruption (specific tables, all data, time window) | Engineering Lead | 30 min |
| 4 | Use Supabase PITR to identify last known good state (see Backup & Recovery Plan) | Engineering Lead | 30 min |
| 5 | Initiate PITR restore to last known good point | Engineering Lead | 1–2 h |
| 6 | Validate data integrity: spot-check key tables, confirm RLS policies intact | Engineering Lead | 30 min |
| 7 | Re-enable edge functions; notify customers of recovery & data window | CEO | 30 min |
| 8 | Conduct root cause analysis; implement preventive controls | Engineering Lead | 24 h |

### 7.4 Scenario D: Security Breach Requiring System Isolation

**Impact:** Malicious activity detected; system must be isolated to prevent further damage.

1. Follow Incident Response Plan (`docs/approval/fedramp/incident-response-plan.md`).
2. Revoke all service role keys immediately.
3. Isolate Supabase project (Supabase → Settings → "Pause Project").
4. Preserve all logs for forensic analysis before any recovery actions.
5. Perform full PITR restore to pre-incident state from validated backup.
6. Rotate all keys and secrets before bringing the system back online.
7. Complete post-incident review before restoring customer access.

---

## 8. Contingency Plan Testing (CP-4)

| Test Type | Frequency | Target |
|-----------|-----------|--------|
| Tabletop exercise | Annual | Review ISCP, walk through each scenario, update contact list |
| Database PITR restore test | Quarterly | Restore backup to a test Supabase project; validate data integrity |
| Frontend alternate deployment test | Annual | Deploy `dist/` to Netlify/S3; validate application loads |
| Full DR simulation | Annual | Simulate Scenario A or C end-to-end |

### Test Schedule

| Test | Planned Date | Status |
|------|-------------|--------|
| First PITR restore test | Q3 2026 | Not yet scheduled |
| First tabletop exercise | Q3 2026 | Not yet scheduled |
| First frontend alternate deployment test | Q4 2026 | Not yet scheduled |

> **Process:** After each test, update this document with lessons learned, and update the POA&M (`docs/approval/fedramp/poam.md`) to reflect any new gaps discovered.

---

## 9. Communications During Contingency

| Audience | Channel | Who Communicates | Timing |
|----------|---------|-----------------|--------|
| Internal team | Slack / text | CEO | Immediately upon activation |
| Customers | Email + status page | CEO | Within 30 minutes of activation |
| Agency POC (post-ATO only) | Direct email/phone | CEO | Per agency agreement (typically within 1 hour for P1) |
| Supabase support | support.supabase.com ticket | Engineering Lead | Immediately for P1 outages |

---

## 10. Document Maintenance

This ISCP is reviewed and updated:
- Annually (regardless of events)
- After any contingency event or DR test
- When system architecture changes significantly
- When new recovery procedures are identified

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-21) |

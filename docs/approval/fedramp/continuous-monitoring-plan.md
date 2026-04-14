# Continuous Monitoring Plan — SSP Appendix N
**System:** JobLine AI  
**Organization:** WeCr8 Solutions LLC  
**Version:** 1.0  
**Date:** April 13, 2026  
**NIST Reference:** NIST SP 800-137, NIST SP 800-53 Rev. 5 (CA-7, SI-4, RA-5, AU-6)  
**FedRAMP Reference:** FedRAMP Continuous Monitoring Strategy Guide (v3.3)  
**Owner:** Engineering Lead / designated ISSO  
**Review Cycle:** Annual review; updated after each significant control change

---

## 1. Purpose and Scope

This Continuous Monitoring Plan (ConMon Plan) defines the strategy, procedures, and frequency by which WeCr8 Solutions maintains ongoing situational awareness of the security posture of **JobLine AI**. It satisfies the FedRAMP Continuous Monitoring (ConMon) requirement that all Cloud Service Providers (CSPs) maintain an active, evidence-based security monitoring program following any FedRAMP assessment.

**System Boundary:** All components within the JobLine AI authorization boundary as defined in the Integrated Inventory Workbook (Appendix M):

- Supabase platform services (PostgreSQL, Auth, Edge Functions, Realtime, Storage)
- Vercel frontend CDN and edge routing
- JobLine web application (React SPA)
- JobLine Desktop (Electron)
- GitHub Actions CI/CD pipeline
- Third-party integrations within boundary (LLM API, Stripe)

**Authorization Stage:** This plan is written in anticipation of FedRAMP Moderate equivalency pursuit. All monitoring controls below are implemented as part of the current security posture and will be maintained continuously after any ATO.

---

## 2. Continuous Monitoring Strategy Overview

WeCr8 Solutions employs a risk-based continuous monitoring strategy aligned with NIST SP 800-137. The strategy addresses three core objectives:

1. **Define** — Establish a security monitoring program with defined metrics, frequencies, and ownership
2. **Collect** — Automate and operationalize data collection from security controls
3. **Analyze and Report** — Analyze security metrics, report findings, and escalate as required

### 2.1 Monitoring Tiers

| Tier | Scope | Frequency | Responsible Party |
|------|-------|-----------|------------------|
| Tier 1 — Automated Scanning | Vulnerabilities, secrets, dependencies | Weekly (CI) + event-driven | Engineering / CI pipeline |
| Tier 2 — Log Review | Audit logs, authentication events, anomalies | Daily (automated alerts) + weekly human review | Engineering Lead |
| Tier 3 — Control Assessment | Security control efficacy review | Quarterly | Engineering Lead / ISSO |
| Tier 4 — Annual Review | Full control set re-assessment | Annual | ISSO + leadership |

---

## 3. Vulnerability Scanning and Management

### 3.1 Automated Dependency Scanning (RA-5, SI-2)

**Tool:** Trivy (via GitHub Actions `security-scan.yml` workflow) + npm audit  
**Frequency:** Weekly scheduled scan (Monday 08:00 UTC) + triggered on every pull request  
**Scope:** All npm production and development dependencies; Dockerfile and IaC configurations  
**Output:** SARIF report uploaded as GitHub Actions artifact (90-day retention); critical/high findings fail the CI build

**SLA for remediation (per VMP):**

| Severity | CVSS Score | SLA |
|----------|-----------|-----|
| Critical | 9.0–10.0 | Remediate before next deploy; max 24 hours |
| High | 7.0–8.9 | 7 calendar days |
| Medium | 4.0–6.9 | 30 calendar days |
| Low | <4.0 | 90 calendar days |
| Informational | N/A | Track in POA&M; no fixed SLA |

### 3.2 Secret / Credential Scanning (IA-5, SC-28)

**Tool:** Trivy secret scanner (GitHub Actions)  
**Frequency:** On every pull request and weekly scheduled scan  
**Scope:** Full repository scan for API keys, tokens, private keys, credentials  
**Response:** Any confirmed secret finding triggers immediate incident response (per IRP); secret rotated within 2 hours of confirmation

### 3.3 Static Application Security Testing — SAST  (SA-11, SI-10)

**Tool:** Codacy (integrated with GitHub pull request workflow)  
**Frequency:** On every pull request  
**Scope:** TypeScript/JavaScript source code; SQL in migration files  
**Output:** Pull request annotations; findings block merge for critical security issues

### 3.4 Software Bill of Materials (SR-3, SA-12)

**Tool:** Syft (CycloneDX format), executed in `release.yml` GitHub Actions workflow  
**Frequency:** On every tagged release  
**Storage:** `docs/releases/sbom/` directory; also uploaded as GitHub Releases artifact  
**Purpose:** Supports supply chain risk management (G-22 SCRMP) and vulnerability triage

---

## 4. Security Log Collection and Review (AU-6, AU-12, SI-4)

### 4.1 Application Audit Logs

**Source:** `activity_logs` table in Supabase PostgreSQL  
**Events captured:**

| Event Category | Events Logged |
|---------------|--------------|
| Authentication | Login success/failure, MFA enrollment, session creation/revocation, OAuth callbacks |
| Authorization | Role assignment changes, RLS access denials, privilege escalation |
| Data Access | Handoff note reads/writes, work order CRUD, NCR creation |
| Administration | Org settings changes, user invite/removal, billing changes |
| AI Activity | AI planning assistant invocations (model, input token count, org) |
| Security Events | Invite code generation/redemption, password resets, failed auth attempts |

**Retention:** 90 days in hot storage (Supabase); exported to cold storage for 1-year retention (per AU-11)  
**Access:** Admin role only; RLS policies enforce org-scoped access

### 4.2 Infrastructure Logs

**Vercel:** Deployment logs, edge function execution logs, error rate by route  
**Supabase:** Database slow query logs, RLS evaluation logs, auth service logs  
**GitHub Actions:** CI build logs retained for 90 days

### 4.3 Log Review Cadence

| Review Type | Frequency | Reviewer | Output |
|------------|-----------|----------|--------|
| Automated anomaly alerts | Real-time | Engineering (on-call rotation) | Incident ticket if triggered |
| Authentication anomaly review | Daily | Engineering Lead | Exception log |
| Full audit log spot-check | Weekly | Engineering Lead | Weekly summary memo |
| Log completeness verification | Monthly | ISSO | Monthly ConMon report |

### 4.4 SIEM Integration (Forward-Looking)

Per G-07 (roadmap), SIEM log export integration via Supabase webhook → edge function → configurable SIEM endpoint is planned for Q3 2026. Upon deployment, logs will be forwarded in CEF format to customer-configured SIEM (Splunk, QRadar, Microsoft Sentinel) for agency-side correlation.

---

## 5. Configuration Management Monitoring (CM-3, CM-6, CM-7)

### 5.1 Infrastructure Configuration

**Version control:** All Supabase migration files, Edge Function source, Vercel configuration (`vercel.json`), and Vite/build configuration are maintained in the GitHub repository under version control.

**Drift detection:** No unauthorized changes can be deployed outside the GitHub Actions pipeline (branch protection rules require PR approval; direct push to `main` is restricted).

**Configuration baseline:** Documented in `docs/approval/fedramp/configuration-management-plan.md`

### 5.2 Change Control Monitoring

All production changes flow through the following process monitored for compliance:

```
Feature branch → Pull Request → Codacy SAST + Trivy scan → Peer review → Merge →
Vercel auto-deploy → Supabase migration apply (manual for schema changes)
```

**Emergency changes:** Hotfix path requires post-deployment PR and retroactive review within 24 hours (documented in CMP).

### 5.3 Environment Variable / Secret Rotation

| Secret | Rotation Frequency | Owner |
|--------|--------------------|-------|
| Supabase service role key | Annually or on suspected compromise | Engineering Lead |
| Supabase JWT secret | Annually or on suspected compromise | Engineering Lead |
| LLM API key | Per provider recommendation / annually | Engineering Lead |
| Stripe webhook secret | Annually or on key rotation | Engineering Lead |

---

## 6. Plan of Action & Milestones (POA&M) Management (CA-5)

**Document:** `docs/approval/fedramp/poam.md`  
**Update frequency:** Monthly (within 5 business days of end of month)  
**Process:**

1. Review all open POA&M items at start of each month
2. Update status of each item (On Track / Delayed / Complete)
3. Add any new findings from automated scans or incident response
4. Escalate any items where SLA is at risk to Engineering Lead for re-prioritization
5. Close items with documented evidence only (scan report, test result, code commit reference)

**FedRAMP ConMon submission:** After ATO — POA&M submitted to FedRAMP PMO monthly via the FedRAMP secure repository.

---

## 7. Incident Response Integration (IR-6, IR-8)

Security incidents detected through monitoring are handled per the **Incident Response Plan (IRP):** `docs/approval/fedramp/incident-response-plan.md`

**Incident triggers from monitoring:**

| Monitoring Source | Trigger | Response |
|------------------|---------|----------|
| Trivy / npm audit | Critical CVE in production dependency | P1 Incident — remediate within 24h |
| Secret scanner | Confirmed credential exposure | P1 Incident — rotate immediately |
| Auth logs | >10 failed logins for single account in 5 min | P2 Incident — account lockout review |
| Supabase alerts | Database error rate >5% | P2 Incident — engineering triage |
| Audit logs | Unexpected admin privilege use | P2 Incident — engineering review |
| VDP report | External vulnerability disclosure | Per VDP response timeline |

**FedRAMP reporting:** Incidents involving confirmed breach of federal data require notification to the sponsoring agency ISSO within **1 hour** of confirmation (FedRAMP IR reporting requirement).

---

## 8. Security Control Assessment (CA-2, CA-7)

### 8.1 Quarterly Control Reviews

Each quarter, the Engineering Lead and ISSO conduct a focused review of a rotating subset of NIST 800-53 controls:

| Quarter | Control Families Reviewed |
|---------|--------------------------|
| Q1 | AC, IA, AU |
| Q2 | SC, SI, CM |
| Q3 | IR, CP, RA |
| Q4 | SA, SR, PL, PS, AT, MA, MP, PE, CA, PM |

**Output:** Control review memo documenting: control objective, current implementation, any gaps found, remediation items added to POA&M.

### 8.2 Annual Security Assessment

An annual internal security assessment is conducted covering all 323 Moderate baseline controls. This assessment:

- Verifies all SSP Appendix A implementation statements remain accurate
- Identifies any control implementation drift
- Drives annual POA&M refresh
- Produces an Annual Assessment Report (AAR) for ISSO review

**After 3PAO engagement:** Annual assessment includes independent testing by 3PAO per FedRAMP ConMon requirements.

### 8.3 Penetration Testing

Per G-04 (roadmap), an independent penetration test by a CREST/OSCP-certified firm is planned for Q3 2026. Following the initial assessment:

- Annual re-test (web application + API surface)
- Bi-annual re-test (Electron desktop app)
- Penetration test reports maintained in secure internal document store (not committed to public repository)

---

## 9. Reporting and Metrics (CA-7, PM-6)

### 9.1 Monthly ConMon Report

Produced within 5 business days of end of each month. Contains:

- Number of vulnerabilities found (by severity) vs. remediated
- Outstanding POA&M items and current status
- Scan completion confirmation (Trivy, npm audit, Codacy)
- Any security incidents and resolution status
- Authentication anomalies reviewed
- Configuration changes deployed during the month

**Distribution:** Internal — Engineering Lead, CEO. After ATO — submitted to sponsoring agency ISSO.

### 9.2 Key Security Metrics Dashboard

| Metric | Target | Review Frequency |
|--------|--------|-----------------|
| Critical/High CVEs unresolved >SLA | 0 | Weekly |
| POA&M items open beyond milestone | <5 | Monthly |
| Failed CI security scans (unresolved) | 0 | Weekly |
| Authentication anomaly events | Tracked; trend review | Weekly |
| Mean time to remediate (MTTR) — Critical | <24 hours | Monthly |
| Mean time to remediate (MTTR) — High | <7 days | Monthly |

### 9.3 FedRAMP ConMon Deliverables (Post-ATO)

| Deliverable | Frequency | Submission |
|-------------|-----------|------------|
| POA&M | Monthly | FedRAMP secure repository |
| Vulnerability scan results | Monthly | FedRAMP secure repository |
| ConMon report | Monthly | Sponsoring agency ISSO |
| Annual security assessment | Annually | FedRAMP secure repository |
| Significant change notification | As needed | FedRAMP PMO within 30 days |

---

## 10. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| **ISSO (Engineering Lead)** | Owns ConMon program; signs off monthly reports; escalates unresolved findings to CEO |
| **Engineering Team** | Executes automated scans; remediates findings within SLA; maintains CI pipeline integrity |
| **CEO / Authorizing Official (AO)** | Reviews and approves annual assessment; authorizes significant changes; accepts residual risk |
| **3PAO (after engagement)** | Independent testing and validation of control implementations; annual assessment |

---

## 11. Significant Change Management

Any significant change to the JobLine AI system boundary, architecture, or control implementation requires:

1. **Notice to AO** — Engineering Lead notifies CEO at least 30 days in advance
2. **Control impact analysis** — Which NIST 800-53 controls are affected?
3. **SSP update** — Appendix A implementation statements updated before change goes live
4. **Post-ATO: Notice to FedRAMP PMO** — Submitted within 30 days of change

**Examples of significant changes:**

- Infrastructure migration (Supabase → AWS GovCloud) — G-00
- Addition of new external service with access to federal data
- Major authentication architecture change (e.g., adding SAML SSO — G-06)
- Change to encryption algorithms or key management

---

## 12. Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial ConMon Plan — pre-3PAO |

---

*This document satisfies FedRAMP SSP Appendix N (Continuous Monitoring Plan). Aligned with NIST SP 800-137, NIST SP 800-53 Rev. 5 CA-7, and FedRAMP Continuous Monitoring Strategy Guide v3.3.*

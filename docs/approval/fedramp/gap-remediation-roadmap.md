# JobLine AI — Enterprise & FedRAMP Gap Remediation Roadmap
**Version:** 1.0  
**Date:** April 2026  
**Owner:** WeCr8 Solutions Engineering + Leadership  
**Linked To:** General Atomics ITS General Vendor Questionnaire Response  

> This document defines the prioritized remediation plan for all gaps identified during the General Atomics vendor questionnaire response. Items are organized by phase, effort, and business impact.

---

## Gap Summary

| ID | Gap | Category | Priority |
|----|-----|----------|----------|
| G-01 | FedRAMP Moderate authorization | Compliance | 🔴 CRITICAL (long-term) |
| G-02 | FedRAMP Moderate equivalency (3PAO) | Compliance | 🔴 CRITICAL (mid-term) |
| G-03 | Software Bill of Materials (SBOM) generation | Supply Chain Security | 🟠 HIGH |
| G-04 | Third-party penetration testing | Security Assurance | 🟠 HIGH |
| G-05 | Bug bounty / responsible disclosure program | Security Assurance | 🟠 HIGH |
| G-06 | Active Directory / SAML 2.0 SSO | Identity | 🟠 HIGH |
| G-07 | SIEM log export integration | Operations | 🟡 MEDIUM |
| G-08 | Formal written security program | Documentation | 🟡 MEDIUM |
| G-09 | Formal incident response plan (IRP) | Documentation | 🟡 MEDIUM |
| G-10 | Formal vulnerability management program (VMP) | Documentation | 🟡 MEDIUM |
| G-11 | Formal backup and recovery plan | Documentation | 🟡 MEDIUM |
| G-12 | AI opt-out UX (explicit org-level toggle) | Product | 🟡 MEDIUM |
| G-13 | Prompt injection detection controls | AI Security | 🟡 MEDIUM |
| G-14 | AI data retention policy document | Documentation | 🟡 MEDIUM |
| G-15 | Penetration test SLA (backup restore test cadence) | Operations | 🟢 LOW |
| G-16 | Status page (jobline.ai uptime statistics) | Operations | 🟢 LOW |

---

## Phase 1 — Quick Wins (2–4 weeks, low cost)
*Documentation and process gaps. These can be done immediately with internal resources and dramatically improve questionnaire responses.*

### G-08: Formal Security Program Document

**What:** A written information security policy covering access control, data classification, acceptable use, incident response, and audit requirements.

**Actions:**
- [ ] Draft security program document (template from NIST 800-53 Moderate control families)
- [ ] Cover: Access Control (AC), Audit & Accountability (AU), Identification & Authentication (IA), System & Communications Protection (SC), Risk Assessment (RA)
- [ ] Get internal sign-off from leadership
- [ ] Store at: `docs/security/information-security-program.md`
- [ ] Version and date-stamp; review annually

**Effort:** 2–3 days  
**Owner:** Founders + legal review  

---

### G-09: Formal Incident Response Plan (IRP)

**What:** A documented procedure for detecting, responding to, and recovering from security incidents.

**Actions:**
- [ ] Define incident severity levels (P1–P4) with examples
- [ ] Define response timelines per severity (P1: 2hrs contain, 4hrs notify; P2: 24hrs; etc.)
- [ ] Define notification procedure: who gets notified (internal + customers), by whom, using what channel
- [ ] Define evidence preservation steps
- [ ] Define post-incident review requirements
- [ ] Store at: `docs/security/incident-response-plan.md`

**Effort:** 1–2 days  
**Owner:** Founders  

---

### G-10: Formal Vulnerability Management Program (VMP)

**What:** A documented program defining how vulnerabilities in JobLine's code and infrastructure are tracked, prioritized, and remediated.

**Actions:**
- [ ] Document existing Trivy + Codacy scanning process
- [ ] Define SLA tiers:
  - Critical (CVSS 9.0+): Remediate before next deploy, max 24 hours
  - High (CVSS 7.0–8.9): Remediate within 7 days
  - Medium (CVSS 4.0–6.9): Remediate within 30 days
  - Low (CVSS < 4.0): Track, remediate within 90 days
- [ ] Document exception/waiver process
- [ ] Include infrastructure: Supabase + Vercel patching SLAs (inherited)
- [ ] Store at: `docs/approval/fedramp/vulnerability management program/vulnerability-management-program.md`

**Effort:** 1 day  
**Owner:** Engineering lead  

---

### G-11: Formal Backup and Recovery Plan

**What:** Document the backup strategy and test the restoration process.

**Actions:**
- [ ] Document Supabase daily backup configuration (PITR settings, retention, S3 location)
- [ ] Define RTO (Recovery Time Objective) and RPO (Recovery Point Objective) targets
- [ ] Schedule quarterly backup restoration tests (table-level restore in staging)
- [ ] Document restoration procedure step-by-step
- [ ] Store at: `docs/security/backup-recovery-plan.md`

**Effort:** 1 day  
**Owner:** Engineering  

---

### G-14: AI Data Retention Policy Document

**What:** Documented policy stating how long (if at all) AI prompts and completions are stored, and who has access.

**Actions:**
- [ ] Confirm with LLM API provider that prompts are not used for training under the current API contract
- [ ] Document retention policy: "JobLine AI does not persist prompt text. Prompts are transient per-request and discarded after the LLM response is returned."
- [ ] Review and document LLM provider's data processing terms
- [ ] Store at: `docs/security/ai-data-retention-policy.md`

**Effort:** 0.5 days  
**Owner:** Engineering + legal review  

---

### G-05: Bug Bounty / Responsible Disclosure Program

**What:** A public-facing responsible disclosure policy and security contact.

**Actions:**
- [ ] Create `security.txt` at `/.well-known/security.txt` per RFC 9116
- [ ] Add `SECURITY.md` to repository root
- [ ] Publish contact: `security@jobline.ai` (mailbox must exist)
- [ ] Define scope: in-scope (jobline.ai, api.jobline.ai, self-hosted Electron app) and out-of-scope (third-party infrastructure)
- [ ] Define response timeline: acknowledge within 48 hours, triage within 7 days
- [ ] (Optional later) Register with a formal bug bounty platform (HackerOne, Bugcrowd) once penetration testing baseline is complete

**Effort:** 1 day  
**Owner:** Founders  

---

### G-03: SBOM Generation

**What:** Software Bill of Materials for each release, listing all dependencies and versions.

**Actions:**
- [ ] Add CycloneDX or Syft to CI pipeline
  ```
  # Option A: Syft (simpler)
  syft packages dir:. -o cyclonedx-json > sbom-$(date +%Y%m%d).json
  
  # Option B: @cyclonedx/bom npm tool
  npx @cyclonedx/bom --output sbom.xml
  ```
- [ ] Generate SBOM on every tagged release
- [ ] Store SBOMs in `docs/releases/sbom/` or publish to GitHub Releases
- [ ] Reference SBOM in release notes

**Effort:** 1 day  
**Owner:** Engineering  

---

### G-16: Status Page

**What:** Public uptime statistics and incident history for jobline.ai.

**Actions:**
- [ ] Set up status page at `status.jobline.ai` (recommend: Instatus, Better Uptime, or UptimeRobot Status Pages)
- [ ] Monitor: jobline.ai, Supabase API endpoint, edge function health
- [ ] Link from docs/support page

**Effort:** 0.5 days  
**Owner:** Engineering  

---

## Phase 2 — Security Hardening (4–12 weeks)
*Requires engineering effort or vendor engagement. Directly addresses the most common enterprise objections.*

### G-04: Third-Party Penetration Testing

**What:** Hire a CREST/OSCP-certified penetration testing firm to perform a black-box and gray-box application assessment.

**Actions:**
- [ ] Select qualified pen test vendor (Cobalt.io, Bishop Fox, NetSPI, or similar)
- [ ] Define scope:
  - Web app (jobline.ai): all authenticated endpoints, auth flows, session management
  - API surface: all Supabase edge functions and RLS access patterns
  - Electron desktop app: local file system, IPC channels, update mechanism
- [ ] Conduct test
- [ ] Receive findings report
- [ ] Remediate all Critical and High findings before releasing report to customers
- [ ] Issue Letter of Attestation (LoA) summary for procurement purposes
- [ ] Schedule annual re-test

**Target date:** Q3 2026  
**Effort:** 2–4 weeks elapsed, ~$20,000–$50,000  
**Owner:** Founders (procurement) + Engineering (remediation)  

---

### G-06: Active Directory / SAML 2.0 SSO

**What:** Enable enterprise SSO via SAML 2.0, allowing customers to authenticate with their existing Azure AD, Okta, or ADFS deployments.

**Actions:**
- [ ] Enable Supabase Enterprise SAML 2.0 SSO (Supabase supports this natively)
- [ ] Build org-level SSO configuration UI in settings
- [ ] Allow org admins to configure SAML metadata URL
- [ ] Test with: Azure AD, Okta, ADFS (all support standard SAML 2.0)
- [ ] Document: SSO configuration guide for IT administrators
- [ ] Store docs at: `docs/enterprise/sso-configuration.md`

**Dependencies:** Supabase Pro/Enterprise plan (SAML 2.0 is available on Enterprise tier)  
**Effort:** 3–6 weeks  
**Owner:** Engineering  

---

### G-07: SIEM Log Export Integration

**What:** Enable audit logs to be pushed to external SIEM systems (Splunk, QRadar, Microsoft Sentinel, Elastic SIEM).

**Architecture approach:**
```
activity_logs (PostgreSQL) 
  → Supabase Webhook on INSERT
  → JobLine log-export edge function
  → HTTP POST to SIEM ingest endpoint (configurable per org)
```

**Actions:**
- [ ] Create `supabase/functions/log-export/index.ts` edge function
  - Receives webhook payload from `activity_logs` insert
  - Authenticates to configured SIEM endpoint
  - Formats event as CEF (Common Event Format) or JSON
- [ ] Add org-level SIEM configuration in admin settings (target URL, auth token/header, format)
- [ ] Support: Splunk HTTP Event Collector (HEC), QRadar syslog, Sentinel Log Ingestion API
- [ ] Add opt-in toggle per org
- [ ] Test with Splunk (most common in A&D)

**Effort:** 2–4 weeks  
**Owner:** Engineering  

---

### G-12: AI Opt-Out UX (Explicit Toggle)

**What:** An explicit UI control for org admins to disable AI features, rather than just "not enabling" the entitlement.

**Actions:**
- [ ] Add `ai_enabled` boolean to `organization_settings` table (migration)
- [ ] Add toggle to org admin settings UI
- [ ] When `ai_enabled = false`, `ai-planning-assistant` edge function returns 403 for requests from that org
- [ ] Default: `false` for new organizations (opt-in model)

**Effort:** 1–2 weeks  
**Owner:** Engineering  

---

### G-13: Prompt Injection Detection Controls

**What:** Add controls in the AI planning assistant to detect and reject potentially malicious prompt content.

**Actions:**
- [ ] Add input validation layer before prompt assembly:
  - Strip HTML/markdown injection attempts from user-controlled fields
  - Implement max token cap on user-supplied context
  - Add blocklist for known prompt injection patterns
- [ ] Log all AI request inputs/outputs in `ai_request_logs` table for audit (org-scoped, admin-readable)
- [ ] Add output validation: check LLM response for signs of jailbreak or unexpected content before returning to client
- [ ] Review: https://owasp.org/www-project-top-10-for-large-language-model-applications/ (LLM01, LLM02)

**Effort:** 1–2 weeks  
**Owner:** Engineering  

---

## Phase 3 — Enterprise Compliance (3–12 months)
*Larger investments. Triggered by specific enterprise contract requirements. FedRAMP is the long-term goal.*

### G-02: FedRAMP Moderate Equivalency with 3PAO Evidence

**What:** Achieve a credible, documented equivalency to FedRAMP Moderate by engaging a Third-Party Assessment Organization (3PAO) to assess the control implementation. Not full authorization — an assessment report that demonstrates "FedRAMP Moderate-equivalent" controls.

**Why this before full FedRAMP:**
- 10x cheaper than full authorization (~$150K–$300K vs $1–2M)
- Typically accepted by large enterprises and some agencies for vendor selection
- Creates the assessment baseline needed if full authorization pursued later

**Prerequisites:**
- All Phase 1 documentation complete
- Penetration testing complete (G-04)
- SAML SSO complete (G-06)
- System Security Plan (SSP) drafted against NIST 800-53 Moderate baseline

**Actions:**
- [ ] Draft System Security Plan (SSP) mapping all controls
- [ ] Engage qualified 3PAO (Coalfire, Schellman, A-LIGN, Tevora)
- [ ] Conduct gap assessment
- [ ] Remediate assessment findings
- [ ] Receive 3PAO Assessment Report (SAR)
- [ ] Publish SAR executive summary to qualified enterprise customers under NDA

**Target:** Q1–Q2 2027  
**Effort:** 6–9 months, ~$150,000–$300,000  
**Owner:** Founders (budget + vendor selection), Engineering (control implementation)  

---

### G-01: FedRAMP Moderate Authorization (Full)

**What:** Formal FedRAMP Moderate authorization from a sponsoring agency or through the FedRAMP marketplace "Ready" / "Authorized" path.

**Trigger:** This is justified once we have a federal agency sponsor or enterprise contract requiring it.

**Prerequisites:**
- All Phase 1 + Phase 2 work complete
- 3PAO equivalency (G-02) complete
- Dedicated compliance engineer on staff or contracted
- FIPS 140-2/140-3 validated cryptographic modules (may require migration to AWS GovCloud Supabase instance)
- US-person-only access controls for government customer data

**Critical FIPS note:** Current Supabase commercial tier runs on AWS but is not FIPS 140-2 validated for the crypto layer. For FedRAMP Moderate, we would need either:
1. Migrate to a Supabase Enterprise instance on AWS GovCloud where FIPS modules are enabled, OR
2. Use AWS RDS PostgreSQL on GovCloud directly (bypassing managed Supabase)

**Actions:**
- [ ] Engage FedRAMP-focused law/consulting firm for agency sponsorship path
- [ ] Evaluate GovCloud infrastructure migration (cost/complexity)
- [ ] Complete full SSP, SAP, SAR, POA&M
- [ ] Submit for FedRAMP authorization

**Target:** 2027–2028 (contingent on contract need)  
**Effort:** 12–18 months, ~$1,000,000–$2,000,000  
**Owner:** CEO-level commitment required  

---

## Remediation Timeline Summary

```
2026 Q2 (NOW)
├── G-08  Security Program Document              ████ 1 week
├── G-09  Incident Response Plan                 ████ 1 week
├── G-10  Vulnerability Management Program       ████ 1 week
├── G-11  Backup & Recovery Plan                 ████ 1 week
├── G-14  AI Data Retention Policy               ██ 2 days
├── G-05  Responsible Disclosure / security.txt  ██ 1 day
├── G-03  SBOM Generation (CI automation)        ████ 1 week
└── G-16  Status Page                            ██ 1 day

2026 Q3
├── G-04  Third-Party Penetration Test           ████████████████████ 4–6 weeks
├── G-12  AI Opt-Out Toggle (product)            ████████ 2 weeks
└── G-13  Prompt Injection Controls              ████████ 2 weeks

2026 Q4
├── G-07  SIEM Log Export                        ████████████ 3–4 weeks
└── G-06  SAML 2.0 / Active Directory SSO       ████████████████ 4–6 weeks

2027 Q1–Q2
└── G-02  3PAO FedRAMP Moderate Equivalency     ████████████████████████████████ 6–9 months

2027–2028 (if required by contract)
└── G-01  FedRAMP Moderate Authorization        ████████████████████████████████████████████ 12–18 months
```

---

## Current Strengths to Highlight (Enterprise Sales Context)

When presenting to General Atomics or other enterprise customers, emphasize what is **already built**:

| Strength | Evidence |
|----------|----------|
| Full RBAC with 7 distinct roles | `user_roles` table, RLS helper functions, enforced at DB layer |
| MFA enforcement (TOTP) | `useMFAEnforcement.ts`, org-level `mfa_required` flag |
| Zero-trust data isolation | RLS on every table — no org can access another org's data |
| JWT-authenticated API layer | All edge functions validate JWT before data access |
| Comprehensive audit logging | `activity_logs` table, 22 event types, admin-only access |
| US-hosted infrastructure | Supabase us-east-1 (AWS Virginia) + Vercel US origin |
| Self-hosted / ITAR deployment path | Electron app + `docs/prd/02-itar-self-hosted-deployment.md` |
| Continuous vulnerability scanning | Trivy + Codacy on every commit |
| Active code security scanning | ESLint security rules, OWASP-aligned, Codacy gates |
| Session management | `user_sessions` table, IP/device tracking, admin revocation |

---

## Document References

| Document | Purpose | Location |
|----------|---------|----------|
| Questionnaire responses | Each question answered for GA | `docs/approval/jobline-vendor-questionnaire-response.md` |
| This document | Gap roadmap | `docs/approval/fedramp/gap-remediation-roadmap.md` |
| VMP (in progress) | Vulnerability management | `docs/approval/fedramp/vulnerability management program/` |
| ITAR deployment guide | Self-hosted compliance path | `docs/prd/02-itar-self-hosted-deployment.md` |
| ITAR readiness roadmap | Multi-phase compliance plan | `docs/prd/04-itar-readiness-roadmap-prd.md` |
| Desktop build guide | Self-hosted install | `desktop/docs/Desktop_Build_Guide.md` |
| Architecture diagrams | System context, ERD, RLS matrix | `docs/mermaid/` |

# JobLine AI — Enterprise & FedRAMP Gap Remediation Roadmap
**Version:** 1.1  
**Date:** April 13, 2026  
**Owner:** WeCr8 Solutions Engineering + Leadership  
**Linked To:** General Atomics ITS General Vendor Questionnaire Response  
**Reference Documents:**
- `FedRAMP-High-Moderate-Low-LI-SaaS-Baseline-System-Security-Plan-(SSP).docx` — Official SSP template (FedRAMP PMO v1.1, 10/13/2023)
- `FedRAMP_Security_Controls_Baseline.xlsx` — 323-control Moderate baseline (NIST 800-53 Rev. 5)
- `CSP_Authorization_Playbook.pdf` — CSP Authorization Playbook (Volumes I & II)
- `Agency_Authorization_Playbook.pdf` — Agency Authorization Playbook
- `CSP_A_FedRAMP_Authorization_Boundary_Guidance.pdf` — Authorization Boundary Guidance
- `nistspecialpublication800-60v2r1.pdf` — NIST SP 800-60 Vol. II (data categorization)
- `docs/approval/fedramp/jobline-ssp-draft.md` — JobLine SSP working draft

> This document defines the prioritized remediation plan for all gaps identified during the General Atomics vendor questionnaire response AND from analysis of the official FedRAMP SSP template and 323-control Moderate baseline. Items are organized by phase, effort, and business impact.

---

## ⚠️ CRITICAL INFRASTRUCTURE BLOCKER — Must Decide Before Phase 3

> **Finding from SSP draft analysis (Section 6):** FedRAMP Moderate requires that all infrastructure handling federal data be **FedRAMP Authorized**. As of April 2026:
> - **Supabase commercial** — NOT FedRAMP authorized (runs on AWS, but Supabase itself is not on the FedRAMP Marketplace)
> - **Vercel** — NOT FedRAMP authorized
>
> This means the entire JobLine SaaS stack currently runs on **non-authorized infrastructure**, which is the primary blocker for FedRAMP Moderate authorization.
>
> **Infrastructure migration decision required before Phase 3 can begin:**
>
> | Option | Infrastructure | FedRAMP Status | Est. Migration Effort |
> |--------|---------------|----------------|----------------------|
> | **Option A** (Recommended) | AWS GovCloud (RDS PostgreSQL + Lambda + CloudFront) | ✅ FedRAMP High (US-Gov-West-1) | 3–6 months, $50–150K engineering |
> | **Option B** | Azure Government (PostgreSQL Flexible Server + Azure Static Web Apps) | ✅ FedRAMP High | 4–8 months, $60–180K |
> | **Option C** | Supabase Enterprise on GovCloud tenant | ⏳ Not yet available (monitor Supabase roadmap) | Unknown timeline |
>
> Note: Vercel frontend can be replaced with AWS CloudFront (FedRAMP) or Azure CDN (FedRAMP) relatively quickly. The database migration (Supabase → RDS) is the hard part.

---

## Gap Summary

| ID | Gap | Category | Priority | NIST Control(s) |
|----|-----|----------|----------|----------------|
| **G-00** | **Non-FedRAMP infrastructure (Supabase commercial + Vercel)** | **Infrastructure** | **🔴 BLOCKING** | **All SC, AC, AU controls** |
| G-01 | FedRAMP Moderate authorization | Compliance | 🔴 CRITICAL (long-term) | CA-6, CA-9 |
| G-02 | FedRAMP Moderate equivalency (3PAO) | Compliance | 🔴 CRITICAL (mid-term) | CA-2, CA-8 |
| G-03 | Software Bill of Materials (SBOM) generation | Supply Chain Security | 🟠 HIGH | SR-3, SA-12 |
| G-04 | Third-party penetration testing | Security Assurance | 🟠 HIGH | CA-8, RA-5 |
| G-05 | Bug bounty / responsible disclosure program | Security Assurance | 🟠 HIGH | IR-6, SI-2 |
| G-06 | Active Directory / SAML 2.0 SSO | Identity | 🟠 HIGH | IA-2, IA-8, AC-2 |
| G-07 | SIEM log export integration | Operations | 🟡 MEDIUM | AU-6, AU-9 |
| G-08 | Formal written security program (PL-2, AC-1) | Documentation | 🟡 MEDIUM | PL-2, AC-1, all -1 controls |
| G-09 | Formal incident response plan (IRP) | Documentation | 🟡 MEDIUM | IR-1, IR-8 |
| G-10 | Formal vulnerability management program (VMP) | Documentation | 🟡 MEDIUM | RA-1, RA-5 |
| G-11 | Formal backup and recovery plan | Documentation | 🟡 MEDIUM | CP-9, CP-10 |
| G-12 | AI opt-out UX (explicit org-level toggle) | Product | 🟡 MEDIUM | AC-20, SA-9 |
| G-13 | Prompt injection detection controls | AI Security | 🟡 MEDIUM | SI-3, SI-10 |
| G-14 | AI data retention policy document | Documentation | 🟡 MEDIUM | AU-11, MP-6 |
| G-15 | Backup restore test cadence | Operations | 🟢 LOW | CP-4 |
| G-16 | Status page (uptime statistics) | Operations | 🟢 LOW | CP-2, SA-17 |
| G-17 | Formal security awareness training | Documentation | 🟡 MEDIUM | AT-2, AT-3 |
| G-18 | Personnel security policy | Documentation | 🟡 MEDIUM | PS-1, PS-3, PS-4 |
| G-19 | Rules of Behavior (RoB) document | Documentation | 🟡 MEDIUM | PL-4 |
| G-20 | Configuration Management Plan (CMP) | Documentation | 🟡 MEDIUM | CM-1, CM-2, CM-9 |
| G-21 | Information System Contingency Plan (ISCP) | Documentation | 🟡 MEDIUM | CP-2, CP-7 |
| G-22 | Supply Chain Risk Management Plan (SCRMP) | Documentation | 🟠 HIGH | SR-1, SR-2, SR-3 |
| G-23 | FIPS 140-2/140-3 cryptographic validation | Technical | 🔴 HIGH | SC-13, IA-7 |
| G-24 | SSP Appendix A — 323-control implementations | Documentation | 🔴 HIGH (for 3PAO) | All families |
| G-25 | SSP Appendix J — CIS/CRM Workbook | Documentation | 🔴 HIGH (for 3PAO) | All families |
| G-26 | FIPS 199 / NIST 800-60 data categorization worksheet | Documentation | 🟡 MEDIUM | RA-2, CA-3 |
| G-27 | Digital Identity Worksheet (NIST 800-63B) | Documentation | 🟡 MEDIUM | IA-1, IA-2 |
| G-28 | Integrated Inventory Workbook | Documentation | 🟡 MEDIUM | CM-8, SA-4 |
| G-29 | POA&M (Plan of Action & Milestones) | Documentation | 🟡 MEDIUM | CA-5 |

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

### G-17: Security Awareness Training Program
*NIST 800-53: AT-2, AT-3 — Required for ALL staff with system access*

**What:** A formal security awareness training program covering: phishing, password hygiene, incident reporting, data handling, acceptable use.

**Actions:**
- [ ] Enroll all engineers and support staff in a FedRAMP-acceptable security awareness training service (KnowBe4, Proofpoint, or free CISA resources)
- [ ] Document training completion per employee (AT-2 requires annual completion with records)
- [ ] For platform admin roles: additional role-based training (AT-3) covering RLS administration, JWT key management, Supabase access
- [ ] Store completion records at: `docs/security/training-records/` (by year)

**Effort:** 1 week setup, recurring annual  
**Owner:** ISSO / Engineering Lead  

---

### G-18: Personnel Security Policy
*NIST 800-53: PS-1, PS-3, PS-4, PS-5 — Required for any staff with privileged access to federal data*

**What:** Formal policies for screening, onboarding, transfers, and offboarding personnel with access to production systems.

**Actions:**
- [ ] Document personnel security policy covering:
  - Pre-employment screening requirements (PS-3)
  - Access provisioning on hire (PS-3)
  - Access revocation on termination (PS-4) — specifically: Supabase admin, GitHub, Vercel, domain registrar
  - Access modification on transfer/role change (PS-5)
- [ ] Create offboarding checklist (include all system credentials + SSH keys)
- [ ] Reference `user_sessions` admin revocation as the technical control
- [ ] Store at: `docs/security/personnel-security-policy.md`

**Effort:** 1 day  
**Owner:** Founders (HR/legal)  

---

### G-19: Rules of Behavior (RoB)
*NIST 800-53: PL-4 — Required for all users of the system (including JobLine customers)*

**What:** A documented agreement that all users must acknowledge before accessing the system. Required by FedRAMP Moderate.

**Actions:**
- [ ] Draft RoB document covering: acceptable use, data handling, password requirements, MFA requirement, incident reporting responsibilities
- [ ] Integrate into the account creation / onboarding flow (checkbox acceptance + timestamp stored)
- [ ] For federal agency customers: ensure RoB is reviewed and signed at org-admin level
- [ ] Store template at: `docs/security/rules-of-behavior.md`

**Effort:** 1–2 days  
**Owner:** Legal / Engineering (for in-app integration)  

---

### G-20: Configuration Management Plan (CMP)
*NIST 800-53: CM-1, CM-2, CM-9 — Required for Moderate baseline*

**What:** A formal plan documenting how configuration changes to the system are controlled, reviewed, and approved.

**Actions:**
- [ ] Document the baseline configuration for: React SPA (Vite build settings), Supabase project configuration, Vercel deployment config, Edge function environment variables
- [ ] Define the change control process: local → PR → Codacy review → merge → Vercel auto-deploy
- [ ] Define emergency change procedures (hotfix path)
- [ ] Document who can approve changes to production (separation of duties for CM)
- [ ] Store at: `docs/security/configuration-management-plan.md`

**Effort:** 2 days  
**Owner:** Engineering Lead  

---

### G-21: Information System Contingency Plan (ISCP)
*NIST 800-53: CP-2, CP-7 — Required for Moderate baseline; FedRAMP-provided template*

**What:** A formal plan for how the system recovers from disruptions: outages, disasters, data loss.

**Actions:**
- [ ] Define RTO (Recovery Time Objective): Target **4 hours** for SaaS; **24 hours** for self-hosted
- [ ] Define RPO (Recovery Point Objective): Target **1 hour** for SaaS (Supabase PITR); **24 hours** self-hosted
- [ ] Document alternate processing site procedure: Can Vercel + Supabase fail over to a different region? If not, document manual procedures.
- [ ] Define incident notification chain for outages affecting federal customers
- [ ] Reference: FedRAMP ISCP template (use the formal template for 3PAO assessment)
- [ ] Store at: `docs/security/iscp.md`

**Effort:** 2–3 days  
**Owner:** Engineering + Founders  

---

### G-22: Supply Chain Risk Management Plan (SCRMP)
*NIST 800-53: SR-1, SR-2, SR-3 — Required for Moderate baseline*

**What:** A plan documenting how JobLine manages risk from its software supply chain (npm packages, Deno modules, Supabase, Vercel, LLM provider).

**Actions:**
- [ ] Inventory all third-party dependencies by criticality tier:
  - **Critical:** Supabase (all customer data), Vercel (all traffic), JWT/Auth libraries
  - **High:** React, Vite, Tailwind, shadcn/ui (frontend rendering)
  - **Medium:** LLM API provider, Stripe
  - **Low:** Most npm utilities
- [ ] Document supplier vetting criteria for new dependencies (what compliance/security posture is required)
- [ ] Require SBOMs (G-03) as part of SCRMP evidence
- [ ] Reference Trivy/Codacy scanning as ongoing SR-5 posture
- [ ] Store at: `docs/security/supply-chain-risk-management-plan.md`

**Effort:** 2 days  
**Owner:** Engineering Lead  

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

### G-00: Infrastructure Migration to FedRAMP-Authorized Services
*NIST 800-53: All SC, AC, AU controls — This is the single largest technical blocker*

**What:** Migrate JobLine AI's backend infrastructure from Supabase commercial + Vercel to FedRAMP-authorized equivalents. Required because FedRAMP Moderate mandates that all infrastructure handling federal data be on the FedRAMP Marketplace.

**Current non-authorized infrastructure:**
- Supabase commercial (AWS us-east-1) — NOT FedRAMP authorized
- Vercel — NOT FedRAMP authorized

**Recommended migration path (Option A — AWS GovCloud):**
```
Current:                          →   Target (FedRAMP):
Supabase (commercial DB)         →   Amazon RDS PostgreSQL (AWS GovCloud us-gov-west-1)
Supabase Auth                    →   Amazon Cognito (FedRAMP High) + custom JWT layer
Supabase Edge Functions          →   AWS Lambda / API Gateway (FedRAMP High)
Supabase Realtime (WebSocket)    →   AWS AppSync or API Gateway WebSockets
Vercel (frontend CDN)            →   AWS CloudFront + S3 (FedRAMP High)
Vercel edge functions            →   AWS Lambda@Edge (FedRAMP High)
```

**Alternative (Option B — Azure Government):**
```
Supabase (DB) → Azure Database for PostgreSQL (FedRAMP High)
Supabase Auth → Azure AD B2C (FedRAMP High)
Supabase Edge → Azure Functions (FedRAMP High)
Vercel       → Azure Static Web Apps + Azure CDN (FedRAMP High)
```

**Actions:**
- [ ] **Decision checkpoint:** Choose Option A (AWS GovCloud) or Option B (Azure Government) — requires CEO + CTO alignment on timeline and budget
- [ ] Estimate migration effort for all Supabase-specific features (RLS, Realtime, Edge Functions) onto chosen platform
- [ ] Plan data migration strategy (PostgreSQL → PostgreSQL is straightforward; Auth migration is more complex)
- [ ] Implement FIPS 140-2/140-3 mode on all crypto operations in new environment (resolves G-23)
- [ ] Build and test parallel environment before cutover
- [ ] Update SSP draft (Section 6) to list newly leveraged FedRAMP-authorized services

**Effort:** 3–6 months, $50,000–$200,000 engineering cost  
**Owner:** Engineering Lead + CEO  

---

### G-23: FIPS 140-2/140-3 Cryptographic Validation
*NIST 800-53: SC-13, IA-7 — Required for Moderate baseline*

**What:** All cryptographic operations must use FIPS 140-2 or 140-3 validated modules. This is currently unmet because Supabase commercial is not on the FedRAMP Marketplace.

**Resolution:** Resolved as part of G-00 infrastructure migration to AWS GovCloud (FIPS mode) or Azure Government.

**Documentation needed:**
- [ ] After migration: document FIPS certificate numbers for all cryptographic modules in SSP Appendix Q
- [ ] Confirm TLS configuration uses only FIPS-approved cipher suites (TLS 1.2/1.3 with approved ciphers)
- [ ] Confirm bcrypt (password hashing) or document FIPS-approved alternative (PBKDF2)

---

### G-24 + G-25: SSP Security Controls Appendix A + CIS/CRM Workbook (Appendix J)
*323 controls across 18 NIST 800-53 Rev. 5 families — The core 3PAO assessment deliverable*

**What:** Appendix A contains implementation descriptions for all 323 Moderate controls. Appendix J (CIS/CRM Workbook) maps which controls are the CSP's responsibility vs. the customer's (agency) responsibility. Both are required for any FedRAMP assessment.

**Control family breakdown from `FedRAMP_Security_Controls_Baseline.xlsx`:**

| Family | Controls | JobLine Status | Priority |
|--------|----------|---------------|---------|
| AC (Access Control) | 43 | ✅ Strong | Document existing RBAC/RLS |
| AU (Audit & Accountability) | 16 | ✅ Strong | Document activity_logs; add SIEM |
| IA (Identification & Authentication) | 27 | ✅ Strong | Document JWT/MFA; address FIPS |
| SC (System & Communications Protection) | 29 | ✅ Strong (after migration) | TLS, boundary, FIPS after G-00 |
| SI (System & Information Integrity) | 24 | ⚠️ Partial | Add SI-7 hashing, SI-8 spam protection |
| CM (Configuration Management) | 27 | ⚠️ Partial | Requires G-20 CMP |
| RA (Risk Assessment) | 11 | ⚠️ Partial | Requires G-10 VMP + formal RA-3 |
| SA (System & Services Acquisition) | 21 | ⚠️ Partial | Requires SDLC docs, G-22 SCRMP |
| IR (Incident Response) | 17 | ❌ Gap | Requires G-09 IRP |
| CP (Contingency Planning) | 23 | ❌ Gap | Requires G-21 ISCP |
| AT (Awareness & Training) | 6 | ❌ Gap | Requires G-17 training program |
| PS (Personnel Security) | 10 | ❌ Gap | Requires G-18 personnel policy |
| PL (Planning) | 7 | ❌ Gap | This SSP + G-08 security program |
| SR (Supply Chain Risk Management) | 12 | ❌ Gap | Requires G-22 SCRMP + G-03 SBOM |
| MA (Maintenance) | 10 | ✅ Inherited | Supabase/Vercel managed; document |
| MP (Media Protection) | 7 | ✅ Inherited | Cloud-managed media; document |
| PE (Physical & Environmental) | 19 | ✅ Inherited | AWS data center; document inheritance |
| CA (Security Assessment) | 14 | ❌ Gap | Requires pen test, 3PAO, authorization |

**Actions:**
- [ ] Complete all Phase 1 documentation gaps first (G-08 through G-22)
- [ ] Complete infrastructure migration (G-00)
- [ ] Populate SSP Appendix A for all 323 controls using `FedRAMP_Security_Controls_Baseline.xlsx`
- [ ] Complete SSP Appendix J (CIS/CRM) to define customer vs. CSP responsibilities
- [ ] Engage 3PAO for independent assessment

---

### G-26: FIPS 199 / NIST 800-60 Data Categorization
*Based on `nistspecialpublication800-60v2r1.pdf` — Required for SSP Appendix K*

**What:** Formally categorize the information types stored and processed by JobLine AI using NIST SP 800-60 Vol. II methodology. This determines the correct FedRAMP impact level (Low/Moderate/High).

**Preliminary categorization for JobLine AI:**

| Information Type | NIST 800-60 Category | Confidentiality | Integrity | Availability | Impact |
|-----------------|---------------------|----------------|-----------|-------------|--------|
| Manufacturing job records | D.2.2 (Supply Chain Management) | Moderate | Moderate | Moderate | Moderate |
| Shift handoff notes | D.2.2 (Manufacturing Operations) | Moderate | Moderate | Low | Moderate |
| User account / identity data | C.2.8 (Identity Management) | Moderate | High | Moderate | Moderate |
| NCR / quality records | D.2.2 (Regulatory Compliance) | Moderate | High | Moderate | Moderate |
| Work order data | D.2.2 (Acquisition) | Low | Moderate | Low | Moderate |
| System audit logs | C.2.1 (Security Management) | Moderate | High | Moderate | Moderate |
| Billing data | D.1.2 (Budget/Finance) | Low | Moderate | Low | Moderate |

**Overall system categorization: {Moderate, Moderate, Moderate} — Moderate overall**

**Actions:**
- [ ] Complete formal FIPS 199 worksheet (SSP Appendix K) using above analysis
- [ ] Use FedRAMP-provided digital identity worksheet for Appendix E (IAL2/FAL2/AAL2)
- [ ] Document in SSP Section 3 (System Information table, FIPS PUB 199 field)

---

### G-27: Digital Identity Worksheet (NIST SP 800-63B)

**What:** SSP Appendix E — Formal documentation of the Identity Assurance Level (IAL), Authenticator Assurance Level (AAL), and Federation Assurance Level (FAL).

**JobLine AI IAL/AAL/FAL determination:**
- **IAL2** — Identity proofing via email verification + optional in-person/video proofing for high-assurance orgs
- **AAL2** — TOTP MFA enforced for elevated access; JWT session management
- **FAL2** — OAuth 2.0/OIDC federation with Google, Microsoft, GitHub

**Actions:**
- [ ] Complete FedRAMP-provided Digital Identity Worksheet (Appendix E)
- [ ] Document in SSP Section 3 (DIL field)

---

### G-28: Integrated Inventory Workbook (Appendix M)

**What:** FedRAMP-provided template requiring a complete inventory of all hardware, software, and virtual components within the authorization boundary.

**For JobLine AI (software/virtual components only — no hardware):**
- All Supabase services (DB instances, Auth, Edge functions, Realtime, Storage)
- Vercel deployment units (production, preview)
- All npm package versions in use (supported by SBOM from G-03)
- Electron app versions (desktop releases)
- External service connections (LLM, Stripe, GA)

**Actions:**
- [ ] Create inventory workbook from SBOM output (G-03) + Supabase + Vercel service inventory
- [ ] Ensure all components match diagram labels in architecture diagrams (Section 8)
- [ ] Maintain version tracking per release

---

### G-29: POA&M (Plan of Action & Milestones)

**What:** FedRAMP-provided template for tracking all open security findings and their remediation status. Required as part of the authorization package and maintained continuously after ATO.

**Actions:**
- [ ] Create initial POA&M using all gap items in this roadmap
- [ ] Map each gap to the NIST control(s) it affects
- [ ] Define remediation milestones and owners
- [ ] Update POA&M after every 3PAO finding during assessment
- [ ] After ATO: update POA&M monthly as part of Continuous Monitoring (ConMon)

---

### G-02: FedRAMP Moderate Equivalency with 3PAO Evidence

**What:** Achieve a credible, documented equivalency to FedRAMP Moderate by engaging a Third-Party Assessment Organization (3PAO) to assess the control implementation. Not full authorization — an assessment report that demonstrates "FedRAMP Moderate-equivalent" controls.

**Why this before full FedRAMP:**
- 10x cheaper than full authorization (~$150K–$300K vs $1–2M)
- Typically accepted by large enterprises and some agencies for vendor selection
- Creates the assessment baseline needed if full authorization pursued later

**Prerequisites:**
- All Phase 1 documentation complete (G-08 through G-22)
- Penetration testing complete (G-04)
- SAML SSO complete (G-06)
- Infrastructure migration to FedRAMP-authorized services complete (G-00)
- SSP draft complete (this document)
- FIPS 140-2 confirmed (G-23)
- Appendix A (323 controls) at least 80% complete (G-24)

**Actions:**
- [ ] Draft complete SSP using `jobline-ssp-draft.md` as starting point
- [ ] Fill in all 323 control implementations in Appendix A
- [ ] Complete CIS/CRM Workbook (Appendix J)
- [ ] Engage qualified 3PAO (Coalfire, Schellman, A-LIGN, Tevora)
- [ ] 3PAO readiness review first (~$20–50K, identifies blockers before full assessment)
- [ ] Conduct full 3PAO assessment ($100–200K)
- [ ] Receive Security Assessment Report (SAR)
- [ ] Publish SAR executive summary to qualified enterprise customers under NDA

**Target:** Q1–Q2 2027  
**Effort:** 6–9 months, ~$150,000–$300,000  
**Owner:** Founders (budget + vendor selection), Engineering (control implementation)  

---

### G-01: FedRAMP Moderate Authorization (Full)

**What:** Formal FedRAMP Moderate authorization from a sponsoring agency or through the FedRAMP marketplace "Ready" / "Authorized" path. Per the `CSP_Authorization_Playbook.pdf` and `Agency_Authorization_Playbook.pdf`, this involves either JAB (Joint Authorization Board) or Agency sponsorship path.

**Trigger:** This is justified once we have a federal agency sponsor or enterprise contract requiring it.

**Authorization path comparison:**
| Path | Via | Timeline | Cost |
|------|-----|---------|------|
| **Agency ATO** | Single sponsoring agency (e.g., DoD component, federal contractor) | 6–12 months | ~$500K–$1M |
| **JAB P-ATO** | Joint Authorization Board (FedRAMP top tier) | 12–18 months | ~$1M–$2M |

**For General Atomics / defense contractor use case: Agency ATO path is appropriate.**

**Prerequisites:**
- G-00 (Infrastructure migration) complete
- G-02 (3PAO equivalency) complete
- G-23 (FIPS 140-2) confirmed
- Complete SSP with all appendices (A through Q)
- Dedicated ISSO assigned (full-time or contracted)
- Agency sponsor identified

**Key SSP artifacts from official FedRAMP template:**
- [ ] Sections 1–12 complete (system info, owner, ISSO, leveraged services, architecture, ports, crypto, separation of duties)
- [ ] Appendix A — 323 control implementations (3PAO tested)
- [ ] Appendix C — Security policies and procedures (zip)
- [ ] Appendix D — User guide
- [ ] Appendix E — Digital identity worksheet
- [ ] Appendix F — Rules of Behavior (G-19)
- [ ] Appendix G — ISCP (G-21)
- [ ] Appendix H — CMP (G-20)
- [ ] Appendix I — IRP (G-09)
- [ ] Appendix J — CIS/CRM Workbook
- [ ] Appendix K — FIPS 199 categorization (G-26)
- [ ] Appendix L — CSO-specific laws and regulations (EAR, ITAR, DFARS)
- [ ] Appendix M — Integrated inventory workbook (G-28)
- [ ] Appendix N — Continuous monitoring plan
- [ ] Appendix O — POA&M (G-29)
- [ ] Appendix P — Supply Chain Risk Management Plan (G-22)
- [ ] Appendix Q — Cryptographic modules table (G-23)

**Actions:**
- [ ] Engage FedRAMP-focused law/consulting firm for agency sponsorship path
- [ ] Evaluate and execute GovCloud infrastructure migration (G-00)
- [ ] Complete full SSP, SAP, SAR, POA&M (all appendices A–Q)
- [ ] Submit for FedRAMP authorization

**Target:** 2027–2028 (contingent on contract need)  
**Effort:** 12–18 months, ~$1,000,000–$2,000,000  
**Owner:** CEO-level commitment required  

---

## Updated Remediation Timeline Summary

```
2026 Q2 (NOW) — Phase 1: Documentation Quick Wins
├── G-08  Security Program Document              ████ 1 week
├── G-09  Incident Response Plan                 ████ 1 week
├── G-10  Vulnerability Management Program       ████ 1 week    (COMPLETE)
├── G-11  Backup & Recovery Plan                 ████ 1 week
├── G-14  AI Data Retention Policy               ██ 2 days
├── G-17  Security Awareness Training (setup)    ████████ 2 weeks
├── G-18  Personnel Security Policy              ██ 1 day
├── G-19  Rules of Behavior                      ██ 2 days
├── G-20  Configuration Management Plan          ████ 2 days
├── G-21  ISCP Draft                             ████ 3 days
├── G-22  SCRMP Draft                            ████ 2 days
├── G-05  Responsible Disclosure / security.txt  ██ 1 day
├── G-03  SBOM Generation (CI automation)        ████ 1 week
└── G-16  Status Page                            ██ 1 day

2026 Q3 — Phase 2A: Security Hardening
├── G-04  Third-Party Penetration Test           ████████████████████ 4–6 weeks
├── G-12  AI Opt-Out Toggle (product)            ████████ 2 weeks
└── G-13  Prompt Injection Controls              ████████ 2 weeks

2026 Q4 — Phase 2B: Enterprise Features
├── G-07  SIEM Log Export                        ████████████ 3–4 weeks
└── G-06  SAML 2.0 / Active Directory SSO       ████████████████ 4–6 weeks

2026 Q4 – 2027 Q1 — Phase 3A: Infrastructure Migration (BLOCKING for FedRAMP)
└── G-00  Migrate to AWS GovCloud / Azure Gov    ████████████████████████████████ 3–6 months

2027 Q1–Q2 — Phase 3B: FedRAMP Documentation
├── G-23  FIPS 140-2 validation (post-migration) ████ 2 weeks
├── G-24  SSP Appendix A (323 controls)         ████████████████████████████████ 3–4 months
├── G-25  CIS/CRM Workbook                       ████████████████ 2 months
├── G-26  FIPS 199 Categorization                ████ 1 week
├── G-27  Digital Identity Worksheet             ████ 1 week
├── G-28  Integrated Inventory Workbook          ████████ 2 weeks
└── G-29  POA&M                                  ████ ongoing

2027 Q2–Q3 — Phase 3C: 3PAO Assessment
└── G-02  3PAO FedRAMP Moderate Equivalency     ████████████████████████████████ 6–9 months

2027–2028 (if required by contract) — Phase 3D: Full Authorization
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
| JobLine SSP Draft | Pre-filled System Security Plan | `docs/approval/fedramp/jobline-ssp-draft.md` |
| VMP | Vulnerability management program | `docs/approval/fedramp/vulnerability management program/` |
| ITAR deployment guide | Self-hosted compliance path | `docs/prd/02-itar-self-hosted-deployment.md` |
| ITAR readiness roadmap | Multi-phase compliance plan | `docs/prd/04-itar-readiness-roadmap-prd.md` |
| Desktop build guide | Self-hosted install | `desktop/docs/Desktop_Build_Guide.md` |
| Architecture diagrams | System context, ERD, RLS matrix | `docs/mermaid/` |

**Official FedRAMP Source Documents (in `docs/approval/fedramp/`):**

| Document | Key Content |
|----------|-------------|
| `Agency_Authorization_Playbook.pdf` | Agency-side ATO process, roles, responsibilities |
| `CSP_Authorization_Playbook.pdf` | CSP path to authorization — step by step |
| `CSP_A_FedRAMP_Authorization_Boundary_Guidance.pdf` | What's inside vs. outside the authorization boundary |
| `FedRAMP-High-Moderate-Low-LI-SaaS-Baseline-System-Security-Plan-(SSP).docx` | Official SSP template — 12 sections + 17 appendices (A–Q) |
| `FedRAMP_Security_Controls_Baseline.xlsx` | All 323 Moderate controls across 18 NIST 800-53 families |
| `nistspecialpublication800-60v2r1.pdf` | Data type categorization methodology for FIPS 199 |

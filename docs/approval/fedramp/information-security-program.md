# Information Security Program
**Organization:** WeCr8 Solutions (JobLine AI)  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** Engineering Lead  
**Approved By:** CEO  
**Review Cycle:** Annual  
**NIST Controls:** PL-2, AC-1, AT-1, AU-1, CA-1, CM-1, CP-1, IA-1, IR-1, MA-1, MP-1, PE-1, PL-1, PS-1, RA-1, SA-1, SC-1, SI-1, SR-1  

---

## 1. Purpose

This Information Security Program (ISP) establishes WeCr8 Solutions' organizational commitment to protecting the confidentiality, integrity, and availability of JobLine AI and all information processed by the system. This document fulfills the "policy and procedures" controls (-1 controls) across all 18 NIST SP 800-53 Rev. 5 control families required for FedRAMP Moderate authorization.

---

## 2. Scope

This program applies to:
- All WeCr8 Solutions employees, contractors, and third parties with access to JobLine AI systems or data
- All environments: production (Supabase + Vercel), staging, and development
- The Electron desktop (self-hosted) deployment path
- All third-party services integrated with JobLine AI (Stripe, LLM API, email service)

---

## 3. Information Security Objectives

1. **Confidentiality:** Protect customer and organizational data from unauthorized disclosure through access controls, encryption, and least-privilege enforcement.
2. **Integrity:** Ensure data is accurate, complete, and protected from unauthorized modification through audit logging, input validation, and change management.
3. **Availability:** Maintain system availability per contractual SLAs through redundant infrastructure, backup processes, and incident response.

---

## 4. Roles and Responsibilities

| Role | Responsibilities |
|------|----------------|
| **CEO / Executive Leadership** | Ultimate accountability for information security; approves risk exceptions, budget, and major security decisions; designated Authorizing Official (AO) for internal risk acceptance |
| **Engineering Lead** | Day-to-day ownership of the security program; manages vulnerability scanning, incident response, and security documentation; serves as Information System Security Officer (ISSO) |
| **All Engineers** | Responsible for secure coding practices; resolve security findings on their PRs; complete annual security awareness training |
| **Third-Party Vendors** | Bound by vendor agreements to maintain security controls aligned with their service tier; reviewed annually |

---

## 5. Security Control Framework

WeCr8 Solutions uses **NIST SP 800-53 Rev. 5** as its primary security control framework, aligned with the **FedRAMP Moderate Baseline** (323 controls across 18 families). Controls are implemented, documented, and assessed per the System Security Plan (SSP) maintained at:

`docs/approval/fedramp/jobline-ssp-draft.md`

---

## 6. Policy Statements by Control Family

### 6.1 Access Control (AC)
All access to JobLine AI systems is granted based on job function and least privilege. Multi-factor authentication (TOTP) is enforced for all user sessions via the `mfa_required` org-level setting. Row-Level Security (RLS) is enforced at the database layer for all tables. Role-Based Access Control (RBAC) with 7 roles is enforced application-wide. Access is reviewed when employees change roles or depart.

### 6.2 Awareness and Training (AT)
All WeCr8 Solutions team members complete security awareness training upon hire and annually thereafter. Training covers phishing recognition, secure coding practices, data handling, and incident reporting. See Gap G-17 for training program implementation timeline.

### 6.3 Audit and Accountability (AU)
All significant user and system events are logged to the `activity_logs` table with event type, user ID, timestamp, and originating IP/device. Audit records are retained for a minimum of 12 months. Logs are tamper-protected via database RLS (admin/developer access only). Log export to SIEM is planned per Gap G-07.

### 6.4 Security Assessment (CA)
JobLine AI undergoes automated security scanning on every code commit (Codacy, Trivy). Third-party penetration testing is performed annually (planned Q3 2026, Gap G-04). A Vulnerability Management Program (VMP) is maintained at `docs/approval/fedramp/vulnerability management program/`. All findings are tracked in the POA&M at `docs/approval/fedramp/poam.md`.

### 6.5 Configuration Management (CM)
All application source code is version-controlled in Git (GitHub). Infrastructure configuration is managed through Supabase project settings and Vercel project settings. No configuration changes are made to production without a pull request review. Full Configuration Management Plan is maintained per Gap G-20.

### 6.6 Contingency Planning (CP)
JobLine AI leverages Supabase's built-in Point-in-Time Recovery (PITR) for database backup (daily automated backups, 7-day retention). Recovery Time Objective (RTO) and Recovery Point Objective (RPO) are defined in the Backup and Recovery Plan (Gap G-11) and the Information System Contingency Plan (Gap G-21).

### 6.7 Identification and Authentication (IA)
All users authenticate via Supabase Auth using unique credentials. Password complexity is enforced by Supabase Auth policies. TOTP-based MFA is available and enforceable per org. JWT tokens expire after 1 hour. Session management is tracked in the `user_sessions` table.

### 6.8 Incident Response (IR)
Security incidents are reported to `security@jobline.ai` and triaged by the Engineering Lead within 4 hours. The Incident Response Plan (IRP) defines response procedures per Gap G-09. Critical incidents are escalated to the CEO within 1 hour of identification.

### 6.9 Maintenance (MA)
All infrastructure maintenance (OS patching, database patching) is performed by Supabase and Vercel under their respective SLAs. Application-level patching is managed through the VMP SLA schedule. No remote maintenance access to customer systems is provided.

### 6.10 Media Protection (MP)
All data is stored in cloud-hosted databases and object storage (Supabase). No physical media is used in the SaaS product. For the self-hosted Electron path, media protection is the customer's responsibility as documented in the CIS/CRM Workbook (Gap G-25).

### 6.11 Physical and Environmental Protection (PE)
All physical and environmental controls are inherited from AWS (for Supabase) and the customer's facility (for Electron self-hosted). WeCr8 Solutions operates no physical data center. AWS physical controls are documented in the AWS FedRAMP authorization package.

### 6.12 Planning (PL)
This Information Security Program constitutes the organizational security plan. The System Security Plan (SSP) at `docs/approval/fedramp/jobline-ssp-draft.md` serves as the system-level security plan. Rules of Behavior for all users are defined per Gap G-19.

### 6.13 Personnel Security (PS)
All WeCr8 Solutions personnel with access to production systems are subject to background verification. Access is provisioned using least-privilege principles and revoked immediately upon termination. Personnel Security Policy is maintained per Gap G-18.

### 6.14 Risk Assessment (RA)
WeCr8 Solutions performs risk assessments through automated vulnerability scanning (Codacy, Trivy) on every commit, annual penetration testing (planned), and periodic review of the gap roadmap. FIPS 199 categorization is maintained in the SSP (MODERATE impact for all three security objectives). All identified risks are tracked in the POA&M.

### 6.15 System and Services Acquisition (SA)
All new dependencies and third-party services are reviewed for security prior to adoption. A Software Bill of Materials (SBOM) is generated per release (Gap G-03). Supply chain risk is managed per the Supply Chain Risk Management Plan (Gap G-22). All procurement decisions consider security requirements.

### 6.16 System and Communications Protection (SC)
All data in transit is encrypted using TLS 1.2 or 1.3. All data at rest is encrypted using AES-256 (managed by Supabase/AWS). HTTPS is enforced on all endpoints. WebSocket connections (Supabase Realtime) use WSS. FIPS 140-2/140-3 validated cryptography is planned as part of infrastructure migration (Gap G-23).

### 6.17 System and Information Integrity (SI)
All npm dependencies are scanned for CVEs on every commit using Trivy. Static application security testing (SAST) is performed using Codacy (ESLint security rules) on every PR. Critical and High findings block merge. Prompt injection controls are implemented for the AI planning assistant per Gap G-13.

### 6.18 Supply Chain Risk Management (SR)
All third-party vendors are reviewed prior to adoption. A formal SCRMP is being developed per Gap G-22. SBOM generation is automated per Gap G-03. Open-source dependencies are monitored for vulnerabilities via Trivy and Dependabot alerts.

---

## 7. Compliance and Enforcement

Violations of this security program are reported to the Engineering Lead and CEO. Disciplinary action up to and including termination may result from willful violations. Third-party violations are addressed per applicable vendor agreements.

---

## 8. Related Documents

| Document | Location |
|----------|----------|
| System Security Plan (SSP) | `docs/approval/fedramp/jobline-ssp-draft.md` |
| Gap Remediation Roadmap | `docs/approval/fedramp/gap-remediation-roadmap.md` |
| POA&M | `docs/approval/fedramp/poam.md` |
| Vulnerability Management Program | `docs/approval/fedramp/vulnerability management program/vulnerability-management-program.md` |
| Asset Inventory | `docs/approval/fedramp/asset-inventory.md` |
| Incident Response Plan | `docs/approval/fedramp/incident-response-plan.md` |
| Backup and Recovery Plan | `docs/approval/fedramp/backup-recovery-plan.md` |
| Rules of Behavior | `docs/approval/fedramp/rules-of-behavior.md` |
| Configuration Management Plan | `docs/approval/fedramp/configuration-management-plan.md` |
| Personnel Security Policy | `docs/approval/fedramp/personnel-security-policy.md` |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-08) |

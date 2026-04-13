# JobLine AI — FedRAMP System Security Plan (SSP) Draft
**CSP:** WeCr8 Solutions  
**CSO:** JobLine AI  
**Version:** 0.1 — Working Draft (Pre-3PAO)  
**Date:** April 13, 2026  
**Based on:** FedRAMP® (High, Moderate, Low, LI-SaaS) Baseline SSP Template v1.1 (10/13/2023)  
**Target Baseline:** Moderate  

> **Status:** This is a working draft for internal preparation. It is NOT an official FedRAMP package submission. It is structured against the official FedRAMP SSP template to identify gaps and prepare JobLine for eventual 3PAO assessment or Agency Authorization.  
>
> **How to use this document:** Sections with `[NEEDS: ...]` indicate gaps that must be addressed before engaging a 3PAO or submitting to an Authorizing Official (AO). Sections marked ✅ are substantially complete.

---

## 1. Introduction

The System Security Plan (SSP) is the "security blueprint" of a Cloud Service Offering (CSO). This SSP defines the JobLine AI authorization boundary and describes the security controls in place to protect the confidentiality, integrity, and availability (CIA) of the system and any federal data it holds.

---

## 2. Purpose

This document is prepared for use by WeCr8 Solutions in pursuing an Agency Authorization to Operate (ATO) through the Federal Risk and Authorization Management Program (FedRAMP) for the JobLine AI SaaS platform.

---

## 3. System Information

**Table 3.1 — System Information**

| Field | Value |
|-------|-------|
| **CSP Name** | WeCr8 Solutions |
| **CSO Name** | JobLine AI |
| **FedRAMP Package ID** | [NEEDS: Assigned upon marketplace submission] |
| **Service Model** | Software as a Service (SaaS) |
| **Digital Identity Level (DIL)** | IAL2 / FAL2 / AAL2 (TOTP MFA enforced, account-proofed via email verification) |
| **FIPS PUB 199 Level** | Moderate |
| **Fully Operational as of** | January 2025 (Production SaaS); Desktop v1.0 released [see release notes] |
| **Deployment Model** | Public Cloud (SaaS); Hybrid Cloud available (self-hosted Electron + Supabase) |
| **Authorization Path** | Agency Authorization (target) |

**General System Description:**

JobLine AI is a Software as a Service (SaaS) offering using a multi-tenant public cloud computing environment. It is available to manufacturing organizations in the aerospace, defense, automotive, fabrication, and general industrial sectors, including federal contractors and government contractors.

JobLine AI provides real-time job tracking, shift handoff management, work order tracking, non-conformance report (NCR) management, and production analytics for shop floor operations. The service enables supervisors and operators to capture job status, handoff notes, and shift summaries digitally, replacing paper-based shift change procedures that are common failure points in manufacturing operations.

The system is available as:
1. A browser-based SaaS application at `jobline.ai`
2. A self-hosted Electron desktop application for ITAR / air-gapped deployments

---

## 4. System Owner

**Table 4.1 — System Owner**

| Field | Value |
|-------|-------|
| **Name** | [NEEDS: Insert CEO/Owner Full Name] |
| **Title** | Chief Executive Officer / Co-Founder |
| **Company / Organization** | WeCr8 Solutions |
| **Address** | [NEEDS: Business Address, City, State, Zip] |
| **Phone Number** | [NEEDS: Business Phone] |
| **Email Address** | [NEEDS: CEO Email] |

---

## 5. Assignment of Security Responsibility

The WeCr8 Solutions JobLine AI Information System Security Officer (ISSO), or equivalent, has been appointed in writing and is responsible for maintaining the security posture of the system.

**Table 5.1 — ISSO Point of Contact**

| Field | Value |
|-------|-------|
| **Name** | [NEEDS: ISSO Name — may be same as system owner for startup; consider hiring or contracting ISSO before 3PAO engagement] |
| **Title** | ISSO / Engineering Lead |
| **Company / Organization** | WeCr8 Solutions |
| **Address** | [NEEDS: Address] |
| **Phone Number** | [NEEDS: Phone] |
| **Email Address** | security@jobline.ai |

> **Note:** FedRAMP requires a dedicated ISSO responsibility. For a seed-stage startup, the Engineering Lead may serve this role. However, for Moderate baseline, consider engaging a part-time virtual CISO or ISSO before assessment.

---

## 6. Leveraged FedRAMP-Authorized Services

**Table 6.1 — Leveraged FedRAMP Authorized Services**

> **CRITICAL FINDING:** As of April 2026, neither Supabase (commercial tier) nor Vercel are FedRAMP Authorized in the FedRAMP Marketplace. This is a **critical gap** for FedRAMP Moderate authorization. JobLine AI's primary infrastructure dependencies are NOT on the FedRAMP Marketplace.
>
> **Remediation path:** Migrate to FedRAMP-authorized infrastructure:
> - **Database:** AWS RDS (PostgreSQL) on AWS GovCloud — AWS GovCloud is FedRAMP High authorized
> - **Compute/Edge:** AWS Lambda@Edge or Azure Government Functions
> - OR: Wait for Supabase Enterprise on AWS GovCloud (Supabase has announced GovCloud availability exploration)
>
> This is **the single largest technical blocker** for full FedRAMP authorization.

| # | CSP/CSO Name | CSO Service | Authorization Type | Nature of Agreement | Impact Level | Data Types | Authorized Users |
|---|-------------|-------------|-------------------|--------------------|----|---|---|
| — | No FedRAMP-authorized services currently leveraged | — | — | — | — | — | — |

---

## 7. External Systems and Services Not Having FedRAMP Authorization

JobLine AI makes use of the following systems and services without FedRAMP authorization:

**Table 7.1 — External Systems Without FedRAMP Authorization**

| # | Name | Connection | Nature of Agreement | Supported | Data Types | Data Cat. | Auth Users | Other Compliance | Description | Hosting | Risk/Impact/Mitigation |
|---|------|-----------|---------------------|-----------|-----------|-----------|-----------|-----------------|-------------|---------|----------------------|
| 1 | **Supabase** (PostgreSQL, Auth, Edge Functions, Storage) | Outbound (HTTPS, WSS, PG connection) from JobLine app to Supabase API | SaaS Subscription (Pro tier) | Y | Customer org data, job records, handoff notes, user auth credentials, audit logs, work orders, NCRs | Moderate | All backend roles (platform admin, edge functions as service account) | SOC 2 Type II (Supabase, 2024), ISO 27001 | Primary database, authentication provider, edge function runtime, file storage. All JobLine customer data stored here. | AWS us-east-1 (Virginia) — Public Cloud | **HIGH RISK for FedRAMP.** Supabase commercial is NOT FedRAMP authorized. Federal data would reside on non-authorized infrastructure. Mitigation: Migration to Supabase on AWS GovCloud or native AWS RDS required for FedRAMP. Currently mitigated by: SOC 2 Type II attestation, AES-256 encryption at rest, TLS in transit, RLS data isolation. |
| 2 | **Vercel** (Frontend CDN, Edge Runtime) | Outbound (HTTPS) from user browsers to Vercel edge; Vercel routes to Supabase | SaaS (Pro plan) | Y | Session data, UI request/response, no persistent federal data stored on Vercel edge | Low | End users (browser), Vercel deploy service account | SOC 2 Type II (Vercel, 2024) | Frontend hosting and CDN. Static assets + React SPA. Edge Functions not used for data processing. | Vercel edge network (US POPs) | MEDIUM RISK. No persistent federal data stored on Vercel. Static asset delivery only. TLS 1.3 enforced. Mitigation: Consider Vercel Government tier or migration to AWS CloudFront (FedRAMP authorized) for full compliance. |
| 3 | **External LLM API** (AI Planning Assistant) | Outbound HTTPS from Supabase Edge Function to LLM provider API | API Service Agreement | Y | Contextual job/work order data (org-scoped, minimum necessary), no PII beyond org context | Low–Moderate | AI Planning feature (triggered by authenticated org users) | [NEEDS: Document LLM provider's compliance certifications] | Powers the AI Planning Assistant (`ai-planning-assistant` edge function). Sends structured context (job records, station data) to LLM for planning suggestions. | External commercial cloud (LLM provider's infrastructure) | **MEDIUM–HIGH RISK for FedRAMP.** Federal data (even operational/manufacturing data) should not traverse non-authorized external services. Mitigation: (1) AI feature can be disabled per-org via entitlements; (2) Local LLM roadmap item (PRD-07) eliminates this dependency for self-hosted deployments; (3) Evaluate FedRAMP-authorized AI services (Azure OpenAI on GovCloud, AWS Bedrock GovCloud). |
| 4 | **Stripe** (Payment Processing) | Outbound HTTPS from Supabase Edge Function to Stripe API | Merchant Agreement | Y | Billing data (subscription tier, card metadata — card numbers NOT stored by JobLine, stored by Stripe) | Low | Platform admin (billing operations) | PCI DSS Level 1 | Subscription billing and payment management. Card data handled entirely by Stripe; JobLine stores only Stripe customer ID and subscription state. | Stripe commercial cloud | LOW RISK. No federal data flows to Stripe. PCI DSS Level 1 certified. Relevant only for SaaS billing; not applicable to self-hosted deployments. |
| 5 | **Google Analytics (GA4)** | Outbound HTTPS from user browser to Google Analytics servers | Google Terms of Service | Y | Anonymized page view events, UTM parameters, shop type selection events | Low | End users (browser-side analytics) | Google Cloud SOC 2, ISO 27001 | Product analytics for marketing and feature usage. **Disabled by default on self-hosted/ITAR deployments** (`VITE_DISABLE_ANALYTICS=true`). No PII transmitted. | Google commercial cloud (US) | LOW RISK. No federal data. Disabled in self-hosted mode. For strict FedRAMP, can be disabled in SaaS tier for federal agency customers by org-level configuration. |

---

## 8. Illustrated Architecture and Narratives

### 8.1 Architecture Diagrams

> [NEEDS: Generate formal Authorization Boundary Diagram (ABD), Network Diagram, and Data Flow Diagram (DFD) using a diagramming tool. These must be embedded as images. Mermaid diagrams in `docs/mermaid/` provide the basis — need conversion to formal FedRAMP-compliant ABD format per `CSP_A_FedRAMP_Authorization_Boundary_Guidance.pdf`.]
>
> **Required diagram elements (per FedRAMP Authorization Boundary Guidance):**
> - Bold red line clearly marking authorization boundary
> - All internal components with consistent naming
> - All external service connections with directional arrows
> - MFA depicted on all access paths
> - Encryption status on all data stores and flows (reference numbers from Appendix Q)
> - Alternate processing site indicated
> - FedRAMP vs non-FedRAMP services clearly distinguished

### 8.2 Narrative

JobLine AI is a public cloud SaaS environment that resides in the AWS us-east-1 (Northern Virginia) region, hosted on Supabase managed infrastructure. Vercel hosts the React SPA frontend with global CDN distribution.

The major components include:

**Frontend / Presentation Layer:**
- React 18 SPA hosted on Vercel edge network
- Served via HTTPS (TLS 1.3) to user browsers
- No federal data stored on Vercel edge

**Application / API Layer:**
- Supabase Edge Functions (Deno runtime) serving as the API layer
- All edge function requests require JWT bearer token authentication
- Edge functions validate JWT signature before any database access

**Database / Persistence Layer:**
- PostgreSQL 15 (Supabase managed, AWS us-east-1)
- Row-Level Security (RLS) policies on all tables enforce org-level data isolation
- AES-256 encryption at rest (AWS storage layer)
- Connection via TLS mutual authentication

**Authentication / Identity:**
- Supabase Auth (JWT-based, bcrypt password hashing)
- TOTP MFA available and org-enforceable
- OAuth 2.0 / OIDC for federated identity (Google, Microsoft, GitHub)
- Session management via `user_sessions` table (IP, device, expiry tracking)

**External Services:**
- LLM API: AI Planning feature only; disabled per org; local LLM option on roadmap
- Stripe: SaaS billing only; no federal data
- Google Analytics: Disabled for self-hosted and configurable for federal customers

**Security Technologies:**

| Category | Technology |
|----------|-----------|
| Identity & Access Management | Supabase Auth, JWT, TOTP MFA, PostgreSQL RLS |
| Code Security (SAST) | Codacy (ESLint security rules), TypeScript strict |
| Dependency Scanning | Codacy/Trivy (CVE scanning on every commit) |
| Encryption (data at rest) | AES-256 (AWS/Supabase managed) |
| Encryption (data in transit) | TLS 1.2/1.3 (Vercel + Supabase enforced) |
| Audit Logging | PostgreSQL `activity_logs` table (22 event types) |
| Secrets Management | Supabase environment secrets + Vercel environment variables |
| MFA | Supabase Auth TOTP (org-enforced via `mfa_required` flag) |
| SIEM | [NEEDS: Not yet integrated — see G-07 in gap roadmap] |
| Vulnerability Scanning | Trivy via Codacy CI integration |
| Configuration Management | [NEEDS: Formal CMP not yet documented] |
| Firewall/VPN | Supabase/Vercel-managed; no VPN for admin access — [NEEDS: VPN for admin access to Supabase management console] |

---

## 9. Services, Ports, and Protocols

**Table 9.1 — Services, Ports, and Protocols**

| Service Name | Port | Protocol | Ref # | Purpose | Used By |
|-------------|------|---------|-------|---------|---------|
| HTTPS | 443 | TCP/TLS 1.2–1.3 | 1 | All web traffic (SPA, API calls, auth) | End users, Supabase API, Vercel edge |
| WSS (WebSocket Secure) | 443 | TCP/TLS 1.2–1.3 | 2 | Real-time updates (Supabase Realtime) | End users (live job board updates) |
| PostgreSQL | 5432 | TCP/TLS | 3 | Database connections from edge functions | Supabase edge functions (internal) |
| HTTPS (Supabase API) | 443 | TCP/TLS 1.3 | 4 | REST API calls to Supabase PostgREST | Edge functions, client SDK |
| HTTPS (External LLM) | 443 | TCP/TLS | 5 | AI planning feature API calls | Supabase `ai-planning-assistant` edge function |
| HTTPS (Stripe API) | 443 | TCP/TLS | 6 | Billing/subscription management | Supabase billing edge function |
| HTTPS (Google Analytics) | 443 | TCP/TLS | 7 | Analytics telemetry (browser-side SDK) | End-user browsers (when enabled) |

---

## 10. Cryptographic Modules

> Full cryptographic modules documentation should be maintained in Appendix Q.

**Table 10.1 — Data at Rest Encryption Summary**

| Ref # | Data Store | Encryption Status | Algorithm | FIPS 140-2 Validated? | Notes |
|-------|-----------|------------------|-----------|----------------------|-------|
| DAR-1 | PostgreSQL database (Supabase/AWS) | Encrypted | AES-256 (AWS EBS) | ⚠️ AWS supports FIPS 140-2 but Supabase commercial not FedRAMP authorized; chain of trust not formal | Primary data store |
| DAR-2 | PostgreSQL backups (AWS S3) | Encrypted | AES-256 (SSE-S3) | ⚠️ Same as DAR-1 | Daily PITR backups |
| DAR-3 | File storage (Supabase Storage / AWS S3) | Encrypted | AES-256 (SSE-S3) | ⚠️ Same as DAR-1 | Attachment/file uploads |
| DAR-4 | Passwords | Hashed (not encrypted) | bcrypt (Supabase Auth) | ✅ Not applicable (one-way hash) | Passwords never stored as plaintext or reversibly encrypted |
| DAR-5 | Secrets / API keys | Encrypted at rest | Platform-managed (Supabase Vault / Vercel env vars) | ⚠️ Not FIPS validated | JWT secrets, service keys |

**Table 10.2 — Data in Transit Encryption Summary**

| Ref # | Data Flow | Encryption Status | Protocol | FIPS 140-2 Validated? | Notes |
|-------|----------|------------------|----------|----------------------|-------|
| DIT-1 | User browser → Vercel edge | Encrypted | TLS 1.3 | ⚠️ Vercel not FedRAMP; TLS 1.3 is strong but not FIPS-attested | Auto-redirect HTTP→HTTPS |
| DIT-2 | Vercel edge → Supabase API | Encrypted | TLS 1.3 | ⚠️ Supabase commercial | Internal edge-to-API calls |
| DIT-3 | Supabase edge function → PostgreSQL | Encrypted | TLS (mutual) | ⚠️ Supabase managed | Internal DB connections |
| DIT-4 | Edge function → External LLM API | Encrypted | TLS 1.2+ | ❌ Unknown (external provider) | AI feature only; can be disabled |
| DIT-5 | Browser → Supabase Realtime (WebSocket) | Encrypted | WSS (TLS 1.3) | ⚠️ Supabase commercial | Real-time job board updates |

> **FIPS 140-2/140-3 Gap:** For FedRAMP Moderate, FIPS 140-2/140-3 validated cryptographic modules are required for all areas. Current Supabase commercial tier cannot provide this attestation. This is resolved by migrating to AWS GovCloud-based infrastructure where FIPS 140-2 is validated.

---

## 11. Separation of Duties

**Table 11.1 — Separation of Duties Matrix**

| Duty | Platform Admin (WeCr8) | Org Admin | Supervisor | Operator | Viewer | ISSO (WeCr8) |
|------|----------------------|-----------|-----------|---------|--------|-------------|
| Add/remove platform admins | ✅ | ❌ | ❌ | ❌ | ❌ | — |
| Add/remove org users | ✅ (override) | ✅ | ❌ | ❌ | ❌ | — |
| Add/remove supervisors | ✅ | ✅ | ❌ | ❌ | ❌ | — |
| View all org data (any org) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (audit) |
| View org's own data | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Create/edit job records | — | ✅ | ✅ | ✅ | ❌ | — |
| Create/edit handoffs | — | ✅ | ✅ | ✅ | ❌ | — |
| Create/edit work orders | — | ✅ | ✅ | ❌ | ❌ | — |
| View audit logs | ✅ | ✅ (org only) | ❌ | ❌ | ❌ | ✅ |
| Configure MFA enforcement | ✅ | ✅ (org) | ❌ | ❌ | ❌ | — |
| Database schema migrations | ✅ | ❌ | ❌ | ❌ | ❌ | — |
| Review/approve policy changes | ✅ | — | — | — | — | ✅ |
| Enforce security policy | ✅ | — | — | — | — | ✅ |

---

## 12. SSP Appendices List

**Table 12.1 — Required Appendices Status**

| Appendix | Name | FedRAMP Template? | Status | File/Location |
|----------|------|-------------------|--------|---------------|
| A | FedRAMP Security Controls (Moderate baseline — 323 controls) | FedRAMP-provided | ❌ NOT STARTED | Must complete from `FedRAMP_Security_Controls_Baseline.xlsx` |
| B | Related Acronyms | CSP-provided | ⚠️ IN PROGRESS | See Section 12 below |
| C | Security Policies and Procedures | CSP-provided (zip) | ❌ NOT STARTED | [NEEDS: Formal policy docs — see gap G-08] |
| D | User Guide | CSP-provided | ⚠️ PARTIAL | In-app onboarding; formal user guide not authored |
| E | Digital Identity Worksheet | FedRAMP-provided | ❌ NOT STARTED | [NEEDS: Complete NIST SP 800-63 IAL/FAL/AAL worksheet] |
| F | Rules of Behavior | FedRAMP-provided | ❌ NOT STARTED | [NEEDS: RoB document for system users] |
| G | Information System Contingency Plan (ISCP) | FedRAMP-provided | ❌ NOT STARTED | [NEEDS: ISCP — currently relying on Supabase/Vercel SLAs without formal plan] |
| H | Configuration Management Plan (CMP) | CSP-provided | ❌ NOT STARTED | [NEEDS: Formal CMP documenting change management procedures] |
| I | Incident Response Plan (IRP) | CSP-provided | ⚠️ IN PROGRESS | `docs/security/incident-response-plan.md` (planned per gap G-09) |
| J | CIS and CRM Workbook | FedRAMP-provided | ❌ NOT STARTED | [NEEDS: Control Implementation Summary for all 323 Moderate controls] |
| K | FIPS 199 Categorization | FedRAMP-provided | ❌ NOT STARTED | [NEEDS: Formal categorization against NIST 800-60 Vol. II data types] |
| L | CSO-Specific Laws and Regulations | CSP-provided | ❌ NOT STARTED | [NEEDS: Document applicable export control (EAR/ITAR), CMMC, DFARS requirements] |
| M | Integrated Inventory Workbook | FedRAMP-provided | ❌ NOT STARTED | [NEEDS: Complete component inventory with diagram labels] |
| N | Continuous Monitoring Plan | CSP-provided | ⚠️ PARTIAL | Trivy/Codacy CI described; no formal ConMon plan |
| O | POA&M | FedRAMP-provided | ❌ NOT STARTED | [NEEDS: Plan of Action and Milestones for all open findings] |
| P | Supply Chain Risk Management Plan (SCRMP) | CSP-provided | ❌ NOT STARTED | [NEEDS: SCRMP covering npm/Deno dependencies, Supabase, Vercel, LLM provider] |
| Q | Cryptographic Modules Table | FedRAMP-provided | ⚠️ PARTIAL | See Section 10 above; needs formal Appendix Q format |

**Appendix B — Related Acronyms**

| Acronym | Definition |
|---------|-----------|
| AO | Authorizing Official |
| ATO | Authorization to Operate |
| CIA | Confidentiality, Integrity, Availability |
| CMP | Configuration Management Plan |
| CSO | Cloud Service Offering |
| CSP | Cloud Service Provider |
| DIL | Digital Identity Level |
| FIPS | Federal Information Processing Standards |
| FedRAMP | Federal Risk and Authorization Management Program |
| IAL | Identity Assurance Level |
| IA | Independent Assessor |
| ISSO | Information System Security Officer |
| IRP | Incident Response Plan |
| ISCP | Information System Contingency Plan |
| JAB | Joint Authorization Board |
| JWT | JSON Web Token |
| MFA | Multi-Factor Authentication |
| NCR | Non-Conformance Report |
| NIST | National Institute of Standards and Technology |
| P-ATO | Provisional Authorization to Operate |
| POA&M | Plan of Action and Milestones |
| RLS | Row-Level Security |
| RBAC | Role-Based Access Control |
| SAST | Static Application Security Testing |
| SCRMP | Supply Chain Risk Management Plan |
| SIEM | Security Information and Event Management |
| SLA | Service-Level Agreement |
| SPA | Single Page Application |
| SSP | System Security Plan |
| TOTP | Time-Based One-Time Password |
| 3PAO | Third-Party Assessment Organization |

---

## NIST SP 800-53 Moderate Control Families — JobLine Status Summary

> Derived from `FedRAMP_Security_Controls_Baseline.xlsx` — Moderate baseline contains **323 controls** across **18 families**.  
> This table provides a quick status for each control family to prioritize SSP Appendix A work.

| Family | Controls | Status | Notes |
|--------|----------|--------|-------|
| **AC — Access Control** (43 controls) | AC-1 through AC-25 | ✅ STRONG | RBAC implemented (7 roles), RLS enforces data isolation at DB layer, MFA enforcement, session management, account management in Supabase Auth. Formal AC policy doc needed. |
| **AU — Audit & Accountability** (16 controls) | AU-1 through AU-12 | ✅ STRONG | `activity_logs` table with 22 event types, `user_sessions` tracks IP/device, audit records contain who/what/when/where/outcome. SIEM integration needed (AU-9, AU-11). |
| **IA — Identification & Authentication** (27 controls) | IA-1 through IA-12 | ✅ STRONG | JWT auth, TOTP MFA, bcrypt passwords, OAuth 2.0 OIDC, session timeouts. FIPS-validated crypto for authenticators needs attention (IA-7). |
| **SC — System & Communications Protection** (29 controls) | SC-1 through SC-28 | ✅ STRONG | TLS 1.2/1.3 everywhere, HTTPS-only, boundary protection via Supabase/Vercel. FIPS 140 for crypto needed. Denial-of-service protection via Vercel/Supabase (SC-5). |
| **SI — System & Information Integrity** (24 controls) | SI-1 through SI-19 | ⚠️ PARTIAL | Trivy/Codacy for malware/vuln scanning. No formal spam protection (SI-8), no input validation policy. SI-7 (integrity checking) needs FIPS-validated hashes. |
| **CM — Configuration Management** (27 controls) | CM-1 through CM-14 | ⚠️ PARTIAL | Code repo enforces change tracking. No formal CMP (CM-1), no baseline config documentation (CM-2), no formal change control board. System component inventory (CM-8) not formally maintained. |
| **IR — Incident Response** (17 controls) | IR-1 through IR-10 | ❌ GAP | No formal IRP (IR-1, IR-8). No incident response training (IR-2). No defined IR team (IR-7). Writing IRP is Phase 1 gap item G-09. |
| **CP — Contingency Planning** (23 controls) | CP-1 through CP-13 | ⚠️ PARTIAL | Supabase daily backups / PITR (CP-9). No formal ISCP (CP-2). No alternate processing site formally documented (CP-7). |
| **CA — Security Assessment & Authorization** (14 controls) | CA-1 through CA-9 | ❌ GAP | No formal security assessment (CA-2). No authorization package (CA-6). No continuous monitoring plan (CA-7). No pen testing (CA-8). All core to Phase 2–3. |
| **RA — Risk Assessment** (11 controls) | RA-1 through RA-9 | ⚠️ PARTIAL | Trivy scanning covers RA-5 (vulnerability scanning). No formal risk assessment (RA-3). No privacy risk assessment (RA-8). VMP covers RA-5 SLAs. |
| **SA — System & Services Acquisition** (21 controls) | SA-1 through SA-23 | ⚠️ PARTIAL | Secure SDLC exists (CI scanning). No formal SA policy (SA-1). No formal acquisition docs (SA-4). No supply chain plan (SA-12/SA-20 → SR family). Developer training needed (SA-15). |
| **AT — Awareness & Training** (6 controls) | AT-1 through AT-6 | ❌ GAP | No formal security awareness training (AT-2). No role-based security training (AT-3). All staff need annual ISSO training documents. |
| **PS — Personnel Security** (10 controls) | PS-1 through PS-9 | ❌ GAP | No formal personnel security policy (PS-1). No documented background screening (PS-3). No formal termination procedures (PS-4) or transfer procedures (PS-5). |
| **PL — Planning** (7 controls) | PL-1 through PL-11 | ❌ GAP | No formal system security plan as an approved document (PL-2). No rules of behavior (PL-4). No security architecture document (PL-8). This SSP draft is the beginning. |
| **MA — Maintenance** (10 controls) | MA-1 through MA-6 | ✅ INHERITED | All infrastructure (Supabase + Vercel) is vendor-managed. Document controlled maintenance (MA-2) for any direct system access. No self-managed hardware. |
| **MP — Media Protection** (7 controls) | MP-1 through MP-8 | ✅ INHERITED | No physical media — cloud-based. Supabase/AWS handles media sanitization (MP-6). Policies for workstation media needed. |
| **PE — Physical & Environmental Protection** (19 controls) | PE-1 through PE-20 | ✅ INHERITED | Data centers are AWS (us-east-1) — PE controls inherited from AWS FedRAMP authorization (AWS GovCloud is FedRAMP High). Need to document inheritance in SSP Appendix A. |
| **SR — Supply Chain Risk Management** (12 controls) | SR-1 through SR-12 | ❌ GAP | No formal SCRMP (SR-2). No acquisition strategies for supply chain (SR-5). SBOM not generated (SR-3). SBOMs required for SR-3 compliance. |

---

## Critical Path to FedRAMP Moderate Authorization

Based on this SSP analysis and the `FedRAMP_Security_Controls_Baseline.xlsx`, `CSP_Authorization_Playbook.pdf`, and `Agency_Authorization_Playbook.pdf`:

### Step 1 — Infrastructure Decision (Blocking)
FedRAMP Moderate requires that **all infrastructure handling federal data must be FedRAMP authorized or inherit authorization**. Current state:
- ❌ Supabase commercial = NOT FedRAMP authorized
- ❌ Vercel = NOT FedRAMP authorized

**Decision required:** Migrate to one of:
- **Option A:** AWS GovCloud (RDS PostgreSQL + Lambda + CloudFront) — Full FedRAMP High
- **Option B:** Supabase Enterprise on GovCloud tenant (if/when available)
- **Option C:** Azure Government (PostgreSQL Flexible Server + Azure Static Web Apps)

Until this decision is made, FedRAMP Moderate authorization cannot proceed.

### Step 2 — Complete Phase 1 Documentation (6 documents)
See `gap-remediation-roadmap.md` Phase 1 items. These must exist before 3PAO engagement.

### Step 3 — Engage 3PAO for Readiness Assessment
Before full assessment, a 3PAO "readiness review" (~$20–50K) identifies remaining gaps and avoids wasted spend on a full assessment with known blockers.

### Step 4 — Complete SSP Appendices A, C–P
The 323-control Appendix A is the largest work item. The CIS/CRM Workbook (Appendix J) maps CustomerResponsibility vs. CSP responsibility for each control — critical for agency review.

### Step 5 — Engage Sponsoring Agency or JAB
- **Agency ATO path:** Find a single federal agency willing to sponsor and accept the ATO. More common for startups.
- **JAB P-ATO path:** Requires JAB TRs (FedRAMP technical reviewers) review — higher bar, takes 12–18 months, but results in broader marketability.

### Step 6 — Assessment, POA&M, and ATO
3PAO conducts Security Assessment (SAR). CSP responds with POA&M for open findings. AO issues ATO. ConMon begins.

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | April 13, 2026 | Engineering Lead | Initial draft — pre-3PAO preparation; marks all gaps and inherited controls |

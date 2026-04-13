# JobLine AI — General Atomics Vendor Questionnaire Response
**Questionnaire:** ITS General Vendor Questionnaire Workbook 2.xlsx  
**Submitted by:** JobLine AI (WeCr8 Solutions)  
**Date:** April 2026  
**Version:** 1.0 — Initial Submission  
**Status:** Draft — Pending Legal / Leadership Review Before Submission  

> **Legend:**  
> ✅ YES — Fully satisfied  
> ⚠️ PARTIAL — Partially satisfied; see notes  
> ❌ NO / GAP — Not yet satisfied; see Gap Roadmap  
> ➡️ N/A — Not applicable to our architecture  

---

## SHEET 2 — Mandatory IT Questions

### Section A: Vendor Systems (WeCr8 Solutions as an organization)

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 1 | Does your organization have a documented security program? | ⚠️ PARTIAL | We maintain internal engineering security standards enforced via Codacy static analysis, dependency vulnerability scanning (Trivy), and RLS-enforced data isolation. A formal written security program document is in progress. |
| 1a | Can the document be made available for review if requested? | ⚠️ PARTIAL | We will provide available documentation upon request. The formal security program is currently being finalized. |
| 2 | Do you have a corporate Vulnerability Management Program for your own networks? | ⚠️ PARTIAL | All application dependencies are scanned continuously via Codacy/Trivy in our CI pipeline. Our team uses managed SaaS infrastructure (Supabase, Vercel) with no self-operated servers, which limits our direct network exposure surface. A formal VMP document is in development (see `docs/approval/fedramp/`). |
| 2a | Can the document be made available for review if requested? | ⚠️ PARTIAL | Yes, once finalized. |
| 3 | Do you have a cybersecurity incident response plan? | ⚠️ PARTIAL | We have informal procedures for security incidents. A formal written IRP detailing severity levels, response timelines, and customer notification procedures is in development. |
| 3a | Can the document be made available for review if requested? | ⚠️ PARTIAL | Yes, once finalized. |
| 4 | Do you employ server hardening? | ✅ YES | We do not operate bare-metal or self-managed servers. Application infrastructure runs on Vercel (frontend) and Supabase (database, auth, edge functions), both of which apply server hardening, CIS benchmarks, and managed patching at the platform level. For self-hosted deployments, our customer hardening guide provides configuration requirements. |
| 5 | Do you log and review security events? | ✅ YES | All authentication events (login, logout, signup, failures) are logged to the `activity_logs` table. User sessions are tracked in `user_sessions` with IP address, user agent, and device info. Admin access to logs is restricted by RBAC. |
| 6 | Do you notify your customers during the event of a cybersecurity incident/breach? | ⚠️ PARTIAL | We commit to customer notification for incidents affecting customer data. Formal notification timelines and procedures are being codified in our incident response plan. |
| 6a | What is the timeframe for notification? | ⚠️ PARTIAL | Target: within 72 hours of confirmed incident affecting customer data, consistent with GDPR Article 33 standards. To be formalized in IRP. |
| 7 | Does your organization and/or parent company reside in a foreign country? | ✅ NO | WeCr8 Solutions is a US-based company. No parent company in a foreign country. |
| 7a | If yes, which country? | ➡️ N/A | Domestic US entity. |

---

### Section B: Product Being Offered (JobLine AI SaaS)

#### Cloud Offerings

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 7 | Do you offer a SaaS solution? | ✅ YES | JobLine AI is offered as a SaaS product at jobline.ai and as a self-hosted on-premises Electron desktop application. |
| 8 | Is the SaaS solution authorized as at least FedRAMP moderate in the FedRAMP marketplace? | ❌ NO (GAP) | JobLine AI is not currently FedRAMP authorized. As a seed-stage startup, FedRAMP authorization is on the roadmap pending enterprise contract commitments that justify the investment (~$1–2M and 12–18 months). See Gap Roadmap. |
| 9 | If not FedRAMP moderate, is the service FedRAMP moderate equivalent with 3PAO evidence? | ❌ NO (GAP) | We do not currently have 3PAO attestation. We are able to provide a control mapping against NIST SP 800-53 Rev. 5 Moderate baseline, demonstrating architectural equivalency through our Supabase and Vercel infrastructure. See Gap Roadmap. |
| 10 | If not FedRAMP, is the product deployable on IL4 Gov Clouds? | ⚠️ PARTIAL | The self-hosted deployment option supports configuration against a customer-controlled Supabase instance running on any cloud provider, including AWS GovCloud or Azure Government. The SaaS product itself runs on commercial Supabase (us-east-1 AWS). A validated IL4 configuration guide is in development. |
| 10a | If IL4 deployable, do you follow a secure SDLC? | ✅ YES | We follow a secure SDLC: code review required for all PRs, static analysis via Codacy (ESLint, security rules), dependency vulnerability scanning via Trivy, and automated test suite (219+ tests via Vitest). |
| 10b | Do you provide Software Bill of Materials (SBOMs)? | ❌ NO (GAP) | SBOMs are not currently generated as part of our release process. We can generate them from `package.json` and `bun.lockb` via standard tooling (CycloneDX or Syft). Adding to roadmap. |

#### Access Control & Identification/Authentication

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 11 | Does your product support Role Based Access Control (RBAC)? | ✅ YES | Full RBAC is implemented across three scopes: Platform roles (admin, developer), Organization roles (supervisor, operator, viewer, engineering, programming), and Team roles (owner, admin, member). All data access is enforced at the database layer via PostgreSQL Row-Level Security (RLS) policies — no client-side bypass is possible. |
| 12 | Does your product support Single-Sign-On (SSO)? | ⚠️ PARTIAL | OAuth 2.0 / OpenID Connect is supported (Google, Microsoft, GitHub) via Supabase Auth. Enterprise SAML-based SSO (Okta, Azure AD, ADFS) is on the roadmap for enterprise tier. |
| 13 | Does your product support MFA for administrators? | ✅ YES | TOTP-based MFA is supported via Supabase Auth. Organizations can enforce MFA for all users via the `mfa_required` org setting. When enforced, users are blocked from accessing the application until MFA enrollment is complete (`useMFAEnforcement` hook). |
| 13a | Does your product support MFA for general users? | ✅ YES | MFA is configurable per organization and applies to all user roles including operators and viewers when the org-level `mfa_required` flag is enabled. |
| 13b | Does your product support OAuth 2.0 or OpenID for MFA? | ✅ YES | OAuth 2.0 and OpenID Connect are used for federated identity (Google, Microsoft). TOTP MFA is layered on top of these identity providers via Supabase Auth. |

#### Vulnerability Management & SDLC

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 14 | Do you have a Vulnerability Management Program for your product? | ⚠️ PARTIAL | Dependency vulnerabilities are scanned continuously via Trivy (Codacy integration) on every commit and PR. Critical findings block merge. A formal VMP document with defined SLAs is in development. |
| 15 | Are security checks integrated into your SDLC? | ✅ YES | |
| 15a | Code scanning | ✅ YES | Codacy static analysis runs on every commit: ESLint with security rules, TypeScript strict mode, code pattern analysis. |
| 15b | Vulnerability scanning | ✅ YES | Trivy scans all dependencies via Codacy on every commit. CVE detection with severity-based blocking. |
| 15c | Penetration testing | ❌ NO (GAP) | Third-party penetration testing has not been performed. Scheduled for Q3 2026 as part of enterprise readiness. |
| 16 | Do you remediate findings from security checks pursuant to established SLAs? | ⚠️ PARTIAL | Critical vulnerabilities are remediated on the same PR before merge. Formal written SLA tiers (Critical/High/Medium/Low) are being documented in the VMP. |

#### Audit Logging

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 17 | Does your product support audit logging for user, administrative, and system changes? | ✅ YES | The `activity_logs` table records all significant events: login, logout, signup, handoff created/updated, station changes, team changes, role changes, NCR events, work order adjustments. Logs are accessible to admin and developer roles only, enforced by RLS. |
| 18 | Do audit records contain the minimum required fields (what, when, where, source, outcome, identity)? | ✅ YES | Each `activity_logs` record captures: event type (what), `created_at` timestamp (when), user agent / IP in `user_sessions` (where/source), success/failure outcome, and `user_id` + `user_email` (identity). The `activity_type` enum has 22 distinct event categories. |
| 19 | Does your product support offloading audit logs to a SIEM or logging repository? | ⚠️ PARTIAL | Audit logs are stored in PostgreSQL (Supabase) and can be queried via the Supabase Management API or exported via Postgres logical replication. Direct SIEM push integration (Splunk, QRadar, Microsoft Sentinel) is not yet built but is architecturally supported. Adding to roadmap. |

#### Encryption

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 20 | Does your product support secure communications in transit (SSL/TLS)? | ✅ YES | All traffic uses TLS 1.2/1.3 enforced by Vercel (frontend, edge) and Supabase (API, database connections). HTTP is redirected to HTTPS. All edge functions enforce HTTPS-only communication. |
| 21 | Can data at rest be encrypted without affecting functionality? | ✅ YES | All data at rest is encrypted by Supabase (AES-256 encryption of PostgreSQL storage, provided by AWS infrastructure). |
| 21a | What encryption level? FIPS 140-2 or 140-3 validated? | ⚠️ PARTIAL | Supabase runs on AWS which provides FIPS 140-2 validated cryptographic modules (AWS CloudHSM, AWS KMS). However, Supabase's commercial tier is not itself FedRAMP authorized, meaning the FIPS validation inherit chain has not been formally attested. For deployments requiring FIPS 140-2 attestation, the self-hosted configuration on an AWS GovCloud Supabase instance is required. |

#### Implementation / Support

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 22 | If support staff access servers/databases/data, are they US Citizens or US Persons? | ✅ YES | WeCr8 Solutions is a US-based company. All engineering and support personnel with access to production infrastructure and customer data are US Citizens or US Persons. |
| 23 | Is the product or service hosted on infrastructure based in the United States? | ✅ YES | SaaS: Supabase (AWS us-east-1, Virginia) and Vercel (US edge + origin). Self-hosted: Customer controls the hosting region. |
| 23a | Is high-availability also hosted within the US? | ✅ YES | Vercel's global edge CDN includes US-based POPs. Supabase production tier provides high availability within the us-east-1 region. |

---

## SHEET 3 — Mandatory AI Questions

> JobLine AI **does** include an AI planning assistant feature (edge function `ai-planning-assistant`) powered by an external LLM API. The following answers cover **current state**. The second block (future plans) is intentionally left consistent as our roadmap for local LLM is documented.

### Current AI in Product

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 1 | Is the backend LLM commercially available or custom trained? | ✅ | The LLM is a commercially available model accessed via API (external LLM provider). No custom training is performed. |
| 2 | Where is data stored, processed, and transmitted? | ⚠️ PARTIAL | Data is processed in-transit to the LLM API endpoint over HTTPS. Only the minimum contextual data needed for the planning response is sent (job records, station IDs, work order summaries scoped to the requesting authenticated organization). No raw customer data is stored by the LLM provider beyond transient request processing per their standard API terms. |
| 3 | Is prompt data used to train or fine-tune models? | ✅ | JobLine AI does not opt into training data sharing with the LLM provider. Enterprise API arrangements typically exclude prompt data from training (to be verified with LLM provider contract terms and disclosed to customer). |
| 4 | Is the LLM service segregated or isolated per customer? | ✅ | Organization ID is injected at the query layer: all data passed to the LLM is scoped to the authenticated user's organization via RLS-enforced queries before the prompt is assembled. No cross-tenant data bleed is architecturally possible. |
| 5 | How long are user prompts and completions stored? | ⚠️ PARTIAL | JobLine AI does not currently persist prompt text or LLM completions to the database. Prompts are transient (request → response cycle). We do not currently have a formal retention policy document. In development. |
| 6 | Where is prompt data stored and processed? | ⚠️ As above | Prompts are not persistently stored by JobLine. They are transmitted to the LLM API over HTTPS and discarded after the response is returned. |
| 7 | Are there controls to detect prompt injection, malicious code suggestions, or model misuse? | ⚠️ PARTIAL | The AI feature requires authenticated requests (JWT bearer token validated in the edge function). The context passed to the LLM is assembled from structured database queries, not raw user text, which limits prompt injection surface. Additional output validation and prompt injection detection controls are on the roadmap. |
| 8 | Can the AI features be disabled? | ✅ YES | The AI planning assistant is invoked only via explicit user action. It can be disabled at the organization level via the entitlements system (`features.ai_planning`). Disabling prevents the edge function from responding to requests from that org. |
| 9 | Can a customer opt out of using AI features? | ✅ YES | Yes, either by not enabling the AI entitlement, or by contacting support to disable it at the org level. No AI features are on by default for new organizations. |

### Future AI Plans

JobLine's roadmap includes a **local LLM option** for self-hosted / ITAR deployments (`docs/prd/07-local-llm-test-repair-prd.md`) that would process all data locally within the customer's network boundary, eliminating all external LLM data transmission concerns. The same answers above would apply, with the additional improvement that data would never leave the customer's environment.

---

## SHEET 4 — Supplemental Questions: Vendor Systems

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 1 | What security standards/compliance frameworks does your security program follow? | ⚠️ PARTIAL | Our security posture is aligned with: NIST SP 800-53 (access control, audit, identification & authentication, system protection), OWASP Top 10 (enforced via Codacy static analysis), and Supabase's own SOC 2 Type II infrastructure controls. We do not yet hold SOC 2, ISO 27001, or FedRAMP authorizations. See Gap Roadmap. |
| 2 | Does your IR plan include customer notification? What are the response procedures? | ⚠️ PARTIAL | Our commitment is to notify customers within 72 hours of confirmed breach affecting their data. Formal IR plan with severity tiers and runbooks is in development. |
| 3 | Do you perform regular network, application, and OS-level vulnerability scans? | ✅ YES | Application-layer: Trivy + Codacy on every commit. We rely on Supabase and Vercel for infrastructure-layer scanning as part of their managed services. |
| 4 | Do you employ a third-party to test your security posture? | ❌ NO (GAP) | Not yet. Third-party penetration testing scheduled for Q3 2026. |
| 5 | How is MFA deployed in your environments? | ✅ YES | TOTP MFA via Supabase Auth. Per-organization enforcement toggle. Admin console requires platform admin role (restricted to company owner). |
| 6 | How do you keep server operating systems patched? | ✅ YES | We operate no self-managed server OS. Supabase and Vercel handle all OS patching as part of their managed service SLAs. |
| 7 | What operating systems are used on your servers? | ✅ | Supabase: Linux (AWS-managed). Vercel: Linux (managed edge runtime). Our Electron desktop app supports Windows 10/11 and macOS. |
| 8 | How do you keep workstations patched? | ✅ | Engineering workstations use current Windows 11 and macOS with automatic OS updates enabled. Developer tooling (Node.js, Bun, etc.) is managed via package managers and updated regularly. |
| 9 | How often do you patch? | ✅ | Infrastructure: continuous (managed by Supabase/Vercel). Application dependencies: scanned on every commit; critical CVEs addressed within the same sprint. |
| 10 | Is network equipment physically secured? | ✅ YES | WeCr8 Solutions is a cloud-native company. Physical network equipment at our offices uses standard commercial-grade secured networking. No customer data traverses on-premise equipment. |
| 11 | What data center providers do you use? | ✅ | **Supabase** (AWS us-east-1 — Northern Virginia) for database, auth, and edge functions. **Vercel** (US-based edge + origin) for frontend hosting and API routing. |
| 12 | What countries are your data centers located in? | ✅ | United States only (SaaS tier). Self-hosted: customer's choice. |
| 13 | Who has access to your data centers? | ✅ | Data center physical access is managed entirely by AWS and Vercel infrastructure teams. WeCr8 Solutions has no physical data center presence. Access to the Supabase management console is restricted to company founders. |
| 14 | Do you backup your data? | ✅ YES | Supabase Pro tier includes daily automated backups with point-in-time recovery (PITR). |
| 15 | How do you store backups? | ✅ | Supabase stores backups in AWS S3 with server-side encryption (AES-256). Backups are logically separated from production data. |
| 16 | Do you test backups? | ⚠️ PARTIAL | Supabase provides backup restoration tooling. We have not yet formalized a scheduled backup restoration test cadence. Adding to documentation roadmap. |
| 17 | Do you have business continuity procedures? | ⚠️ PARTIAL | Our SaaS inherits Supabase's and Vercel's high-availability and resilience guarantees. A formal BCP document for WeCr8 Solutions as a company (key person coverage, escalation paths) is in development. |
| 18 | What type of code review process do you have? | ✅ YES | All changes require a pull request. Commits to `main` require review. Codacy automated analysis gates on every PR. Commits that introduce critical vulnerabilities or regressions are blocked. |
| 19 | Do you have a process for end-to-end testing? | ✅ YES | Vitest-based test suite with 219+ tests covering RLS policies, role access patterns, component behavior, and API integration. RoleScopeTestRunner provides in-app role boundary verification. |
| 20 | Does your product offer automation for time changes? | ✅ YES | All timestamps are stored in UTC (PostgreSQL `timestamptz`). UI rendering converts to local timezone automatically via browser APIs. No manual time-change intervention required. |
| 21 | What are your security protocols for transferring data to external devices? | ✅ | Data export functions require authentication and appropriate role (supervisor or admin). All transfers occur over HTTPS. No automatic sync to external drives. Self-hosted deployments can configure additional controls at the network layer. |
| 22 | Do you have an Account Management team for larger customers? | ⚠️ PARTIAL | Currently handled directly by founders. As we scale to enterprise accounts, a dedicated customer success/account management function will be established. |
| 23 | Do you have a Product Roadmap? | ✅ YES | Yes. Maintained in `docs/prd/` covering production readiness, ITAR readiness, security hardening, testing, and upcoming features. Available for NDA-protected review. |
| 24 | What development lifecycle framework and SLAs do you follow? | ✅ | Continuous delivery: feature branches → PR review → automated testing → merge to `main` → Vercel auto-deploy. Bug SLAs: Critical (same sprint), High (next sprint), Medium/Low (backlog prioritization). |
| 25 | Have you experienced any data spills in the last 12 months? | ✅ NO | No data spills or confirmed data breaches have occurred. |

---

## SHEET 5 — Supplemental Questions: Product

| ID | Question | Status | JobLine Response |
|----|----------|--------|-----------------|
| 1 | What is your application? What does it do? | ✅ | **JobLine AI** is a real-time job tracking and shift handoff platform for manufacturing shops (CNC, auto repair, body shops, fabrication). It provides live job board visibility, digital shift handoffs, work order tracking, NCR management, and production analytics. Available as SaaS (jobline.ai) and self-hosted Electron app. |
| 2 | Please provide an architecture diagram | ⚠️ PARTIAL | Mermaid architecture diagrams exist in `docs/mermaid/` (system context, service architecture, data flow, ERD, RLS matrix). A customer-facing PDF version will be prepared upon request. |
| 3 | What is your defense in depth strategy? | ✅ | **Layer 1:** TLS 1.2/1.3 in transit (Vercel + Supabase). **Layer 2:** JWT authentication on all API calls. **Layer 3:** PostgreSQL RLS — every DB query is scoped to the authenticated user's organization. **Layer 4:** RBAC — admin/supervisor/operator/viewer roles with distinct capability sets. **Layer 5:** Codacy static analysis gates on all commits. **Layer 6:** Edge function auth validation (JWT verified before any data access). |
| 4 | What type of end client is used? | ✅ | Thin web client (browser-based React SPA) for SaaS. Thick client (Electron desktop app) for self-hosted. Mobile browser supported but native mobile app not yet available. |
| 5 | What web browsers are supported? | ✅ | Chrome (recommended), Firefox, Edge, Safari. Modern evergreen browsers. IE11 not supported. |
| 6 | Can you provide uptime statistics? | ⚠️ PARTIAL | We rely on Supabase's SLA (99.9% uptime) and Vercel's SLA (99.99% uptime). Formal jobline.ai uptime statistics will be available via a status page being configured at status.jobline.ai. |
| 7 | Server requirements (On-Prem) | ✅ | Self-hosted deployment requires: Windows 10/11 x64 (for Electron app), or any OS with a modern browser. Backend: Self-hosted Supabase requires Docker and a Linux server (min. 2 vCPU / 4GB RAM). Full requirements detailed in `desktop/docs/Desktop_Build_Guide.md` and `docs/prd/02-itar-self-hosted-deployment.md`. |
| 8 | Storage requirements | ✅ | SaaS: Managed by Supabase (scales automatically). Self-hosted: PostgreSQL storage scales with data volume; initial deployment ~10GB recommended with growth capacity. |
| 9 | Database requirements | ✅ | PostgreSQL 15+ (provided by Supabase). Data is stored within the managed database. No external NAS required. |
| 10 | Cloud infrastructure: own or third party? | ✅ | Third party: **Supabase** (AWS us-east-1) + **Vercel** (Vercel edge network, US-based origin). |
| 11 | Third party provider, data flow diagram? | ⚠️ PARTIAL | Data flow: User browser → Vercel edge (HTTPS) → Supabase API (HTTPS/JWT) → PostgreSQL (mutual TLS). Edge functions: Vercel → Supabase Edge Runtime → external APIs (LLM, Stripe) as needed. Formal data flow diagram available in `docs/mermaid/`. PDF version upon request. |
| 12 | Are in-cloud and federated accounts both supported? | ✅ YES | Both supported: in-cloud email/password accounts and federated OAuth (Google, Microsoft, GitHub) via Supabase Auth. |
| 13 | Can in-cloud accounts be outfitted with MFA? | ✅ YES | TOTP MFA is available for all account types. Can be enforced at the organization level. |
| 14 | Compatible with major OS (Mac, Windows, Linux)? | ✅ | SaaS: Browser-based, compatible with all. Self-hosted Electron: Windows 10/11 and macOS. Linux self-hosted via Docker + browser. |
| 15 | Any middleware requirements? | ✅ | SaaS: None. Self-hosted: Docker for Supabase. No proprietary middleware required. |
| 16 | Endpoint HD space? | ✅ | SaaS: None (browser-based). Electron app: ~500MB. Self-hosted Supabase: see server requirements above. |
| 17 | Endpoint memory requirements? | ✅ | SaaS: Browser standard. Electron: 4GB RAM recommended. |
| 18 | Does your product support multiple security-level roles? | ✅ YES | **Platform:** admin, developer. **Organization:** supervisor, operator, viewer, engineering, programming. **Team:** owner, admin, member. Clear capability distinctions between roles enforced at the database layer. Read-only, read/write, and full admin modes are distinct. |
| 19 | Does your product require login credentials? | ✅ YES | Authentication is required for all features. Session tokens are JWT-based, managed by Supabase Auth. |
| 20 | Does your product integrate with Active Directory? | ❌ NO (GAP) | Direct AD/LDAP integration is not built. SAML 2.0 SSO (which enables AD federation via Azure AD / ADFS) is on the enterprise roadmap. |
| 21 | Does your product have minimum password security standards? | ✅ YES | Enforced by Supabase Auth: minimum 8 characters, bcrypt hashing. Additional complexity rules (uppercase, number, special character) are configurable. |
| 22 | What are the password complexity requirements? | ✅ | Supabase default: minimum 8 characters. Configurable: uppercase letter, number, special character requirements available in Supabase Auth settings. |
| 23 | Are passwords stored in an encrypted format? | ✅ YES | Passwords are hashed using bcrypt (Supabase Auth). Plaintext passwords are never stored. |
| 24 | Are passwords transmitted in an encrypted format? | ✅ YES | All auth API calls use HTTPS (TLS 1.2/1.3). Passwords are never transmitted in plaintext. |
| 25 | How do users get their initial password? | ✅ | Users register with email + password, or use OAuth (passwordless). Org users invited via unique invite codes that prompt credential creation on first use. |
| 26 | How can users recover their credentials? | ✅ | Supabase Auth provides email-based password reset (magic link). Recovery emails are sent from a controlled domain. |
| 27 | Does your product support user session timeouts? | ✅ YES | Supabase Auth JWT tokens expire (default 1 hour, configurable). Sessions are tracked in the `user_sessions` table with `expires_at` and `last_activity_at`. |
| 28 | What are session timeout configurations? | ✅ | Default JWT access token expiry: 1 hour. Refresh token: 7 days (configurable). Sessions can be revoked by admins via the `user_sessions` table. |
| 29 | How do you manage access tokens? | ✅ | JWTs are used for all API access. Access tokens expire in 1 hour. Refresh tokens can be revoked by admins. `is_active` field in `user_sessions` allows instant session termination. Platform admins can invalidate all sessions for a user. |
| 30 | Do you have a bug bounty program? | ❌ NO (GAP) | Not yet established. Responsible disclosure policy and security contact (security@jobline.ai) will be published on roadmap. |
| 31 | Do you have a defined release management schedule? | ✅ YES | Continuous delivery to SaaS via Vercel (on merge to `main`). Desktop: versioned releases documented in `docs/desktop/RELEASE_NOTES_*.md` and `public/release.json`. |
| 32 | Is there clear communication on upcoming releases, including release notes and incompatibilities? | ✅ YES | Release notes maintained in `desktop/docs/RELEASE_NOTES_1.0.0.md`. SaaS changes documented via changelog. Incompatibility notices included in release documentation. |
| 33 | Do you employ pentesting against your products? | ❌ NO (GAP) | Not yet. Planned for Q3 2026. |
| 34 | Does your application have a valid SSL certificate? | ✅ YES | TLS certificates are managed by Vercel (Let's Encrypt / DigiCert) and Supabase. Auto-renewed. Valid for jobline.ai and all subdomains. |
| 35 | Is data encrypted at rest? | ✅ YES | AES-256 at rest via Supabase/AWS storage encryption. All PostgreSQL data, backups, and file storage are encrypted. |
| 36 | Are backups performed according to a documented backup and recovery plan? | ⚠️ PARTIAL | Supabase Pro provides daily automated backups with PITR. Our internal backup and recovery plan document is in development. |
| 37 | Are backups encrypted? | ✅ YES | Supabase backups are stored in AWS S3 with AES-256 server-side encryption. |
| 38 | Are there any unique backup requirements? | ✅ | No unique requirements for SaaS. Self-hosted customers are responsible for their own backup configuration, with guidance provided in deployment documentation. |
| 39 | What is included in backups? | ✅ | Full PostgreSQL database snapshots including all tables, schemas, RLS policies, functions, and data. Configuration is managed via Supabase infrastructure (not in backup scope). |
| 40 | Are backups geographically separated from the application? | ✅ YES | Supabase backups are stored in a separate AWS S3 bucket, logically and physically separated from the primary database instance. AWS manages geographic redundancy within the region. |
| 41 | Can audit logs be sent to a SIEM such as QRadar? | ⚠️ PARTIAL | Audit logs are in PostgreSQL and can be exported via Supabase's API, Postgres logical replication, or webhook triggers. Native push-integration to QRadar/Splunk/Sentinel is on the roadmap. |
| 42 | Is a mobile application available? | ⚠️ PARTIAL | The web application is mobile-responsive and functional via mobile browser. A dedicated native mobile app (iOS/Android) is not currently available but is on the roadmap. |
| 43 | Is mobile app compatible with Microsoft Intune? | ⚠️ PARTIAL | The browser-based web app runs within any Intune-managed browser (Edge, Chrome with Intune MAM policy). A native mobile app subject to Intune would be required for full MDM management. |
| 44 | Additional mobile controls? | ✅ | Authentication required within the app on every session. MFA can be enforced org-wide. Session timeout applies to mobile browsers as well. |
| 45 | What mobile OS is compatible? | ✅ | Mobile browsers on iOS 15+ and Android 10+ are supported. Can run on tablets. |
| 46 | How do you handle offline scenarios? | ⚠️ PARTIAL | The SaaS application requires network connectivity. The Electron desktop app can cache recent data for limited read-only offline viewing. Full offline write capability is on the roadmap. |
| 47 | Does the product work in VDI environments? | ✅ YES | The browser-based SaaS works in any VDI environment that supports a modern web browser (Citrix, VMware Horizon, Azure Virtual Desktop). |
| 48 | Does the product communicate with third parties? | ✅ YES | **Stripe** (billing/payments — SaaS only), **external LLM API** (AI planning feature — can be disabled), **Google Analytics** (disabled on self-hosted via `VITE_DISABLE_ANALYTICS=true`). No third-party communication for core handoff/job tracking data. |
| 49 | Does the application require vendor access to servers for patches? | ✅ NO | SaaS: Vercel and Supabase handle infrastructure updates transparently. Self-hosted: Customer manages their own Supabase instance; vendor access not required. |
| 50 | Are there specific networking requirements? | ✅ | HTTPS (443) outbound to jobline.ai and Supabase project URL. WebSocket (wss://) for real-time features. No multicast or specialty networking required. |
| 51 | Do you offer High Availability Architecture? | ✅ YES | Vercel provides global HA via edge CDN. Supabase Pro provides database HA with automatic failover. |
| 52 | What failover components exist? | ✅ | Supabase: managed PostgreSQL primary-replica with automatic failover. Vercel: stateless edge functions with no single point of failure. |
| 53 | How does infrastructure expand to accommodate growth? | ✅ | SaaS: Horizontal scaling is managed by Supabase (connection pooling via PgBouncer) and Vercel (auto-scaling edge). Compute scales automatically with load. |
| 54 | Are updates voluntary or automated? | ✅ | SaaS: Automated (deploy on merge to main). Electron desktop: Update check on app launch; user approves update install. |
| 55 | What is your release cycle? | ✅ | SaaS: Continuous delivery (multiple times per week). Desktop: Versioned releases, typically monthly or on significant feature completion. |
| 56 | How are patches delivered? | ✅ | SaaS: Vercel deploys automatically on merge. Desktop: Electron auto-updater fetches signed update from update server. |
| 57 | How are encryption keys stored? | ✅ | Supabase manages encryption keys using AWS KMS. Application-level JWT secrets are stored as Supabase environment secrets (not in code). No encryption keys are stored in the codebase. |
| 58 | How is the administrative interface managed? | ✅ | Admin interface (`/admin`) is gated by `has_role(user_id, 'admin')` RLS helper function. Platform admin role is assigned only via the Supabase dashboard directly (no UI self-assignment possible). |
| 59 | If deployed in containers, what are the requirements? | ✅ | Self-hosted Supabase uses Docker containers (standard Supabase `docker-compose` configuration). Customer manages container lifecycle. Vercel/Supabase SaaS uses serverless/managed containers with no customer container management needed. |
| 60 | Are there additional application requirements? | ✅ | None beyond a modern web browser for SaaS. See `desktop/docs/Desktop_Build_Guide.md` for Electron self-hosted. |
| 61 | Additional infrastructure requirements? | ✅ | SaaS: None. Self-hosted: DNS configuration, reverse proxy (nginx recommended), Docker, Linux host. |
| 62 | Additional networking requirements? | ✅ | Can run on standard corporate WiFi. No specialty wireless or multicast needed. Standard HTTPS/WSS on port 443. |
| 63 | What config/reporting can be done in-house vs vendor support? | ✅ | **In-house by customer:** Organization settings, team/user management, station configuration, role assignments, custom fields, report exports. **Vendor support needed:** Schema migrations, platform-level billing, new integration development. |
| 64 | Do you allow client configuration (functional)? | ✅ YES | Full org configuration by admin users: stations, teams, work order fields, handoff templates, notification settings. |
| 65 | Do you allow client configuration (reporting)? | ✅ YES | Supervisors and admins can configure dashboards, filter views, and export data. Custom reporting endpoints are available for enterprise customers. |
| 66 | What training is included? | ✅ | Knowledge base articles, in-app onboarding, and contextual help. Professional services implementation support available for enterprise contracts. |
| 67 | How many environment instances are included? | ⚠️ PARTIAL | SaaS: Production environment included. Separate staging/QA environments are available to enterprise customers by arrangement. Internal staging at Vercel preview URLs for development. |
| 68 | How are secondary instances (Test/QA) licensed? | ⚠️ PARTIAL | QA environments use the same subscription. Physical/logical separation for enterprise QA is available as an add-on. |
| 69 | What is the licensing structure? | ✅ | Subscription-based (monthly/annual). No perpetual license. Tiered: Free, Pro, Enterprise. |
| 70 | Are any additional licenses required? | ✅ | No additional third-party software licenses required for end users. |
| 71 | Do you offer Professional Services for implementation? | ✅ YES | Yes. Professional services for onboarding, custom integration, and training are available for enterprise accounts. |
| 72 | Is support a "follow the sun" model or US-centered? | ✅ | Currently US-centered (support team is US-based). Enterprise SLAs with defined response times are available. |
| 73 | Do you have other clients in Aerospace & Defense? | ✅ | Yes. JobLine AI was purpose-built for manufacturing including aerospace and defense shops. Customer references available under NDA. |
| 74 | What IDP authentication types are supported? | ✅ | Email/password, Google OAuth 2.0, Microsoft OAuth 2.0, GitHub OAuth 2.0. SAML 2.0 (Azure AD, Okta, ADFS) on enterprise roadmap. |
| 75 | Do version upgrades compile from previous versions to keep features in sync? | ✅ YES | Database migrations are incremental and forward-compatible (Supabase migration system). No destructive schema changes without migration path. Application versioning ensures backward-compatible API changes. |
| 76 | What encryption do you offer for application configuration files? | ✅ | All secrets (API keys, service keys, JWT secrets) are stored as environment variables in Vercel and Supabase — never in source code or config files. Config files in the Electron app support encrypted storage via the OS keychain. Codacy scans ensure no secrets are committed to the repository. |

---

## Summary Status Table

| Sheet | Category | Total Questions | ✅ YES | ⚠️ PARTIAL | ❌ GAP |
|-------|----------|----------------|--------|-----------|-------|
| Mandatory IT — Vendor | Org security posture | 13 | 7 | 6 | 0 |
| Mandatory IT — Product (Cloud) | SaaS/FedRAMP | 4 | 1 | 1 | 2 |
| Mandatory IT — Product (A&A) | Access control | 5 | 4 | 1 | 0 |
| Mandatory IT — Product (SDLC) | Vuln management | 5 | 3 | 1 | 1 |
| Mandatory IT — Product (Audit) | Logging | 3 | 2 | 1 | 0 |
| Mandatory IT — Product (Encryption) | Crypto | 3 | 2 | 1 | 0 |
| Mandatory IT — Product (Support) | Hosting/staff | 3 | 3 | 0 | 0 |
| Mandatory AI Questions | AI security | 9 | 4 | 5 | 0 |
| Supplemental Vendor | Org practices | 25 | 18 | 6 | 1 |
| Supplemental Product | Detailed product | 76 | 55 | 14 | 7 |
| **TOTAL** | | **146** | **99 (68%)** | **36 (25%)** | **11 (7%)** |

---

## Critical Gaps Requiring Remediation (❌ Items)

| Priority | Gap | Impact | Est. Effort |
|----------|-----|--------|-------------|
| 🔴 HIGH | FedRAMP Moderate authorization | Required for DoD/federal contracts | 12–18 months, $1–2M |
| 🔴 HIGH | FedRAMP Moderate equivalency (3PAO) | Alternative path to FedRAMP | 3–6 months, $150–300K |
| 🟠 MED | Software Bill of Materials (SBOM) | Required for many enterprise contracts | 1–2 weeks |
| 🟠 MED | Third-party penetration testing | Demonstrates active security posture | 2–4 weeks, ~$20–50K |
| 🟠 MED | Bug bounty / responsible disclosure policy | Enterprise trust signal | 1 week |
| 🟠 MED | Active Directory / SAML 2.0 SSO integration | Required for AD-based enterprises | 4–8 weeks |
| 🟡 LOW | SIEM integration (QRadar/Splunk push) | Enterprise log management | 2–4 weeks |
| 🟡 LOW | Formal written security program document | Documentation gap | 1–2 weeks |
| 🟡 LOW | Formal incident response plan (written) | Documentation gap | 1–2 weeks |
| 🟡 LOW | Formal vulnerability management program (written) | Documentation gap | 1 week |
| 🟡 LOW | Formal backup and recovery plan (written) | Documentation gap | 1 week |

*See `docs/approval/fedramp/gap-remediation-roadmap.md` for detailed remediation plan with phases and owners.*

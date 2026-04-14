#!/usr/bin/env pwsh
# Quinn FedRAMP SSP Appendix A — remaining control family generator
# Generates one markdown file per NIST 800-53 control family
# Families: IA, SC, SI, CM, CP, IR, AT, PS, PL, RA, SA, SR, MA, MP, PE, CA, PM

param(
    [string]$Family = "all"   # all | IA | SC | SI | CM | CP | IR | AT | PS | PL | RA | SA | SR | MA | MP | PE | CA | PM
)

$OllamaUrl = "http://localhost:11434/api/generate"
$Model = "qwen2.5-coder:7b"
$OutDir = "docs\approval\fedramp"

# JavaScriptStringEncode handles all JSON string escaping correctly in Windows PS 5.1
Add-Type -AssemblyName System.Web

# ── Shared system context injected into every prompt ─────────────────────────
$SYS = @"
SYSTEM: JobLine (shift-handover-hub) — SaaS shift-handover and work-order management platform for manufacturing facilities.
VENDOR: WeCr8 Solutions LLC (2-5 person startup). CEO + Engineering Lead are the only two personnel.
STACK: React/TypeScript frontend on Vercel CDN | Supabase PostgreSQL (managed, multi-tenant via RLS, org_id) | Supabase Auth (JWT 1-hour sessions + TOTP MFA) | Supabase Edge Functions (Deno/TypeScript) | Optional Electron desktop for ITAR self-hosted deployments.
RBAC: 4 roles — admin, supervisor, technician, viewer. Row Level Security enforces tenant isolation.
AUDIT LOG: activity_logs table with 22 event types, UTC timestamps (server-side via PostgreSQL now()), 1-year retention, RLS-protected (no DELETE/UPDATE for non-service roles).
ENCRYPTION: TLS 1.2+ enforced by Vercel + Supabase for transit. AES-256 at rest via Supabase managed infrastructure.
AUTH: Supabase Auth — invite-only registration (custom invite token system), TOTP MFA, password reset via email, no anonymous access.
CHANGE CONTROL: GitHub PRs required for all production changes. Vercel auto-deploys from main branch. No direct prod pushes.
BACKUPS: Supabase daily automated backups with 7-day retention. Point-in-time recovery available.
IRP: Incident Response Plan at docs/approval/fedramp/incident-response-plan.md. 4-hour SLA. Slack alerts.
CMP: Configuration Management Plan at docs/approval/fedramp/configuration-management-plan.md.
ISCP: Information System Contingency Plan at docs/approval/fedramp/iscp.md.
SCRMP: Supply Chain Risk Management Plan at docs/approval/fedramp/supply-chain-risk-management-plan.md.
TRAINING: Security Awareness Training program at docs/approval/fedramp/security-awareness-training.md.
PERSONNEL: Personnel Security Policy at docs/approval/fedramp/personnel-security-policy.md.
FEDRAMP TARGET: Moderate impact, LI-SaaS pathway. Not yet authorized.
"@

function Invoke-Quinn {
    param([string]$Prompt, [string]$OutFile, [string]$FamilyId, [int]$MaxTokens = 5000)

    $fullPath = Join-Path $OutDir $OutFile
    if (Test-Path $fullPath) {
        Write-Host "  SKIP: $fullPath already exists" -ForegroundColor Yellow
        return $true
    }

    Write-Host "`n=== Quinn generating $FamilyId ===" -ForegroundColor Cyan

    # Use JavaScriptStringEncode — reliably escapes all chars for JSON in Windows PS 5.1
    $escapedPrompt = [System.Web.HttpUtility]::JavaScriptStringEncode($Prompt, $false)
    # Build body via string concatenation (avoids all PowerShell interpolation quirks)
    $body = '{"model":"' + $Model + '","prompt":"' + $escapedPrompt + '","stream":false,"options":{"temperature":0.1,"num_predict":' + $MaxTokens + '}}'

    try {
        $result = Invoke-RestMethod -Uri $OllamaUrl -Method POST -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -ContentType "application/json" -TimeoutSec 360
        $content = $result.response.Trim()
        # Strip wrapping markdown fences if model added them
        $content = $content -replace '^```markdown\s*', '' -replace '^```\s*', '' -replace '\s*```$', ''
        $content = $content.Trim()

        if ($content.Length -lt 200) {
            Write-Host "  WARNING: Short response ($($content.Length) chars)" -ForegroundColor Yellow
            return $false
        }

        $content | Out-File $fullPath -Encoding utf8
        Write-Host "  Written: $fullPath ($($content.Length) chars)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ERROR on $FamilyId`: $_" -ForegroundColor Red
        return $false
    }
}

# ── IA: Identification and Authentication ─────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "IA") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Identification and Authentication (IA) control implementation statements for the following system.

$SYS

Write implementation statements for these IA controls in order:
- IA-1: Policy and Procedures (annual review, roles: CEO approves, Engineering Lead maintains)
- IA-2: Identification and Authentication (Organizational Users) — Supabase Auth, invite-only, TOTP MFA required for all users, password minimum 12 chars
- IA-2(1): MFA for privileged accounts — TOTP enforced for admin/supervisor roles
- IA-2(2): MFA for non-privileged accounts — TOTP enforced for all roles
- IA-3: Device Identification and Authentication — no device certs; device auth deferred (N/A for LI-SaaS)
- IA-4: Identifier Management — user IDs are UUID (Supabase managed), org_id scoping, invite token for registration, deprovisioning via admin dashboard
- IA-5: Authenticator Management — passwords min 12 chars, TOTP secrets stored in Supabase Auth (encrypted), password reset via email link (24hr expiry), no shared accounts
- IA-5(1): Password-based Authentication — Supabase Auth policy: min 12 chars, complexity TBD, no reuse policy enforced (planned), bcrypt hashing
- IA-6: Authentication Feedback — password field obscured; no success/fail message distinguishes username vs password
- IA-7: Cryptographic Module Authentication — TLS 1.2+ for transport, AES-256 at rest, bcrypt for password hashing (FIPS 140-3 equivalency planned per G-23)
- IA-8: Identification and Authentication (Non-Organizational Users) — same Supabase Auth flow applies; no separate non-org user path
- IA-11: Re-authentication — JWT 1-hour expiry enforced server-side; session not extendable without re-auth
- IA-12: Identity Proofing — invite-only registration (org admin issues invite token); IAL1 per digital identity worksheet

For each control use this exact format:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific implementation description referencing the actual system>
**Responsible Role:** <CEO | Engineering Lead | Org Admin>
**Test Method:** <how an assessor verifies this control>

Start with:
# SSP Appendix A — Identification and Authentication (IA) Family

Output Markdown only. No preamble. No explanation outside the document.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-ia.md" -FamilyId "IA (Identity & Auth)" -MaxTokens 6000
}

# ── SC: System and Communications Protection ──────────────────────────────────
if ($Family -eq "all" -or $Family -eq "SC") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 System and Communications Protection (SC) control implementation statements for the following system.

$SYS

Write implementation statements for these SC controls:
- SC-1: Policy and Procedures
- SC-2: Separation of System and User Functionality — Supabase RLS separates data by org_id; admin functions only in admin dashboard route (RBAC gate)
- SC-3: Security Function Isolation — Supabase Auth and RLS enforce separation; application has no privileged OS access
- SC-4: Information in Shared Resources — multi-tenant isolation via org_id RLS; no shared memory concerns in serverless/managed stack
- SC-5: Denial of Service Protection — Vercel edge network with DDoS mitigation; Supabase rate limiting; planned WAF (G-07)
- SC-7: Boundary Protection — Vercel CDN as boundary; Supabase connection pooling; no direct DB access from client
- SC-8: Transmission Confidentiality and Integrity — TLS 1.2+ enforced by Vercel HSTS; Supabase enforces TLS on all connections
- SC-8(1): Cryptographic Protection in Transmission — TLS 1.2+/1.3 with modern cipher suites on all endpoints
- SC-10: Network Disconnect — Supabase JWT 1-hour expiry; Vercel serverless functions stateless (no persistent TCP)
- SC-12: Cryptographic Key Establishment and Management — TLS certificates managed by Vercel (auto-renew); DB encryption keys managed by Supabase
- SC-13: Cryptographic Protection — TLS 1.2+, AES-256 at rest, bcrypt for passwords. FIPS 140-3 compliance pending infrastructure migration (G-00/G-23)
- SC-15: Collaborative Computing Devices and Applications — N/A; no collaborative computing devices
- SC-17: Public Key Infrastructure Certificates — TLS certs from Vercel CA (Let's Encrypt); no internal PKI
- SC-18: Mobile Code — React SPA served from Vercel; no unsigned/unapproved mobile code; CSP headers planned
- SC-20: Secure Name/Address Resolution Service — DNS managed via domain registrar; DNSSEC not yet enabled (planned)
- SC-21: Secure Name/Address Resolution Service (Recursive or Caching) — inherits from Vercel/Supabase infrastructure
- SC-22: Architecture and Provisioning for Name/Address Resolution — inherits from cloud providers
- SC-23: Session Authenticity — Supabase JWT session tokens validated server-side on every request; HTTPS-only cookies
- SC-28: Protection of Information at Rest — AES-256 at rest via Supabase managed encryption; Vercel no persistent storage
- SC-28(1): Cryptographic Protection of Data at Rest — AES-256 confirmed for Supabase PostgreSQL data volumes
- SC-39: Process Isolation — Vercel serverless functions run in isolated V8 isolates; Supabase Postgres connections pooled but isolated per session

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — System and Communications Protection (SC) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-sc.md" -FamilyId "SC (System & Comms Protection)" -MaxTokens 7000
}

# ── SI: System and Information Integrity ──────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "SI") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 System and Information Integrity (SI) control implementation statements.

$SYS

Write implementation statements for these SI controls:
- SI-1: Policy and Procedures
- SI-2: Flaw Remediation — Dependabot alerts on GitHub; Codacy static analysis on every PR; npm audit in CI; patch SLA: critical 24h, high 72h, medium 30 days
- SI-3: Malicious Code Protection — no self-hosted servers to run endpoint AV; Vercel/Supabase managed infra handles host-level protection; Codacy scans for injected malicious patterns in PRs
- SI-4: System Monitoring — Supabase dashboard metrics; Vercel analytics; activity_logs captures 22 event types; no SIEM yet (G-07 planned)
- SI-5: Security Alerts, Advisories, and Directives — GitHub Dependabot security advisories; CISA Known Exploited Vulnerabilities (KEV) list monitored manually; Slack alerts for critical CVEs
- SI-6: Security and Privacy Function Verification — automated test suite (Vitest) covers auth flows, RLS policies, API endpoints; runs in CI on every PR
- SI-7: Software, Firmware, and Information Integrity — npm lockfile (bun.lockb) enforces dependency pinning; Supabase migrations versioned in Git; no unsigned code deployed
- SI-8: Spam Protection — N/A for internal manufacturing SaaS; no email reception pipeline
- SI-10: Information Input Validation — Zod schema validation on all API inputs; TypeScript strict mode catches type errors; Supabase RLS enforces data access policy at DB layer
- SI-12: Information Management and Retention — AI data retention policy at docs/approval/fedramp/ai-data-retention-policy.md; activity_logs 1-year retention; work order data retained per org policy
- SI-16: Memory Protection — N/A for managed cloud (Vercel V8 isolates, Supabase managed PostgreSQL); no bare-metal memory management

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — System and Information Integrity (SI) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-si.md" -FamilyId "SI (System & Info Integrity)" -MaxTokens 6000
}

# ── CM: Configuration Management ─────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "CM") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Configuration Management (CM) control implementation statements.

$SYS
REFERENCE DOC: Configuration Management Plan at docs/approval/fedramp/configuration-management-plan.md.

Write implementation statements for these CM controls:
- CM-1: Policy and Procedures — references CMP
- CM-2: Baseline Configuration — baseline defined in CMP: Vite build config, Supabase project settings, Vercel environment variables, Edge Function configs; versioned in Git
- CM-3: Configuration Change Control — all changes via GitHub PR; Vercel preview deployments before merge; no CCB (2-person team); Engineering Lead is change approver
- CM-4: Impact Analysis — PR description must include impact assessment; Codacy/ESLint run automatically on PR; breaking changes require smoke test in staging
- CM-5: Access Restrictions for Change — GitHub branch protection on main; only Engineering Lead merges; Supabase production changes require service role key (stored in GitHub Secrets)
- CM-6: Configuration Settings — secure-by-default Vercel/Supabase settings; environment variables in GitHub Secrets and Vercel project settings; no plaintext secrets in code
- CM-7: Least Functionality — Supabase Edge Functions expose only required endpoints; no unused ports/services; Vercel serverless functions scope-limited
- CM-7(1): Periodic Review of Unnecessary Software — quarterly review of npm dependencies; Dependabot auto-PRs for outdated packages; unused Edge Functions removed
- CM-8: System Component Inventory — asset inventory at docs/approval/fedramp/asset-inventory.md; includes all software components, cloud services, third-party integrations
- CM-9: Configuration Management Plan — documented at docs/approval/fedramp/configuration-management-plan.md
- CM-10: Software Usage Restrictions — all npm packages are OSS with compatible licenses; no commercial software without license review; checked via license-checker in CI
- CM-11: User-Installed Software — N/A for SaaS; users cannot install software into the application
- CM-12: Information Location — SSP Section 9 documents data flows; Supabase is the authoritative data store; no shadow IT data stores
- CM-14: Signed Components — npm package integrity via lockfile checksum; Vercel deployment signatures; no unsigned runtime components

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Configuration Management (CM) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-cm.md" -FamilyId "CM (Configuration Mgmt)" -MaxTokens 6000
}

# ── CP: Contingency Planning ──────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "CP") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Contingency Planning (CP) control implementation statements.

$SYS
REFERENCE DOC: Information System Contingency Plan (ISCP) at docs/approval/fedramp/iscp.md.
BACKUPS: Supabase daily automated backups, 7-day retention, point-in-time recovery. Vercel CDN has no persistent storage (stateless).
RTO: 4 hours. RPO: 24 hours (one daily backup cycle).

Write implementation statements for these CP controls:
- CP-1: Policy and Procedures — references ISCP
- CP-2: Contingency Plan — ISCP at docs/approval/fedramp/iscp.md; defines RTO=4h, RPO=24h, roles (CEO/Engineering Lead), activation criteria
- CP-3: Contingency Training — annual tabletop exercise per ISCP; training records maintained
- CP-4: Contingency Plan Testing — annual test per ISCP; backup restore tested quarterly
- CP-6: Alternate Storage Site — Supabase manages geographic redundancy of backups; no separate CSP-managed alternate site required
- CP-7: Alternate Processing Site — Vercel auto-routes to alternate edge PoP on failure; Supabase has regional failover; no manual alternate processing site
- CP-8: Telecommunications Services — Vercel CDN with global PoPs; Supabase multi-region; no single-telco dependency
- CP-9: System Backup — Supabase daily automated backups; 7-day retention; PITR available; backup integrity validated by Supabase; Engineering Lead verifies monthly
- CP-10: System Recovery and Reconstitution — ISCP defines recovery steps; Supabase PITR enables DB reconstitution; Vercel re-deploy from Git tag for app layer
- CP-11: Alternate Communications Protocols — N/A; all communications via HTTPS
- CP-13: Alternative Security Mechanisms — if Supabase Auth fails, break-glass procedure in ISCP (service role key access); documented in ISCP

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Contingency Planning (CP) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-cp.md" -FamilyId "CP (Contingency Planning)" -MaxTokens 5000
}

# ── IR: Incident Response ─────────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "IR") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Incident Response (IR) control implementation statements.

$SYS
REFERENCE DOC: Incident Response Plan (IRP) at docs/approval/fedramp/incident-response-plan.md.
SLA: 4-hour response for critical incidents. Slack #security-alerts channel for notifications.
REPORTING: US-CERT/CISA reporting within 1 hour of discovery for confirmed incidents per FedRAMP requirements.

Write implementation statements for these IR controls:
- IR-1: Policy and Procedures — references IRP
- IR-2: Incident Response Training — annual training per IRP; tabletop exercises; training records
- IR-3: Incident Response Testing — annual tabletop test; results documented in IRP
- IR-4: Incident Handling — IRP defines 6-phase lifecycle: Preparation, Detection, Containment, Eradication, Recovery, Post-Incident; 4-hour SLA for critical
- IR-5: Incident Monitoring — Supabase monitoring + Vercel alerts; activity_logs for behavioral anomalies; Slack #security-alerts
- IR-6: Incident Reporting — US-CERT/CISA report within 1 hour of confirmed incident; FedRAMP JAB/AO notified per FedRAMP IR requirements
- IR-7: Incident Response Assistance — Engineering Lead is primary IR contact; CEO as backup; no IR retainer yet (planned Phase 2)
- IR-8: Incident Response Plan — IRP at docs/approval/fedramp/incident-response-plan.md; reviewed annually; distributed to CEO + Engineering Lead
- IR-10: Integrated Information Security Analysis Team — WeCr8 engineering team (2 people) serves as ISAT; external IR firm engagement planned

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Incident Response (IR) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-ir.md" -FamilyId "IR (Incident Response)" -MaxTokens 4500
}

# ── AT: Awareness and Training ────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "AT") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Awareness and Training (AT) control implementation statements.

$SYS
REFERENCE DOC: Security Awareness Training program at docs/approval/fedramp/security-awareness-training.md.

Write implementation statements for these AT controls:
- AT-1: Policy and Procedures — references training program doc
- AT-2: Literacy Training and Awareness — annual security awareness training for all personnel; covers phishing, social engineering, secure coding, incident response; tracked in training log
- AT-2(2): Insider Threat Awareness — included in annual training; personnel trained to recognize and report suspicious behavior
- AT-3: Role-Based Training — additional training for privileged role holders (admin, Engineering Lead): secure coding, OWASP Top 10, FedRAMP responsibilities, key management
- AT-4: Training Records — training completion records maintained by CEO; stored in secure HR folder; minimum 3-year retention

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Awareness and Training (AT) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-at.md" -FamilyId "AT (Awareness & Training)" -MaxTokens 3000
}

# ── PS: Personnel Security ────────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "PS") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Personnel Security (PS) control implementation statements.

$SYS
REFERENCE DOC: Personnel Security Policy at docs/approval/fedramp/personnel-security-policy.md.
COMPANY SIZE: 2-5 employees. CEO + Engineering Lead are the only consistent personnel with system access.

Write implementation statements for these PS controls:
- PS-1: Policy and Procedures — references personnel security policy
- PS-2: Position Risk Designation — all positions with system access classified as Moderate risk; documented in personnel policy
- PS-3: Personnel Screening — background check (identity + criminal) required before system access grant; CEO administers for Engineering Lead; Engineering Lead administers for future hires
- PS-4: Personnel Termination — access termination procedure in personnel policy: disable account within 1 hour of separation, rotate any shared credentials, recover assets; Engineering Lead executes, CEO oversees
- PS-5: Personnel Transfer — reassignment procedure: re-evaluate access need, adjust RBAC role before transfer effective date
- PS-6: Access Agreements — Rules of Behavior at docs/approval/fedramp/rules-of-behavior.md signed before system access; annual re-acknowledgment
- PS-7: External Personnel Security — vendors/contractors must sign NDA and acknowledge Rules of Behavior; no standing access granted to third parties
- PS-8: Personnel Sanctions — formal sanction policy in personnel security policy; disciplinary actions up to termination for security violations
- PS-9: Position Descriptions — system access responsibilities documented in position descriptions for Engineering Lead and CEO

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Personnel Security (PS) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-ps.md" -FamilyId "PS (Personnel Security)" -MaxTokens 3500
}

# ── PL: Planning ──────────────────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "PL") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Planning (PL) control implementation statements.

$SYS
SSP: System Security Plan at docs/approval/fedramp/jobline-ssp-draft.md (working draft; pre-authorization).
SECURITY PROGRAM: Information Security Program at docs/approval/fedramp/information-security-program.md.
RULES OF BEHAVIOR: docs/approval/fedramp/rules-of-behavior.md.

Write implementation statements for these PL controls:
- PL-1: Policy and Procedures — references information security program
- PL-2: System Security Plan — SSP draft at docs/approval/fedramp/jobline-ssp-draft.md; reviewed annually; distributed to CEO + Engineering Lead; not yet submitted to AO (pre-authorization)
- PL-4: Rules of Behavior — RoB at docs/approval/fedramp/rules-of-behavior.md; signed before access; covers acceptable use, data handling, incident reporting, AI data policy
- PL-4(1): Social Media and Networking Restrictions — covered in Rules of Behavior; no posting of system data or customer information on social media
- PL-8: Security and Privacy Architectures — architecture documented in SSP Section 10, ERD, RLS matrix diagrams; privacy architecture: no PII beyond name/work-email; no health or financial data
- PL-9: Central Management — Engineering Lead centrally manages security configuration; no distributed administration; Supabase dashboard + GitHub are central management planes
- PL-10: Baseline Selection — FedRAMP Moderate baseline selected per FIPS 199 security categorization

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Planning (PL) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-pl.md" -FamilyId "PL (Planning)" -MaxTokens 3000
}

# ── RA: Risk Assessment ───────────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "RA") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Risk Assessment (RA) control implementation statements.

$SYS
VMP: Vulnerability Management Program at docs/approval/fedramp/vulnerability management program/vulnerability-management-program.md.
FIPS 199: Security categorization at docs/approval/fedramp/fips-199-categorization.md. Result: SC={C:Moderate, I:High, A:Moderate}.
SCANNING: Dependabot (GitHub) + Codacy static analysis + Trivy container/SBOM scanning run on every PR.
CVE SLA: Critical 24h, High 72h, Medium 30 days, Low 90 days.

Write implementation statements for these RA controls:
- RA-1: Policy and Procedures — references VMP
- RA-2: Security Categorization — completed FIPS 199 worksheet at docs/approval/fedramp/fips-199-categorization.md; SC={C:Moderate, I:High, A:Moderate}; overall Moderate
- RA-3: Risk Assessment — informal risk assessment conducted by Engineering Lead; gap roadmap (docs/approval/fedramp/gap-remediation-roadmap.md) documents identified risks and remediation; formal risk assessment planned before 3PAO engagement
- RA-3(1): Supply Chain Risk Assessment — supply chain risks documented in SCRMP; dependencies assessed via Dependabot + Trivy SBOM scan
- RA-5: Vulnerability Monitoring and Scanning — Dependabot alerts on GitHub; Codacy SAST on every PR; Trivy scan on every PR; no network/infrastructure scan yet (managed by cloud providers); scan results reviewed weekly
- RA-5(2): Update Vulnerabilities to Be Scanned — Dependabot uses NVD/GitHub Advisory DB (auto-updated); Codacy rulesets updated per Codacy release cycle
- RA-5(11): Public Disclosure Program — responsible disclosure policy planned (G-05); no formal bug bounty yet
- RA-7: Risk Response — CVE remediation per VMP SLAs; POA&M tracks open risk items; Engineering Lead is risk owner
- RA-9: Criticality Analysis — criticality analysis performed informally during architecture decisions; formal analysis planned before 3PAO

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Risk Assessment (RA) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-ra.md" -FamilyId "RA (Risk Assessment)" -MaxTokens 4000
}

# ── SA: System and Services Acquisition ──────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "SA") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 System and Services Acquisition (SA) control implementation statements.

$SYS
SCRMP: Supply Chain Risk Management Plan at docs/approval/fedramp/supply-chain-risk-management-plan.md.
CI/CD: GitHub Actions runs ESLint, TypeScript typecheck, Vitest tests, Codacy SAST, Trivy scan on every PR.
KEY VENDORS: Supabase (DBaaS/Auth), Vercel (hosting/CDN), GitHub (source control/CI), Stripe (billing), Resend (email), OpenAI API (AI planning assistant Edge Function).

Write implementation statements for these SA controls:
- SA-1: Policy and Procedures
- SA-2: Allocation of Resources — security requirements addressed in sprint planning; no formal security budget line (startup); Engineering Lead allocates time for security tasks
- SA-3: System Development Life Cycle — Git-based SDLC: feature branch → PR with automated code review (Codacy/ESLint/typecheck) → Engineering Lead review → merge → Vercel auto-deploy; security requirements in PRD documents
- SA-4: Acquisition Process — vendor selection criteria in SCRMP; FedRAMP-authorized vendors preferred; security questionnaires for new vendors
- SA-4(1): Functional Properties of Security Controls — vendor security capabilities documented in SCRMP and via Supabase/Vercel SOC 2 reports
- SA-5: System Documentation — SSP, architecture diagrams, ERD, API docs maintained in docs/ directory; README.md for codebase
- SA-8: Security and Privacy Engineering Principles — secure-by-default: RLS on all tables, invite-only auth, HTTPS-only, minimal data collection; OWASP ASVS Level 1 as development target
- SA-9: External System Services — Supabase (SOC 2 Type II), Vercel (SOC 2), Stripe (PCI DSS), GitHub (SOC 2); vendor compliance reviewed annually per SCRMP
- SA-10: Developer Configuration Management — all code in GitHub; IaC (Supabase migrations, Vercel config) versioned in Git; no developer-owned production access
- SA-11: Developer Testing and Evaluation — Vitest unit/integration tests; TypeScript strict mode; Codacy static analysis; Trivy SBOM/vuln scan; all run in CI on every PR
- SA-15: Development Process, Standards, and Tools — documented in SDLC (SA-3); ESLint + TypeScript enforced; Prettier for formatting; security-focused code review checklist in PR template
- SA-16: Developer-Provided Training — Engineering Lead responsible for staying current on OWASP, FedRAMP requirements, dependency security; annual security training per AT-3
- SA-17: Developer Security and Privacy Architecture and Design — privacy by design: minimal PII collection; architecture documented in SSP; no unnecessary data retention
- SA-22: Unsupported System Components — Dependabot alerts for EOL packages; annual review of component support lifecycle; unsupported components replaced within 90 days

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — System and Services Acquisition (SA) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-sa.md" -FamilyId "SA (System & Services Acquisition)" -MaxTokens 6000
}

# ── SR: Supply Chain Risk Management ─────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "SR") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Supply Chain Risk Management (SR) control implementation statements.

$SYS
SCRMP: Supply Chain Risk Management Plan at docs/approval/fedramp/supply-chain-risk-management-plan.md.
SBOM: Not yet generated (G-03 gap); planned via cyclonedx-npm or similar tool in CI.
KEY DEPENDENCIES: React, TypeScript, Supabase JS client, Zod, Tailwind CSS, shadcn/ui, Stripe SDK, Vitest.
KEY SERVICES: Supabase, Vercel, GitHub, Stripe, Resend, OpenAI.

Write implementation statements for these SR controls:
- SR-1: Policy and Procedures — references SCRMP
- SR-2: Supply Chain Risk Management Plan — SCRMP at docs/approval/fedramp/supply-chain-risk-management-plan.md; updated annually and when new vendors onboarded
- SR-3: Supply Chain Controls and Processes — npm lockfile (bun.lockb) pins all dependency versions; Dependabot + Trivy SBOM scan on every build; vendor security questionnaires; SOC 2 reports collected for key vendors
- SR-5: Acquisition Strategies, Tools, and Methods — prefer vendors with SOC 2/FedRAMP ATO; SBOM generation planned (G-03); dependency provenance via npm registry integrity checks
- SR-6: Supplier Assessments and Reviews — annual review of Supabase, Vercel, GitHub, Stripe compliance reports; documented in SCRMP
- SR-8: Notification Agreements — vendor security incident notification requirements in contracts/ToS; Supabase and Vercel notify customers of incidents per their ToS
- SR-9: Tamper Resistance and Detection — npm lockfile + package integrity checksums prevent tampering; Vercel deployment signed artifacts; GitHub commit signing planned
- SR-10: Inspection of Systems and Components — dependency audit via Dependabot/Trivy on every PR; no physical hardware to inspect
- SR-11: Component Authenticity — npm registry signature verification; no custom hardware components; Vercel builds from verified Git commits
- SR-12: Component Disposal — N/A; no physical media or hardware components; cloud-managed infrastructure

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Supply Chain Risk Management (SR) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-sr.md" -FamilyId "SR (Supply Chain Risk Mgmt)" -MaxTokens 4500
}

# ── MA: Maintenance ───────────────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "MA") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Maintenance (MA) control implementation statements.

$SYS
NOTE: JobLine is a fully managed SaaS. No physical hardware. Supabase and Vercel perform infrastructure maintenance. Application-layer maintenance is performed by the Engineering Lead via the SDLC process.

Write implementation statements for these MA controls:
- MA-1: Policy and Procedures
- MA-2: Controlled Maintenance — Supabase performs infrastructure/DB maintenance with scheduled maintenance windows (advance notice via status page); app-layer changes via PR/SDLC; no unscheduled maintenance without approval
- MA-3: Maintenance Tools — N/A for physical tools; application maintenance via VS Code, GitHub, Supabase CLI, Vercel CLI — all authorized developer tools
- MA-4: Nonlocal Maintenance — all maintenance is nonlocal (Supabase dashboard, Vercel dashboard, GitHub); sessions protected by TLS 1.2+ and MFA
- MA-5: Maintenance Personnel — Engineering Lead is authorized maintainer; Supabase/Vercel engineers maintain infrastructure under their SOC 2 controls; no unauthorized maintenance personnel
- MA-6: Timely Maintenance — Supabase/Vercel SLA governs infrastructure maintenance timing; critical app-layer security patches within 24 hours per VMP

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Maintenance (MA) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-ma.md" -FamilyId "MA (Maintenance)" -MaxTokens 2500
}

# ── MP: Media Protection ──────────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "MP") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Media Protection (MP) control implementation statements.

$SYS
NOTE: JobLine is a cloud-only SaaS. No physical media (USB drives, disks, tapes) is used. All data resides in Supabase managed cloud storage. Data exports (CSV) are generated in-browser and handled by the end user's device, outside the system boundary.

Write implementation statements for these MP controls:
- MP-1: Policy and Procedures
- MP-2: Media Access — No physical media in the system boundary; Supabase manages cloud storage media; access controlled by Supabase infrastructure team under SOC 2
- MP-3: Media Marking — N/A; no physical media
- MP-4: Media Storage — N/A; no physical media storage; all data in Supabase-managed encrypted storage
- MP-5: Media Transport — N/A; no physical media transport; data transmitted via TLS 1.2+
- MP-6: Media Sanitization — N/A for physical media; logical data deletion: org data deleted per offboarding process; Supabase storage volumes sanitized upon decommission under their SOC 2 controls; AI data retention policy governs AI-processed data
- MP-7: Media Use — No portable media (USB, external drives) used in system operation; developers use personal endpoints under corporate acceptable use policy

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method or "N/A — inherited from Supabase infrastructure controls">

Start with:
# SSP Appendix A — Media Protection (MP) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-mp.md" -FamilyId "MP (Media Protection)" -MaxTokens 2500
}

# ── PE: Physical and Environmental Protection ─────────────────────────────────
if ($Family -eq "all" -or $Family -eq "PE") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Physical and Environmental Protection (PE) control implementation statements.

$SYS
NOTE: JobLine is a cloud-only SaaS. Physical infrastructure is entirely managed by Supabase (AWS-backed data centers) and Vercel (edge CDN). WeCr8 Solutions has no physical data center presence. Physical controls are inherited from Supabase/Vercel. Use "Inherited — [Provider]" for controls inherited from cloud providers and note the relevant SOC 2 report.

Write implementation statements for these PE controls:
- PE-1: Policy and Procedures
- PE-2: Physical Access Authorizations — Inherited from Supabase/Vercel; access to data center facilities controlled by their physical security teams (SOC 2 Type II)
- PE-3: Physical Access Control — Inherited from Supabase/Vercel; multi-layer physical access controls (badge, biometric, video surveillance) per SOC 2 Type II reports
- PE-6: Monitoring Physical Access — Inherited from Supabase/Vercel; 24/7 CCTV, security guards, intrusion detection per SOC 2 reports
- PE-8: Visitor Access Records — Inherited from Supabase/Vercel cloud providers
- PE-9: Power Equipment and Cabling — Inherited from Supabase/Vercel; redundant power (UPS, generator) per SOC 2 reports
- PE-10: Emergency Shutoff — Inherited from Supabase/Vercel
- PE-11: Emergency Power — Inherited from Supabase/Vercel; UPS + generator backup per SOC 2 reports
- PE-12: Emergency Lighting — Inherited from Supabase/Vercel
- PE-13: Fire Protection — Inherited from Supabase/Vercel; FM-200 suppression and smoke detection per SOC 2 reports
- PE-14: Environmental Controls — Inherited from Supabase/Vercel; temperature/humidity monitoring per SOC 2 reports
- PE-15: Water Damage Protection — Inherited from Supabase/Vercel
- PE-16: Delivery and Removal — Inherited from Supabase/Vercel; no hardware delivered to WeCr8 facilities for system components
- PE-17: Alternate Work Site — Engineering Lead may work remotely; all access via TLS-protected web interfaces; no special physical controls required at remote sites for SaaS access
- PE-18: Location of System Components — Supabase: AWS us-east-1 (primary); Vercel: global edge PoPs. No WeCr8-owned data center components.
- PE-20: Asset Monitoring and Tracking — Inherited from Supabase/Vercel; no WeCr8-owned physical assets in data centers

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Inherited | Not Applicable
**Description:** <specific description or "Inherited from [Provider] — covered under their SOC 2 Type II controls">
**Responsible Role:** <role or "Supabase/Vercel infrastructure team">
**Test Method:** <verification method or "Review Supabase/Vercel SOC 2 Type II report for relevant PE controls">

Start with:
# SSP Appendix A — Physical and Environmental Protection (PE) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-pe.md" -FamilyId "PE (Physical & Environmental)" -MaxTokens 3500
}

# ── CA: Security Assessment and Authorization ─────────────────────────────────
if ($Family -eq "all" -or $Family -eq "CA") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Security Assessment and Authorization (CA) control implementation statements.

$SYS
AUTHORIZATION STATUS: Pre-authorization (FedRAMP Moderate authorization not yet obtained).
POA&M: docs/approval/fedramp/poam.md tracks all open security findings.
3PAO: Not yet engaged; planned after Phase 1/2 gap closure (~2027).

Write implementation statements for these CA controls:
- CA-1: Policy and Procedures — references information security program
- CA-2: Control Assessments — no formal 3PAO assessment yet; internal self-assessment using FedRAMP Moderate baseline; gap roadmap documents findings; annual self-assessment planned
- CA-3: Information Exchange — no system interconnections with external federal systems at this time; any future interconnections will require signed ISA/MOU
- CA-5: Plan of Action and Milestones — POA&M at docs/approval/fedramp/poam.md; updated when new gaps identified; monthly review by Engineering Lead
- CA-6: Authorization — pre-authorization; ATO not yet obtained; pursuing LI-SaaS pathway; target 2027-2028 per gap roadmap
- CA-7: Continuous Monitoring — informal continuous monitoring: Dependabot weekly, Codacy on every PR, activity_logs review weekly, Supabase dashboard metrics; formal ConMon plan (Appendix N) planned
- CA-8: Penetration Testing — no formal penetration test yet (G-04 gap); internal ad-hoc security review by Engineering Lead; 3PAO pen test planned as part of assessment
- CA-9: Internal System Connections — documented in SSP Section 10; Supabase is the only internal data connection; all connections are authenticated (JWT) and encrypted (TLS)

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Security Assessment and Authorization (CA) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-ca.md" -FamilyId "CA (Security Assessment)" -MaxTokens 3500
}

# ── PM: Program Management ────────────────────────────────────────────────────
if ($Family -eq "all" -or $Family -eq "PM") {
    $p = @"
You are a FedRAMP compliance expert. Write NIST SP 800-53 Rev. 5 Program Management (PM) control implementation statements.

$SYS
SECURITY PROGRAM: Information Security Program at docs/approval/fedramp/information-security-program.md.
NOTE: WeCr8 Solutions is a 2-5 person startup. Many PM controls apply at a reduced scale appropriate for a small organization.

Write implementation statements for these PM controls:
- PM-1: Information Security Program Plan — Information Security Program document at docs/approval/fedramp/information-security-program.md; reviewed annually; CEO approves, Engineering Lead maintains
- PM-2: Information Security Program Leadership Roles — CEO is ISSM (Information System Security Manager); Engineering Lead is ISSO (Information System Security Officer); no dedicated security staff
- PM-3: Information Security and Privacy Resources — security activities funded from general operating budget; Engineering Lead allocates ~20% of time to security responsibilities
- PM-4: Plan of Action and Milestones Process — POA&M at docs/approval/fedramp/poam.md; reviewed monthly; updated when new gaps identified; linked to gap remediation roadmap
- PM-5: System Inventory — asset inventory at docs/approval/fedramp/asset-inventory.md; includes all system components, cloud services, dependencies
- PM-6: Measures of Performance — security metrics tracked: open CVE count, patch SLA compliance, training completion rate, incident response time; reviewed quarterly
- PM-7: Enterprise Architecture — architecture documented in SSP, ERD, RLS matrix diagrams; reviewed when significant changes occur
- PM-8: Critical Infrastructure Plan — N/A; JobLine is not critical infrastructure
- PM-9: Risk Management Strategy — risk management documented in information security program; gap roadmap is the primary risk register for FedRAMP
- PM-10: Authorization Process — FedRAMP authorization process tracked per gap roadmap; CA-6 addresses ATO status
- PM-11: Mission and Business Process Definition — SSP Section 3 defines system purpose (shift handovers, work orders, NCR tracking); mission-critical functions documented
- PM-12: Insider Threat Program — 2-person organization; insider threat awareness covered in AT-2(2); no formal insider threat program at this scale
- PM-13: Security Workforce — Engineering Lead is sole security practitioner; continuing education via OWASP, industry training; plans to hire security-focused engineer as company scales
- PM-14: Testing, Training, and Monitoring — integrated into SDLC (CI tests on every PR), annual security training (AT-2), weekly monitoring review
- PM-15: Security and Privacy Groups and Associations — Engineering Lead subscribes to GitHub security advisories, CISA alerts, OWASP newsletter, NVD RSS feed
- PM-16: Threat Awareness Program — CISA Known Exploited Vulnerabilities monitored; GitHub Dependabot for CVE awareness; Engineering Lead reviews security news weekly
- PM-28: Risk Framing — risk framing documented in FIPS 199 categorization + gap roadmap; risk tolerance defined as FedRAMP Moderate

Format per control:
### **<ID>** <Full Control Name>
**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable
**Description:** <specific description>
**Responsible Role:** <role>
**Test Method:** <verification method>

Start with:
# SSP Appendix A — Program Management (PM) Family

Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p -OutFile "ssp-appendix-a-pm.md" -FamilyId "PM (Program Management)" -MaxTokens 5000
}

Write-Host "`n=== All families queued. Check docs/approval/fedramp/ for output files. ===" -ForegroundColor Magenta

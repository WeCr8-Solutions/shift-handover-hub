# Supply Chain Risk Management Plan (SCRMP)
**Organization:** WeCr8 Solutions (JobLine AI)  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** CEO / Engineering Lead  
**Review Cycle:** Annual; updated when new vendors are added  
**NIST Controls:** SR-1, SR-2, SR-3, SR-4, SR-5, SR-6  
**SSP Location:** Appendix P  

---

## 1. Purpose

This Supply Chain Risk Management Plan (SCRMP) identifies and manages the risks posed by third-party components, vendors, and services in the JobLine AI supply chain. It fulfills NIST SP 800-53 Rev. 5 SR (Supply Chain Risk Management) controls required for FedRAMP Moderate and enables the organization to demonstrate software supply chain awareness to agency customers.

---

## 2. Scope

This plan covers all external software, services, and vendors that:
- Are part of the JobLine AI authorization boundary, or
- Process, store, or transmit data on behalf of JobLine AI, or
- Provide build, deployment, or CI/CD tooling in the software delivery pipeline

---

## 3. Platform Services Risk Assessment (SR-2)

Each platform service is assessed on the following criteria:
- **FedRAMP Status:** Whether the vendor has a FedRAMP-authorized offering
- **Data Exposure:** Whether the vendor processes customer data, PII, or system metadata
- **Data Processing Agreement (DPA):** Whether a DPA or BAA is in place
- **SOC 2 Type II:** Whether the vendor holds a current SOC 2 Type II report

### 3.1 Critical Platform Services

| ID | Vendor | Role | FedRAMP | Data Exposure | DPA | SOC 2 | Risk |
|----|--------|------|---------|--------------|-----|-------|------|
| SVC-001 | **Supabase** | Database, Auth, Edge Functions | ❌ Not authorized | HIGH — all customer data | ✅ Available | ✅ Type II | **HIGH** |
| SVC-002 | **Vercel** | Frontend hosting, CDN | ❌ Not authorized | LOW — static assets only | ✅ Available | ✅ Type II | **MEDIUM** |
| SVC-003 | **GitHub** | Source code, CI/CD | ✅ FedRAMP Moderate | LOW — source code only | ✅ Available | ✅ Type II | **LOW** |
| SVC-004 | **Stripe** | Payment processing | ❌ Not FedRAMP | MEDIUM — billing data | ✅ PCI DSS agreement | ✅ Type II | **MEDIUM** |
| SVC-005 | **OpenAI / Anthropic** | LLM inference (AI features) | ❌ Not authorized | MEDIUM — query data (see AI data retention policy) | ✅ Enterprise DPA available | ✅ SOC 2 | **HIGH** (federal context) |
| SVC-006 | **Resend** | Transactional email | ❌ Not FedRAMP | LOW — email addresses only | ✅ DPA available | Review in progress | **LOW** |
| SVC-007 | **AWS** (via Supabase) | Underlying infrastructure | ✅ FedRAMP High (inherited) | ALL — inherited via Supabase | N/A (Supabase manages) | ✅ Type II | **LOW** (inherited) |
| SVC-008 | **Cloudflare** (via Vercel) | CDN, DDoS protection | ✅ FedRAMP Moderate | LOW — request headers | N/A (Vercel manages) | ✅ Type II | **LOW** (inherited) |

### 3.2 Risk Mitigation for HIGH-Risk Vendors

**SVC-001 (Supabase) — CRITICAL PATH ITEM (G-00):**
Supabase hosts all customer data and does not offer a FedRAMP-authorized product tier. Resolution options:
- Migrate to a FedRAMP-authorized database (AWS GovCloud RDS, Azure Government PostgreSQL) — this is the G-00 blocker
- Until migration: limit federal customer data to pre-authorization evaluation only; ensure government customers are aware

**SVC-005 (LLM APIs for federal use cases):**
AI features may not be used for processing federal data until a FedRAMP-authorized AI inference service is available (e.g., AWS Bedrock GovCloud). Until then:
- AI features must be disabled for any federally-contracted customers
- Document this restriction in Rules of Behavior and AI Data Retention Policy
- See `docs/approval/fedramp/ai-data-retention-policy.md`

---

## 4. Software Dependency Risk Assessment (SR-3, SR-4)

### 4.1 Dependency Vulnerability Monitoring

All npm dependencies are continuously monitored for known vulnerabilities:

| Mechanism | Tool | Frequency | Action Threshold |
|-----------|------|-----------|-----------------|
| Pre-merge scan | Codacy + Trivy in CI | Every PR/commit | Block merge on Critical |
| Weekly scheduled scan | GitHub Actions `security-scan.yml` | Weekly (Monday 8am UTC) | Alert on High/Critical |
| Manual audit | `npm audit` | On-demand | Review High+ findings |
| SBOM generation | Syft (anchore SBOM action) | Weekly | Upload to GitHub security tab |

**Evidence location:** `.github/workflows/security-scan.yml` (see also `docs/approval/fedramp/asset-inventory.md`)

### 4.2 High-Risk Dependency Categories

The following categories require elevated review when dependencies are added or updated:

| Category | Examples | Additional Review Required |
|----------|---------|--------------------------|
| Authentication libraries | `@supabase/supabase-js`, `@supabase/auth-ui-react` | Engineering Lead review; verify update release notes |
| Cryptographic functions | Any crypto library | Security review; prefer Node.js built-ins or libsodium |
| HTTP clients / fetch wrappers | `axios`, `node-fetch` | Check for SSRF potential in usage; validate TLS enforcement |
| File parsers | XLSX, CSV, PDF parsers | Check for path traversal and deserialization vulnerabilities |
| Template engines | Handlebars, Mustache | Check for server-side template injection |
| ORM / database drivers | PostgreSQL clients | Review for SQL injection potential in raw query usage |

### 4.3 Authorized Software List

All production dependencies must be:
1. Listed in `package.json` under `dependencies` (not devDependencies)
2. Approved via the PR review process (CM-3)
3. Free of known Critical or High CVEs at the time of addition

Adding a new production dependency requires:
- Explicit PR with justification for the new dependency
- Trivy scan of the new dependency passing in CI
- Engineering Lead review and approval

---

## 5. Acquisition Criteria (SR-5)

When selecting new vendors or open-source components, the following criteria are evaluated:

### 5.1 Critical Vendor Requirements (Must-Have)

- Data Processing Agreement (DPA) or equivalent must be available
- Evidence of security program (SOC 2 Type II, ISO 27001, or equivalent)
- Clear data residency and data handling policies
- Incident notification procedures (must notify WeCr8 within 72 hours of breach)

### 5.2 Federal Customer Requirements

When a vendor will handle data for federal agency customers:
- **FedRAMP authorization required** for all cloud services that store or process federal data
- If no FedRAMP authorization exists, a formal exception and risk acceptance must be documented (signed by CEO)
- ITAR-controlled data requires U.S.-hosted infrastructure only (AWS GovCloud, Azure Government, or equivalent)

### 5.3 Open Source Component Requirements

- Actively maintained (last commit within 12 months)
- No known unresolved Critical/High CVEs
- License compatible with commercial use (avoid GPL/LGPL for production dependencies)
- Source code publicly auditable (not obfuscated)

---

## 6. SBOM Reference (SR-4)

A Software Bill of Materials (SBOM) is generated weekly via the security scan workflow:
- **File:** `sbom.cyclonedx.json` (GitHub Actions artifact, 365-day retention)
- **Format:** CycloneDX JSON (CISA-recommended format)
- **Generated by:** `anchore/sbom-action` in `.github/workflows/security-scan.yml`
- **Use:** Provided to federal agency customers upon request; used internally for dependency auditing

A static snapshot of the software asset inventory is maintained at:
`docs/approval/fedramp/asset-inventory.md`

---

## 7. Provenance and Code Integrity (SR-3)

To maintain supply chain integrity in the software delivery pipeline:

| Control | Implementation |
|---------|---------------|
| Pinned GitHub Actions | All workflows reference actions at a specific commit SHA or version tag |
| Dependency lockfile | `bun.lockb` / `package-lock.json` committed to repository; reproducible builds |
| Signed commits | Recommended for all engineers (enforced pre-ATO on main branch) |
| Branch protection | `main` branch requires PR + CI checks before merge |
| Weekly CVE scan | Trivy SBOM scan generates evidence continuously |
| No unreviewed external code | All dependencies introduced through reviewed PRs only |

---

## 8. Vendor Management

### 8.1 Vendor Contract Review

All new vendor relationships involving data processing must:
1. Execute a DPA before any data is transmitted to the vendor
2. Verify the vendor's incident notification policy (72-hour requirement for FedRAMP)
3. Review the vendor's most recent security audit report (SOC 2 or equivalent)

### 8.2 Ongoing Vendor Monitoring

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Review vendor security pages for breach notifications | Monthly | Engineering Lead |
| Check FedRAMP marketplace for authorization status updates | Quarterly | Engineering Lead |
| Renew / review DPA agreements | Annually | CEO |
| Assess new critical CVEs in vendor platforms | On-demand (via CVE feeds) | Engineering Lead |

---

## 9. Document Updates

This SCRMP is updated when:
- A new vendor or SaaS service is added to the authorization boundary
- A vendor's FedRAMP status changes
- A supply chain security incident occurs
- Annual review cycle

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-22) |

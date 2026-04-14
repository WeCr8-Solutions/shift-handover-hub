# FedRAMP Phase 2 — Quinn Execution Skill
**Scope:** Security hardening, pen test execution, federal onboarding, and remediation workflow  
**Phase:** 2 — Building on completed Phase 1 documentation (all G-08 through G-29 complete)  
**Updated:** April 2026

---

## System Context

**Product:** JobLine AI — SaaS shift-handover and work-order management for manufacturing  
**Company:** WeCr8 Solutions LLC  
**Stack:** React 18 + TypeScript (Vite), Supabase (PostgreSQL 15 + GoTrue Auth + Edge Functions / Deno + Realtime), Vercel CDN  
**Repo:** `shift-handover-hub` on GitHub (`WeCr8-Solutions` org)  
**Production URL:** `https://app.jobline.ai`  
**Dev/Staging URL:** `https://dev.jobline.ai`  
**FedRAMP pathway:** Moderate / LI-SaaS — Agency ATO path  
**Authorization blocker:** G-00 (Supabase commercial + Vercel not FedRAMP authorized); target migration Q4 2026

---

## Phase 2 Task Inventory

All Phase 1 documentation gaps (G-03 through G-29) are COMPLETE. Remaining open work:

| Gap | Task | Effort | Owner |
|-----|------|--------|-------|
| **G-04** | Third-party penetration test + internal DAST | 2–4 wks elapsed | Engineering + CEO |
| **G-06** | SAML 2.0 / AD SSO | 3–6 wks engineering | Engineering |
| **G-07** | SIEM log export edge function | 2–4 wks engineering | Engineering |
| **G-12** | AI opt-out toggle (org-level `ai_enabled` flag) | 1–2 wks | Engineering |
| **G-13** | Prompt injection controls + AI request logging | 1–2 wks | Engineering |
| **G-15** | Backup restore test (quarterly cadence) | 1 day + recurring | Engineering |
| **G-16** | Status page at `status.jobline.ai` | 0.5 days | Engineering |
| **G-00** | Infrastructure migration to AWS GovCloud | 3–6 months | CEO + Engineering |

---

## G-04: Penetration Testing — Free Resources + Execution Plan

### Free / No-Cost Testing Services (Start Here)

#### 1. CISA Cyber Hygiene Vulnerability Scanning (CHvS) — FREE
- **What:** DHS/CISA scans external-facing IPs and domains weekly, sends PDF reports of findings
- **Cost:** $0 — funded by DHS as a public service for organizations seeking federal relationships
- **Sign-up:** Email `cyhy@hq.dhs.gov` with:
  - Organization name: WeCr8 Solutions LLC
  - Primary contact name and email
  - Domains to scan: `jobline.ai`, `app.jobline.ai`, `api.jobline.ai`
  - IP ranges (Vercel IPs — can use domain names instead)
- **Output:** Weekly vulnerability report (CVE-based), available in their web portal
- **FedRAMP value:** Evidence of proactive vulnerability management (RA-5); referenced in ConMon reports
- **Timeline:** Setup takes ~1 week for activation

#### 2. OWASP ZAP DAST Scanning — FREE (CI-integrated)
- **What:** Automated Dynamic Application Security Testing against live endpoints
- **Tool:** `zaproxy/action-full-scan` GitHub Action (free, open-source)
- **Workflow:** `.github/workflows/zap-scan.yml` — runs weekly against `app.jobline.ai` and on pull requests against `dev.jobline.ai`
- **Output:** SARIF report uploaded to GitHub Security tab; HTML report as artifact
- **FedRAMP value:** CA-8 (pen testing evidence), RA-5 (vulnerability scanning), SI-3 (malicious code protection)

#### 3. HackerOne Response (Free VDP Platform) — FREE
- **What:** Formalized Vulnerability Disclosure Program — security researchers submit findings through a structured portal
- **Cost:** $0 for Response tier (no paid bounties required)
- **Sign-up:** https://www.hackerone.com/vulnerability-disclosure-programs
  - Create an organization account
  - Configure scope (same as `responsible-disclosure-policy.md`)
  - Link VDP URL in `public/.well-known/security.txt`
- **FedRAMP value:** RA-5(11) (threat intelligence), IR-6 (incident reporting); shows proactive community engagement to 3PAO

#### 4. GitHub Code Scanning (CodeQL) — FREE with GitHub Enterprise Cloud
- **What:** SAST scanning via CodeQL — already available on the GitHub Enterprise Cloud plan
- **Enable:** Settings → Security → Code scanning → Enable CodeQL
- **Benefit:** TypeScript/JavaScript security queries; results appear in Security tab
- **FedRAMP value:** SA-11 (developer security testing), SI-3

#### 5. CISA Attack Surface Management (ASM) — FREE
- **What:** Continuous internet-facing asset discovery and monitoring
- **Sign-up:** https://www.cisa.gov/resources-tools/services/attack-surface-management
- **Contact:** `ASM@cisa.dhs.gov`
- **FedRAMP value:** CM-8 (inventory), RA-5 (scanning)

### First Paid Option (When Budget Available) — Cobalt.io
- **What:** Crowdsourced pen test via certified security researchers
- **Cost:** ~$5,000–$15,000 for a web app + API assessment (JobLine scope)
- **Why:** CREST-aligned methodology; provides a formal Letter of Attestation (LoA) accepted by enterprises and used as CA-8 evidence in 3PAO readiness reviews
- **Scope template:** See `docs/approval/fedramp/pentest-rules-of-engagement.md`

---

## G-06: SAML 2.0 SSO — Implementation Blueprint

### Architecture
```
Customer AD/Okta/Azure AD
  → SAML 2.0 IdP assertion
  → Supabase SAML SSO (Enterprise tier)
  → JobLine org context with existing RBAC
```

### Database changes needed
```sql
-- Migration: add SSO config to organizations
ALTER TABLE organizations ADD COLUMN sso_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN sso_provider TEXT; -- 'saml' | 'oidc'
ALTER TABLE organizations ADD COLUMN sso_metadata_url TEXT;  -- IdP metadata URL

-- Admin can configure SSO; only org admins can toggle
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- existing RLS covers this via org-admin role check
```

### Edge Function changes
- `supabase/functions/auth-email-hook/` — already handles custom auth; will need SSO flow hook
- Add `supabase/functions/sso-config/` — CRUD for org SSO metadata

### Frontend
- Add SSO configuration panel in org admin settings
- Login page: detect `?org=<slug>` and redirect to IdP if SSO enabled
- `src/pages/SSOSetup.tsx` — guided setup wizard

### Testing IdPs (free tier available)
- **Okta Developer Org** — free forever developer account at `developer.okta.com`
- **Azure AD Free** — free tier includes SAML federation
- **JumpCloud Free** — up to 10 users free; supports SAML

---

## G-07: SIEM Log Export — Implementation Blueprint

### Architecture
```
activity_logs INSERT trigger
  → Supabase Database Webhook (pg_hhook)
  → supabase/functions/log-export/index.ts
  → Configured SIEM endpoint (per-org setting)
```

### New Edge Function location
`supabase/functions/log-export/index.ts`

### Key behaviors
- Accept Supabase webhook payload (`type: INSERT`, `table: activity_logs`)
- Format as CEF (Common Event Format) for Splunk or JSON for Elastic/Sentinel
- Authenticate to SIEM via stored org secret (Supabase Vault)
- Support: Splunk HEC, QRadar syslog, Sentinel Log Ingestion API, generic HTTP POST
- Fail-open: if SIEM unreachable, log error to `siem_export_errors` table (don't drop the event)

### New table needed
```sql
CREATE TABLE siem_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('cef', 'json', 'syslog')),
  auth_header TEXT, -- stored encrypted
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Free SIEM options for testing
- **Elastic SIEM (self-hosted)** — free; docs at `elastic.co/siem`
- **Wazuh** — open-source SIEM; free; Docker-based
- **OpenSearch + Security Analytics** — AWS open-source fork of Elasticsearch; free

---

## G-12/G-13: AI Security Controls — Implementation Blueprint

### G-12: Org-Level AI Opt-Out

**Migration:**
```sql
ALTER TABLE organizations 
ADD COLUMN ai_enabled BOOLEAN NOT NULL DEFAULT false;
-- Default OFF — opt-in model for new orgs
```

**Edge Function gate** (`supabase/functions/ai-planning-assistant/index.ts`):
```typescript
const { data: org } = await supabase
  .from('organizations')
  .select('ai_enabled')
  .eq('id', orgId)
  .single();

if (!org?.ai_enabled) {
  return new Response(JSON.stringify({ error: 'AI features not enabled for this organization' }), {
    status: 403,
    headers: corsHeaders,
  });
}
```

**Frontend toggle:** Org admin settings → Security → "AI Features" toggle  
**Control evidence:** AC-20 (use of external systems), SA-9 (external service agreement)

### G-13: Prompt Injection Controls

**Input validation layer** (add to `ai-planning-assistant` before prompt assembly):
```typescript
import DOMPurify from 'dompurify'; // or server-side: sanitize-html

function validateAIInput(input: string): { valid: boolean; reason?: string } {
  // Max input size (prevent token stuffing)
  if (input.length > 4000) return { valid: false, reason: 'Input exceeds 4000 characters' };
  
  // Basic injection pattern detection
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now\s+a?\s*different/i,
    /system\s*:\s*you/i,
    /<\|.*?\|>/,  // LLM control tokens
    /\[INST\]|\[\/INST\]/,  // Llama instruction tokens
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      return { valid: false, reason: 'Input contains disallowed pattern' };
    }
  }
  
  return { valid: true };
}
```

**AI request logging table:**
```sql
CREATE TABLE ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL,
  input_hash TEXT NOT NULL,          -- SHA-256 of input; not plaintext
  input_token_count INTEGER,
  response_token_count INTEGER,
  model TEXT NOT NULL,
  duration_ms INTEGER,
  blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Row-level security: org admins can read their org's logs
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;
```

**Note:** Store the SHA-256 hash of the input, never plaintext — this satisfies AU-3 (content audit) without storing potentially sensitive work-order content.

---

## Remediation Workflow — OWASP Top 10 Priority Order

When ZAP, CISA CHvS, or pen test findings come in, triage by OWASP category before CVSS score:

| Priority | OWASP Category | Examples | Response SLA |
|----------|---------------|---------|-------------|
| P1 | A01 Broken Access Control | RLS bypass, IDOR, privilege escalation | Fix before next deploy |
| P1 | A02 Cryptographic Failures | Token in URL, weak cipher, secret exposure | Fix before next deploy |
| P1 | A03 Injection | SQL injection, XSS, command injection | Fix before next deploy |
| P2 | A07 Auth Failures | Session fixation, weak JWT, missing MFA enforcement | 7 days |
| P2 | A09 Security Logging Failures | Missing audit trail, log injection | 7 days |
| P3 | A05 Security Misconfiguration | Missing headers, CORS misconfiguration | 30 days |
| P3 | A06 Vulnerable Components | CVE in npm dependency | Per VMP SLA |
| P4 | A04 Insecure Design | Architecture-level finding | 90 days / POA&M |

### Finding → POA&M Flow
1. Finding confirmed → create POA&M item in `docs/approval/fedramp/poam.md`
2. Assign NIST control(s) affected
3. Severity → SLA per VMP
4. Engineering creates GitHub Issue tagged `security` + `fedramp`
5. Fix implemented in feature branch → Codacy + Trivy validate → merge
6. POA&M item updated to CLOSED with code commit reference as evidence

---

## Quinn Commands for Phase 2

```
# Generate SAML SSO edge function
/codegen edge-function sso-config "CRUD for org-level SAML SSO metadata; protected by org-admin RLS"

# Generate SIEM log export edge function
/codegen edge-function log-export "Receive activity_log webhook and forward to configurable SIEM endpoint in CEF/JSON format"

# Generate AI opt-out migration
/codegen migration add-ai-enabled-flag "Add ai_enabled boolean to organizations table, default false; add ai_request_logs table with RLS"

# Generate AI security controls for ai-planning-assistant
/codegen edge-function ai-planning-assistant "Add input validation, injection detection, SHA-256 audit logging, and org ai_enabled gate to existing AI assistant edge function"

# Generate prompt injection test suite
/codegen test supabase/functions/ai-planning-assistant "Test prompt injection detection, ai_enabled gate, input size limits, and audit log creation"
```

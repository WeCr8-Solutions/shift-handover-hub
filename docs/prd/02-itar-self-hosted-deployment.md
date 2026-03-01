# JobLine AI — ITAR Self-Hosted Deployment Guide

**Version:** 1.0.0
**Date:** 2026-02-28
**Audience:** IT Administrators, Compliance Officers, Security Teams
**Classification:** For Organizational Use

---

## 1. ITAR Applicability Context

**ITAR (International Traffic in Arms Regulations)** governs the export and import of defense-related articles, services, and technical data as defined on the United States Munitions List (USML). ITAR does not regulate general-purpose manufacturing software — it regulates **controlled technical data** that may be entered into or processed by software.

### What This Means for JobLine AI

JobLine AI is a **manufacturing operations platform**, not itself a defense article. However, organizations that handle ITAR-controlled technical data (e.g., CNC programs, drawings, specs for defense articles) in their manufacturing workflow must ensure that data remains:

1. Stored on infrastructure within US jurisdiction
2. Accessible only to US Persons (US citizens, lawful permanent residents, or those with appropriate export licenses)
3. Subject to audit logging sufficient to demonstrate access control
4. Protected against unauthorized disclosure

The **self-hosted deployment model** described in this document is the appropriate path for such organizations.

---

## 2. Deployment Architecture

### 2.1 Cloud (Default — NOT ITAR-Suitable)

```
User Machine
└── JobLine AI.exe
    └── Loads https://app.jobline.ai
        └── Supabase Cloud (commercial shared infrastructure)
            └── Data location: Supabase-managed, no region guarantee
```

**Why this is not ITAR-suitable:**
- Data location not guaranteed to be US-only
- No US person access controls at account creation
- Shared commercial infrastructure (not FedRAMP authorized)
- No audit trail for data access (only login/logout logged)

### 2.2 Self-Hosted (ITAR-Suitable Path)

```
User Machine (org-controlled)
└── JobLine AI.exe
    └── Loads https://app.YOUR-DOMAIN.com   (org-controlled)
        └── Self-hosted Vite/React app
            └── Supabase (self-hosted or dedicated instance)
                └── PostgreSQL in US-East region
                    └── All data within org jurisdiction
```

**Why this supports ITAR compliance:**
- All data resides on org-controlled infrastructure
- Org controls who can access the app URL
- Supabase instance can be deployed in US-only AWS/Azure region
- Org can add authentication layers (VPN, CAC/PIV, IP allowlisting) in front of the app URL

---

## 3. Prerequisites for Self-Hosted Deployment

### 3.1 Infrastructure Requirements

| Component | Requirement | Notes |
|-----------|-------------|-------|
| Web Server | Node 18+ or static file hosting | Serve the built Vite app |
| Database | PostgreSQL 15+ | Supabase self-hosted or AWS RDS in US region |
| Supabase Instance | Self-hosted or dedicated project | Must be in US region if using Supabase Cloud |
| TLS Certificate | Valid SSL cert for your domain | Required for Supabase Auth |
| Network | HTTPS accessible from user machines | Can be internal network only |

### 3.2 ITAR Network Controls (Recommended)

| Control | Implementation |
|---------|---------------|
| VPN requirement | Require users to be on org VPN to reach `appUrl` |
| IP allowlisting | Restrict `appUrl` to org IP ranges at firewall/nginx level |
| CAC/PIV authentication | Add CAC/PIV proxy (e.g., Nginx + PKCS11) in front of app URL |
| DNS isolation | Use internal DNS only; do not expose `appUrl` publicly |

> **Note:** These network controls are implemented at the infrastructure layer, outside the JobLine AI application. JobLine AI v1 does not natively enforce CAC/PIV or IP restrictions.

---

## 4. Self-Hosted Deployment Steps

### Step 1 — Clone and Build the Web App

```bash
git clone https://github.com/your-org/shift-handover-hub.git
cd shift-handover-hub

# Set environment variables for your private Supabase instance
cp .env.example .env
# Edit .env:
# VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
# VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID

npm install
npm run build
# Output: dist/ folder — deploy to your web server
```

### Step 2 — Deploy Supabase (Self-Hosted or Dedicated)

**Option A: Supabase Cloud with US Region**
1. Create a new Supabase project
2. Select region: `us-east-1` (N. Virginia) or `us-west-1` (N. California)
3. Apply all migrations: `supabase db push`
4. Deploy edge functions: `supabase functions deploy`

**Option B: Supabase Self-Hosted**
1. Follow [Supabase self-hosting guide](https://supabase.com/docs/guides/self-hosting)
2. Deploy on-premises or on AWS/Azure in a US-controlled region
3. Apply migrations and deploy edge functions

### Step 3 — Configure the Desktop EXE

Copy the self-hosted config template to the target machine:

```
Source:      <installer location>\assets\config-selfhosted-template.json
Destination: %APPDATA%\JobLine AI\config.json
```

Edit `config.json` with your actual values:

```json
{
  "mode": "cloud",
  "appUrl": "https://app.yourcompany.internal",
  "apiBaseUrl": "https://app.yourcompany.internal",
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "supabaseAnonKey": "YOUR_ANON_KEY",
  "updateChannel": "stable"
}
```

### Step 4 — Verify Connection

1. Launch `JobLineAI.exe`
2. Confirm the app loads your self-hosted URL (not `app.jobline.ai`)
3. Sign in with an account on your private Supabase instance
4. Verify data only writes to your private database (check Supabase dashboard)

---

## 5. Environment Variable Reference

All config values can be set via system environment variables, which override `config.json`. This is useful for enterprise GPO or MDM deployment.

| Environment Variable | Config Key | Description |
|---------------------|------------|-------------|
| `JOBLINE_APP_URL` | `appUrl` | URL the Electron window loads |
| `JOBLINE_API_BASE_URL` | `apiBaseUrl` | API base URL (usually same as appUrl) |
| `JOBLINE_SUPABASE_URL` | `supabaseUrl` | Your Supabase project URL |
| `JOBLINE_SUPABASE_ANON_KEY` | `supabaseAnonKey` | Your Supabase anon (publishable) key |
| `JOBLINE_MODE` | `mode` | `cloud` or `embedded` |
| `JOBLINE_UPDATE_CHANNEL` | `updateChannel` | `stable` or `beta` |
| `JOBLINE_LOGS_PATH` | `logsPath` | Custom log file directory |

**Precedence:** Default config → `config.json` → Environment variables

**GPO Example (Windows Group Policy):**
```
Computer Configuration → Windows Settings → Environment Variables
JOBLINE_APP_URL = https://app.yourcompany.internal
JOBLINE_SUPABASE_URL = https://YOUR_PROJECT.supabase.co
```

---

## 6. ITAR Compliance Checklist (Self-Hosted)

### 6.1 Infrastructure

- [ ] Supabase/PostgreSQL instance deployed in US-controlled region (us-east-1 or us-west-1)
- [ ] Web app hosted on org-controlled US infrastructure
- [ ] TLS certificate valid and in place
- [ ] Access to `appUrl` restricted to org network (VPN/firewall/IP allowlist)
- [ ] No public internet exposure of the app URL

### 6.2 Access Controls

- [ ] Only US Persons have accounts in the Supabase Auth system
- [ ] Org owner has reviewed and approved all user accounts
- [ ] Users accessing from outside org network are required to use VPN
- [ ] Admin accounts use strong unique passwords (MFA enforcement planned for v1.2)

### 6.3 Data Handling

- [ ] Confirm no ITAR-controlled data (drawings, CNC programs, specifications) is uploaded to `app.jobline.ai`
- [ ] All work orders and handoff records with controlled technical data are entered only in the self-hosted instance
- [ ] File attachments (if any) stored in org-controlled Supabase Storage bucket

### 6.4 Audit & Logging

- [ ] `activity_logs` table captures login/logout/signup events
- [ ] Supabase audit log retention configured per org data retention policy
- [ ] Desktop app logs reviewed periodically at `%APPDATA%\JobLine AI\logs\`
- [ ] Regular export of activity logs for compliance records

### 6.5 Desktop EXE Distribution

- [ ] EXE distributed through org-controlled software deployment (SCCM, Intune, etc.)
- [ ] `config.json` pre-populated with self-hosted URL before distribution
- [ ] Or environment variables set via GPO before EXE runs for the first time
- [ ] End users do not have ability to change `appUrl` to `app.jobline.ai`

---

## 7. What Is NOT Implemented in v1.0.0

The following ITAR-relevant capabilities are roadmapped but not yet available:

| Capability | Status | Notes |
|-----------|--------|-------|
| Airgap / offline mode | Roadmap v2.0 | App requires internet to load hosted URL |
| CAC/PIV (smart card) authentication | Roadmap v2.0 | Must be implemented at infrastructure proxy layer |
| US Person gating at signup | Roadmap v2.0 | Currently no citizenship/export authorization check |
| MFA enforcement per organization | Roadmap v1.2 | |
| Data classification labels | Roadmap v2.0 | No field-level data classification |
| FedRAMP authorized hosting | Not planned | Would require significant infrastructure changes |
| End-to-end encryption of data at rest | Not planned | Relies on Supabase/PostgreSQL default encryption |
| ITAR-specific audit log export | Roadmap v1.2 | Manual database export currently required |

---

## 8. Responsibility Matrix

| Responsibility | JobLine AI (Vendor) | Org IT Admin | End User |
|---------------|---------------------|--------------|----------|
| Application security defaults | Owner | Verify | N/A |
| Self-hosted infrastructure setup | Guide | Owner | N/A |
| US-only data residency | Guide | Owner | N/A |
| US Person access control | N/A | Owner | Comply |
| Network isolation (VPN, firewall) | N/A | Owner | Comply |
| Audit log review | N/A | Owner | N/A |
| ITAR training for users | N/A | Owner | Comply |
| Code signing (EXE) | v1.1 | N/A | N/A |

---

## 9. Contact & Support

For enterprise/ITAR deployment support, contact the JobLine AI team before entering any controlled technical data into the platform. Confirm your self-hosted configuration has been verified before operational use with ITAR-controlled data.

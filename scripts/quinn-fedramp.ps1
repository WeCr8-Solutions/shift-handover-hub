#!/usr/bin/env pwsh
# Quinn FedRAMP document generation script
# Generates G-26 (FIPS 199), G-27 (Digital Identity), G-24 (SSP Appendix A stubs)

param(
    [string]$Gap = "all"   # all | G-26 | G-27 | G-24
)

$OllamaUrl = "http://localhost:11434/api/generate"
$Model = "qwen2.5-coder:7b"
$OutDir = "docs\approval\fedramp"

function Invoke-Quinn {
    param([string]$Prompt, [string]$OutFile, [string]$GapId, [int]$MaxTokens = 3000)

    Write-Host "`n=== Quinn generating $GapId ===" -ForegroundColor Cyan

    # Build JSON body using ConvertTo-Json on the string to get proper escaping,
    # then embed in a manually constructed outer object to avoid ConvertTo-Json depth issues.
    $promptJson = $Prompt | ConvertTo-Json   # produces a JSON-safe quoted string
    $body = "{""model"":""$Model"",""prompt"":$promptJson,""stream"":false,""options"":{""temperature"":0.1,""num_predict"":$MaxTokens}}"

    try {
        $result = Invoke-RestMethod -Uri $OllamaUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 240
        $content = $result.response.Trim()

        if ($content.Length -lt 100) {
            Write-Host "  WARNING: Short response ($($content.Length) chars). Check model." -ForegroundColor Yellow
            return $false
        }

        $fullPath = Join-Path $OutDir $OutFile
        $content | Out-File $fullPath -Encoding utf8
        Write-Host "  Written: $fullPath ($($content.Length) chars)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        return $false
    }
}

# --- G-26: FIPS 199 Security Categorization ---
if ($Gap -eq "all" -or $Gap -eq "G-26") {
    $p26 = @"
You are a FedRAMP compliance expert. Write a complete FIPS 199 / NIST SP 800-60 security categorization worksheet in Markdown for the following system:

SYSTEM: JobLine (shift-handover-hub)
DESCRIPTION: A SaaS web application for manufacturing facility shift handovers, work order management, NCR (non-conformance report) tracking, and equipment calibration management.
TECHNOLOGY STACK: React/TypeScript frontend on Vercel CDN, Supabase PostgreSQL database, Supabase Auth (JWT + TOTP MFA), Supabase Edge Functions (Deno), optional self-hosted Electron desktop for ITAR facilities.
OPERATOR: WeCr8 Solutions LLC (small startup, CEO + Engineering Lead)
USERS: Manufacturing facility employees, supervisors, org administrators
FEDERAL CUSTOMERS: Government contractors, potential ITAR-regulated facilities
AUTHORIZATION TARGET: FedRAMP Moderate
DATA TYPES: Work orders, shift handover notes, NCR records, equipment calibration records, job performance logs, employee names and email addresses (PII), organizational membership records
SENSITIVE DATA: No classified data. PII is limited to first/last name and work email. No financial data, no health data.

Write the worksheet with these exact sections:

## 1. System Identification

Include: System Name, System Version, System Type (Major Application), Authorization Level (FedRAMP Moderate), Operator, Date.

## 2. System Description

2-3 paragraph description of what the system does, who uses it, how it is deployed.

## 3. Information Types

Create a table with these exact columns:
| Information Type | Description | NIST 800-60 Vol II ID | Confidentiality Impact | Integrity Impact | Availability Impact |

Include at least these information types determined from the system context:
- Administrative and Management Information
- Process and Operational Data (work orders, NCRs, shift notes)
- Personally Identifiable Information (employee names, emails)
- Audit and Accountability Records (activity logs, auth events)
- Equipment and Asset Management Data (calibration records)

Rate each impact as Low, Moderate, or High per NIST 800-60 Vol II guidelines.

## 4. System Security Categorization

State the overall SC = {Confidentiality: X, Integrity: X, Availability: X} using the HIGH WATER MARK rule.
Justify the selection.

## 5. Impact Rating Rationale

For each of Confidentiality, Integrity, and Availability: explain why the rating was selected (2-4 sentences each) referencing the specific data types and potential harm from compromise.

## 6. Authorization Signatures

Provide a placeholder signature block with fields for: System Owner, Information System Security Officer (ISSO), Authorizing Official (AO), Date.

Output complete Markdown only. No preamble, no explanation outside the document.
"@
    Invoke-Quinn -Prompt $p26 -OutFile "fips-199-categorization.md" -GapId "G-26 (FIPS 199)"
}

# --- G-27: Digital Identity Worksheet ---
if ($Gap -eq "all" -or $Gap -eq "G-27") {
    $p27 = @"
You are a FedRAMP compliance expert. Write a complete Digital Identity Worksheet per NIST SP 800-63-3 guidance for a FedRAMP Moderate system in Markdown.

SYSTEM: JobLine (shift-handover-hub) — SaaS manufacturing shift-handover and work-order management
AUTHENTICATION TECHNOLOGY:
- Provider: Supabase Auth (built on GoTrue)
- Methods: Email/password (bcrypt-hashed), TOTP-based MFA (Authenticator apps), magic-link via email
- Sessions: JWT access tokens (1-hour expiry), refresh tokens (30-day with rotation), stored in httpOnly cookies
- Password policy: min 8 chars, complexity enforced server-side, breach-check via Supabase
- MFA: org-level flag `mfa_required`; enforced before write actions if enabled
- Account lockout: Supabase rate-limiting on failed attempts
- Account lifecycle: invite-only (admin-generated invite codes), admin deactivation, automatic JWT expiry
FEDERAL CUSTOMERS: Government contractors; some facilities may be ITAR-regulated

Write the worksheet with:

## 1. System and Document Information

System name, version, date, authorization level, preparer.

## 2. Digital Identity Acceptance Statement

One paragraph: whether the system meets or plans to meet required IAL, AAL, FAL levels.

## 3. Transaction Types and Risk Assessment

Table with columns:
| Transaction Type | Description | Potential Impact (Low/Mod/High) | Justification |

Include: User Login, Admin Account Management, Work Order Write, NCR Submission, Data Export, MFA Enrollment/Reset

## 4. Identity Assurance Level (IAL) Selection

State selected IAL (1, 2, or 3) and justify per NIST 800-63A. Explain why in-person identity proofing is/is not required.

## 5. Authenticator Assurance Level (AAL) Selection

State selected AAL (1, 2, or 3) and justify per NIST 800-63B. Reference specific authentication mechanisms implemented (password + TOTP = AAL2).

## 6. Federation Assurance Level (FAL) Selection

State selected FAL (1, 2, or 3) or N/A if no federation. Justify.

## 7. Implementation Summary

Table mapping each assurance level to specific technical controls implemented in the system.

## 8. Gaps and Remediation Plan

List any gaps between current implementation and the required assurance levels. Include planned remediation with estimated completion.

## 9. Signatures

Placeholder signature block: System Owner, ISSO, AO, Date.

Output complete Markdown only. No preamble.
"@
    Invoke-Quinn -Prompt $p27 -OutFile "digital-identity-worksheet.md" -GapId "G-27 (Digital Identity)"
}

# --- G-24: SSP Appendix A — AC and AU control family stubs ---
if ($Gap -eq "all" -or $Gap -eq "G-24") {
    $p24 = @"
You are a FedRAMP compliance expert writing a System Security Plan (SSP) Appendix A for a FedRAMP Moderate system.

SYSTEM: JobLine (shift-handover-hub)
STACK: React/TypeScript on Vercel, Supabase PostgreSQL + Auth + Edge Functions, Electron desktop (optional)
OPERATOR: WeCr8 Solutions LLC (CEO + Engineering Lead)
RBAC: org_id-scoped roles (admin, supervisor, technician, viewer) enforced via PostgreSQL Row Level Security
AUTH: Supabase Auth, JWT, TOTP MFA, invite-only onboarding
LOGGING: activity_logs table with 22 event types; Supabase logs for auth events and Edge Function invocations
INCIDENT RESPONSE: documented IRP, PagerDuty alerts for critical events, <4hr notification SLA
CHANGE MANAGEMENT: GitHub Actions CI/CD, branch protection, PR review required, Vercel preview deployments

Write SSP Appendix A control implementation statements for these NIST SP 800-53 Rev. 5 controls.
For each control write:

### <CONTROL-ID> — <Control Name>

**Control Requirement (FedRAMP Moderate):** [one sentence from NIST 800-53 Rev. 5]

**Implementation Status:** Implemented | Partially Implemented | Planned | Not Applicable

**Implementation Description:**
[Specific description of HOW this control is implemented in this system. Reference actual tools, tables, policies, config values. 3-8 sentences or a bulleted list.]

**Responsible Role:** CEO | Engineering Lead | Both

**Test Method:** [How an assessor would verify this control — specific evidence artifacts]

---
Write statements for ALL of the following controls:

AC Controls:
AC-1 (Policy and Procedures), AC-2 (Account Management), AC-3 (Access Enforcement), AC-4 (Information Flow Enforcement), AC-5 (Separation of Duties), AC-6 (Least Privilege), AC-7 (Unsuccessful Login Attempts), AC-8 (System Use Notification), AC-11 (Device Lock), AC-12 (Session Termination), AC-14 (Permitted Actions Without Identification or Authentication), AC-17 (Remote Access), AC-18 (Wireless Access), AC-19 (Access Control for Mobile Devices), AC-20 (Use of External Information Systems), AC-22 (Publicly Accessible Content)

AU Controls:
AU-1 (Policy and Procedures), AU-2 (Event Logging), AU-3 (Content of Audit Records), AU-4 (Audit Log Storage Capacity), AU-5 (Response to Audit Processing Failures), AU-6 (Audit Record Review, Analysis, and Reporting), AU-7 (Audit Record Reduction and Report Generation), AU-8 (Time Stamps), AU-9 (Protection of Audit Information), AU-11 (Audit Record Retention), AU-12 (Audit Record Generation)

Output complete Markdown only. Start with:
# SSP Appendix A — Control Implementation Statements
## Access Control (AC) Family
[then each AC control...]
## Audit and Accountability (AU) Family
[then each AU control...]

No preamble. No explanation outside the document content.
"@
    Invoke-Quinn -Prompt $p24 -OutFile "ssp-appendix-a-controls.md" -GapId "G-24 (SSP Appendix A)" -MaxTokens 8000
}

Write-Host "`nQuinn FedRAMP generation complete." -ForegroundColor Green
Write-Host "Files in ${OutDir}:"
Get-ChildItem $OutDir | Select-Object Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB,1)}} | Format-Table -AutoSize

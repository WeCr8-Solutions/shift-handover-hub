# ITAR / US Person Screening Procedure

**Organization:** WeCr8 Solutions (JobLine AI)
**Version:** 1.0
**Date:** May 2026
**Classification:** Internal
**Owner:** CEO
**Approved By:** CEO
**Review Cycle:** Annual; after any control change
**NIST Controls:** AC-3, AC-4, AC-22, MP-3, PS-3, SR-1, SR-3
**Authority:** International Traffic in Arms Regulations (ITAR) 22 CFR §§120-130; Export Administration Regulations (EAR) 15 CFR §§730-774

---

## 1. Purpose

This procedure documents how JobLine AI screens organizations and individual users for compliance with U.S. export-control law (ITAR/EAR) and how the platform technically enforces ITAR data-handling restrictions. It complements the FIPS-199 categorization (`fips-199-categorization.md`) and the SSP boundary controls.

---

## 2. Scope

Applies to:
- Every organization that self-identifies as ITAR-controlled in JobLine AI organization settings.
- Every user account that accesses an ITAR-flagged organization.
- All system components that store, process, or transmit data on behalf of ITAR-flagged organizations (queue items, work orders, handoff records, machine configurations, file uploads, ERP-sourced rows).

Does **not** apply to commercial / non-ITAR organizations, public marketing pages, or anonymous Talent Network browsing.

---

## 3. Definitions

| Term | Definition |
|---|---|
| **U.S. Person** | A U.S. citizen, lawful permanent resident, refugee, asylee, or U.S.-incorporated entity, per 22 CFR §120.62. |
| **ITAR-Controlled Org** | An organization with `organizations.requires_us_person_declaration = true`. |
| **Technical Data** | Data covered by USML categories I–XXI. In JobLine AI: any work-order row, routing step, drawing reference, or machine configuration uploaded by an ITAR-controlled org. |
| **Read-Through** | ERP rows (JobBOSS / SAP) are streamed to the operator UI on demand and **never persisted** in Supabase. Default for all ITAR orgs. |
| **Write-Through** | ERP rows are mirrored into `queue_items`. **Forbidden** for ITAR orgs (DB-trigger enforced). |

---

## 4. Org-Level ITAR Declaration (At Onboarding)

### 4.1 Declaration

During organization creation or in **Settings → Organization → Compliance**, an authorized officer (Org Owner) must affirm one of:

1. **"This organization handles ITAR-controlled technical data"** → Sets `organizations.requires_us_person_declaration = true`.
2. **"This organization does not handle ITAR-controlled data"** → Default; commercial controls only.

The declaration is logged in `activity_logs` (`activity_type='organization_settings_changed'`) with the actor's user_id, timestamp, and IP address.

### 4.2 Officer Attestation Record

When ITAR is enabled, the system records:
- Org Owner display_name + user_id
- Email + last login IP
- Timestamp of attestation
- Acknowledgement that the org will not invite non-U.S. Persons without separate Technical Assistance Agreement (TAA)

Stored in `organization_compliance_attestations` (append-only, RLS: org admins read; platform admins read all).

---

## 5. User-Level US Person Gate

### 5.1 Invitation Flow

When an Org Admin invites a user into an **ITAR-flagged** org:

1. Invite email contains a U.S. Person attestation form linked to the invite token.
2. On invite acceptance, the invitee must check:
   - "I am a U.S. Person as defined under 22 CFR §120.62", **OR**
   - "I am covered under an existing TAA (TAA reference required)."
3. Refusal → invite is auto-rejected; the would-be user never gains org membership.
4. Acceptance writes a row to `user_us_person_attestations` with: user_id, org_id, attestation_type, taa_reference (nullable), accepted_at, accepted_ip.

### 5.2 Re-Attestation

- Required annually.
- Required immediately if the user changes citizenship status (self-report via Settings → Profile).
- Stale attestations (>365 days) suppress the user from new ITAR data and surface a banner: "Re-attest to continue access".

---

## 6. Technical Enforcement

### 6.1 Database Triggers

| Trigger | Behavior |
|---|---|
| `enforce_itar_read_through` (BEFORE UPDATE on `organizations`) | Blocks `erp_persistence_mode='write_through'` when `requires_us_person_declaration=true`. |
| `enforce_org_isolation` (BEFORE INSERT/UPDATE on every tenant table) | Confirms `organization_id` matches the caller's active org. |
| RLS on every table | Default-deny. Org-scoped read/write only via `is_org_member()` and `has_role()` helpers (search_path-pinned). |

### 6.2 Edge-Function Gates

| Function | Gate |
|---|---|
| `sap-sync` / `erp-sync` | Reads `erp_persistence_mode`. ITAR orgs always force read-through; queue_items writes are skipped. |
| `ai-planning-assistant` | Refuses to enrich context with persisted data when org is ITAR + write-through (mode is impossible by 6.1). |
| `parse-resume` / Talent Network | Talent profiles are personal and **not** ITAR data; no extra gate, but contact info masking always applies. |

### 6.3 Application-Layer

- `useDataSourceMode` hook + `DataSourceBanner` component visibly surface "Read-through (ITAR)" mode to operators.
- AdSense, AI suggestions, and external embeds are runtime-disabled when `requires_us_person_declaration=true`. (See `mem://features/ads/placement-and-app-exclusion`.)

---

## 7. Sub-Processor Boundary

ITAR orgs are informed at attestation that JobLine AI's current commercial deployment runs on:

- **Supabase (commercial AWS us-east-1)** — not separately FedRAMP- or ITAR-authorized.
- **Vercel (commercial AWS)** — front-end only; no ITAR data in build artifacts.

**Until the GovCloud migration (POA&M G-00) completes**, ITAR orgs are advised in writing that JobLine AI is not yet a compliant ITAR repository. Continued use is at the org's discretion under their own export-control program. This advisory is presented during attestation and stored alongside the acceptance record.

Post-GovCloud cutover, this section is updated and re-attestation is required.

---

## 8. Personnel (WeCr8 Engineering) Screening

All personnel with production database access must:
- Be U.S. Persons (22 CFR §120.62), verified at hire via I-9 and citizenship documentation.
- Sign the Rules of Behavior (`rules-of-behavior.md`).
- Complete annual security awareness training (`security-awareness-training.md`).
- Have prod access reviewed quarterly by the Engineering Lead (logged to `data_access_logs`).

Foreign-national contractors are categorically excluded from prod-access roles until a TAA is filed.

---

## 9. Incident Procedure (Suspected ITAR Disclosure)

If a suspected unauthorized export of technical data is detected:

1. Within 1 hour: Engineering Lead invokes the Incident Response Plan (`incident-response-plan.md`).
2. Within 24 hours: CEO assesses whether disclosure to State Department DDTC is required (22 CFR §127.12).
3. Within 60 days of discovery: Voluntary disclosure to DDTC if confirmed.
4. Affected org notified per their Data Processing Agreement.
5. Evidence preserved in `docs/approval/fedramp/evidence/itar-incident-{date}/`.

---

## 10. Evidence & Records

| Record | Location | Retention |
|---|---|---|
| Org ITAR attestations | `organization_compliance_attestations` table | Indefinite |
| User U.S. Person attestations | `user_us_person_attestations` table | 5 years post-account-deletion |
| Settings change logs | `activity_logs` | 1 year online + 6 years cold archive |
| Personnel I-9 + citizenship | HR locked file | Per IRS / DHS retention rules |
| Quarterly access reviews | `docs/approval/fedramp/evidence/access-review-YYYY-Qn.md` | Indefinite |

---

## 11. Review & Approval

| Field | Value |
|---|---|
| Author | Engineering Lead |
| Approved by | CEO |
| Initial issue | May 2026 |
| Next review | May 2027 |
| Related controls | AC-3, AC-4, AC-22, MP-3, PS-3, SR-1, SR-3, IR-6 |
| Related docs | `personnel-security-policy.md`, `rules-of-behavior.md`, `incident-response-plan.md`, `fips-199-categorization.md`, `appendix-a/ssp-appendix-a-ac.md` |

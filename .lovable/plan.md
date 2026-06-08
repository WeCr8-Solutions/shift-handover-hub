## Problem

The `/admin/concierge/print/:engagementId` route renders a 12‑page packet but the only "export" is the browser's Print dialog — nothing downloads, nothing is reviewable section‑by‑section, and the worksheets don't match the Excel intake template (`/public/templates/JobLine_Setup_Template.xlsx`) or the in‑app UI fields. There is also no central, reusable contract/document library for staff or customers.

## Goal

One Concierge Document Library that:
1. Lets JobLine staff and customers **download** every onboarding artifact (MSA, ITAR declaration, payment instructions, intake worksheets, go‑live checklist, NDA, employee SOPs) as PDF, DOCX (editable) and XLSX (intake worksheets only).
2. Always shows a **review preview** before download.
3. **Matches the live UI + Excel template** (same field names, same order, single source of truth).
4. Is reusable inside engagement print, the customer portal, and an internal staff library.

## Deliverables

### 1. Shared document registry (single source of truth)
`src/lib/concierge/documentRegistry.ts`
- One `DOCUMENT_KEYS` enum: `msa`, `itar_declaration`, `payment_instructions`, `nda_mutual`, `equipment_worksheet`, `stations_worksheet`, `users_worksheet`, `routing_worksheet`, `quality_worksheet`, `erp_questionnaire`, `go_live_checklist`, `signature_page`, `employee_onboarding_sop`, `employee_handoff_sop`.
- Each entry: `{ key, title, audience: 'customer'|'staff'|'both', kind: 'contract'|'worksheet'|'sop'|'reference', formats: ('pdf'|'docx'|'xlsx')[], requiresEngagement, render(engagement?) }`.
- Worksheet column lists imported from the **same constants** the bulk import edge function and `IntakeMembersEditor` / `IntakeErpEditor` use → guarantees parity with UI + Excel template.

### 2. Renderers (client‑side, no server)
`src/lib/concierge/renderers/`
- `renderPdf.ts` — uses existing `jspdf` + `html2canvas` (already in tree via `CertificatePdfDownloadButton`); takes a registry entry, returns a Blob.
- `renderDocx.ts` — uses `docx` npm package (one new dep) for editable contracts/SOPs.
- `renderXlsx.ts` — uses existing `exceljs` (already in tree via `scripts/verify-bulk-template.mjs`) to emit per‑worksheet `.xlsx` matching `JobLine_Setup_Template.xlsx` sheet names.
- Engagement‑aware fills: org name, plan tier, amount, signer slots pre‑populated when called from an engagement.

### 3. Reusable UI component
`src/components/admin/concierge/DocumentLibrary.tsx`
- Grid of cards (one per registry entry) filtered by `audience` prop.
- Each card: title, description, **Preview** (opens shadcn Dialog with the rendered PDF in an `<iframe>` for review), **Download PDF / DOCX / XLSX** buttons, last‑updated timestamp, and a "Send to customer" action when used from an engagement (uploads to existing `concierge-contracts` bucket and emails via existing `send-transactional-email` queue).
- Bulk action: **Download full packet** (zips all selected docs via `jszip` — already used elsewhere; verify, else add).

### 4. Mounting points
- **Engagement print panel** (`ConciergeSalesPack.tsx`): keep current paginated preview but replace top toolbar with `<DocumentLibrary engagement={...} />` so staff can preview/download/email each piece individually and still get a combined PDF.
- **Engagement detail** (`EngagementDetail.tsx`): add "Documents" tab below Readiness using the same component, audience=`both`.
- **Internal staff library**: new route `/admin/concierge/library` (platform‑admin/developer gated) with `audience="staff"` (adds NDA, employee SOPs, internal payment instructions).
- **Customer portal**: new route `/settings/concierge/documents` (org admin gated) with `audience="customer"` so customers can re‑download their MSA, ITAR declaration, worksheets, and SOPs at any time.

### 5. Reusable contract & SOP content
`src/lib/concierge/templates/`
- `msa.ts`, `itar.ts`, `nda.ts`, `paymentInstructions.ts` — extracted from `ConciergeSalesPack.tsx` so the same text is rendered into PDF, DOCX, and the live preview. Variables: customer name, plan, amount, effective date, signer name/title.
- `employeeOnboardingSop.ts`, `employeeHandoffSop.ts` — new short SOPs for JobLine staff (intake checklist, escalation, post‑go‑live handoff).

### 6. Audit + review safety
- Every download writes to `admin_audit_events` (`action='concierge_document_download'`, metadata={key, format, engagement_id}).
- "Send to customer" requires a confirmation dialog showing the recipient email + a preview thumbnail.
- All contract docs include a footer with engagement ID + generation timestamp so reviewers can verify the latest version was used.

## Out of scope
- No backend schema changes; reuses `concierge-contracts` bucket, `admin_audit_events`, and the existing transactional email queue.
- No e‑signature integration (wet‑signature flow via `ContractPanel` is unchanged).

## Files touched / created
**New**: `src/lib/concierge/documentRegistry.ts`, `src/lib/concierge/renderers/{renderPdf,renderDocx,renderXlsx}.ts`, `src/lib/concierge/templates/{msa,itar,nda,paymentInstructions,employeeOnboardingSop,employeeHandoffSop}.ts`, `src/components/admin/concierge/DocumentLibrary.tsx`, `src/components/admin/concierge/DocumentPreviewDialog.tsx`, `src/pages/admin/ConciergeLibrary.tsx`, `src/pages/settings/ConciergeDocuments.tsx`.

**Edited**: `src/pages/ConciergeSalesPack.tsx` (mount DocumentLibrary toolbar), `src/components/admin/onboarding/EngagementDetail.tsx` (Documents tab), `src/App.tsx` (2 new lazy routes).

**Dependency**: add `docx` (npm). `exceljs`, `jspdf`, `html2canvas`, `jszip` already present.

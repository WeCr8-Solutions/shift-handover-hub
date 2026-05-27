## Goal

Turn the existing Admin → History tab into a true **AS9100 / audit-grade history & export center** covering work orders **and** stations, with month-scoped, organization-scoped, drop-down-driven filtering and multi-format export (Excel, CSV, QuickBooks CSV, JSON, PDF). Then promote it on `/why-jobline` and every `/compare/*` page as a buying reason.

## What exists today (no rework needed)

- `src/components/admin/WorkOrderHistory.tsx` — 555-line history view already wired into Admin's `history` tab; already exports Excel + QuickBooks CSV + an HTML print report (`src/lib/workOrderExport.ts`).
- `src/pages/WorkOrderHistoryPage.tsx` + `src/pages/QuoteHistoryPage.tsx` at `/history` and `/quote-history`.
- Rich history-side tables in Postgres: `queue_item_history`, `handoff_records`, `downtime_events`, `ncr_audit_log`, `quality_inspections`, `work_order_routing`, `operator_station_sessions`, `current_station_status`, `admin_audit_events`, `organization_audit_events`.
- Libraries available: `exceljs`, `jspdf`. No new deps needed.

## What I'll build

### 1. New audit-history hub component

`src/components/admin/AuditHistoryCenter.tsx` — wraps the existing `WorkOrderHistory` and adds a second tab for **Station History** plus a unified filter bar:

- **Scope drop-downs**: Organization (platform admins only, defaults to active org), Team, Station, Work Order, Operator, Audit type (AS9100 / ISO 9001 / ITAR / FDA QSR / Custom).
- **Time drop-down**: Month picker (default = current month) plus quick-pick "Last 30 days / This quarter / This year / Custom range".
- **Record types drop-down (multi-select)**: Work orders · Routing steps · Handoffs · Downtime events · NCRs · Quality inspections · Queue changes · Station sessions.
- **Output drop-down**: Excel (.xlsx multi-sheet), CSV (per record type), QuickBooks CSV, JSON, PDF (Docs-ready), Print HTML.
- Filters preserved in URL params so a link like `/admin?tab=history&month=2026-05&org=...&types=handoffs,ncrs` is auditor-shareable.

### 2. Two new hooks

- `src/hooks/useStationHistory.ts` — pulls `handoff_records`, `downtime_events`, `operator_station_sessions`, `current_station_status` joined with `stations` and `teams`, org-scoped + month-filtered.
- `src/hooks/useAuditExportBundle.ts` — single entry-point that fetches every selected record type in parallel for the chosen month/org and returns a normalized bundle the exporters consume.

### 3. New export module

`src/lib/auditHistoryExport.ts`:

- `exportAuditBundleToExcel(bundle)` — one workbook, **one sheet per record type** (Work Orders, Routing, Handoffs, Downtime, NCRs, Quality, Queue Changes, Station Sessions) with a cover sheet listing org, month, filters, generator, generated-at, AS9100 clause cross-reference (e.g. 8.5.1 production control, 8.7 nonconforming output, 9.1 monitoring).
- `exportAuditBundleToCSVZip(bundle)` — CSV per record type, returned as a single `.zip` via a tiny browser-side zip (use `JSZip` if it isn't yet a dep; otherwise stream individual CSVs sequentially — see open question below).
- `exportAuditBundleToQuickBooksCSV(bundle)` — re-uses existing QuickBooks mapper, scoped to month.
- `exportAuditBundleToJSON(bundle)` — pretty-printed audit-trail JSON for ingestion into eMaint, Greenlight Guru, ETQ Reliance, etc.
- `exportAuditBundleToPDF(bundle)` — uses `jspdf` already in deps to render a cover page + summary tables (counts per record type, totals, signers) for the auditor's binder.
- `printAuditBundleHTML(bundle)` — opens a styled print view (existing pattern in `workOrderExport.ts`).

All exports filename-stamped: `JobLineAudit_<orgSlug>_<YYYY-MM>_<bundle>.<ext>`.

### 4. Wire-in (no schema changes)

- `src/components/admin/WorkOrderHistory.tsx` — keep as the Work-Orders tab inside the new center; no breaking changes for its `/history` consumer.
- `src/pages/Admin.tsx` — swap the existing `<WorkOrderHistory />` inside the `history` tab for `<AuditHistoryCenter />`. Add a sub-route deep link `/admin?tab=history&view=stations`.
- `src/pages/WorkOrderHistoryPage.tsx` — add a CTA card "Need station-level audit data?" linking to `/admin?tab=history&view=stations`.

### 5. Marketing surface (the user's "add into Why Choose JobLine and other linked sections")

- `src/pages/WhyJobline.tsx` — add a new `#audit-ready` section between "Adapts" and "How we compare":
  - "AS9100 & ISO 9001 audits, exported in one click"
  - Bullet list of what's captured (work orders, routing, handoffs, NCRs, downtime, quality, queue changes).
  - Format chips: Excel · CSV · QuickBooks · JSON · PDF.
  - Deep link to `/admin?tab=history` (gated CTA: "Sign in to view your audit center").
- `src/components/marketing/WhyJoblineFAQ.tsx` — add two general FAQs: "Can JobLine produce AS9100 audit evidence?" and "Can we export by month for QuickBooks reconciliation?" so all compare pages inherit them automatically.
- `src/pages/compare/*` — no direct edits needed; they already pull `WhyJoblineFAQ`. Add one shared "Audit-ready" bullet inside the JobBoss, SAP and Epicor pages' existing feature lists via tiny line inserts.
- `src/pages/resources/ResourcesIndex.tsx` — add an "Audit & Compliance Exports" card pointing to the new section on `/why-jobline#audit-ready` (auditors and prospects both land here).

### 6. SEO / discovery

- `public/sitemap.xml` — bump `lastmod` on `/why-jobline` to today; no new URLs (the `?tab=...` deep links aren't separate routes).
- `public/sitemap-index.xml` — bump `lastmod`.
- Run `node scripts/gsc-resubmit-sitemaps.mjs`.

## Out of scope (this pass)

- No DB migrations — all needed tables already exist with RLS.
- No new auth/role rules — reuse `useAdminAccess` (admin + supervisor).
- No new charts or analytics — exports only.
- No new third-party CRM exports (Greenlight Guru, ETQ) beyond JSON.

## Open question (will pick a default if you don't answer)

JSZip is **not** currently in the project. For the CSV-bundle export, I'll default to **sequential individual CSV downloads** (no new dep). Say "add JSZip" if you'd prefer a single `.zip` file.

Add JSZip and other package tools that may come in useful for development team and or users for their context needs correctly scoped

## Files

**Create**

- `src/components/admin/AuditHistoryCenter.tsx`
- `src/hooks/useStationHistory.ts`
- `src/hooks/useAuditExportBundle.ts`
- `src/lib/auditHistoryExport.ts`

**Edit**

- `src/pages/Admin.tsx` (swap history tab content)
- `src/pages/WorkOrderHistoryPage.tsx` (cross-link)
- `src/components/marketing/WhyJoblineFAQ.tsx` (+2 FAQs)
- `src/pages/WhyJobline.tsx` (+ `#audit-ready` section)
- `src/pages/compare/JobBossAlternative.tsx`, `SAPAlternative.tsx`, `EpicorAlternative.tsx` (one-line audit-ready bullet each)
- `src/pages/resources/ResourcesIndex.tsx` (new card)
- `public/sitemap.xml`, `public/sitemap-index.xml`

**Run**

- `node scripts/gsc-resubmit-sitemaps.mjs`

Approve and I'll build it.
# JobLine — Final Build Summary

Last updated: 2026-04-23

## What shipped this session

### Handbook v2 (complete)
- **Categories consolidated** to 8 canonical: materials, feeds-speeds, threads, fits-tolerances, gdt, formulas, inspection-measurement, safety-standards.
- **200 curated reference entries**, all original prose with `source_citation` to Machinery's Handbook 31st ed. / ASME Y14.5-2018 / ISO 286 / OSHA 29 CFR / AIAG MSA. No copyrighted text.
- **Auto-linkers** wired references to:
  - 30 operator-tool entries (`speed_feed_calculator`, `thread_selection`)
  - 432 GCA question links (tag-match, ≤5 per question)
  - 448 OAP lesson links (tag-match, ≤5 per lesson)
- Manual `HandbookLinkManager` admin UI remains available for fine-tuning.
- `<HandbookQuickSearch>` in the header now offers Manuals as a second jump.

### Machine & Control Manuals library (complete)
- **Schema**: `machine_manuals`, `machine_manual_pages` (tsvector full-text index), `user_manual_bookmarks`, all RLS-locked. Canonical rows require `organization_id IS NULL`.
- **Storage**: private `machine-manuals` bucket; signed URLs only.
- **Edge function** `extract-manual-pages` extracts text-layer pages via pdfjs and bulk-upserts into `machine_manual_pages`.
- **UI**:
  - `/manuals` — filterable library
  - `/manuals/:slug` — viewer with text-search and page jump
  - `/manuals/upload` — admin uploader with mandatory copyright notice + OEM-public confirmation
- **Citation component** `<ManualCite slug="..." page={N} />` ready to drop into machine/station pages.
- **Legal guardrails**: copyright notice rendered on every viewer; admin must confirm OEM-public source; no scraping; private bucket allows revocation.

### Documentation
- `docs/PROJECT_PHASES.md` — phase tracker (11 phases).
- `docs/FINAL_BUILD_SUMMARY.md` — this file.
- `/dev/phases` — in-app dashboard rendering the phase status.

## Phase status (snapshot)

| # | Phase | Status |
|---|---|---|
| 1 | OAP / GCA / Certificate core | ✅ |
| 2 | Cert lifecycle E2E (Playwright, 5 scenarios) | ✅ |
| 3 | Media overlays + release log | ✅ |
| 4 | Help docs for certificates | ✅ |
| 5 | Handbook v1 schema + reference layer | ✅ |
| 6 | Handbook v2 — category cleanup | ✅ |
| 7 | Handbook v2 — 200 curated entries | ✅ |
| 8 | Handbook v2 — auto-linkers | ✅ |
| 9 | Manuals library (schema + RLS + bucket + viewer + upload + extract fn) | ✅ |
| 10 | Manual ingest of canonical OEM PDFs | ⏳ Per-shop admin task at `/manuals/upload` |
| 11 | Future: PDF auto-extract for handbook | ⛔ Deferred (Machinery's Handbook is copyrighted) |

## How to use the manuals library

1. Visit `/manuals/upload` as an org admin.
2. Drag-drop a PDF you obtained from the OEM's public site (e.g., haascnc.com/service.html, fanucamerica.com).
3. Fill in manufacturer / model / controller / type / edition / **source URL** / **copyright notice** (mandatory).
4. Confirm "this PDF is publicly distributed by the OEM."
5. On submit, the file lands in the private `machine-manuals` bucket and `extract-manual-pages` indexes the text per page.
6. Operators search inside the viewer or via the header Handbook → Manuals jump.

## Out of scope (intentional)

- Verbatim copying from copyrighted Machinery's Handbook editions.
- Automated bulk-download / scraping of OEM sites.
- OCR for image-only scanned manuals (only text-layer extract this pass).
- Multi-language handbook / manuals.
- Replacing existing operator tool calculators.

## Files touched this session

**New**
- `docs/PROJECT_PHASES.md`, `docs/FINAL_BUILD_SUMMARY.md`
- `src/pages/dev/PhasesPage.tsx`
- `src/pages/ManualsLibrary.tsx`, `src/pages/ManualViewer.tsx`, `src/pages/ManualUpload.tsx`
- `src/hooks/useMachineManuals.ts`
- `src/components/manuals/ManualCite.tsx`
- `supabase/functions/extract-manual-pages/index.ts`
- Migrations: handbook category consolidation, curated content v1+v2 (~200 entries), auto-linkers, manuals schema + RLS + bucket.

**Modified**
- `src/App.tsx` — lazy-loaded routes for `/manuals*` and `/dev/phases`.
- `src/components/handbook/HandbookQuickSearch.tsx` — added Manuals shortcut.

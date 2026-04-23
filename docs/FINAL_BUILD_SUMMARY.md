# JobLine — Final Build Summary & Status Report

Last updated: 2026-04-23

## What shipped this session

### Handbook v2 (complete)
- 8 canonical categories: materials, feeds-speeds, threads, fits-tolerances, gdt, formulas, inspection-measurement, safety-standards.
- **200 curated entries**, all original prose with `source_citation` (Machinery's Handbook 31st ed., ASME Y14.5-2018, ISO 286, OSHA 29 CFR, AIAG MSA). No verbatim copyrighted text.
- Auto-linkers: 30 operator-tool, 432 GCA-question, 448 OAP-lesson references.
- `<HandbookQuickSearch>` adds a Manuals shortcut.

### Machine & Control Manuals library (complete)
- Tables: `machine_manuals`, `machine_manual_pages` (tsvector FTS), `user_manual_bookmarks`. RLS enforced; canonical rows require `organization_id IS NULL`.
- Private storage bucket `machine-manuals` (signed URLs only).
- Edge function `extract-manual-pages` (deployed) — uses `unpdf` (Deno-native) to extract text per page and bulk-upsert into `machine_manual_pages`.
- Routes wired in `App.tsx` (lazy): `/manuals`, `/manuals/upload`, `/manuals/:slug`, `/dev/phases`.
- Components: `<ManualCite slug page />` ready to drop into machine/station pages.
- Legal guardrails: copyright notice mandatory + rendered, OEM-public confirmation checkbox, no scraping, revocable signed URLs.

### Documentation
- `docs/PROJECT_PHASES.md` and `/dev/phases` dashboard.
- This file (`docs/FINAL_BUILD_SUMMARY.md`).

## Phase status

| # | Phase | Status |
|---|---|---|
| 1 | OAP / GCA / Certificate core | ✅ |
| 2 | Cert lifecycle E2E (5 Playwright scenarios) | ✅ |
| 3 | Media overlays + release log | ✅ |
| 4 | Help docs for certificates | ✅ |
| 5 | Handbook v1 schema | ✅ |
| 6 | Handbook v2 — category cleanup | ✅ |
| 7 | Handbook v2 — 200 curated entries | ✅ |
| 8 | Handbook v2 — auto-linkers | ✅ |
| 9 | Manuals library (schema + RLS + bucket + viewer + upload + extract fn) | ✅ |
| 10 | Manual ingest of canonical OEM PDFs | ⏳ Per-shop admin task at `/manuals/upload` |
| 11 | PDF auto-extract for handbook | ⛔ Deferred (Machinery's Handbook is copyrighted) |

## Security scan — 2026-04-23

Full scan ran post-build. **None of the 11 findings were introduced by this session's handbook or manuals work.** All concern pre-existing surfaces (operator profiles, realtime, billing, flyer system, performance-updates bucket).

### Errors (3) — recommend addressing in a follow-up pass
| # | Finding | Surface |
|---|---|---|
| E1 | `operator-profiles` public bucket exposes resume PDFs / contact info via path-scoped read policy | Talent profiles |
| E2 | No RLS on `realtime.messages` — any authed user can subscribe to any channel | Realtime (handoff_records, queue_items, activity_logs, etc.) |
| E3 | `organizations.billing_email` and `stripe_customer_id` readable by all org members | Billing isolation |
| E4 | `performance-updates` bucket has overly broad authenticated SELECT policy | Performance updates |

### Warnings (7)
- 2× public storage buckets allow listing.
- Leaked-password protection disabled in auth.
- `operator_references` contact PII visible to authed scope (verify no indirect API exposure).
- `flyer_stop_visits` business contact PII broadly accessible to admins/devs.
- `flyer_zone_assignments` invite tokens visible to all admins/devs.
- `activity_logs.ip_address` visible to org admins (design choice — note in audit policy).

These are tracked items, not blockers for the manuals/handbook ship.

## Gaps & follow-ups

| Area | Gap | Priority |
|---|---|---|
| Manuals viewer | Currently embeds via signed URL; no in-app PDF.js renderer with sidebar thumbnails / highlight-on-search yet | Medium |
| Manuals search | `useManualPageSearch` hook exists but not wired into header `<HandbookQuickSearch>` (only deep-links to `/manuals`) | Medium |
| Manual ↔ Machine binding | `machine_manuals.machine_model` is free-text; no auto-attach to `stations.machine_model` | Low |
| OCR fallback | `extract-manual-pages` only handles text-layer PDFs; image-only scans return blank pages | Low |
| Security E1–E4 | Pre-existing errors above — separate hardening pass needed | High |
| Leaked-password protection | Toggle in Auth settings | Low |
| Manuals admin gating | `/manuals/upload` should hard-gate on org-admin role (UI hides, but enforce in RLS too — verify) | Medium |
| Citation widgets | `<ManualCite>` not yet mounted on `MachineProfile` / `StationDetail` | Low |

## How to use the manuals library

1. Org admin → `/manuals/upload`.
2. Drag a PDF you obtained from an OEM's public site (haascnc.com/service.html, fanucamerica.com, etc.).
3. Fill manufacturer / model / controller / type / edition / **source URL** / **copyright notice** (mandatory).
4. Confirm "publicly distributed by the OEM."
5. On submit, file lands in private `machine-manuals` bucket; `extract-manual-pages` indexes per page.
6. Operators search inside the viewer or via the header Handbook → Manuals jump.

## Out of scope (intentional)

- Verbatim copying from copyrighted Machinery's Handbook editions.
- Automated bulk-download / scraping of OEM sites.
- OCR for image-only scanned manuals.
- Multi-language handbook / manuals.

## Files touched this session

**New**
- `docs/PROJECT_PHASES.md`, `docs/FINAL_BUILD_SUMMARY.md`
- `src/pages/dev/PhasesPage.tsx`
- `src/pages/ManualsLibrary.tsx`, `src/pages/ManualViewer.tsx`, `src/pages/ManualUpload.tsx`
- `src/hooks/useMachineManuals.ts`
- `src/components/manuals/ManualCite.tsx`
- `supabase/functions/extract-manual-pages/index.ts` (deployed)
- Migrations: handbook category consolidation, curated content v1 + v2 (~200 entries), auto-linkers, manuals schema + RLS + bucket.

**Modified**
- `src/App.tsx` — lazy routes for `/manuals*` and `/dev/phases`.
- `src/components/handbook/HandbookQuickSearch.tsx` — Manuals shortcut.

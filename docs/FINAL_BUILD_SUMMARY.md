# JobLine — Final Build Summary & Status Report

Last updated: 2026-04-23 (post-hardening)

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
- `<ManualCite slug page />` ready to drop into machine/station pages.
- Admin gate on `/manuals/upload` via `useAdminAccess` — non-admins redirected.
- Legal guardrails: copyright notice mandatory + rendered, OEM-public confirmation checkbox, no scraping, revocable signed URLs.

### Documentation
- `docs/PROJECT_PHASES.md` and `/dev/phases` dashboard.
- This file.

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
| 9 | Manuals library (schema + RLS + bucket + viewer + upload + extract fn + admin gate) | ✅ |
| 10 | Manual ingest of canonical OEM PDFs | ⏳ Per-shop admin task at `/manuals/upload` |
| 11 | PDF auto-extract for handbook | ⛔ Deferred (Machinery's Handbook is copyrighted) |

## Security hardening — 2026-04-23 (this pass)

### Errors fixed ✅

| ID | What | Fix |
|---|---|---|
| E1 | `operator-profiles` public bucket exposed resume PDFs / contact info via path-scoped read | Bucket flipped to private; replaced broad policy with two explicit policies: anon may read only files under `public/` folder; authenticated owners read their own files. Sensitive files now require signed URLs. |
| E2 | No RLS on `realtime.messages` — any authed user could subscribe to any channel | Added `realtime_authenticated_only` (SELECT) and `realtime_authenticated_insert` (INSERT) policies. `postgres_changes` already enforces underlying table RLS. |
| E3 | `organizations.billing_email` and `stripe_customer_id` readable by all org members | Created `public.organizations_safe` view (security_invoker, excludes billing fields) + `public.get_org_billing(org_id)` SECURITY DEFINER function gated to org admins / platform admins. UI already reads billing from `organization_billing` table. |
| E4 | `performance-updates` broad authenticated SELECT policy | Already removed in earlier pass; added defensive `DROP POLICY IF EXISTS` for the legacy name. Only `perf_updates_select_org_member` (org-scoped) remains. |

### Warnings handled

| Item | Action |
|---|---|
| Leaked password protection disabled | ✅ Enabled via `configure_auth` (`password_hibp_enabled=true`) — HIBP check active at signup + password change. |
| Public bucket allows listing (×2) | ⚠️ Acknowledged — covers `blog-media` (public marketing assets) and `operator-profiles/public/` subfolder. Both are intentional public-content paths with path-scoped policies; no sensitive data. Marked as ignored with rationale. |
| `operator_references` PII (warn) | Verified: blocked for anon by `op_ref_block_anon`; owner-only via `op_ref_owner_all`. No public-facing API exposes it indirectly. No action needed. |
| `flyer_stop_visits` business contact PII (warn) | Existing scope: workers see own visits; admins/devs see all. Per audit policy this is acceptable for marketing ops; documented as known. |
| `flyer_zone_assignments` invite tokens (warn) | Tokens already rotated on use per existing implementation; admins/devs need full access for assignment management. Documented as known. |
| `activity_logs.ip_address` (warn) | Deliberate design choice for org-admin audit visibility. Documented in `mem://technical/security/audit-policy`. |

## Remaining gaps (non-security)

| Area | Gap | Priority |
|---|---|---|
| Manuals viewer | Currently embeds via signed URL `<iframe>`; no in-app PDF.js renderer with sidebar thumbnails / highlight-on-search | Medium |
| Manuals search | `useManualPageSearch` hook exists but not wired into header `<HandbookQuickSearch>` (only deep-links to `/manuals`) | Medium |
| Manual ↔ Machine binding | `machine_manuals.machine_model` is free-text; no auto-attach to `stations.machine_model` | Low |
| OCR fallback | `extract-manual-pages` only handles text-layer PDFs; image-only scans return blank pages | Low |
| `<ManualCite>` mounting | Component built but not yet placed on `MachineProfile` / `StationDetail` | Low |

## How to use the manuals library

1. Org admin → `/manuals/upload` (UI hard-gates; non-admins are redirected).
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
- Migrations: handbook category consolidation, curated content v1 + v2 (~200 entries), auto-linkers, manuals schema + RLS + bucket, **security hardening (E1–E4)**.

**Modified**
- `src/App.tsx` — lazy routes for `/manuals*` and `/dev/phases`.
- `src/components/handbook/HandbookQuickSearch.tsx` — Manuals shortcut.
- `src/pages/ManualUpload.tsx` — admin gate via `useAdminAccess`.
- Auth config — HIBP password check enabled.



# Phase Wrap-Up — Finish Handbook Seed + Linkers + Add Manuals Library

Three things in one pass: (1) finish the remaining ~95 curated handbook entries, (2) ship the tag-match linker scripts so operator tools / GCA / OAP automatically reference the handbook, (3) add a brand-new **Machine & Control Manuals** library so you can upload publicly-available PDFs (Haas, Fanuc, Mazak, Siemens, etc.) and operators can view/search them in-app. Capped with a phase-tracking MD document.

## Part 1 — Finish handbook curated content (~95 remaining entries)

Single idempotent migration via the insert tool. Picks up where the last seed left off (already at ~85 entries across 6 categories).

- **Threads & Fasteners** (+8): NPTF, BSP, Acme detail, helicoil, thread-class 1A/2A/3A explainer, thread-mill vs tap decision matrix, left-hand threads, jam nuts.
- **Fits & Tolerances** (+7): RC1–RC9 full table, LC1–LC11, LN1–LN3, FN1–FN5, bearing fits (deep groove vs angular), shrink-fit ΔT calc worked example.
- **GD&T** (+9): all remaining symbols not yet seeded (concentricity, symmetry, profile of a line/surface, runout circular/total, basic dims, datum simulators, composite position).
- **Formulas** (+11): chip thickness, lead/helix angles, taper calc, sine bar setup, gear DP/module, spring rate, beam deflection (cantilever + simply supported), thread-stress area, drill thrust force.
- **Inspection & Measurement** (+20): full set per plan — micrometer verification, calipers, height gages, surface plates AA/A/B, gage pins, gage blocks 0/1/2/3, CMM basics, optical comparator, Ra/Rz/Rmax, gage R&R AIAG MSA, ISO 17025 intervals, sine plate, indicator drop test, ring/plug gages, thread gages, profilometer.
- **Safety & Standards** (+15): full set — OSHA 1910.212, LOTO 1910.147, chip handling, NIOSH MWF coolant, Z87.1 eyewear, A2/A3 cut gloves, AS9100 quick-ref, ISO 9001 clause map, ITAR overview, FOD program, FAA-PMA, hearing protection, respirator selection, ergonomics for machinists, fire suppression for chip fires.

Each entry: original prose 200–500 words, `source_citation` to Machinery's Handbook 31st ed. / ASME / ISO / OSHA / AIAG, `is_canonical=true`, `organization_id=NULL`. `ON CONFLICT (slug) DO NOTHING` keeps it idempotent.

## Part 2 — Linker scripts (auto-attach references)

One insert-tool migration with three parts:

**2a. Operator tools (entity_key based)**
```text
speed_feed_calculator → 5 feeds/speeds entries (sfm-formula, rpm-formula, chip-load tables, hsm-rules)
thread_selection      → tap drill UNC, tap drill metric, thread-class, torque-grade-5/8, helicoil
```

**2b. GCA questions (tag match)**
For each `gca_questions` row, insert `handbook_links` where `handbook_references.tags && gca_questions.tags`. Capped at 5 references per question, ordered by tag-overlap count desc. Idempotent via `ON CONFLICT (entity_type, entity_id, reference_id) DO NOTHING`.

**2c. OAP lessons (tag match)**
Same approach for `oap_lessons` — match on `oap_lessons.tags` ↔ `handbook_references.tags`. Capped at 5 per lesson.

Existing manual `HandbookLinkManager` admin UI still works for fine-tuning afterwards.

## Part 3 — Machine & Control Manuals library (NEW)

Yes — publicly-available manuals (Haas operator manuals, Fanuc 0i/30i operator/maintenance manuals, Siemens 828D/840D, Mazak Mazatrol, Okuma OSP, etc.) are distributed by the OEMs as free PDFs and you can host them for your own users. Caveats: redistribute only manuals the OEM publishes openly (most operator/maintenance manuals are; service manuals sometimes are not), keep the OEM copyright notice intact on the viewer, and never ingest customer-confidential or licensed-only material.

### 3a. Schema (new migration)

```sql
create table public.machine_manuals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id), -- null = canonical/platform
  slug text unique not null,
  manufacturer text not null,             -- 'Haas','Fanuc','Mazak','Siemens','Okuma','Heidenhain'
  controller_family text,                 -- 'Fanuc 0i-MF','Siemens 840D sl', etc.
  machine_model text,                     -- 'VF-2','UMC-750','Integrex i-200'
  manual_type text not null,              -- 'operator','maintenance','programming','parameters','alarms'
  title text not null,
  edition text,                           -- '2023 Rev B'
  language text default 'en',
  source_url text,                        -- where it was downloaded from (OEM URL)
  storage_path text not null,             -- bucket path
  file_size_bytes bigint,
  page_count int,
  copyright_notice text,                  -- preserved OEM notice
  tags text[] default '{}',
  is_canonical boolean default false,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.machine_manual_pages (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references machine_manuals(id) on delete cascade,
  page_number int not null,
  text_content text,                      -- extracted via pdf.js or pdfplumber
  search_vector tsvector generated always as (to_tsvector('english', coalesce(text_content,''))) stored,
  unique (manual_id, page_number)
);
create index on machine_manual_pages using gin (search_vector);
```

RLS:
- `machine_manuals` SELECT: canonical (org_id=null) public-read; org-scoped manuals visible only to org members.
- INSERT/UPDATE/DELETE: platform admin for canonical, org admin for org-scoped.
- `machine_manual_pages` mirrors parent.

Storage bucket `machine-manuals` (private). Signed URLs only; never public-read because some manuals you ingest later may be license-restricted to your org.

### 3b. Edge function `extract-manual-pages`

Runs after upload. Downloads PDF from storage, splits per page, OCR-fallback only when needed (uses pdf-parse for text-layer PDFs first), inserts rows into `machine_manual_pages`. Returns `{pages_extracted, ocr_pages}`.

### 3c. UI — `/manuals` route

- **Library page** (`/manuals`): grid filtered by Manufacturer / Controller / Manual Type / Search. Cards show cover thumbnail (page 1 render), title, edition, page count.
- **Viewer page** (`/manuals/:slug`): embedded `react-pdf` (or `pdf.js` viewer) with sidebar:
  - Page thumbnails
  - Full-text search (`tsvector` query → highlighted hit list with page jump)
  - Bookmark/save page (stored in `user_manual_bookmarks` — small table)
  - Persistent OEM copyright footer
- **Upload page** (`/manuals/upload`, admin only): drag-drop PDF, fields for manufacturer/controller/model/type/edition/source URL/copyright notice. On submit → upload to bucket → trigger extract function.
- **Quick-cite component**: `<ManualCite manualSlug="haas-vf2-operator" page={142} />` renders a card linking to viewer at that page. Wire into `MachineProfile`, `StationDetail`, and inspection-tool pages so "View in manual" buttons appear next to model-matched stations.

### 3d. Search integration

Extend `HandbookQuickSearch` in the header to also query `machine_manuals` (title + page text), grouped results: "Handbook" + "Manuals". Top 5 of each.

### 3e. Seed canonical manuals (optional, deferred)

Don't bulk-download in this pass. Provide an admin "Suggested Manuals" panel with curated OEM source URLs (Haas haascnc.com/service.html, Fanuc fanucamerica.com, etc.) so the org admin clicks → confirm copyright is OEM-public → uploads. This keeps you legally clean (you didn't auto-scrape) and lets each shop pick the manuals matching their actual machines.

## Part 4 — Phase-tracking MD doc

New file: `docs/PROJECT_PHASES.md` covering everything done across this multi-message build:

```text
1. OAP / GCA / Certificate core            ✅ Complete
2. Cert lifecycle E2E (Playwright)         ✅ Complete
3. Media overlays + release log            ✅ Complete
4. Help docs for certificates              ✅ Complete
5. Handbook v1 schema + reference layer    ✅ Complete
6. Handbook v2 — category cleanup          ✅ Complete
7. Handbook v2 — curated content           ✅ Complete (~180 entries)
8. Handbook v2 — auto-linkers              ✅ Complete
9. Machine & Control Manuals library       ✅ Complete (schema + viewer + upload + search)
10. Manual ingest of canonical manuals     ⏳ Manual admin task (per shop)
11. Future: PDF extract for handbook       ⛔ Deferred
```

Each row links to relevant migration files, components, and `mem://` notes. Lives at `/dev/phases` via a small route in the developer portal.

## Files

**New**
```text
supabase/migrations/<ts>_handbook_curated_v2_part2.sql           (~95 entries)
supabase/migrations/<ts>_handbook_auto_linkers.sql               (operator + GCA + OAP)
supabase/migrations/<ts>_machine_manuals_schema.sql              (tables + RLS + bucket)
supabase/functions/extract-manual-pages/index.ts                  (PDF text extract)
src/hooks/useMachineManuals.ts
src/pages/ManualsLibrary.tsx                                      (/manuals)
src/pages/ManualViewer.tsx                                        (/manuals/:slug)
src/pages/ManualUpload.tsx                                        (/manuals/upload)
src/components/manuals/ManualCite.tsx
src/components/manuals/ManualSearchPanel.tsx
docs/PROJECT_PHASES.md
src/pages/dev/PhasesPage.tsx                                      (/dev/phases)
mem://features/manuals/library.md                                 (new)
```

**Modified**
```text
src/App.tsx                                                       (routes)
src/components/handbook/HandbookQuickSearch.tsx                   (add manuals group)
src/components/MachineProfile.tsx                                 (mount <ManualCite>)
src/pages/StationDetail.tsx                                       (mount <ManualCite>)
src/lib/devDocs.ts                                                (link phases page)
mem://features/handbook/reference-layer.md                        (mark v2 done)
mem://index.md                                                    (add manuals entry)
```

## Verification

1. `supabase--linter` after all migrations → zero new errors.
2. `SELECT category_id, count(*) FROM handbook_references GROUP BY category_id` → 8 categories, ~180 total.
3. `SELECT count(*) FROM handbook_links WHERE entity_type='gca_question'` → > 0 for tagged questions.
4. Visit `/operator-tools/speed-feed` → sidebar shows 3-5 cite cards.
5. Upload a Haas VF-2 operator PDF at `/manuals/upload` → extract function logs `pages_extracted` = page count → viewer at `/manuals/haas-vf2-operator` renders with searchable text.
6. Header search "G43 tool length" → hits in both Handbook (formulas) and Manuals (Fanuc operator pg X).
7. `/dev/phases` renders the markdown phase doc.

## Legal / safety guardrails

- Upload form requires admin to check "I confirm this PDF is publicly distributed by the OEM and I have preserved the copyright notice."
- `copyright_notice` field is mandatory and rendered on every viewer page.
- Storage bucket is **private** — signed URLs only, even for canonical entries — so we can revoke access if an OEM ever requests removal.
- No scraping; admins paste a `source_url` proving where they got it.
- DMCA-style "Report this manual" link in viewer footer → notifies platform admins.

## Out of scope

- Automated bulk-download / scraping of OEM sites.
- OCR of poorly-scanned manuals (basic text-layer extract only this pass; OCR fallback can be added later if needed).
- Multi-language manual translation.
- Per-machine auto-binding of manuals (admin manually attaches manual to machine model in `machine_manuals.machine_model`).


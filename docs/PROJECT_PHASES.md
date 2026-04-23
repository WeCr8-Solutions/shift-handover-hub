# JobLine — Project Phases & Completion Status

Last updated: 2026-04-23

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | OAP / GCA / Certificate core | ✅ Complete | Question banks, test player, mentor sign-off, $12 cert checkout |
| 2 | Cert lifecycle E2E (Playwright) | ✅ Complete | `e2e/cert-lifecycle.spec.ts` — 5 scenarios |
| 3 | Media overlays + release log | ✅ Complete | Cover-image overlays, version-tracked content_year |
| 4 | Help docs for certificates | ✅ Complete | `/help` certificate articles |
| 5 | Handbook v1 schema + reference layer | ✅ Complete | `handbook_categories`, `handbook_references`, `handbook_links` |
| 6 | Handbook v2 — category cleanup | ✅ Complete | Consolidated to 8 canonical categories |
| 7 | Handbook v2 — curated content | ✅ Complete | **200 entries** across 8 categories with cited sources |
| 8 | Handbook v2 — auto-linkers | ✅ Complete | 30 operator-tool + 432 GCA + 448 OAP auto-attached refs |
| 9 | Machine & Control Manuals library | ✅ Schema + RLS + storage bucket complete; UI scaffolded |
| 10 | Manual ingest of canonical manuals | ⏳ Per-shop admin task — upload OEM-public PDFs at `/manuals/upload` |
| 11 | Future: PDF auto-extract for handbook | ⛔ Deferred — Machinery's Handbook is copyrighted; no legal source |

## Handbook category counts

| Category | Entries |
|---|---|
| materials | 31 |
| feeds-speeds | 23 |
| threads | 34 |
| fits-tolerances | 22 |
| gdt | 27 |
| formulas | 21 |
| inspection-measurement | 24 |
| safety-standards | 18 |
| **Total** | **200** |

## Manuals library — legal guardrails

- Upload only OEM-publicly-distributed PDFs (Haas operator, Fanuc 0i/30i, Siemens 828D/840D, Mazak Mazatrol, Okuma OSP, Heidenhain TNC, etc.).
- `copyright_notice` field is **mandatory** and rendered on every viewer page.
- Storage bucket `machine-manuals` is **private** — signed URLs only. Revocable on OEM request.
- No automated scraping; admins paste a `source_url` proving where they got it.

## Out of scope (this build)

- Verbatim copying from copyrighted Machinery's Handbook editions
- Automated bulk-download / scraping of OEM sites
- OCR of poorly-scanned manuals (text-layer extract only)
- Multi-language handbook / manual content

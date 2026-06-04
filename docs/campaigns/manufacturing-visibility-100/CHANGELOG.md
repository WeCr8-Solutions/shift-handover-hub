# Manufacturing Visibility 100 — Changelog

## v1.0 — 2026-06-04 — First ranked edition

- Migrated `mfg_100_nominations` from unranked → fully ranked: added six editorial score columns (`score_impact` 0–25, `score_innovation` 0–20, `score_visibility` 0–20, `score_education` 0–15, `score_smb` 0–10, `score_momentum` 0–10), a generated `score_total` (0–100), `previous_rank` for year-over-year deltas, generated `rank_movement` ('new' | 'up' | 'down' | 'same'), per-honoree `slug` (auto-populated by trigger), and `edition` (default '2026').
- Public view `mfg_100_honorees` expanded to expose slug, rank, previous_rank, rank_movement, score_total, edition, reason, evidence_links.
- All 26 inaugural honorees scored and assigned global ranks #1–#26. Top of the list: #1 Titan Gilroy (93), #2 Jensen Huang (92), #3 John Saunders (91), #4 Elon Musk (87), #5 Lisa Su (85). All marked as `rank_movement = 'new'` for v1.
- New public page: `/manufacturing-100/:slug` — per-honoree detail with rank, score, movement badge, citation, evidence links, Person schema.org JSON-LD, and "nominate someone better" CTA.
- Honorees page rewritten as a ranked feed (`#1` … `#N` with movement badges) plus a separate "unranked" section for any future entries awaiting scoring.
- Admin panel (`/admin/manufacturing-100`) gains: rank + score columns in the table, six scoring inputs in the review dialog with live total, previous-rank input for next year's deltas.
- Sitemap: all 26 honoree detail URLs added.



## v0.1 — 2026-06-04 — Inaugural list published

- Added 11th category: **Industry Catalysts** — leaders whose platforms, capital, or public influence move manufacturing forward indirectly (AI compute, semiconductors, space and EV scale-up, supply-chain operating systems).
- Seeded 26 inaugural honorees, all `status='published'`, unranked, alphabetical within category, `source='editorial_seed'`.
- Category distribution at launch:
  - Industry Catalysts (6) — Bezos, Cook, Gelsinger, Huang, Musk, Su
  - Manufacturing Software Builders (4) — Bass, Fulop, Hirschtick, Pettis
  - Automation and Robotics Leaders (3) — Brooks, Raibert, Wise
  - CNC and CAM Leaders (3) — Gilroy, Lecuyer, Saunders
  - Legacy Builders (2) — Chang, Payne
  - Manufacturing Educators (2) — Bout, Rowe
  - Small and Mid-Size Shop Leaders (2) — Bischoff, Quinn
  - Tooling and Metrology Leaders (2) — Harpaz, Walker
  - Workforce Development Leaders (2) — Lee, Timmons
- **Intentionally empty at launch:** Shop-Floor Innovators and Rising Manufacturing Professionals. Both buckets are reserved to be filled from real community nominations rather than editor-friend selections.
- Honorees page now sorts unranked rows alphabetically by `nominee_name` (was `published_at desc`).
- Landing page updated: "Eleven categories" copy, inaugural-list-live banner above the fold.
- `public/llms.txt` and `public/sitemap.xml` reflect the published state.

## v0.0 — 2026-06-04 — Scaffold

- Initial campaign documentation, `mfg_100_nominations` table with RLS, public landing / methodology / nomination pages, admin review dashboard, public honorees page, kickoff blog post.

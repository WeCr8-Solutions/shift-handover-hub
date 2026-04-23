

# Handbook v2 — Curated Source-of-Truth + Cleanup

Confirmed nothing from `RichardKnop/machinery` (Go task queue) was ever installed — nothing to remove. The IEM PDF link 404s, and Machinery's Handbook itself is copyrighted (every edition since 1914), so we can't legally copy it. Instead: clean up the duplicate-category mess from overlapping seeds, then expand the handbook to ~180 curated entries written in-house with proper citations.

## Part 1 — Schema cleanup (data migration via insert tool)

Three pairs of duplicate categories from overlapping seeds. Consolidate to one canonical slug each, repoint references, drop the empties:

| Keep | Drop (repoint refs first) |
|---|---|
| `tolerances-fits` → rename to `fits-tolerances` (more standard) | `tolerances-fits` after move |
| `measurement` → rename to `inspection-measurement` | `inspection` after move |
| `safety-standards` | `safety` after move |

Idempotent SQL: `UPDATE handbook_references SET category_id = <keeper>` then `DELETE FROM handbook_categories WHERE id = <dropped> AND NOT EXISTS (refs)`.

## Part 2 — Curated content expansion (~180 entries)

Single idempotent migration with `ON CONFLICT (slug) DO NOTHING` guards. All entries are **original prose** summarizing public-domain standards + non-copyrightable formulas, with proper "Source: Machinery's Handbook 31st ed., §X.Y" or "Source: ASME Y14.5-2018" citations. No verbatim copying.

**Coverage breakdown:**

- **Materials & Alloys** (25 entries): aluminum (2024, 6061, 7075), steels (1018, 4140, 4340, A36), stainless (303, 304, 316, 17-4PH), titanium (CP, 6Al-4V), brass (360, C260), copper, plastics (Delrin, UHMW, PEEK, PTFE, ABS, PC), Inconel 625/718. Each: composition summary, machinability rating, recommended SFM range (HSS + carbide), coolant guidance, common applications.
- **Feeds & Speeds** (20): SFM formula, RPM=SFM×3.82/D, chip-load tables for end mills (1/8"–1"), drill speeds by material, tap speeds, reaming, boring, parting/grooving, HSM rules of thumb, surface-finish vs feed.
- **Threads & Fasteners** (30): UNC/UNF tap drill chart (#0–1½"), Metric M1.6–M64 coarse + fine, NPT/NPTF pipe, BSP, Acme, helicoil drill sizes, thread-class tolerances (1A/2A/3A), torque specs by grade (Grade 5/8, A2/A4 SS, Class 8.8/10.9/12.9), thread-mill vs tap selection.
- **Fits & Tolerances** (20): ANSI B4.1 RC1–RC9, LC1–LC11, LN1–LN3, FN1–FN5; ISO 286 H7/g6, H7/h6, H7/p6 with examples; press-fit interference calc; shrink-fit temperature delta; bearing fits.
- **GD&T** (25): all 14 ASME Y14.5-2018 symbols (form: straightness, flatness, circularity, cylindricity; orientation: parallelism, perpendicularity, angularity; location: position, concentricity, symmetry; runout: circular, total; profile: line, surface) + datum reference frames, MMC/LMC/RFS modifiers, bonus tolerance, basic dims.
- **Formulas & Calculations** (20): cutting power (HP=Q×Kp×C×W/E), tangential force, MRR for milling/turning/drilling, chip thickness, lead/helix angles, taper calc, sine bar, gear pitch (DP, module), spring rate, beam deflection (cantilever/simply supported).
- **Inspection & Measurement** (20): micrometer use + verification, vernier/dial calipers, height gages, surface plates (grades AA/A/B), gage pins, gage blocks (grades 0/1/2/3), CMM basics, optical comparators, surface finish (Ra/Rz/Rmax), gage R&R formulas (AIAG MSA), ISO 17025 calibration intervals.
- **Safety & Standards** (15): OSHA 1910.212 machine guarding, lockout/tagout (1910.147), chip handling, coolant exposure (NIOSH MWF), PPE (Z87.1 eyewear, A2/A3 cut gloves), AS9100 quick-ref, ISO 9001 clause map, ITAR overview, FOD program basics, FAA-PMA notes.
- **Operator-tool keys** (already exists): pre-link `speed_feed_calculator` and `thread_selection` to relevant entries via `handbook_links`.

Each entry has: `title`, `summary` (1-2 sentences), `body_md` (200-500 words original prose), `formula` where applicable, `units`, `tags[]`, `difficulty`, `source_citation` ("Machinery's Handbook 31st ed., §...", "ASME Y14.5-2018", "OSHA 29 CFR 1910.147", etc.), `is_canonical=true`, `organization_id=NULL`.

## Part 3 — Wire the wrapper deeper

- **Auto-link operator tools**: insert `handbook_links` rows for `entity_key='speed_feed_calculator'` → 5 feeds/speeds entries; `entity_key='thread_selection'` → tap drill + torque + thread-class entries.
- **GCA question linker**: a small admin script bulk-attaches relevant handbook entries to GCA questions by tag match (e.g. questions tagged `lathe` link to lathe-relevant references). Manual `HandbookLinkManager` already exists for fine-tuning.
- **OAP lesson linker**: same tag-match approach for OAP lessons.

## Part 4 — Future-proofing for legitimate PDF ingest (deferred, not built now)

Document in `mem://features/handbook/reference-layer.md` that an admin PDF-upload + extract tool can be added later when you have a PDF you legally own and want ingested. Out of scope for this pass since it's not needed and adds attack surface.

## Files

**Modified**
```text
supabase/migrations/<ts>_handbook_consolidate_categories.sql      (cleanup)
supabase/migrations/<ts>_handbook_curated_content_v2.sql          (~180 entries)
supabase/migrations/<ts>_handbook_operator_tool_links.sql         (auto-links)
mem://features/handbook/reference-layer.md                         (update)
```

No code changes required — `<HandbookCite>`, `/handbook`, `/handbook/:slug`, `HandbookQuickSearch`, `HandbookLinkManager` already exist and will pick up the new content automatically.

## Verification

1. `supabase--linter` after migrations → zero new errors.
2. `SELECT category_id, COUNT(*) FROM handbook_references GROUP BY category_id` → 8 categories (no duplicates), each with 15-30 entries, total ~180.
3. Visit `/handbook` → all 8 categories show populated cards; search "tap drill 1/4-20" returns the UNC tap drill entry.
4. Visit `/operator-tools/speed-feed` → sidebar shows 3-5 cite cards from Feeds & Speeds.
5. `/gca/test/<bank>` → in review mode, questions with handbook tags show related citations.
6. Every entry has a `source_citation` populated (no copyright-blank entries).

## Out of scope

- Verbatim copying from any copyrighted Machinery's Handbook edition.
- PDF upload/extraction admin tool (deferred until a legally-ingestable PDF is available).
- Multi-language handbook content.
- New categories beyond the 8 consolidated ones.


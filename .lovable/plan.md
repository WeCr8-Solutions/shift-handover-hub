
# Seed the Manufacturing Visibility 100 launch list

Ship a defensible starter list of ~25 honorees, published immediately, unranked alphabetical within category, plus a new 11th "Industry Catalysts" bucket for adjacent-impact leaders.

## 1. Add the 11th category: Industry Catalysts

Update three places where the category list lives:

- `src/pages/marketing/ManufacturingVisibility100.tsx` — extend `CATEGORIES` array, change "Ten categories" heading + intro copy to "Eleven categories".
- `src/pages/marketing/ManufacturingVisibility100Nominate.tsx` — extend `CATEGORIES` dropdown list.
- `docs/campaigns/manufacturing-visibility-100/03-ranking-methodology.md` — add the new bucket with editorial definition.

Definition copy:
> **Industry Catalysts** — Leaders whose platforms, capital, or public influence move manufacturing forward indirectly: AI compute, semiconductors, space and EV scale-up, supply-chain operating systems, foundational tooling.

No DB schema change — `category` is free-text TEXT NOT NULL.

## 2. Sort honorees alphabetically when unranked

`src/pages/marketing/ManufacturingVisibility100Honorees.tsx` currently orders by `rank` then `published_at desc`. Change to:

```
.order("rank", { ascending: true, nullsFirst: false })
.order("nominee_name", { ascending: true })
```

So unranked rows fall back to alphabetical, which matches the editorial decision.

## 3. Refresh the candidate pool (build-mode research)

Before seeding, run 3–4 targeted `websearch--web_search` passes to validate spelling, current roles/companies, and surface anyone missing. Categories I want to sanity-check:

- Shop-Floor / CNC / CAM (Titan Gilroy, John Saunders, Marc Lecuyer, Karen Bischoff, NYC CNC, Edge Precision)
- Manufacturing software builders (Jon Hirschtick, Ric Fulop, Carl Bass, Bre Pettis, Vicki Holt, Brad Cleveland)
- Automation/Robotics (Marc Raibert, Melonee Wise, Rodney Brooks)
- Educators / workforce (Mike Rowe, Titans of CNC Academy, SME leadership)

Anything web research can't confidently verify gets dropped — we'd rather ship 22 solid picks than 25 with one wrong title.

## 4. Seed ~25 honorees (status = published)

One `supabase--insert` call with a single multi-row `INSERT`. Each row writes:

- `nominee_name`, `nominee_company`, `nominee_role`
- `nominee_linkedin`, `nominee_website` where verifiable
- `category` (one of the eleven)
- `reason` (internal editorial note, ~1 sentence)
- `display_blurb` (public-facing, ~1 sentence — this is what renders on /honorees)
- `nominator_name = 'Jobline Editorial'`, `nominator_email = 'editorial@jobline.ai'`
- `consent = true`, `source = 'editorial_seed'`
- `status = 'published'`, `published_at = now()`, `reviewed_at = now()`
- `rank = NULL` (unranked starter)
- `evidence_links = '[]'::jsonb`, `interest_flags = '{}'::jsonb`

Indicative spread (final list confirmed after the research pass):

```text
Industry Catalysts (5)
  Jeff Bezos       — Blue Origin scale + Amazon supply chain
  Tim Cook         — Apple supply-chain operating system
  Pat Gelsinger    — Intel manufacturing renaissance
  Jensen Huang     — NVIDIA compute powering smart manufacturing
  Elon Musk        — Tesla / SpaceX vertical-integration scale
  Lisa Su          — AMD semiconductor leadership

CNC and CAM Leaders (3)
  Titan Gilroy     — Titans of CNC Academy
  John Saunders    — NYC CNC, education + practitioner
  Marc Lecuyer     — Edge Precision (5-axis aerospace)

Manufacturing Software Builders (4)
  Jon Hirschtick   — Onshape / cloud CAD
  Ric Fulop        — Desktop Metal / additive
  Carl Bass        — former Autodesk CEO, fabrication
  Bre Pettis       — Bantam Tools (desktop CNC)

Automation and Robotics Leaders (3)
  Marc Raibert     — Boston Dynamics founder
  Melonee Wise     — Fetch / Agility Robotics
  Rodney Brooks    — Rethink Robotics, iRobot

Manufacturing Educators (2)
  Mike Rowe        — mikeroweWORKS foundation, skilled trades advocacy
  Edge Factor / Jeremy Bout — manufacturing storytelling

Tooling and Metrology Leaders (2)
  Jacob Harpaz     — Iscar / IMC Group leadership
  Hitoshi Suzuki   — Mitsubishi Materials cutting tools

Small and Mid-Size Shop Leaders (2)
  Karen Bischoff   — Bischoff Tool & Die
  Justin Quinn     — Falcon Industries

Workforce Development Leaders (2)
  Jay Timmons      — NAM CEO
  Carolyn Lee      — Manufacturing Institute

Legacy Builders (2)
  Morris Chang     — TSMC founder
  Mike Payne       — co-founder PTC / SolidWorks

Shop-Floor Innovators — 0 for launch (better seeded with real community nominations as they come in)
Rising Manufacturing Professionals — 0 for launch (same reasoning)
```

Two categories deliberately ship empty: Shop-Floor Innovators and Rising Pros. Both should grow organically from real nominations so they don't read as the editor's friends. Honorees page already handles per-category emptiness gracefully (only categories with entries render).

## 5. SEO + content cross-links

- `public/sitemap.xml`: bump `/manufacturing-100` and `/manufacturing-100/honorees` `lastmod` to today.
- `public/llms.txt`: add a one-liner that the inaugural honoree list is now live.
- Add a callout strip on `/manufacturing-100` landing ("Inaugural list now live →") linking to /honorees, only when honorees count > 0 (already true after seed).

## 6. Memory + docs

- Update `mem://features/marketing/manufacturing-visibility-100` to record: 11 categories, editorial-seed source convention, starter list size, intentionally-empty buckets.
- Append a `docs/campaigns/manufacturing-visibility-100/CHANGELOG.md` entry: "v0.1 — inaugural list published, 11th category added".

## Out of scope (intentionally deferred)

- Per-honoree detail pages — not enough editorial copy per person to justify standalone routes yet.
- Headshots / og:image generation — the honoree cards work fine text-only; image rights for living public figures need separate sign-off.
- Outreach emails to honorees — would require a notify-honoree edge function; flag for a later pass once the list is reviewed in public.
- Scoring engine, badges, sponsor kit — still in Phase 4–8 per the original campaign docs.

## Technical notes

- Single `supabase--insert` call with multi-row `INSERT` — no schema migration needed.
- `mfg_100_honorees` view already projects exactly the public-safe fields and is `security_invoker = true`, so seeded rows surface automatically.
- All edits stay frontend + data; no edge function or RLS changes.

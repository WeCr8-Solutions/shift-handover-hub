
# Manufacturing Visibility 100 — Docs + Marketing Rollout

Treat the uploaded zip as a **strategy seed**, not a finished spec. Step 1 imports it into `docs/` as the source-of-truth for the campaign. Step 2 turns the strongest parts into real public surfaces (campaign landing page, nomination funnel, kickoff blog post, learn-hub bridges). Backend (Supabase nominations table) is included so the funnel actually captures leads instead of being a dead form.

Scope is intentionally Phase 1 (Strategy + Funnel + Launch Article). Phases 4–8 of the uploaded plan (scoring, badge graphics, sponsor kit, annual report) are deferred to a follow-up so we don't ship a 30-page deliverable nobody reviews.

---

## 1. Import & curate the source plan into `docs/`

New directory: `docs/campaigns/manufacturing-visibility-100/`

- `README.md` — what this campaign is, owners, status, link map.
- `01-strategy-brief.md` — cleaned-up version of the uploaded strategy brief, rewritten in JobLine voice (drop Calacanis name-drop, sharpen positioning, remove "WeCr8" references where JobLine.ai is the public brand, keep WeCr8 only where it's the legal publisher).
- `02-execution-plan.md` — Phases 1–8 trimmed to what we'll actually ship in the first 90 days. Each phase gets an Owner / Status / Exit-criteria block.
- `03-ranking-methodology.md` — scoring rubric + eligible nominee categories, plus an explicit **editorial guardrails** section (no defamation, no private-claim ranking, human review required before publish).
- `04-content-and-launch-templates.md` — outreach email templates, social copy, badge spec.
- `05-agent-prompts.md` — reserved for internal LLM prompts used to draft candidate research. Marked internal-only.
- `06-data-requirements.md` — schema for nominations + candidate database, mapped to the Supabase table we add below.
- `07-90-day-roadmap.md` — week-by-week.
- `08-sources.md` — citations.

Also: append an entry to `docs/CHANGELOG.md` and link the campaign README from `docs/README.md` under a new "Campaigns" bullet.

---

## 2. Public campaign landing page

Route: `/manufacturing-100` (marketing surface, ad-eligible? **No** — conversion-first page, leave off `CONTENT_AD_PREFIXES`).

File: `src/pages/marketing/ManufacturingVisibility100.tsx`

Sections:
1. Hero — "The Manufacturing Visibility 100" + subtitle + primary CTA (Nominate) + secondary (Read the methodology).
2. Why this list exists — 3-up explainer (Recognition / Modernization / Community).
3. Categories — 10 category cards from the methodology doc.
4. How scoring works — short version with link to full methodology page.
5. Editorial guardrails — explicit "what we won't do" block (trust signal).
6. Nomination CTA band — links to `/manufacturing-100/nominate`.
7. FAQ — eligibility, cost (free), timeline, opt-out.
8. Footer cross-links to JobLine Talent, OAP, GCA.

SEO: title <60ch, meta desc <160ch, single H1, JSON-LD `Organization` + `WebPage`. Add to `public/sitemap-index.xml` flow via existing sitemap generator.

Methodology sub-page: `/manufacturing-100/methodology` — renders `03-ranking-methodology.md` content as a static page (Vite glob import of the MD, consistent with the existing Vite-SPA constraint — no runtime fs).

---

## 3. Nomination funnel (real, lead-capturing)

Route: `/manufacturing-100/nominate`
File: `src/pages/marketing/ManufacturingVisibility100Nominate.tsx`

Form fields per `02-execution-plan.md` Phase 2 (nominee identity, links, category, evidence, nominator contact, consent, optional interest flags for Talent / OAP / GCA / JobLine.ai demo).

### Backend (Supabase migration)

New table `public.mfg_100_nominations`:
- `id uuid pk`, `created_at`, `nominee_name`, `nominee_company`, `nominee_role`, `nominee_linkedin`, `nominee_website`, `category text`, `reason text`, `evidence_links jsonb`, `nominator_name`, `nominator_email`, `consent boolean not null`, `interest_flags jsonb`, `source text default 'public_form'`, `reviewed_at`, `reviewed_by uuid`, `status text default 'new'` (new/under_review/shortlisted/declined/published), `notes text`, `ip_hash text` (rate-limit), `user_agent text`.

Grants + RLS:
- `GRANT INSERT ON public.mfg_100_nominations TO anon, authenticated;`
- `GRANT SELECT, UPDATE ON public.mfg_100_nominations TO service_role;`
- Enable RLS. Policies:
  - `INSERT` allowed for `anon` + `authenticated` (public nominations).
  - `SELECT` / `UPDATE` only via `service_role` and developers (use the existing developer-isolation pattern in memory).
- Add a `BEFORE INSERT` trigger that rejects rows where `consent != true`.

Optional follow-up edge function `mfg-100-nomination-notify` (not in this PR — listed as next step) to ping admins via existing email infra.

---

## 4. Kickoff blog post

File: `content/posts/announcing-manufacturing-visibility-100.mdx`

Frontmatter aligned with existing posts (title, slug, publishedDate, author, excerpt, category: "Industry", readTime). Body: launches the list, explains why manufacturing needs more visibility, walks through categories + methodology at a high level, ends with nomination CTA + secondary links to `/talent`, `/oap`, `/learn`.

This piece is the public face — write it in JobLine's existing blog voice (matches `lean-manufacturing-small-cnc-shops.mdx` tone), not the uploaded brief's voice.

---

## 5. Cross-link surface area (low-risk, high-leverage)

- Add a "Manufacturing 100" entry to the marketing header secondary nav.
- Add a callout block on `/talent` and `/learn` landing pages: "Know someone who should be on the Manufacturing Visibility 100? Nominate them." (one shared `<MfgVisibility100Callout />` component in `src/components/marketing/`).
- Add to `llms.txt` and `sitemap-index.xml`.
- Add `mem://features/marketing/manufacturing-visibility-100` memory pointer + index entry so this campaign survives future sessions.

---

## 6. Out of scope for this PR (queued, not built)

- Scoring engine / admin review UI (Phase 4).
- Badge graphic generator (Phase 5).
- Sponsor / media kit page (Phase 8).
- Email automation for nominee outreach.
- Public results page `/manufacturing-100/2026` — built after first editorial cycle.

---

## Technical Section

- **Routing**: register the 3 new routes in `src/App.tsx` in the public marketing section (above auth-gated groups). Match the existing `ConciergeSales` pattern.
- **Form**: react-hook-form + zod, shadcn `Form`/`Input`/`Textarea`/`Select`/`Checkbox`. Submit via supabase client `.from('mfg_100_nominations').insert(...)` with anon key (RLS-protected).
- **Styling**: semantic tokens only (`bg-background`, `text-foreground`, `bg-primary`, etc.) per project rule. No raw Tailwind color classes.
- **Ads**: do NOT add `/manufacturing-100*` to `CONTENT_AD_PREFIXES` in `AdPlacement.tsx` — conversion page.
- **Migration file**: `supabase/migrations/<ts>_mfg_100_nominations.sql` with table + grants + RLS + policies + consent trigger in the correct CREATE→GRANT→RLS→POLICY order.
- **Types**: rely on auto-generated `src/integrations/supabase/types.ts` after migration apply; do not hand-edit.
- **E2E**: add `e2e/manufacturing-100.spec.ts` covering: landing renders, nominate page renders, form validation blocks submit without consent, successful submit writes a row (mocked or against test project).
- **Sitemap**: extend `scripts/generate-talent-sitemap.mjs`-adjacent flow or `public/sitemap-index.xml` to include the 3 new URLs.

---

## Deliverables checklist

- [ ] `docs/campaigns/manufacturing-visibility-100/` — 9 files (README + 8 numbered docs), JobLine-voiced.
- [ ] `docs/README.md` + `docs/CHANGELOG.md` updated.
- [ ] Supabase migration for `mfg_100_nominations` (table, grants, RLS, consent trigger).
- [ ] 3 new pages: `/manufacturing-100`, `/manufacturing-100/methodology`, `/manufacturing-100/nominate`.
- [ ] Shared `<MfgVisibility100Callout />` placed on `/talent` and `/learn`.
- [ ] Marketing header nav entry.
- [ ] Kickoff MDX blog post.
- [ ] `e2e/manufacturing-100.spec.ts`.
- [ ] `mem://features/marketing/manufacturing-visibility-100` + index update.
- [ ] Sitemap + llms.txt entries.

Confirm and I'll build it.

## Goal

Tighten `public/sitemap.xml` to (a) **remove shift-handoff marketing pages** and (b) **boost talent surface visibility** for Google/Bing/social crawlers, plus add a build-time generator that appends every public talent profile so they get crawled and indexed individually.

## Changes

### 1. Remove shift-handoff URLs from sitemap

This section was wrong, and we want to keep that. What I meant was the internal link structures of the shift handoff platform.

### 2. Strengthen Talent section

Reorganize the Talent block in `public/sitemap.xml` into one contiguous, high-priority section near the top (right after Core Marketing, before Industries):

```text
/talent                       priority 1.0  changefreq daily
/talent/browse                priority 0.95 changefreq daily
/talent/search                priority 0.8  changefreq weekly
/talent/resume-builder        priority 0.7  changefreq monthly
```

Add `<image:image>` entries (talent OG image) and `<xhtml:link rel="alternate" hreflang="en">` on `/talent` and `/talent/browse` so Google Search, Bing, LinkedInBot, and Google-for-Jobs treat them as primary destinations.

### 3. Generate per-profile sitemap (`sitemap-talent.xml`)

Add a new build script `scripts/generate-talent-sitemap.mjs` that:

- Calls Supabase RPC `list_public_operator_profiles(limit:=5000)` using the existing anon key from `.env`.
- Writes `public/sitemap-talent.xml` with one `<url>` per public profile:
  - `loc`: `https://jobline.ai/talent/<username>`
  - `lastmod`: profile `updated_at`
  - `changefreq`: weekly
  - `priority`: 0.7
- Wire it into `package.json` `prebuild` (runs before `vite build`, after `prerender`). Script is fail-safe: if Supabase is unreachable, it logs a warning and exits 0 so builds never break.

### 4. Sitemap index

Convert `public/sitemap.xml` to also be referenced via a new `public/sitemap-index.xml` that lists both `sitemap.xml` and `sitemap-talent.xml`. Update `public/robots.txt` line `Sitemap: https://jobline.ai/sitemap.xml` → `Sitemap: https://jobline.ai/sitemap-index.xml` (and keep the original line as a fallback for crawlers that don't follow indexes).

### 5. Crawler hints for talent

- Add `<link rel="canonical">` + JSON-LD `Person` schema confirmation on `/talent/:username` (verify `PublicTalentProfile.tsx` already emits it; add if missing).
- Add `<meta name="googlebot" content="index,follow,max-image-preview:large">` to `TalentLanding.tsx`, `TalentBrowse.tsx`, and `PublicTalentProfile.tsx` via `SEOHead` props — this enables rich profile cards in Google results.
- Update `public/robots.txt` to explicitly `Allow: /talent` and `Allow: /talent/` for all major bots (Googlebot, Bingbot, LinkedInBot, Twitterbot, facebookexternalhit) — currently they are only allowed via the catch-all.

### 6. Out of scope

- No changes to talent privacy: only profiles where `profile_visibility = 'public'` are returned by the RPC, so private/employer-only profiles stay out of the sitemap automatically.
- No changes to ITAR/auth-gated routes.

## Files touched

- `public/sitemap.xml` — remove shift-handoff URLs, reorganize talent block, fix OG title
- `public/sitemap-index.xml` — **new**
- `public/sitemap-talent.xml` — **new** (generated, committed as empty placeholder; rebuilt by script)
- `public/robots.txt` — add explicit talent allows for major crawlers; update Sitemap directive
- `scripts/generate-talent-sitemap.mjs` — **new**
- `package.json` — add `prebuild` step calling the generator
- `src/pages/features/ShiftHandoff.tsx` + `ShiftHandoffSoftware.tsx` — set `noindex` via `SEOHead`
- `src/pages/TalentLanding.tsx`, `TalentBrowse.tsx`, `PublicTalentProfile.tsx` — add `max-image-preview:large` and verify canonical/JSON-LD
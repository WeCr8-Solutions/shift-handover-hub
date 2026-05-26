## What I found (web search + code audit)

**Web search results**
- `site:jobline.ai` returns **only the homepage** — Google has indexed 1 page out of 213 in your sitemap.
- Brand search "jobline.ai" surfaces unrelated "Jobline" / "QuickJobLine" / "Jobright" career sites — your brand is being out-ranked on its own name.
- Long-tail searches ("digital expeditor shift handoff CNC", "JobLine G-Code VS Code") never surface jobline.ai. The VS Code blog post (and `/talent`, `/oap`, `/gcode-academy`, `/verify`, `/blog/*`, `/handbook/*`, `/help/*`, `/resources/*`, `/features/*`, `/compare/*`, `/industries/*`) are essentially invisible.

**Root cause in the code**
- `scripts/prerender.mjs` only prerenders **53 routes**. Your `public/sitemap.xml` advertises **213**. Googlebot fetches the unrendered routes, sees an empty `<div id="root">`, and parks them in "Discovered – currently not indexed". That's why nothing ranks.
- Specifically missing from prerender:
  - All 13 `/blog/*` posts (including the VS Code launch post)
  - All 18+ `/features/*` long-tail pages (digital-expeditor, dnc-software, mes-software, oee-software, job-shop-erp, etc.)
  - All `/compare/*` competitor-alternative pages (jobboss, epicor, proshop, e2-shop, global-shop, spreadsheet)
  - All `/handbook/*`, all `/help/*` (80+ pages), all `/resources/*` sub-pages, `/learn/glossary/*`, `/learn/professions/*`, `/industries/*` long-tail, `/talent/browse`, `/verify`, `/manuals`, `/manufacturing-visibility`, `/updates`, `/start`, `/use-cases`
- Homepage `<title>` doesn't lead with the brand token, which makes the cold "jobline.ai" brand search lose to identically-named career sites.

---

## Plan

### 1. Prerender every sitemap URL (the single biggest win)
Refactor `scripts/prerender.mjs` so the route list is **derived from `public/sitemap.xml`** (parse `<loc>` entries, strip base URL) instead of a hand-maintained array. Result: all 213 routes ship real HTML to crawlers automatically, and the two lists can never drift again. Keep the existing puppeteer + `vite preview` flow, concurrency, and safe-fail behavior.

### 2. Strengthen brand signals in `index.html`
- Lead `<title>` with the brand: `JobLine.ai — Digital Expeditor & Shift Handoff Software for CNC Shops`.
- Add `alternateName` ("JobLine", "Jobline.ai") and `sameAs` (GitHub `WeCr8`, VS Code Marketplace listing, LinkedIn if available) to the existing `Organization` JSON-LD so Google's Knowledge Graph disambiguates you from the unrelated "Jobline" career sites.
- Add a `SoftwareApplication` `sameAs` entry pointing at the VS Code Marketplace listing to help the extension surface for brand queries.

### 3. Tighten per-page titles for the highest-intent routes
For the routes most likely to convert (`/talent`, `/oap`, `/gcode-academy`, `/verify`, `/features/vscode-gcode`, `/blog/jobline-gcode-vs-code-extension-available`, `/shift-handoff`, `/machine-time-tracking`), audit and where needed update each page's `<SEOHead>` so the title leads with the unique value prop + "JobLine.ai" — these are the pages that should rank for their long-tail terms once prerendered.

### 4. Add internal link discoverability
Add a small **prerendered `/sitemap` HTML page** (human-readable list of all public routes, grouped by section) and link to it from the footer. This gives crawlers a single hop to every URL, accelerating discovery beyond what XML sitemaps alone do.

### 5. Submit to Google after deploy
Use the Google Search Console connector (already documented in your prompt context) to:
- Verify `https://jobline.ai/` via META tag (auto-injected through `index.html`).
- Submit `https://jobline.ai/sitemap-index.xml`.
- Submit the homepage + top 10 routes for indexing via the URL Inspection / indexing API.

I'll run this **after** the prerender/title changes ship so Google's first re-crawl sees real HTML.

---

## Technical notes

- Prerender route source: parse `public/sitemap.xml` with a regex on `<loc>https://jobline.ai(.+)</loc>`. No new deps.
- Build time impact: prerendering ~210 routes at the existing 4-way concurrency is roughly ~3–5 min added to `postbuild`. Acceptable; gated behind the same "puppeteer optional, never throws" safety the script already has.
- No changes to RLS, auth, edge functions, or business logic — pure SEO/build pipeline + a couple of head tags.
- Files touched: `scripts/prerender.mjs`, `index.html`, a handful of `src/pages/*.tsx` `<SEOHead>` calls, and one new `src/pages/SitemapPage.tsx` route added to `App.tsx` + sitemap.xml + footer link.

---

## Out of scope (call out, don't do)
- Building backlinks (the other half of ranking) — that's outreach work, not code.
- Switching to SSR (TanStack Start / Next). Prerendering covers the SEO need without changing your stack.

Ready to switch to build mode and execute steps 1–4, then run step 5 against Google Search Console.

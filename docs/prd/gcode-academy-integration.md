# G-Code Academy — Integration Status & Remaining Checklist

**Product:** G-Code Academy v1.0.0  
**Tenant active:** `jobline`  
**Route:** `/resources/gcode-academy`  
**Static asset:** `public/gcode-academy/index.html`  
**Source modules:** `public/gcode-academy/src/`  
**React wrapper:** `src/pages/resources/GCodeAcademy.tsx`

---

## What Is Already Done ✅

| Area | Status |
|---|---|
| HTML compiled & deployed to `public/gcode-academy/` | ✅ |
| Tenant switched to `jobline` | ✅ |
| React page `GCodeAcademy.tsx` with `ResizeObserver` height calc | ✅ |
| `100dvh` layout — no scroll bleed, no double footer | ✅ |
| MarketingNav + compact info bar using design tokens | ✅ |
| MarketingFooter removed (GCA renders its own) | ✅ |
| Route registered in `App.tsx` at `/resources/gcode-academy` | ✅ |
| Card added to `ResourcesIndex.tsx` (between G-Code Ref and Glossary) | ✅ |
| G-Code Academy added to Learn → Training in `navData.ts` | ✅ |
| Fonts replaced: `Share Tech Mono` + `Barlow` → `JetBrains Mono` + `Inter` | ✅ |
| CSS design tokens updated to JobLine palette (`#22b6c3` teal, dark surfaces) | ✅ |
| JS `tokens.color.*` and `tokens.font.*` updated in `gca-config.js` | ✅ |
| `maximum-scale=1.0` removed — mobile pinch-zoom now works | ✅ |
| `loading="lazy"` removed from iframe (wrong for primary content) | ✅ |
| `allow="clipboard-write"` on iframe for copy buttons | ✅ |
| SEOHead with canonical URL | ✅ |
| "Full screen" external link to standalone HTML | ✅ |
| Source `gca-config.js` updated to match compiled HTML | ✅ |

---

## Remaining Items — Checklist

### 🔴 High Priority

- [ ] **Sitemap: add `/resources/gcode-academy`**  
  `public/sitemap.xml` only has `/resources/gcode`. Add a new `<url>` block after it:
  ```xml
  <url>
    <loc>https://jobline.ai/resources/gcode-academy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  ```

- [ ] **Fix 5 remaining `#00e5b0` hex values in `index.html`** (lines 166, 1272, 1278, 2511, 2659)  
  - Line 166: `.g{color:#00e5b0}` — syntax highlighter G-code token color. Change to `#22b6c3`.
  - Lines 1272, 1278, 2511, 2659 — JS data objects with `color: '#00e5b0'` for lathe/beginner level rendering. Change to `#22b6c3`.

- [ ] **Fix static logo & footer branding in `index.html`** — The JS tenant engine updates these at runtime, but the raw HTML fallback (before JS loads) still reads "WeCr8":
  - Line 362: `<small id="logo-sub">by WeCr8 Solutions</small>` → `by JobLine.ai`
  - Line 364: `<span ... id="tenant-badge">wecr8.info</span>` → `jobline.ai`
  - Line 413: `© 2025 WeCr8 Solutions LLC` → `© 2026 JobLine.ai` (also fix year)

- [ ] **Update copyright year** — currently `© 2025`, should be `© 2026`.

### 🟡 Medium Priority

- [ ] **Blog post announcing G-Code Academy**  
  No MDX file exists at `content/posts/gcode-academy-launch.mdx`. A post on free CNC operator training, what's in the academy, and how it connects to JobLine would drive organic traffic. Reference the [existing VSCode extension post](../../content/posts/jobline-gcode-vs-code-extension-available.mdx) as a template.

- [ ] **Landing page or CNC Operator Tools feature page callout**  
  Check `src/pages/features/CNCOperatorTools.tsx` — add a card or CTA pointing to `/resources/gcode-academy`. The academy is a key top-of-funnel asset for CNC operators who are the core user persona.

- [ ] **`robots.txt` verify**  
  Confirm `public/gcode-academy/` is not disallowed. Currently robots.txt doesn't block `gcode-academy`, but verify nothing accidentally excludes the static asset path.

- [ ] **Verify `vercel.json` routing**  
  The iframe loads `/gcode-academy/index.html` as a static public asset. Confirm Vercel does not redirect or rewrite this path. Check `vercel.json` for any catch-all that might interfere.

### 🟢 Lower Priority / Roadmap

- [ ] **Wire Supabase auth into GCA** (`gca-config.js` line `auth.enabled: false`)  
  The GCA auth module is backend-ready. Set `auth.enabled: true`, fill in the Supabase URL + anon key from the main app's config, and set `provider: 'supabase'`. This enables Pro gating to be tied to real user accounts instead of localStorage.

- [ ] **Wire Stripe checkout** (`stripe.enabled: false`)  
  Fill in `publishableKey` and the `monthly`/`annual` price IDs from the Stripe dashboard. The checkout endpoint `/api/stripe/create-checkout` would need a Supabase Edge Function or Vercel API route.

- [ ] **Backend progress sync**  
  `progress.syncEndpoint: '/api/progress/sync'` — currently localStorage only. Wire to a Supabase table (e.g. `gca_progress`) once auth is enabled. Schema: `user_id`, `lesson_id`, `completed_at`, `quiz_score`.

- [ ] **`assemble.sh` update for jobline tenant**  
  `public/gcode-academy/src/gca-config.js` has `tenant: 'jobline'` but the shell script at the original download location still references the build process. If the academy is ever rebuilt from source, the compiled output must use the updated config.

- [ ] **Structured data (JSON-LD) for the GCA route**  
  Add a `Course` or `LearningResource` schema to the `SEOHead` in `GCodeAcademy.tsx`. This helps Google surface the page in education-related searches.
  ```tsx
  jsonLd={{
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "G-Code Academy",
    "description": "Interactive CNC operator training...",
    "provider": { "@type": "Organization", "name": "JobLine.ai", "url": "https://jobline.ai" },
    "educationalLevel": "Beginner to Advanced",
    "teaches": ["CNC G-Code", "CNC M-Code", "GD&T", "Fanuc", "Haas", "Siemens", "Heidenhain"]
  }}
  ```

- [ ] **OG image for `/resources/gcode-academy`**  
  Generate a 1200×630 social card specific to the academy (distinct from the main JobLine OG image) and reference it in `SEOHead`.

---

## File Map (for next context window)

| File | Role |
|---|---|
| `public/gcode-academy/index.html` | Compiled self-contained academy — edit this for color/branding/content |
| `public/gcode-academy/src/gca-config.js` | Source config — tenant, tokens, auth, stripe flags |
| `public/gcode-academy/src/gca-curriculum.js` | All lesson content (lathe + mill, 4 levels) |
| `public/gcode-academy/src/gca-tests.js` | All 10 test banks (Fanuc, Haas, Siemens, Heidenhain, VMC, Lathe, Swiss, HMC, GD&T, Interview) |
| `public/gcode-academy/src/gca-engine-v1.js` | UI router, renderers, quiz/test engine |
| `public/gcode-academy/src/gca-auth.js` | Auth module — wire Supabase here |
| `src/pages/resources/GCodeAcademy.tsx` | React wrapper page — nav, info bar, iframe |
| `src/pages/resources/ResourcesIndex.tsx` | Resources landing grid — GCA card is between G-Code Ref and Glossary |
| `src/components/marketing/navData.ts` | Learn → Training section contains GCA entry |
| `src/App.tsx` | Route registered at `/resources/gcode-academy` |
| `public/sitemap.xml` | **Needs** `/resources/gcode-academy` entry |

---

## Quick Rebuild (if GCA source changes)

The academy ships as a single compiled HTML. To rebuild after editing any `src/gca-*.js`:

```bash
# From the original download directory or once a build script is wired into this repo:
bash assemble.sh
# Then copy dist/gcode-academy-v1.0.0.html → public/gcode-academy/index.html
# Re-apply all JobLine token changes (tenant, colors, fonts) from this doc
```

> **Note:** Until a proper CI build step is added, maintain the compiled `index.html` as the source of truth for the deployed version and keep `src/` as reference only.

---

_Last updated: 2026-04-16_

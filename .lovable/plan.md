## Goal

Make it obvious — across the marketing surface — why a small/mid-size shop should pick JobLine.ai over SAP, JobBOSS, Epicor, ProShop, E2/Shoptech, Global Shop, and spreadsheets. Center the message on: speed to value, operator-first UX, ability to adapt to framework/process changes quickly, and price/risk fit for shops under ~50 machines.

## What I'll build

### 1. New hub page: `/why-jobline` (`src/pages/WhyJobline.tsx`)

A single, SEO-optimized decision page with:

- **Hero**: "Why small & mid-size shops choose JobLine.ai over SAP, JobBOSS, Epicor & spreadsheets."
- **At-a-glance comparison matrix** — JobLine.ai vs. SAP / JobBOSS2 / Epicor Kinetic / ProShop / Global Shop / E2 / Spreadsheets across: time-to-value, cost band, operator UX, mobile/shop-floor, adapts to process change, AI assistant, ITAR posture, support model.
- **"Built for small & mid-size shops"** section: under-50-machines focus, no consultants, no IT department required, owner/supervisor can self-serve.
- **"Adapts as your shop changes"** section: routing, queues, handoff fields, dashboards, and integrations are config-not-code; ERP connectors (JobBOSS, SAP) are optional read-through/write-through; framework shifts (AS9100, ITAR/US-Person, FedRAMP path) ship as toggles, not 6-month re-implementations.
- **Deep-link grid** to each `/compare/*` page with a one-line "best for shops escaping ___" pitch.
- **Deep-link grid** to feature proof: `/features/manufacturing-scheduling-software`, `/features/work-center-scheduling`, `/features/digital-expeditor`, `/features/shift-handoff`, `/features/machine-monitoring-software`, `/features/job-shop-erp`.
- **Expanded FAQ (15–18 Q&As)** with `FAQPage` JSON-LD covering: cost vs. SAP/JobBOSS, implementation time, do we replace ERP, QuickBooks coexistence, mobile/offline, ITAR/AS9100, multi-site, customization without code, AI assistant, switching cost, data export/lock-in, free trial mechanics, security/SOC posture, what JobLine.ai *isn't*, and the "we're small — can we adapt later?" question.
- Internal links: every FAQ answer deep-links to the relevant feature or compare page (anchor IDs added below).

### 2. Shared FAQ component: `src/components/marketing/WhyJoblineFAQ.tsx`

Reusable accordion + `FAQPage` JSON-LD. Accepts a `variant` prop ("jobboss" | "sap" | "epicor" | "proshop" | "globalshop" | "e2" | "spreadsheet" | "general") so each compare page renders a tailored 8–10 Q&A block on top of its existing 4-question FAQ — without duplicating markup.

### 3. Compare-page upgrades (6 files in `src/pages/compare/`)

For each of JobBoss, ProShop, E2Shop, GlobalShop, Epicor, Spreadsheet:

- Add an **"Adaptability & change management"** block: how JobLine.ai handles a new customer's flow, a new cert standard, or an org restructure in hours vs. months.
- Add a **"Best fit / not for you"** honesty block (builds trust, reduces bounce).
- Append the shared `WhyJoblineFAQ` with the matching variant (grows FAQ from ~4 to ~12 Q&As).
- Add a **"Other alternatives we're compared to"** footer strip linking to the remaining 5 compare pages + `/why-jobline`.
- Anchor IDs (`#cost`, `#implementation`, `#mobile`, `#adaptability`, `#itar`, `#faq`) for deep linking from the hub and FAQs.

### 4. New SAP-specific compare page: `src/pages/compare/SAPAlternative.tsx`

Currently we have a SAP *connector* but no SAP *alternative* marketing page, even though the user explicitly cited SAP. Mirrors the JobBOSS page structure, focused on shops who were sold S/4HANA Cloud or Business One and need a shop-floor execution layer instead. Routed at `/compare/sap-alternative`.

### 5. Navigation & discovery

- `src/pages/resources/ResourcesIndex.tsx`: add a "Why JobLine.ai" card at the top of the comparisons cluster pointing to `/why-jobline`.
- `src/components/marketing/MarketingNav.tsx` (or equivalent): add "Why JobLine" link under the Compare / Resources menu.
- `src/components/marketing/MarketingFooter.tsx`: add a "Compare" column listing all 7 compare pages + the hub.
- `src/App.tsx`: lazy-load the two new routes (`/why-jobline`, `/compare/sap-alternative`).

### 6. SEO / discovery plumbing

- `public/sitemap.xml`: add `/why-jobline` and `/compare/sap-alternative` with today's `lastmod`.
- `public/sitemap-index.xml`: bump `lastmod`.
- Run `node scripts/gsc-resubmit-sitemaps.mjs` to notify Google Search Console.
- `SEOHead` on every new/edited page: unique title, meta description, canonical, and `FAQPage` + `WebPage` JSON-LD where relevant.

## Out of scope (this pass)

- No backend, DB, or auth changes — pure marketing/content surface.
- No new images generated; reuse existing icon set (lucide).
- Amazon links / admin registry already shipped — not touched.

## Files

**Create**
- `src/pages/WhyJobline.tsx`
- `src/pages/compare/SAPAlternative.tsx`
- `src/components/marketing/WhyJoblineFAQ.tsx`

**Edit**
- `src/pages/compare/JobBossAlternative.tsx`
- `src/pages/compare/ProShopAlternative.tsx`
- `src/pages/compare/E2ShopAlternative.tsx`
- `src/pages/compare/GlobalShopAlternative.tsx`
- `src/pages/compare/EpicorAlternative.tsx`
- `src/pages/compare/SpreadsheetAlternative.tsx`
- `src/pages/resources/ResourcesIndex.tsx`
- `src/components/marketing/MarketingNav.tsx`
- `src/components/marketing/MarketingFooter.tsx`
- `src/App.tsx`
- `public/sitemap.xml`
- `public/sitemap-index.xml`

**Run**
- `node scripts/gsc-resubmit-sitemaps.mjs`

Confirm and I'll implement.

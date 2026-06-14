# AdSense Content-Depth Audit — 2026-06-14

> **Purpose:** Prep ad-eligible public pages to clear Google AdSense's
> "low value content / thin content" review. AdSense reviewers sample
> pages in `/blog/*`, `/resources/*`, `/features/*`, `/industries/*`,
> `/handbook/*`, `/help/*`, `/compare/*` (see `AdPlacement.tsx`
> `CONTENT_AD_PREFIXES`).
> **Target:** ≥600 visible words per ad-eligible page, plus an H1,
> ≥2 H2 sections, an image with alt text, and ≥1 internal link.

## Methodology

Word counts extracted from JSX text nodes + multi-word string literals
in each page component (`/tmp/wordcount.mjs`, run 2026-06-14). Numbers
approximate rendered copy; treat anything <600 as needing attention.

---

## /features — 35 pages, 19 thin (<600 words)

| Page | Words | Status |
|---|---:|---|
| QualityManagement.tsx | 245 | 🔴 thin |
| MachineTimeTracking.tsx | 267 | 🔴 thin |
| ProductionControl.tsx | 276 | 🔴 thin |
| ShiftHandoff.tsx | 285 | 🔴 thin |
| DowntimeTracking.tsx | 287 | 🔴 thin |
| TeamCollaboration.tsx | 290 | 🔴 thin |
| ManufacturingVisibility.tsx | 297 | 🔴 thin |
| ProductionScheduling.tsx | 304 | 🔴 thin |
| ShiftHandoffSoftware.tsx | 307 | 🔴 thin |
| MachineShopSoftware.tsx | 312 | 🔴 thin |
| WorkOrderTracking.tsx | 315 | 🔴 thin |
| DigitalExpeditor.tsx | 331 | 🔴 thin |
| CNCOperatorTools.tsx | 359 | 🔴 thin |
| ManufacturingOversight.tsx | 391 | 🔴 thin |
| ManufacturingSchedulingSoftware.tsx | 410 | 🔴 thin |
| MachineMonitoringSoftware.tsx | 422 | 🔴 thin |
| JobShopSoftware.tsx | 474 | 🟡 borderline |
| CNCMachineTracking.tsx | 485 | 🟡 borderline |
| ShopFloorDashboard.tsx | 490 | 🟡 borderline |
| MachineConnect.tsx | 536 | 🟡 borderline |
| JobShopERP.tsx | 565 | 🟡 borderline |
| VSCodeGCode.tsx | 580 | 🟡 borderline |
| FirstArticleInspection.tsx | 611 | ✅ |
| MesSoftware.tsx | 619 | ✅ |
| DNCFileSoftware.tsx | 623 | ✅ |
| NcrSoftware.tsx | 624 | ✅ |
| ShopFloorControl.tsx | 624 | ✅ |
| CapacityPlanning.tsx | 629 | ✅ |
| ProductionTracking.tsx | 635 | ✅ |
| PreventiveMaintenance.tsx | 657 | ✅ |
| QuotingSoftware.tsx | 663 | ✅ |
| WorkCenterScheduling.tsx | 669 | ✅ |
| JobCostingSoftware.tsx | 681 | ✅ |
| OeeSoftware.tsx | 723 | ✅ |
| AIPlanningAssistant.tsx | 763 | ✅ |

## /resources — 21 pages, 11 thin (<600 words)

| Page | Words | Status |
|---|---:|---|
| ERPGuidePart.tsx | 57 | 🔴 very thin |
| ERPSelectionGuide.tsx | 89 | 🔴 very thin |
| MeasuringTools.tsx | 175 | 🔴 thin |
| GCodeAcademy.tsx | 316 | 🔴 thin |
| OperatorAcceptanceProgram.tsx | 317 | 🔴 thin |
| EssentialReading.tsx | 322 | 🔴 thin |
| ToolComparisons.tsx | 413 | 🟡 borderline |
| GCodeReference.tsx | 488 | 🟡 borderline |
| ManufacturingGuides.tsx | 786 | ✅ |
| ManufacturingCareers.tsx | 815 | ✅ |
| ResourcesIndex.tsx | 818 | ✅ |
| BeginnersGuide.tsx | 854 | ✅ |
| MesVsErp.tsx | 910 | ✅ |
| QualityInspection.tsx | 1067 | ✅ |
| ShopFloorBuyersGuide.tsx | 1104 | ✅ |
| SafetyCompliance.tsx | 1157 | ✅ |
| LeanManufacturing.tsx | 1326 | ✅ |
| FiveSMethodology.tsx | 1365 | ✅ |
| KanbanSortingTechniques.tsx | 1518 | ✅ |
| ManufacturingPioneers.tsx | 3074 | ✅ |
| IndustryGlossary.tsx | 3207 | ✅ |

---

## Recommended remediation order

**P0 — Pull from sitemap until rewritten (these are the AdSense liability):**

- `/resources/erp-guide-part` (57 words)
- `/resources/erp-selection-guide` (89 words)
- `/resources/measuring-tools` (175 words — has a tool library but minimal prose)

**P1 — Rewrite to ≥800 words this sprint (highest crawl value):**

- `/features/digital-expeditor`, `/features/shift-handoff`,
  `/features/quality-management`, `/features/downtime-tracking`,
  `/features/work-order-tracking` — these are linked from the new
  sitelinks and from MarketingNav, so they're the most-likely review
  samples.

**P2 — Bulk fill remaining thin /features pages with:**

1. Real screenshot of the feature in-app (alt text required).
2. 3 × H2 sections: *"How it works" · "What it replaces" · "Built for AS9100 / ISO 9001 shops"*.
3. FAQ block (5 Q&A) → adds 200+ words and qualifies for FAQ rich snippet.
4. 2 internal links to related `/features/*` or `/resources/*` pages.

**P3 — Sitemap hygiene:**

- Confirm thin pages are excluded from `public/sitemap-*.xml` until
  remediated. `scripts/generate-talent-sitemap.mjs` only covers
  /talent — feature/resource pages are baked into a separate sitemap;
  prune the 🔴 entries.

---

## What's already good

- ✅ `AdPlacement` runtime guard + ESLint ban keep ads off authenticated
  app routes (PRD 12).
- ✅ ITAR builds suppress all ad code via `VITE_DISABLE_ANALYTICS`.
- ✅ Sitewide policy pages (`/terms`, `/privacy`, `/cookies`) exist and
  are linked from the marketing footer.
- ✅ Cookie consent (Consent Mode v2, default-deny) shipped.
- ✅ `ads.txt` served at root with correct publisher ID.

## Re-submission checklist

Per `.lovable/prd/12-ad-placement-strategy.md`:

1. Land the P0/P1 rewrites.
2. Deploy and **URL-inspect** 5 sample marketing pages in Search Console.
3. AdSense → Sites → jobline.ai → *"I confirm I have fixed the issues"* → Request review.
4. Expect a 2–4 week review window.

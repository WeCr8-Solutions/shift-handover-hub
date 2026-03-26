

# Fix Industries Pages, ERP Hub, and Navigation

## Problems Identified

1. **No industry pages exist** -- All 16 industry items in the nav link to `/pricing` as a placeholder. There are no actual industry-specific pages.
2. **ERP Guide has no hub/landing page** -- The 7-part series exists at `/resources/erp-guide` as one long accordion page, but there is no overview page that links to individual parts or draws users in.
3. **Navigation product links are broken** -- The nav uses paths like `/digital-expeditor` but the actual routes are `/features/digital-expeditor` (e.g., `href="/digital-expeditor"` should be `href="/features/digital-expeditor"`). Same issue for shift-handoff, work-order-tracking, production-scheduling, quality-management, ai-planning-assistant, machine-shop-software, and downtime-tracking.

## Plan

### Step 1: Fix product nav links
Update the `productItems` array in `MarketingNav.tsx` to use the correct `/features/...` paths that match the existing routes in `App.tsx`.

### Step 2: Create a reusable IndustryPage component
Build a single template component (`src/pages/industries/IndustryPage.tsx`) that accepts an industry slug and renders:
- Hero section with industry name, description, and key challenges
- How JobLine.ai solves those challenges (3-4 benefit cards)
- CTA to start a free trial
- SEO head with industry-specific meta

All 16 industries will use this same component with different data passed via a config map (slug to content).

### Step 3: Add industry routes and update nav links
- Create an industry data file (`src/pages/industries/industryData.ts`) with content for all 16 industries (Job Shops, Machine Shops, Aerospace & Defense, etc.)
- Add a dynamic route `/industries/:slug` in `App.tsx`
- Update `industryCategories` in `MarketingNav.tsx` so each item links to `/industries/job-shops`, `/industries/machine-shops`, etc. instead of `/pricing`

### Step 4: Create ERP Guide hub page
Split the ERP guide into two layers:
- **Hub page** at `/resources/erp-guide` -- Overview card layout showing all 7 parts with titles, descriptions, and progress indicators. Each card links to the individual part.
- **Part pages** at `/resources/erp-guide/:partSlug` -- Each of the 7 parts gets its own routable page (reusing the existing accordion content from `ERPSelectionGuide.tsx`).

This makes the series navigable, shareable (each part has its own URL), and SEO-friendly.

### Step 5: Clean up header nav on mobile
Ensure the mobile menu properly reflects all the updated links and industry categories render correctly in the collapsible sections.

## Files Changed
- `src/components/marketing/MarketingNav.tsx` -- Fix product hrefs, update industry hrefs
- `src/pages/industries/IndustryPage.tsx` -- New reusable template
- `src/pages/industries/industryData.ts` -- New data file for 16 industries
- `src/pages/resources/ERPSelectionGuide.tsx` -- Refactor into hub + part detail
- `src/pages/resources/ERPGuidePart.tsx` -- New individual part page component
- `src/App.tsx` -- Add `/industries/:slug` and `/resources/erp-guide/:partSlug` routes


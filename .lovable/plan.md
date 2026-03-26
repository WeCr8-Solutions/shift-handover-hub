

# Consolidate Navigation -- ECI-Inspired Structure

## Current Problems

1. **Learn dropdown has 13 items** -- overwhelming, no descriptions, just a wall of links
2. **No "Support" or "Company" sections** -- Blog and Pricing float as standalone top-level items
3. **Mega-menu panels are dense** -- Platform panel crams 8 features + 2 extensions with icon cards; Industries is just plain text lists
4. **Dashboard Header duplicates everything** in tiny dropdown menus that scroll -- poor UX

## New Top-Level Structure

Following the ECI pattern (Products / Industries / Support / Learn / Company):

```text
Logo   |  Products v  |  Industries v  |  Learn v  |  Company v  |  Pricing  |  [Dashboard / Start Free Trial]
```

### Products Mega-Menu
Two columns with title + description (ECI style):
- Left: **Platform** -- Digital Expeditor, Shift Handoff, Work Order Tracking, Production Scheduling, Quality Management, AI Planning Assistant, Machine Shop Software, Downtime Tracking
- Right: **Developer Tools** -- JobLine G-Code (beta badge), JobLine Machine Connect (beta badge)
- Bottom row CTA: "See all features" link

### Industries Mega-Menu
Keep the 3-column category layout (Manufacturing / Process & Specialty / Emerging) but add a right-side promotional panel with a tagline: "Built for precision manufacturing" and a CTA to view all industries.

### Learn Mega-Menu (ECI-style: title + description, 2 columns)
Consolidate 13 items into grouped categories:
- **Resources** -- Manufacturing Guides, G-Code Reference, Industry Glossary, ERP Selection Guide (with short descriptions)
- **Blog** -- Tips, best practices, and industry insights (links to /blog)
- **Training** -- Beginner's Guide, Safety & Compliance, Lean Manufacturing, 5S, Kanban (grouped)
- Bottom CTA: "Explore all resources >"

### Company (new dropdown, simple)
- About (links to a future /about or /)
- Careers (/resources/careers -- moved from Learn)
- Pioneers (/resources/pioneers -- moved from Learn)
- Contact / Help (/help)

## Changes

### 1. `src/components/marketing/navData.ts`
- Restructure `learnItems` into grouped categories with descriptions (new `NavLearnCategory` interface)
- Add `companyItems` array
- Keep `platformFeatures` and `extensionItems` as-is (already have descriptions)
- Add descriptions to industry items (new interface with `name` + `slug`)

### 2. `src/components/marketing/MarketingNav.tsx`
- Change `MenuKey` to `"products" | "industries" | "learn" | "company" | null`
- Remove standalone Blog/Pricing buttons from dropdown area; Blog moves into Learn, Pricing stays as plain link
- Rebuild each mega-menu panel with ECI-style layout: title + description pairs in clean columns, optional promotional sidebar
- Learn panel: 2-column grid with category headings and 3-4 items each with descriptions
- Company panel: simple 4-item list with descriptions

### 3. `src/components/Header.tsx`
- Update `HeaderDropdown` content to match new groupings
- Move Blog/Help into Learn and Company dropdowns respectively
- Keep dashboard-specific nav items (Queue, Tools, Teams, etc.) separate from marketing dropdowns

### 4. Mobile menus (both files)
- Update `MobileSection`/`MobileCollapsible` titles to match new top-level: Products, Industries, Learn, Company
- Move Blog into Learn section, Help/Careers into Company section

## Files Changed
- `src/components/marketing/navData.ts` -- Restructure data with descriptions, add companyItems, group learnItems
- `src/components/marketing/MarketingNav.tsx` -- New mega-menu layouts, new menu keys, ECI-style panels
- `src/components/Header.tsx` -- Update dropdowns to match new groupings


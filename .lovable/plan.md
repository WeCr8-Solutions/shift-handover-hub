

# Unify Navigation and Add Dashboard Button

## What's Wrong

1. **Two separate navs** -- `MarketingNav.tsx` (public pages) and `Header.tsx` (authenticated dashboard) have completely different structures. The marketing nav has the updated Platform/Industries/Learn mega-menus; the dashboard header has none of this.
2. **No explicit "Dashboard" button** -- The only way to reach the dashboard is clicking the logo. Users need a visible, labeled button.
3. **Role confusion** -- Users can't easily switch between Supervisor overview and Operator view from the header.

## Plan

### Step 1: Add a visible "Dashboard" button to both navs

**MarketingNav.tsx** -- When the user is authenticated, show a "Dashboard" button (with LayoutDashboard icon) next to "Start Free Trial" (or replacing it). Links to `/dashboard`.

**Header.tsx** -- Add a labeled "Dashboard" button (not just a logo click) as the first nav item. For users with supervisor/admin access, make it a split button or dropdown with two options:
- "Production Floor" (supervisor overview)
- "Operator View" (operator station view)

This uses existing role detection from `useAdminAccess`.

### Step 2: Add Platform/Industries/Learn links to the dashboard Header

Add a small set of contextual links in the Header so authenticated users can still access Industries and Learn resources without navigating back to the marketing site. These will be simple dropdown menus (not full mega-menus) to keep the header compact. Reuse the same data arrays from `MarketingNav` by extracting them into a shared file.

### Step 3: Extract shared nav data

Move `platformFeatures`, `extensionItems`, `industryCategories`, and `learnItems` arrays into a shared file `src/components/marketing/navData.ts` so both `MarketingNav.tsx` and `Header.tsx` import from the same source. This ensures consistency.

### Step 4: Mobile parity

Update the mobile Sheet in `Header.tsx` to include:
- A prominent "Dashboard" link at the top
- Collapsible sections for Platform, Industries, Learn (matching the marketing mobile nav)

## Files Changed

- `src/components/marketing/navData.ts` -- New shared data file
- `src/components/marketing/MarketingNav.tsx` -- Import from navData, add Dashboard button for authenticated users
- `src/components/Header.tsx` -- Add Dashboard button with role-aware options, add Platform/Industries/Learn dropdowns, update mobile menu




# Admin Dashboard Mobile Optimization

## Problem
At 360px viewport, the admin dashboard has severe usability issues:
- **25+ tabs** render as a wrapped wall of tiny buttons, consuming most of the screen
- **Filter rows** with fixed-width selects (200px, 140px) overflow horizontally
- **Page header** buttons and badge stack poorly
- **Stats cards** grid doesn't collapse cleanly on small screens
- **Tables** in child components cause horizontal scroll issues

## Approach
Replace the desktop tab strip with a **mobile dropdown navigator** on small screens, and fix overflow in key child components.

## Changes

### 1. `src/pages/Admin.tsx` -- Mobile tab navigation
- On screens < 1024px (`useIsMobile`), replace the `TabsList` with a **grouped `<Select>` dropdown** that mirrors the bucket structure (Org, Production, Activity, Dev)
- Use `<optgroup>` -style grouping via Select with category labels
- Keep the full `TabsList` visible only on `lg:` and above
- Shrink page header: stack title/badge vertically, hide "Bulk Upload" text (icon-only on mobile), reduce heading size

### 2. `src/components/admin/AdminStatsCards.tsx` -- Compact mobile grid
- Change grid to `grid-cols-2` on mobile (currently `grid-cols-1`) for better density
- Reduce card padding on small screens with responsive classes

### 3. `src/components/admin/WorkOrderManagement.tsx` -- Fix filter overflow
- Stack filters vertically on mobile: search full-width, selects in a 2-col grid below
- Remove fixed `w-[200px]` / `w-[140px]` on selects, use `w-full` on mobile
- "Add Work Order" button: icon-only on mobile

### 4. `src/components/admin/UserManagement.tsx` -- Responsive table
- Wrap table in `overflow-x-auto` container
- Hide less-critical columns (email, org) on mobile via `hidden sm:table-cell`
- Compact the search/filter row

### 5. `src/components/admin/StationManagement.tsx` -- Responsive table
- Same treatment: `overflow-x-auto`, hide secondary columns on mobile
- Stack filter controls vertically on small screens

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Mobile dropdown nav replacing TabsList, compact header |
| `src/components/admin/AdminStatsCards.tsx` | 2-col mobile grid, smaller card padding |
| `src/components/admin/WorkOrderManagement.tsx` | Stacked filters, responsive select widths |
| `src/components/admin/UserManagement.tsx` | Responsive table columns, overflow handling |
| `src/components/admin/StationManagement.tsx` | Responsive table columns, overflow handling |


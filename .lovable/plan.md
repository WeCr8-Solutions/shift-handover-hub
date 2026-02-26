

# Fix Navigation Overflow for All Devices

## Problem

The `Header.tsx` renders up to 12 items (logo, team selector, queue, teams, settings, admin, testing, system status, updates, shift badge, clock, bug report, bell, user menu) in a single `flex` row with `gap-4`. On tablets and mobile devices, these items overflow horizontally or overlap because there is no responsive breakpoint handling.

The `MarketingNav.tsx` already handles this correctly with `hidden sm:inline-flex` on secondary items -- the app header does not.

## Solution

Restructure `Header.tsx` into two tiers:

### Desktop (md and above)
Keep the current single-row layout but with tighter spacing (`gap-2` instead of `gap-4`).

### Mobile/Tablet (below md)
1. **Always visible**: Logo, Clock, User Menu, and a hamburger menu button
2. **Hamburger sheet/dropdown**: All navigation links (Queue, Teams, Settings, Admin, Testing, Updates) as a vertical list, plus Team Selector, Shift badge, System Status, and Report Issue button
3. Use the existing `Sheet` component (from shadcn/ui, already installed) for the mobile menu drawer

### Specific changes

**`src/components/Header.tsx`**:
- Import `Menu` icon from lucide and `Sheet`/`SheetContent`/`SheetTrigger` from ui
- Add `const isMobile = useIsMobile()` check
- Wrap the nav icons section: on `md+`, render inline as today; below `md`, render inside a `Sheet` triggered by a hamburger button
- Team Selector gets `hidden md:flex` on desktop, moves into Sheet on mobile
- Shift badge and clock get `hidden md:flex`, shown in Sheet on mobile
- Nav icon buttons (Queue, Teams, Settings, Admin, Testing, Updates, Bug, Bell) get `hidden md:flex`, listed vertically in Sheet with labels

**`src/components/TeamSelector.tsx`**:
- No changes needed -- it already has a fixed width that works in both contexts

**`src/components/marketing/MarketingNav.tsx`**:
- Already handles overflow correctly with `hidden sm:inline-flex`. No changes needed.

### Files to modify

1. `src/components/Header.tsx` -- Add mobile hamburger menu with Sheet, hide overflow items on small screens

### Implementation detail

The mobile Sheet will contain:
- Team Selector (full width)
- Divider
- Navigation links as labeled rows (icon + text): Queue, Teams, Settings, Admin, Testing, Updates
- Divider  
- Shift badge + Clock
- Report Issue button
- System Status indicator

This keeps the header to a single compact row on mobile (logo + clock + hamburger + avatar) while providing full access to all navigation via the drawer.


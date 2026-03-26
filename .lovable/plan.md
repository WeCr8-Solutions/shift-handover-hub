

## Fix Header Navigation Overflow on Mobile Web + Data Consistency

### Problems Identified

**1. Desktop nav renders on mobile phones**
The `useIsMobile` hook initializes `isMobile` as `undefined`, which returns `false` on the first render frame. This causes the full desktop navigation (Dashboard dropdown, TeamSelector, all icon buttons, 4 marketing dropdowns, clock, status badge, bug button, notifications, user menu) to render before the effect corrects it. On the published site this flash can persist longer than in the Lovable preview due to bundle load times.

Additionally, if a user has "Request Desktop Site" enabled in Brave (common on Android), the viewport reports a wider width, permanently showing the desktop nav on a phone screen.

**2. Desktop nav has zero overflow protection**
The desktop nav is a single `flex items-center gap-1` row with no `flex-wrap`, `overflow-hidden`, or responsive breakpoints. When it renders on a medium screen or during the initial flash, items overflow and get clipped (as shown in the screenshot with "WeCr8 · All Teams" cut off).

**3. Data discrepancy between preview and published site**
The Lovable preview and published site share the same database. Differences are caused by:
- Different auth sessions (different user accounts)
- The `getCurrentShift()` function from `mockData` — this is static mock data, not real
- Org/team context resolving differently based on which user is logged in

### Plan

#### File 1: `src/hooks/use-mobile.tsx`
- Initialize `isMobile` with an immediate check of `window.innerWidth` instead of `undefined`, eliminating the first-frame flash where desktop nav renders on phones
- Change from `useState<boolean | undefined>(undefined)` to `useState(() => window.innerWidth < MOBILE_BREAKPOINT)`

#### File 2: `src/components/Header.tsx`
- **Wrap desktop nav in overflow protection**: Add `overflow-hidden` and `min-w-0` to the desktop nav container so items don't spill outside the header
- **Collapse marketing dropdowns for logged-in users**: When `user` is authenticated, hide the 4 marketing dropdowns (Products, Industries, Learn, Company) on screens below `xl` (1280px) — these are already available in the hamburger menu. This dramatically reduces desktop nav width
- **Add a "More" dropdown fallback**: For medium desktop screens (lg but not xl), group the marketing links into a single "More" dropdown instead of 4 separate ones
- **Ensure the bell/notification and user menu are always visible**: Use `shrink-0` on critical action buttons so they never get squeezed out

#### File 3: No data fix needed (explanation only)
The data difference is expected — the preview and published site use the same database but different browser sessions. The user likely logged in with a different account or the org context loaded differently. The `getCurrentShift()` mock function returns the same static data everywhere. If real shift data is needed, that would be a separate feature to connect to actual schedule data.

### Technical Details

```text
Before (desktop nav, single row, no overflow):
[Logo] [Dashboard▼] [TeamSelector] [Queue] [Tools] [Teams] [Settings] [Admin] [Products▼] [Industries▼] [Learn▼] [Company▼] [Status] [Updates] [Shift] [Clock] [Bug] [Bell] [User]
       ←————————————— overflows on < ~1400px screens ———————————————→

After (logged-in desktop nav, responsive):
≥ 1280px (xl):  [Logo] [Dashboard▼] [TeamSelector] [Icons...] [Products▼] [Industries▼] [Learn▼] [Company▼] [Status] [Bell] [User]
< 1280px (lg):  [Logo] [Dashboard▼] [TeamSelector] [Icons...] [More▼] [Status] [Bell] [User]
< 1024px:       Mobile layout (hamburger menu)
```

### Files Changed
1. **Edit** `src/hooks/use-mobile.tsx` — fix initial value to prevent desktop flash
2. **Edit** `src/components/Header.tsx` — add overflow protection, responsive marketing nav collapse, ensure critical buttons always visible


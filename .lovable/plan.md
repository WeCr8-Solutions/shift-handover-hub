

## Notification Panel — Unified Alert Center

### Problem
The Notifications bell button in the Header (both desktop and mobile) has no `onClick` handler and doesn't open any panel. Clicking it does nothing. There's no centralized place for users to see their org's Smart Alerts, Complimentary Award status, or System Updates.

### Solution
Create a `NotificationPanel` popover/sheet that opens when the bell is clicked, aggregating three notification sources into a tabbed or sectioned panel:

1. **Smart Alerts** — org production alerts (overdue, stale, bottleneck, etc.) from `useSmartAlerts`
2. **Complimentary Award** — if the org has complimentary status, show a dismissible notice (reusing `ComplimentaryAwardBanner` logic with localStorage persistence)
3. **System Updates** — unread platform updates from `useGlobalUpdates`

### Architecture

**New file: `src/components/NotificationPanel.tsx`**
- Desktop: renders inside a `Popover` anchored to the bell button
- Mobile: renders inside the existing `Sheet` or a dedicated one
- Three sections with counts:
  - **Alerts** — compact list of SmartAlerts with severity badges, clicking navigates to relevant queue item
  - **Announcements** — complimentary award banner (if applicable)
  - **Updates** — unread system updates with acknowledge action, link to `/updates`
- Empty state when no notifications exist
- Dynamic badge count on the bell icon reflecting total unread items (smart alerts count + unread updates + complimentary notice)

**Modified file: `src/components/Header.tsx`**
- Import `NotificationPanel` and wrap the bell `Button` with a `Popover` trigger (desktop) or open a sheet (mobile)
- Replace static red dot with dynamic count badge based on actual data
- Wire the mobile Notifications button the same way
- Use `useSmartAlerts` and existing `useGlobalUpdates` data already in scope

### Technical Details

| Aspect | Approach |
|---|---|
| Desktop trigger | `Popover` from Radix (already in UI lib) wrapping the bell button |
| Mobile trigger | `Sheet` bottom panel, same as mobile menu pattern |
| Smart Alerts data | `useSmartAlerts()` hook (already available, uses org context) |
| System Updates data | `useGlobalUpdates()` already called in Header — reuse `unreadCount`, `updates`, `acknowledgedIds` |
| Complimentary data | `useOrgContext()` to check `subscription_status === "complimentary"` |
| Badge count | `smartAlerts.length + unreadUpdatesCount + (isComplimentary ? 1 : 0)` — hide dot when 0 |
| Dismiss persistence | Complimentary uses existing localStorage key; update acknowledgements use existing DB table |
| Navigation | Clicking a smart alert navigates to `/queue?item=...`; clicking an update navigates to `/updates` |

### Files Changed
1. **Create** `src/components/NotificationPanel.tsx` — unified panel component with sections
2. **Edit** `src/components/Header.tsx` — wire bell button to open the panel, add dynamic badge count


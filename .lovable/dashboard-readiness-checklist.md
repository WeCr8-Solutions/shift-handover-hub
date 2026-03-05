# Dashboard Readiness Checklist

Last updated: 2026-03-05

## ✅ Working / Fixed

| Area | Status | Notes |
|------|--------|-------|
| **Anti-flash loading** | ✅ Fixed | `hasFetchedOnce` ref prevents `setLoading(true)` on subsequent refetches in `useStations`, `useHandoffRecords`, `useQueue`, `useOperatorSessions` |
| **Scroll position preserved** | ✅ Fixed | Dashboards no longer unmount/remount during background refreshes — loading gate only triggers when no cached data |
| **Org-scoped realtime channels** | ✅ Fixed | All channels now include `orgId` in name to prevent cross-tenant data leakage (`station-status-{orgId}`, `queue-changes-{orgId}`, `handoff-records-{orgId}`) |
| **Queue channel isolation** | ✅ Fixed | Was using generic `queue-changes` channel, now `queue-changes-{orgId}-{userId}` |
| **Exponential backoff polling** | ✅ Working | All hooks use 5s start → 1.5x growth → 30s cap fallback polling |
| **Realtime + polling reset** | ✅ Working | Realtime events reset poll interval to 5s for responsiveness |
| **Supervisor KPIs** | ✅ Working | Running/Down/Setup/Waiting/Handoffs computed from real station data |
| **Attention items** | ✅ Working | Machine Down + Waiting stations flagged with severity |
| **Team filter chips** | ✅ Working | Org-wide view with team switching |
| **Operator check-in/out** | ✅ Working | Station selection, shift picker, multi-station support |
| **Station status sync on check-in** | ✅ Working | `current_station_status` updated with operator name/id on check-in |
| **Station status clear on check-out** | ✅ Working | Operator fields cleared on checkout |
| **Admin→Operator view toggle** | ✅ Working | Admins can switch to operator view with back button |
| **Station detail drill-down** | ✅ Working | Click station row → detail view |
| **Handoff form prefill from queue** | ✅ Working | `sessionStorage` auto-open + prefill from queue item detail |
| **Auth redirect on no session** | ✅ Working | Redirects to `/auth` if no session |
| **Setup redirect for new users** | ✅ Working | Redirects to `/setup` if onboarding incomplete |
| **Trial gate** | ✅ Working | `ExpiredTrialGate` wraps authenticated dashboard |
| **Mock data fallback** | ✅ Working | Unauthenticated users see mock stations/handoffs |
| **Work order state machine** | ✅ Working | DB trigger `validate_queue_item_status_transition` enforces valid transitions |
| **NCR state machine** | ✅ Working | DB trigger `validate_ncr_status` enforces valid transitions |

## ⚠️ May Need Fixing / Monitoring

| Area | Status | Notes |
|------|--------|-------|
| **useAdminAccess multiple queries** | ⚠️ Monitor | Fires `user_roles` + `organization_members` queries on every mount — could cache with React Query |
| **Redundant fetches on mount** | ⚠️ Monitor | `fetchStations()` called by both `useEffect(fetchStations)` AND first poll timeout (5s) — first poll could start later |
| **SupervisorDashboard re-instantiates hooks** | ⚠️ Monitor | Both `Index.tsx` and `SupervisorDashboard.tsx` call `useStations()` and `useHandoffRecords()` with same params — double data fetch |
| **No debounce on realtime refetches** | ⚠️ Caution | If realtime fires rapidly (bulk insert), could cause many refetches. Admin hooks have debounce but core hooks don't |
| **Polling never stops** | ⚠️ Design | Polling continues even when realtime is healthy — by design for resilience but adds DB load |
| **StationCheckIn separate useStations call** | ⚠️ Minor | Operator check-in screen makes its own `useStations(null, org.id)` call that doesn't share cache with parent |
| **No error state display** | ⚠️ UX | If data fetch fails, no error banner shown — just stale data |
| **Handoff loading state for handoffs tab** | ⚠️ UX | Handoffs tab in unauthenticated view doesn't have its own loading indicator |
| **ProductionAnalytics** | ⚠️ Unchecked | Not yet reviewed for same flash issues |

## 🔴 Known Gaps

| Area | Status | Notes |
|------|--------|-------|
| **React Query migration** | 🔴 TODO | All data hooks use raw `useState`/`useEffect` — migrating to React Query would solve caching, dedup, stale-while-revalidate, and error handling |
| **Optimistic updates** | 🔴 TODO | Status changes trigger full refetch instead of optimistic local update |
| **Connection status indicator** | 🔴 TODO | No visual indicator when realtime is disconnected (should show "reconnecting" state) |
| **Page visibility API** | 🔴 TODO | Should pause polling when tab is hidden, resume on focus |

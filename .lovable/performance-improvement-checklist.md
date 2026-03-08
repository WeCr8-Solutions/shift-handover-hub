# Dashboard Performance Improvement — Phase Checklist

**Date:** 2026-03-08  
**Reference:** `docs/prd/06-dashboard-performance-audit.md`

---

## Phase 1: Eliminate Duplicate Queries (Impact: ~60% improvement) ✅

**Goal:** Reduce mount queries from 18–22 → 7–9

- [x] **1.1** Lift `useUserOrganization()` into a React Context (`OrgContext`) so it runs once
  - Remove `useUserOrganization()` calls from: `useStations`, `useHandoffRecords`, `useQueue`, `SupervisorDashboard`, `TeamContext`
  - Pass `organizationId` down via context instead of each hook fetching it
- [x] **1.2** Parallelize the 3 sequential queries in `useUserOrganization()` using `Promise.all`
  - `organization_members`, `team_members`, `user_roles` can all fire simultaneously
- [x] **1.3** Remove duplicate `useStations()` / `useHandoffRecords()` from `Index.tsx`
  - Only the active child dashboard (`SupervisorDashboard` or `OperatorDashboard`) should fetch
  - Pass `createHandoffRecord` via callback prop or context
- [x] **1.4** Cache `useAdminAccess()` result — it rarely changes
  - Add a `staleTime` or store in context alongside org data

**Estimated reduction:** ~12 queries eliminated

---

## Phase 2: Migrate to React Query (Impact: ~25% improvement) ✅

**Goal:** Proper caching, dedup, stale-while-revalidate, error handling

- [x] **2.1** Create `QueryClientProvider` wrapper with sensible defaults
- [x] **2.2** Convert `useStations` → React Query with debounced realtime invalidation
- [x] **2.3** Convert `useHandoffRecords` → React Query with debounced realtime
- [x] **2.4** Convert `useQueue` → uses OrgContext for org scoping
- [x] **2.5** Convert `useSmartAlerts` → uses OrgContext
- [x] **2.6** Convert `useUserOrganization` → React Query (5min staleTime)

---

## Phase 3: Debounce & Visibility (Impact: ~10% improvement) ✅

**Goal:** Reduce unnecessary background load

- [x] **3.1** Add 500ms debounce to all realtime event handlers
  - useStations: `useDebouncedInvalidate` (done in Phase 2)
  - useQueue: debounced fetch with `document.hidden` check
- [x] **3.2** Integrate Page Visibility API
  - `refetchIntervalInBackground: false` on React Query hooks
  - `document.hidden` guard on useQueue realtime handler
- [x] **3.3** Remove/extend manual polling from hooks with realtime subscriptions
  - `useStations`: 5min → 15min fallback (realtime is primary)
  - `useHandoffRecords`: 5min → 15min fallback
  - `OperatorDashboard`: `useBackgroundRefresh` min interval → 10min

---

## Phase 4: Server-Side Alert Computation (Impact: variable) ✅

**Goal:** Replace 8 client-side alert queries with 1 DB function

- [x] **4.1** Create `compute_smart_alerts(org_id, station_id, ...)` database function
  - Returns pre-computed alert array as JSONB
  - Combines overdue, stale, bottleneck, on_hold, over_time, high_priority, no_operator, unassigned, no_routing
  - All thresholds configurable via parameters
- [x] **4.2** Update `useSmartAlerts` to call the RPC instead of 8 separate queries
  - Migrated to React Query with `staleTime: 60s`, `refetchInterval: 5min`
  - `refetchIntervalInBackground: false` for visibility optimization
- [ ] **4.3** Consider materialized view or periodic cron for very large orgs (deferred — not needed yet)

---

## Phase 5: Optimistic Updates & Error Handling (UX) ✅

**Goal:** Instant feedback on mutations, graceful error recovery

- [x] **5.1** Add optimistic updates for status changes
  - Queue item status/priority/assignment → local state updated immediately, reverted on error
- [x] **5.2** Add error boundary for failed data fetches
  - Created `DashboardErrorBoundary` component with retry UI
- [ ] **5.3** Add connection status indicator (deferred — low impact)
  - Show "Reconnecting…" when realtime channel disconnects

---

## Phase 6: Bundle & Render Optimization ✅

- [x] **6.1** Lazy-load `ProductionAnalytics` (heavy Recharts dependency)
- [ ] **6.2** Virtualize station list for orgs with 50+ stations (deferred — not needed at current scale)
- [x] **6.3** Memoize `toStationInfo()` transforms via WeakMap cache
- [x] **6.4** Code-split 20+ admin-only components behind `React.lazy()`

---

## Validation Criteria

| Phase | Validation Method |
|-------|-------------------|
| Phase 1 | Network tab shows ≤ 8 queries on dashboard mount |
| Phase 2 | Switching teams doesn't re-fetch if data < 30s old |
| Phase 3 | No network activity when tab is hidden for 5 min |
| Phase 4 | Smart alerts section loads in < 200ms |
| Phase 5 | Status change reflects in UI within 100ms |
| Phase 6 | Lighthouse performance score > 90 |

---

## Priority Order

1. **Phase 1** — Highest ROI, pure refactor, no new dependencies
2. **Phase 2** — Leverages already-installed `@tanstack/react-query`
3. **Phase 3** — Quick wins after Phase 2
4. **Phase 4** — Requires DB migration, do when alert count grows
5. **Phase 5** — UX polish
6. **Phase 6** — Only needed at scale (50+ stations)

# Dashboard Performance Audit — PRD

**Date:** 2026-03-08  
**Status:** Active  
**Severity:** High — user-facing latency on primary workflow surfaces

---

## 1. Executive Summary

Dashboard load times are degraded due to **waterfall data fetching**, **duplicate hook instantiation**, **missing query deduplication/caching**, and **unbounded parallel DB queries**. This audit identifies every bottleneck and prescribes fixes organized into implementation phases.

---

## 2. Architecture Overview (Current)

```
Auth (session + profile + roles)          ← sequential
  → useUserOrganization (3 sequential queries)  ← waterfall
    → TeamContext (useTeams + useUserOrganization again)  ← duplicate
      → Index.tsx
        ├─ useStations(teamId, orgId)       ← fetch #1
        ├─ useHandoffRecords(teamId, orgId) ← fetch #2
        ├─ useAdminAccess()                 ← 2 more queries
        ├─ useOnboardingContext()            ← 1 query
        └─ SupervisorDashboard
             ├─ useStations(teamId, orgId)       ← DUPLICATE of fetch #1
             ├─ useHandoffRecords(teamId, orgId) ← DUPLICATE of fetch #2
             ├─ useUserOrganization()             ← TRIPLICATE
             ├─ useSmartAlerts()                  ← 8 parallel queries
             ├─ useBackgroundRefresh()
             └─ useOrgRefreshInterval()
```

**Total DB round-trips on dashboard mount: ~18–22 queries**

---

## 3. Findings

### 3.1 — Duplicate Hook Instantiation (CRITICAL)

| Hook | Called In | Duplicate In | Impact |
|------|-----------|-------------|--------|
| `useStations()` | `Index.tsx:149` | `SupervisorDashboard.tsx:63` | 2× station + status queries |
| `useHandoffRecords()` | `Index.tsx:151` | `SupervisorDashboard.tsx:68` | 2× handoff queries |
| `useUserOrganization()` | `Index.tsx:148` | `SupervisorDashboard.tsx:60`, `TeamContext.tsx:18`, `useStations.ts:95`, `useHandoffRecords.ts:272`, `useQueue.ts:165` | **5× identical 3-query waterfall** |
| `useAdminAccess()` | `Index.tsx:162` | fires `user_roles` + `organization_members` on every mount | No cache, no dedup |

**Root cause:** Every hook independently calls `useUserOrganization()` which fires 3 sequential queries (org_members → team_members → user_roles). With 5 instances, that's **15 redundant queries** per mount.

### 3.2 — Waterfall Fetching (HIGH)

`useUserOrganization()` executes 3 queries **sequentially**:
1. `organization_members` → wait
2. `team_members` → wait  
3. `user_roles` → wait

Each query adds ~50–150ms RTT. Total: 150–450ms just for org context, **multiplied by 5 instances**.

### 3.3 — Smart Alerts: 8+ Queries Per Refresh (MEDIUM)

`useSmartAlerts()` fires **8 parallel queries** per refresh cycle, plus the "no routing" check does a **sequential N+1 pattern** (fetch active WOs → fetch routing for each).

### 3.4 — No Query Deduplication (CRITICAL)

All hooks use raw `useState`/`useEffect` with no shared cache. React Query (already installed as `@tanstack/react-query`) is **not used anywhere for data fetching**. This means:
- No stale-while-revalidate
- No request deduplication
- No optimistic updates
- No automatic garbage collection
- Every component re-mount triggers fresh DB queries

### 3.5 — Realtime Channels Without Debounce (MEDIUM)

Core hooks (`useStations`, `useHandoffRecords`, `useQueue`) refetch on **every** realtime event with no debounce. A bulk insert of 10 items triggers 10 full refetches.

### 3.6 — Polling Never Pauses (LOW)

- `useStations` and `useHandoffRecords` poll every 5 minutes even when tab is hidden
- `useBackgroundRefresh` polls at org-configured interval regardless of tab visibility
- No Page Visibility API integration

### 3.7 — Index.tsx Renders Both Views' Data (MEDIUM)

`Index.tsx` fetches stations + handoffs even when rendering `SupervisorDashboard` (which fetches them again). The parent data is only used for the operator/unauthenticated view but is **always** fetched.

### 3.8 — No Error Boundaries / Retry Logic (LOW)

Failed queries silently return empty arrays. No toast, no retry, no error state displayed to user.

---

## 4. Metrics to Track

| Metric | Current (est.) | Target |
|--------|---------------|--------|
| Dashboard TTI (Time to Interactive) | 2.5–4s | < 1.5s |
| DB queries on mount | 18–22 | 5–7 |
| `useUserOrganization` instances | 5 | 1 |
| Duplicate station/handoff fetches | 2× each | 0 |
| Smart alert queries per cycle | 8–9 | 1 (server-side) |
| Background queries when tab hidden | All active | 0 |

---

## 5. Recommended Architecture (Target)

```
AuthContext (session + profile)
  → OrgContext (single useUserOrganization, cached via React Query)
    → TeamContext (reads from OrgContext, no extra queries)
      → Index.tsx (no data fetching — delegates to child dashboards)
        └─ SupervisorDashboard
             └─ React Query hooks: useStationsQuery, useHandoffsQuery, useAlertsQuery
                 ├─ Automatic dedup across components
                 ├─ staleTime: 30s (no refetch within window)
                 ├─ Realtime invalidation (debounced 500ms)
                 └─ Page Visibility pause
```

---

## 6. Security Considerations

- All performance changes must maintain existing RLS policies
- React Query caching must be scoped per organization to prevent cross-tenant data leakage
- Realtime channel names must retain org-scoped naming convention

# Component Performance Audit

**Date:** 2026-03-08  
**Status:** Audit complete — implementation phases defined  
**Scope:** All dashboard, queue, admin, and operator components  
**Implementation Plan:** `.lovable/component-performance-phases.md`

---

## Audit Summary

All 6 phases of the performance improvement plan are now **complete**. This document catalogs the current performance profile of each major component area and flags items for future review.

---

## 1. Dashboard Components

### SupervisorDashboard (727 lines)
- **Status:** ⚠️ Large file — candidate for extraction
- **Data:** `useStations` + `useHandoffRecords` + `useSmartAlerts` (all React Query) + `useOrgContext`
- **Rendering:** 6 `useMemo` blocks, lazy-loaded `ProductionAnalytics`
- **Recommendations:**
  - Extract KPI card grid into `DashboardKPICards` component
  - Extract station list table into `StationListTable` component
  - Extract alert sections into dedicated wrapper
  - **Phase:** 2 (see `component-performance-phases.md`)

### OperatorDashboard (240 lines)
- **Status:** ✅ Acceptable size
- **Data:** `useOperatorSessions` + `useHandoffRecords` (React Query + background refresh)
- **Polling:** 10min minimum via `useBackgroundRefresh`
- **Recommendations:** None — well-structured

### ProductionAnalytics (682 lines)
- **Status:** ⚠️ Large file, heavy Recharts imports
- **Optimization:** Now lazy-loaded via `React.lazy()`
- **Recommendations:**
  - Consider splitting chart types into sub-components
  - Memoize chart data transforms

### StationDetailView
- **Status:** ✅ Acceptable
- **Recommendations:** None

---

## 2. Queue Components

### useQueue Hook (605 lines)
- **Status:** ⚠️ Large hook — candidate for React Query migration
- **Optimizations applied:**
  - Debounced realtime handler (500ms)
  - `document.hidden` guard
  - Optimistic updates on `updateItem` with rollback
- **Recommendations:**
  - Migrate to React Query (`useQuery` + `useMutation`)
  - Extract `syncStationStatus` to shared utility
  - **Phase:** 5 (see `component-performance-phases.md`)

### QueueItemDetailDialog (1,311 lines)
- **Status:** 🔴 CRITICAL — largest component in project
- **Violations:** Imports `useUserOrganization` directly (PRD 11 §5 violation)
- **Recommendations:**
  - Split into 6 sub-components (header, status controls, comments/history/routing/NCR tabs)
  - Lazy-load routing and NCR tab contents
  - Replace `useUserOrganization` → `useOrgContext`
  - **Phase:** 1 (OrgContext fix) + 3 (extraction)

### QueueKanbanBoard
- **Status:** ✅ Acceptable
- **Recommendations:** Virtualize columns if >50 items (Phase 6)

---

## 3. Admin Components

### Admin Page (365 lines)
- **Status:** ✅ Optimized
- **Optimizations applied:**
  - 20+ admin tab components lazy-loaded via `React.lazy()`
  - Each tab wrapped in `<Suspense>` with skeleton fallback
- **Recommendations:** None — well-optimized

### Individual Admin Panels
| Component | Lines | Status | Notes |
|-----------|-------|--------|-------|
| UserManagement | ~300 | ✅ | |
| WorkOrderManagement | 653 | ⚠️ | Extract table + detail panel (Phase 4) |
| OrganizationOversight | ~250 | ✅ | |
| ActivityLogs | ~200 | ✅ | |
| MachineMonitorPanel | 439 | ⚠️ | Lazy-load detail modals (Phase 7) |
| ShopFloorDisplayManagement | 446 | ⚠️ | Lazy-load create/edit dialogs (Phase 7) |

---

## 4. Shared Hooks

| Hook | Caching | Realtime | Debounced | Visibility-Aware | Notes |
|------|---------|----------|-----------|-------------------|-------|
| `useUserOrganization` | React Query (5min stale) | ❌ | N/A | N/A | Org data rarely changes |
| `useStations` | React Query (30s stale) | ✅ | ✅ 500ms | ✅ | 15min poll fallback |
| `useHandoffRecords` | React Query (30s stale) | ✅ | ✅ 500ms | ✅ | 15min poll fallback |
| `useShiftStats` | React Query (60s stale) | ❌ | N/A | N/A | |
| `useSmartAlerts` | React Query (60s stale) | ❌ | N/A | ✅ | Single RPC call |
| `useQueue` | useState | ✅ | ✅ 500ms | ✅ (hidden check) | Candidate for React Query migration |
| `useOperatorSessions` | `useBackgroundRefresh` | ❌ | N/A | N/A | 10min interval |
| `useAppSettings` | useState | ❌ | N/A | N/A | Low-frequency reads |

---

## 5. Context Providers

| Provider | Data Source | Re-render Impact | Status |
|----------|-----------|------------------|--------|
| `OrgProvider` | `useUserOrganization` (React Query) | Low — 5min stale | ✅ |
| `TeamProvider` | Derives from `OrgContext` | Low | ✅ |
| `AuthProvider` | Supabase auth state | Low — event-driven | ✅ |
| `ActAsProvider` | Local state | Minimal | ✅ |
| `OnboardingProvider` | Supabase query | Low | ✅ |

---

## 6. Bundle Analysis

### Code-Split Boundaries
- ✅ `ShopFloorDisplay` — lazy-loaded in `App.tsx`
- ✅ `ProductionAnalytics` — lazy-loaded in `SupervisorDashboard`
- ✅ 20+ admin panels — lazy-loaded in `Admin.tsx`

### Heavy Dependencies
| Package | Size Impact | Used In | Notes |
|---------|------------|---------|-------|
| `recharts` | ~200KB | `ProductionAnalytics` | Now lazy-loaded |
| `react-joyride` | ~80KB | Onboarding only | Consider lazy-loading |
| `exceljs` | ~150KB | `BulkUploadDialog` | Already lazy-loaded |
| `react-markdown` | ~50KB | Help pages | Only in help routes |
| `qrcode.react` | ~20KB | Invite system | Small impact |

---

## 7. Performance Metrics Target

| Metric | Target | Current Strategy |
|--------|--------|-----------------|
| Dashboard mount queries | ≤ 8 | OrgContext dedup + React Query |
| Time to interactive | < 2s | Code splitting + lazy loading |
| Smart alerts load | < 200ms | Single server-side RPC |
| Status change feedback | < 100ms | Optimistic updates |
| Background CPU (hidden tab) | ~0 | Visibility API + paused polling |
| Admin page initial load | < 1s | 20+ components lazy-loaded |

---

## 8. Future Optimization Candidates

| Priority | Item | Trigger |
|----------|------|---------|
| Medium | Migrate `useQueue` to React Query | When queue becomes a performance bottleneck |
| Medium | Virtualize station list | When orgs exceed 50+ stations |
| Low | Lazy-load `react-joyride` | Bundle size optimization pass |
| Low | Add realtime connection status indicator | User feedback requests |
| Low | Server-side pagination for admin logs | When log volume exceeds 1000 rows |

---

## 9. Completed Optimization Phases

| Phase | Description | Impact | Status |
|-------|-------------|--------|--------|
| 1 | Eliminate duplicate queries | ~60% fewer mount queries | ✅ |
| 2 | React Query migration | Caching + dedup + stale-while-revalidate | ✅ |
| 3 | Debounce & visibility | Reduced background load | ✅ |
| 4 | Server-side alert computation | 8 queries → 1 RPC | ✅ |
| 5 | Optimistic updates & error handling | Instant UI feedback | ✅ |
| 6 | Bundle & render optimization | Lazy loading + memoization | ✅ |

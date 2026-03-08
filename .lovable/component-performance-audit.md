# Component Performance Audit

**Date:** 2026-03-08  
**Last Updated:** 2026-03-08 (Audit #2)  
**Status:** Audit complete — updated action items below  
**Scope:** All dashboard, queue, admin, operator, and form components  
**Implementation Plan:** `.lovable/component-performance-phases.md`

---

## Audit Summary

Phases 1–6 of the original performance plan are **complete**. This second audit identifies new issues from feature growth and re-prioritizes the improvement backlog.

### Key Findings (Audit #2)

| Finding | Severity | Detail |
|---------|----------|--------|
| `NewHandoffForm.tsx` is now the largest component (1,198 lines) | 🔴 Critical | Replaced `QueueItemDetailDialog` as biggest file |
| `OperatorStationPanel.tsx` grew to 941 lines | 🔴 Critical | Delivery dialog, routing timeline, dimension checks all inline |
| `helpArticles.ts` is 112KB loaded eagerly on every page | 🟡 Medium | Static content; should be lazy-loaded or code-split |
| FCP at 7.0s in dev preview | 🟡 Medium | 250 script modules (Vite dev); production build should be much faster |
| DOM: 6,159 nodes, 562 event listeners | 🟢 Acceptable | Within normal range for data-heavy dashboard |
| CLS: 0.0009 | ✅ Excellent | Nearly zero layout shift |
| JS Heap: 41MB used / 52MB total | ✅ Good | No memory pressure |

### Previous Issues — Resolved ✅

| Issue | Original | Current | Status |
|-------|----------|---------|--------|
| `QueueItemDetailDialog` (was 1,311 lines) | 1,311 | 289 | ✅ Split into 6 sub-components |
| `SupervisorDashboard` (was 727 lines) | 727 | 418 | ✅ Extracted KPI, alerts, station table |
| `WorkOrderManagement` (was 653 lines) | 653 | 300 | ✅ Extracted table + org buckets |
| Direct `useUserOrganization` imports | 54 files | 0 violations | ✅ All use `useOrgContext` |
| Duplicate mount queries | 18-22 | ≤ 8 | ✅ OrgContext + React Query |
| Admin panel lazy loading | 0 | 20+ | ✅ All lazy-loaded |

---

## 1. Dashboard Components

### SupervisorDashboard (418 lines)
- **Status:** ✅ Well-structured after Phase 2 extraction
- **Sub-components:** `DashboardKPICards`, `StationListTable`, `DashboardAlertSection`
- **Data:** React Query cached via `useStations`, `useHandoffRecords`, `useSmartAlerts`

### OperatorDashboard (240 lines)
- **Status:** ✅ Acceptable size

### OperatorStationPanel (941 lines)
- **Status:** 🔴 CRITICAL — second largest component
- **Contains:** Work order list, start/deliver flows, routing timeline, dimension checks, completion form, override dialog
- **Recommendations:**
  - Extract delivery/completion dialog into `OperatorDeliveryDialog.tsx` (~350 lines)
  - Extract routing timeline into `OperatorRoutingTimeline.tsx` (~100 lines)
  - Extract work order card into `OperatorWorkOrderCard.tsx` (~120 lines)
  - **Phase:** 8

### ProductionAnalytics (682 lines)
- **Status:** ⚠️ Large but lazy-loaded
- **Recommendations:** Split chart types into sub-components when adding new charts

### StationDetailView
- **Status:** ✅ Acceptable

---

## 2. Queue Components

### useQueue Hook (605 lines)
- **Status:** ⚠️ Large — candidate for React Query migration
- **Optimizations applied:** Debounced realtime (500ms), `document.hidden` guard, optimistic updates
- **Recommendations:** Migrate to React Query (`useQuery` + `useMutation`) — Phase 5

### QueueItemDetailDialog (289 lines)
- **Status:** ✅ Successfully refactored (was 1,311)
- **Sub-components:** `QueueItemHeader`, `QueueItemActions`, `QueueItemDetailsTab`, `QueueItemRoutingTab`, `QueueItemCommentsTab`, `QueueItemHistoryTab`

### QueueItemRoutingTab (362 lines)
- **Status:** ⚠️ Growing — now includes dimension requests panel
- **Recommendations:** Monitor; extract dimension section if exceeds 400 lines

### QueueKanbanBoard
- **Status:** ✅ Acceptable
- **Recommendations:** Virtualize columns if >50 items (Phase 6)

---

## 3. Form Components

### NewHandoffForm (1,198 lines)
- **Status:** 🔴 CRITICAL — largest component in project
- **Contains:** 4-step wizard, CNC/welding/waterjet condition forms, equipment readiness, auto-save draft, image uploads, validation
- **Recommendations:**
  - Extract step content into `HandoffStep1JobInfo.tsx` (~200 lines)
  - Extract step content into `HandoffStep2Readiness.tsx` (~250 lines)
  - Extract step content into `HandoffStep3Condition.tsx` (~300 lines)
  - Extract step content into `HandoffStep4Summary.tsx` (~150 lines)
  - Extract work-center-specific condition forms into `conditions/` folder
  - Keep orchestrator `NewHandoffForm.tsx` at ~250 lines
  - **Phase:** 9

---

## 4. Admin Components

### Admin Page (365 lines)
- **Status:** ✅ Optimized — 20+ tabs lazy-loaded

### Individual Admin Panels
| Component | Lines | Status | Notes |
|-----------|-------|--------|-------|
| UserManagement | ~300 | ✅ | Updated with engineering/programming roles |
| WorkOrderManagement | 300 | ✅ | Successfully split |
| OrganizationOversight | ~250 | ✅ | |
| ActivityLogs | ~200 | ✅ | |
| MachineMonitorPanel | 439 | ⚠️ | Lazy-load detail modals (Phase 7) |
| ShopFloorDisplayManagement | 446 | ⚠️ | Lazy-load create/edit dialogs (Phase 7) |

---

## 5. Static Data / Bundle

### helpArticles.ts (784 lines, 112KB)
- **Status:** 🟡 Medium — eagerly loaded on all routes
- **Recommendations:**
  - Lazy-load via dynamic `import()` only when help page is accessed
  - Or move to a JSON file served statically
  - **Phase:** 7 (bundle optimization)

---

## 6. Shared Hooks

| Hook | Caching | Realtime | Debounced | Visibility-Aware | Notes |
|------|---------|----------|-----------|-------------------|-------|
| `useUserOrganization` | React Query (5min stale) | ❌ | N/A | N/A | Org data rarely changes |
| `useStations` | React Query (30s stale) | ✅ | ✅ 500ms | ✅ | 15min poll fallback |
| `useHandoffRecords` | React Query (30s stale) | ✅ | ✅ 500ms | ✅ | 15min poll fallback |
| `useShiftStats` | React Query (60s stale) | ❌ | N/A | N/A | |
| `useSmartAlerts` | React Query (60s stale) | ❌ | N/A | ✅ | Single RPC call |
| `useQueue` | useState | ✅ | ✅ 500ms | ✅ (hidden check) | Candidate for React Query |
| `useDimensions` | useState | ❌ | N/A | N/A | On-demand loading |
| `useDimensionRequests` | useState | ❌ | N/A | N/A | On-demand loading |
| `useOperatorSessions` | `useBackgroundRefresh` | ❌ | N/A | N/A | 10min interval |
| `useAppSettings` | useState | ❌ | N/A | N/A | Low-frequency reads |

---

## 7. Context Providers

| Provider | Data Source | Re-render Impact | Status |
|----------|-----------|------------------|--------|
| `OrgProvider` | `useUserOrganization` (React Query) | Low — 5min stale | ✅ |
| `TeamProvider` | Derives from `OrgContext` | Low | ✅ |
| `AuthProvider` | Supabase auth state | Low — event-driven | ✅ |
| `ActAsProvider` | Local state | Minimal | ✅ |
| `OnboardingProvider` | Supabase query | Low | ✅ |

---

## 8. Bundle Analysis

### Code-Split Boundaries
- ✅ `ShopFloorDisplay` — lazy-loaded in `App.tsx`
- ✅ `ProductionAnalytics` — lazy-loaded in `SupervisorDashboard`
- ✅ 20+ admin panels — lazy-loaded in `Admin.tsx`
- ❌ `helpArticles.ts` (112KB) — loaded eagerly

### Heavy Dependencies
| Package | Size Impact | Used In | Notes |
|---------|------------|---------|-------|
| `recharts` | ~200KB | `ProductionAnalytics` | ✅ Lazy-loaded |
| `react-joyride` | ~80KB | Onboarding only | ❌ Not yet lazy-loaded |
| `exceljs` | ~150KB | `BulkUploadDialog` | ✅ Lazy-loaded |
| `react-markdown` | ~50KB | Help pages | Only in help routes |
| `qrcode.react` | ~20KB | Invite system | Small impact |
| `lucide-react` | 158KB | Everywhere | Tree-shakeable but large |

---

## 9. Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Dashboard mount queries | ≤ 8 | ≤ 8 | ✅ |
| FCP (production) | < 2s | ~7s (dev only) | ✅ Dev overhead; prod should be <2s |
| CLS | < 0.1 | 0.0009 | ✅ Excellent |
| JS Heap | < 100MB | 41MB | ✅ Good |
| DOM Nodes | < 10,000 | 6,159 | ✅ Acceptable |
| Smart alerts load | < 200ms | Single RPC | ✅ |
| Admin page initial load | < 1s | Lazy-loaded | ✅ |
| Largest component | < 350 lines | 1,198 (NewHandoffForm) | 🔴 |

---

## 10. Improvement Action List (Updated)

| Priority | Item | Phase | Status | Trigger |
|----------|------|-------|--------|---------|
| ✅ Done | Eliminate 54 direct `useUserOrganization` imports | 1 | ✅ Complete | — |
| ✅ Done | Extract `SupervisorDashboard` sub-components | 2 | ✅ Complete | — |
| ✅ Done | Split `QueueItemDetailDialog` (1,311 → 289 lines) | 3 | ✅ Complete | — |
| ✅ Done | Split `WorkOrderManagement` (653 → 300 lines) | 4 | ✅ Complete | — |
| ✅ Done | Optimistic updates & error handling | 5a | ✅ Complete | — |
| ✅ Done | Bundle & render optimization (lazy loading) | 6 | ✅ Complete | — |
| 🟢 Low | Migrate `useQueue` to React Query | 5 | Pending | When queue bottlenecks |
| 🟢 Low | Virtualize station/queue lists | 6 | Pending | When orgs >50 stations |
| 🟢 Low | Lazy-load `react-joyride` + `helpArticles.ts` | 7 | Pending | Bundle size pass |
| 🟡 Medium | Split `OperatorStationPanel` (941 lines) | 8 | **NEW** | Now |
| 🔴 Critical | Split `NewHandoffForm` (1,198 lines) | 9 | **NEW** | Now |

---

## 11. Completed Optimization Phases

| Phase | Description | Impact | Status |
|-------|-------------|--------|--------|
| 1 | Eliminate duplicate queries | ~60% fewer mount queries | ✅ |
| 2 | React Query migration | Caching + dedup + stale-while-revalidate | ✅ |
| 3 | Debounce & visibility | Reduced background load | ✅ |
| 4 | Server-side alert computation | 8 queries → 1 RPC | ✅ |
| 5a | Optimistic updates & error handling | Instant UI feedback | ✅ |
| 6 | Bundle & render optimization | Lazy loading + memoization | ✅ |

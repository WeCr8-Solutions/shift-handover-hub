# Component Performance — Implementation Phases

**Date:** 2026-03-08  
**Status:** Active — Phase 1 ready for implementation  
**Tracks:** `.lovable/component-performance-audit.md`

---

## Overview

This document defines actionable implementation phases derived from the Component Performance Audit. Each phase targets a specific category of optimization with measurable outcomes.

---

## Phase 1 — Eliminate Direct `useUserOrganization` Imports (CRITICAL)

**Priority:** 🔴 Critical  
**Estimated Impact:** ~54 files violating PRD 11 §5 standard  
**Target:** All hooks and components that call `useUserOrganization()` directly instead of `useOrgContext()`

### Problem
54 files import `useUserOrganization` directly, causing redundant 3-query waterfalls per instance. PRD 11 mandates using `useOrgContext()` from `OrgProvider`.

### Affected Files (by category)

**Components (direct violations):**
| File | Lines | Current Import | Fix |
|------|-------|---------------|-----|
| `QueueItemDetailDialog.tsx` | 1,311 | `useUserOrganization` | → `useOrgContext` |
| `TeamSelector.tsx` | ~80 | `useUserOrganization` | → `useOrgContext` |
| `TeamStationManager.tsx` | ~380 | `useUserOrganization` | → `useOrgContext` |
| `InviteCodeGenerator.tsx` | ~85 | `useUserOrganization` | → `useOrgContext` |
| `SeedTestDataButton.tsx` | ~30 | `useUserOrganization` | → `useOrgContext` |
| `CreateQueueItemDialog.tsx` | ~50 | `useUserOrganization` | → `useOrgContext` |
| `StationManualMachineEntry.tsx` | ~110 | `useUserOrganization` | → `useOrgContext` |

**Hooks (need OrgContext or parameter injection):**
| Hook | Lines | Fix Strategy |
|------|-------|-------------|
| `useLoadBalancer.ts` | ~25 | Accept `orgId` param or use `useOrgContext` |
| `useShopFloorDisplays.ts` | ~30 | Accept `orgId` param or use `useOrgContext` |
| `useUSPersonDeclaration.ts` | ~30 | Use `useOrgContext` |

### Implementation Steps
1. For each component: replace `import { useUserOrganization }` → `import { useOrgContext } from "@/contexts/OrgContext"`
2. Replace `const { organization } = useUserOrganization()` → `const { organization } = useOrgContext()`
3. For hooks that can't use context (called outside OrgProvider): accept `organizationId` as parameter
4. Verify no `useUserOrganization` imports remain outside of `OrgContext.tsx` and `useUserOrganization.ts`

### Success Criteria
- [ ] 0 direct `useUserOrganization` imports outside `OrgContext.tsx`
- [ ] Dashboard mount queries reduced from current to target (≤ 8)
- [ ] No regressions in existing tests

---

## Phase 2 — Extract SupervisorDashboard Sub-Components

**Priority:** 🟡 Medium  
**Estimated Impact:** 727-line file → 4 focused components  
**Target:** `src/components/dashboard/SupervisorDashboard.tsx`

### Extraction Plan

| New Component | Approx Lines | Responsibility |
|--------------|-------------|---------------|
| `DashboardKPICards.tsx` | ~120 | KPI card grid (active stations, handoffs, alerts, parts) |
| `StationListTable.tsx` | ~200 | Station table with status badges, operator info, actions |
| `DashboardAlertSection.tsx` | ~80 | Alert summary wrapper around `SmartAlertPanel` |
| `SupervisorDashboard.tsx` (reduced) | ~300 | Composition + state coordination |

### Implementation Steps
1. Extract KPI computation `useMemo` blocks + card rendering into `DashboardKPICards`
2. Extract station table (including sorting, filtering) into `StationListTable`
3. Extract alert collapsible section into `DashboardAlertSection`
4. Update barrel export in `src/components/dashboard/` if applicable
5. Add render tests for each extracted component

### Success Criteria
- [ ] `SupervisorDashboard.tsx` < 350 lines
- [ ] Each sub-component independently testable
- [ ] No visual regressions

---

## Phase 3 — Split QueueItemDetailDialog

**Priority:** 🟡 Medium  
**Estimated Impact:** 1,311-line file → 5+ focused components  
**Target:** `src/components/queue/QueueItemDetailDialog.tsx`

### Problem
Largest component in the project. Contains routing management, NCR management, comments, history, and status controls all in one file.

### Extraction Plan

| New Component | Approx Lines | Lazy-Load? |
|--------------|-------------|------------|
| `QueueItemHeader.tsx` | ~80 | No |
| `QueueItemStatusControls.tsx` | ~150 | No |
| `QueueItemCommentsTab.tsx` | ~200 | Yes |
| `QueueItemHistoryTab.tsx` | ~150 | Yes |
| `QueueItemRoutingTab.tsx` | ~250 | Yes |
| `QueueItemNCRTab.tsx` | ~200 | Yes |
| `QueueItemDetailDialog.tsx` (reduced) | ~300 | No — orchestrator |

### Implementation Steps
1. Extract each tab content into its own component
2. Lazy-load tab contents that import heavy dependencies (NCR, Routing)
3. Replace `useUserOrganization` → `useOrgContext` (Phase 1 dependency)
4. Update barrel export `src/components/queue/index.ts`
5. Co-locate test files

### Success Criteria
- [ ] `QueueItemDetailDialog.tsx` < 350 lines
- [ ] Routing + NCR tabs lazy-loaded
- [ ] All existing dialog tests pass

---

## Phase 4 — Split WorkOrderManagement

**Priority:** 🟡 Medium  
**Estimated Impact:** 653-line file → 3 focused components  
**Target:** `src/components/admin/WorkOrderManagement.tsx`

### Extraction Plan

| New Component | Approx Lines | Notes |
|--------------|-------------|-------|
| `WorkOrderTable.tsx` | ~200 | Table view with sorting/filtering |
| `WorkOrderDetailPanel.tsx` | ~150 | Detail view / edit form |
| `WorkOrderManagement.tsx` (reduced) | ~300 | Orchestrator + state |

### Success Criteria
- [ ] `WorkOrderManagement.tsx` < 350 lines
- [ ] Sub-dialogs lazy-loaded where heavy

---

## Phase 5 — Migrate `useQueue` to React Query

**Priority:** 🟢 Low (trigger: when queue becomes performance bottleneck)  
**Estimated Impact:** Better caching, dedup, stale-while-revalidate for queue data  
**Target:** `src/hooks/useQueue.ts` (605 lines)

### Current State
- Uses `useState` + `useEffect` for data fetching
- Has optimistic updates with rollback (Phase 5 of performance plan)
- Debounced realtime handler (500ms)
- `document.hidden` guard

### Migration Plan
1. Replace `useState` items with `useQuery` for fetching
2. Replace manual optimistic updates with React Query `onMutate` / `onError` rollback
3. Use `useMutation` for create/update/delete
4. Maintain existing realtime subscription → `queryClient.invalidateQueries`
5. Set `staleTime: 30_000`, `refetchIntervalInBackground: false`

### Success Criteria
- [ ] All queue CRUD operations use `useMutation`
- [ ] Automatic request dedup across components
- [ ] Existing optimistic update behavior preserved
- [ ] Queue tests pass

---

## Phase 6 — Virtualize Large Lists

**Priority:** 🟢 Low (trigger: orgs exceed 50+ stations or 100+ queue items)  
**Target:** Station list in `SupervisorDashboard`, queue columns in `QueueKanbanBoard`

### Plan
1. Add `@tanstack/react-virtual` dependency
2. Virtualize station table rows (only render visible)
3. Virtualize kanban column cards
4. Maintain drag-and-drop compatibility

### Success Criteria
- [ ] Smooth scrolling with 200+ items
- [ ] No visual regressions at < 50 items

---

## Phase 7 — Lazy-Load Heavy Dependencies

**Priority:** 🟢 Low  
**Target:** `react-joyride` (~80KB), sub-dialogs in admin panels

### Plan
1. Lazy-load `react-joyride` in `OnboardingProvider` (only needed during guided tours)
2. Lazy-load create/edit dialogs in `ShopFloorDisplayManagement` (446 lines)
3. Lazy-load detail modals in `MachineMonitorPanel` (439 lines)

### Success Criteria
- [ ] Initial bundle reduced by ~80KB (joyride)
- [ ] Admin panels load sub-dialogs on demand

---

## Implementation Schedule

| Phase | Priority | Dependency | Est. Effort |
|-------|----------|-----------|-------------|
| 1 | 🔴 Critical | None | Medium (54 files) |
| 2 | 🟡 Medium | Phase 1 (for OrgContext) | Small |
| 3 | 🟡 Medium | Phase 1 (for OrgContext) | Medium |
| 4 | 🟡 Medium | None | Small |
| 5 | 🟢 Low | Phase 1 | Large |
| 6 | 🟢 Low | Phase 2, 3 | Medium |
| 7 | 🟢 Low | None | Small |

---

## Metrics Dashboard

| Metric | Current | Phase 1 Target | Final Target |
|--------|---------|---------------|-------------|
| Direct `useUserOrganization` imports | 54 files | 0 | 0 |
| Largest component (lines) | 1,311 | 1,311 | < 350 |
| Dashboard mount queries | ≤ 8 | ≤ 6 | ≤ 5 |
| Queue data layer | useState | useState | React Query |
| Virtualized lists | 0 | 0 | 2+ |
| Lazy-loaded heavy deps | 3 | 3 | 5+ |

---

## Cross-References

- **Audit:** `.lovable/component-performance-audit.md`
- **Performance Report:** `.lovable/performance-enhancement-report.md`
- **Component Standards:** `.lovable/prd/11-component-standards.md` (§5 Data Layer Rules)
- **Service Architecture:** `docs/mermaid/be__service_arch__v01.mmd`
- **Dashboard Sequence:** `docs/mermaid/seq__dashboard_load__v01.mmd`

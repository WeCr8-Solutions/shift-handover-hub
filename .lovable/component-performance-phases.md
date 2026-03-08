# Component Performance — Implementation Phases

**Date:** 2026-03-08  
**Last Updated:** 2026-03-08 (Post-Audit #2)  
**Status:** Phases 1–6 complete. Phases 7–9 defined.  
**Tracks:** `.lovable/component-performance-audit.md`

---

## Overview

This document defines actionable implementation phases derived from the Component Performance Audit. Each phase targets a specific category of optimization with measurable outcomes.

---

## Phase 1 — Eliminate Direct `useUserOrganization` Imports ✅ COMPLETE

**Impact:** ~60% reduction in mount-time queries  
**Result:** 0 direct imports remaining (was 54)

---

## Phase 2 — Extract SupervisorDashboard Sub-Components ✅ COMPLETE

**Impact:** 727 → 418 lines  
**Result:** Extracted `DashboardKPICards`, `StationListTable`, `DashboardAlertSection`

---

## Phase 3 — Split QueueItemDetailDialog ✅ COMPLETE

**Impact:** 1,311 → 289 lines  
**Result:** Extracted `QueueItemHeader`, `QueueItemActions`, `QueueItemDetailsTab`, `QueueItemRoutingTab`, `QueueItemCommentsTab`, `QueueItemHistoryTab`

---

## Phase 4 — Split WorkOrderManagement ✅ COMPLETE

**Impact:** 653 → 300 lines  
**Result:** Extracted `WorkOrderTable`, `WorkOrderOrgBuckets`

---

## Phase 5 — Migrate `useQueue` to React Query

**Priority:** 🟢 Low (trigger: when queue becomes performance bottleneck)  
**Target:** `src/hooks/useQueue.ts` (605 lines)

### Current State
- Uses `useState` + `useEffect` for data fetching
- Has optimistic updates with rollback
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

---

## Phase 6 — Virtualize Large Lists

**Priority:** 🟢 Low (trigger: orgs exceed 50+ stations or 100+ queue items)

### Plan
1. Add `@tanstack/react-virtual` dependency
2. Virtualize station table rows
3. Virtualize kanban column cards
4. Maintain drag-and-drop compatibility

### Success Criteria
- [ ] Smooth scrolling with 200+ items
- [ ] No visual regressions at < 50 items

---

## Phase 7 — Lazy-Load Heavy Dependencies & Static Data

**Priority:** 🟢 Low  
**Target:** `react-joyride` (~80KB), `helpArticles.ts` (112KB), admin sub-dialogs

### Plan
1. Lazy-load `react-joyride` in `OnboardingProvider` (only needed during guided tours)
2. Lazy-load `helpArticles.ts` via dynamic `import()` — only load when help page is accessed
3. Lazy-load create/edit dialogs in `ShopFloorDisplayManagement` (446 lines)
4. Lazy-load detail modals in `MachineMonitorPanel` (439 lines)

### Success Criteria
- [ ] Initial bundle reduced by ~190KB (joyride + helpArticles)
- [ ] Admin panels load sub-dialogs on demand

---

## Phase 8 — Split OperatorStationPanel (NEW)

**Priority:** 🟡 Medium  
**Estimated Impact:** 941-line file → 4 focused components  
**Target:** `src/components/dashboard/OperatorStationPanel.tsx`

### Extraction Plan

| New Component | Approx Lines | Responsibility |
|--------------|-------------|---------------|
| `OperatorDeliveryDialog.tsx` | ~350 | Completion form, qty accounting, dimension gating, override |
| `OperatorRoutingTimeline.tsx` | ~100 | Horizontal routing step visualization |
| `OperatorWorkOrderCard.tsx` | ~120 | Individual work order card with start/deliver actions |
| `OperatorStationPanel.tsx` (reduced) | ~350 | Orchestrator + station header + kanban |

### Implementation Steps
1. Extract the `AlertDialog` delivery/completion flow into `OperatorDeliveryDialog`
2. Extract the routing timeline (scrollable step circles) into `OperatorRoutingTimeline`
3. Extract individual work order rendering into `OperatorWorkOrderCard`
4. Pass callbacks via props; keep state coordination in parent
5. Add render tests for extracted components

### Success Criteria
- [ ] `OperatorStationPanel.tsx` < 400 lines
- [ ] Each sub-component independently testable
- [ ] No visual regressions

---

## Phase 9 — Split NewHandoffForm (NEW)

**Priority:** 🔴 Critical  
**Estimated Impact:** 1,198-line file → 6 focused components  
**Target:** `src/components/NewHandoffForm.tsx`

### Problem
Largest component in the project. Contains a 4-step wizard with work-center-specific condition forms, readiness checklists, auto-save draft logic, image uploads, and validation — all in one file.

### Extraction Plan

| New Component | Approx Lines | Lazy-Load? |
|--------------|-------------|------------|
| `handoff/HandoffStepJobInfo.tsx` | ~200 | No |
| `handoff/HandoffStepReadiness.tsx` | ~250 | No |
| `handoff/HandoffStepCondition.tsx` | ~150 | No (orchestrator for conditions) |
| `handoff/HandoffStepSummary.tsx` | ~150 | No |
| `handoff/conditions/CNCConditionForm.tsx` | ~120 | Yes |
| `handoff/conditions/WeldingConditionForm.tsx` | ~80 | Yes |
| `handoff/conditions/WaterJetConditionForm.tsx` | ~60 | Yes |
| `handoff/conditions/GenericConditionForm.tsx` | ~60 | Yes |
| `NewHandoffForm.tsx` (reduced) | ~250 | No — orchestrator + step navigation + draft save |

### Implementation Steps
1. Create `src/components/handoff/` directory
2. Extract each wizard step into its own component
3. Extract work-center-specific condition forms into `handoff/conditions/`
4. Lazy-load condition forms (only loaded when that work center type is selected)
5. Keep step navigation, auto-save draft, and form state coordination in parent
6. Extract shared types/constants into `handoff/types.ts`

### Success Criteria
- [ ] `NewHandoffForm.tsx` < 300 lines
- [ ] Condition forms lazy-loaded by work center type
- [ ] Auto-save draft still works across steps
- [ ] All existing handoff tests pass

---

## Implementation Schedule

| Phase | Priority | Status | Est. Effort |
|-------|----------|--------|-------------|
| 1 | 🔴 Critical | ✅ Complete | — |
| 2 | 🟡 Medium | ✅ Complete | — |
| 3 | 🟡 Medium | ✅ Complete | — |
| 4 | 🟡 Medium | ✅ Complete | — |
| 5 | 🟢 Low | Pending | Large |
| 6 | 🟢 Low | Pending | Medium |
| 7 | 🟢 Low | Pending | Small |
| 8 | 🟡 Medium | **NEW** | Medium |
| 9 | 🔴 Critical | **NEW** | Large |

---

## Metrics Dashboard

| Metric | Original | After Phases 1-6 | Current | Target |
|--------|----------|-----------------|---------|--------|
| Direct `useUserOrganization` imports | 54 | 0 | 0 | 0 |
| Largest component (lines) | 1,311 | 289 | 1,198 (different file) | < 350 |
| Dashboard mount queries | 18-22 | ≤ 8 | ≤ 8 | ≤ 5 |
| Queue data layer | useState | useState | useState | React Query |
| Lazy-loaded heavy deps | 0 | 3 | 3 | 5+ |
| CLS | — | — | 0.0009 | < 0.1 |
| JS Heap | — | — | 41MB | < 100MB |

---

## Cross-References

- **Audit:** `.lovable/component-performance-audit.md`
- **Performance Report:** `.lovable/performance-enhancement-report.md`
- **Component Standards:** `.lovable/prd/11-component-standards.md` (§5 Data Layer Rules)
- **Service Architecture:** `docs/mermaid/be__service_arch__v01.mmd`
- **Dashboard Sequence:** `docs/mermaid/seq__dashboard_load__v01.mmd`

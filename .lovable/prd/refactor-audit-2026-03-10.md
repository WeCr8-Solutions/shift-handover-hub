# Refactor & Token Audit — 2026-03-10

**Status:** Active  
**Scope:** Remaining hardcoded colors (110 files, ~1,965 instances) + oversized components  
**Previous Work:** Batches 1–5 complete, shared `status-colors.ts` utility created, `AppWindowChrome` extracted

---

## Part A: Remaining Hardcoded Color Instances

### Summary

| Category | Files | Instances | Priority |
|---|---|---|---|
| **P0 — Core App Components** | 12 | ~550 | Must fix — user-facing, frequent |
| **P1 — Settings & Admin** | 10 | ~200 | Should fix — admin-facing |
| **P2 — Feature Pages (marketing)** | 15 | ~180 | Nice to have — mostly `text-green-500` checkmarks |
| **P3 — Type Definitions** | 2 | ~30 | Should fix — config files leaking raw colors |
| **P4 — Queue/Kanban Item Badges** | 4 | ~80 | Should fix — ERP/quote badge colors |

---

### P0 — Core App Components (12 files, ~550 instances)

#### 1. `src/components/StationCard.tsx` — **150 instances, 961 lines**
**THE #1 PROBLEM FILE.** Contains:
- Local `getPriorityColor()` (lines 482–488) — duplicates `status-colors.ts`
- Local `getItemStatus()` (lines 491–504) — duplicates `status-colors.ts`
- ~60 inline hardcoded colors for delivery sections (`border-red-500`, `bg-orange-500/20`, `text-amber-700`, `text-white`)
- Delivery flash section (lines 546–577) — 20+ raw colors
- Incoming items section (lines 601–640) — 20+ raw colors
- Completed items section — 15+ raw colors

**Token replacements needed:**
| Current | Token |
|---|---|
| `text-red-600`, `border-red-500/50`, `bg-red-500/10` | `text-status-critical`, `border-status-critical/50`, `bg-status-critical/10` |
| `text-orange-600`, `border-orange-500/50`, `bg-orange-500/10` | `text-priority-urgent`, `border-priority-urgent/50`, `bg-priority-urgent/10` |
| `text-amber-600`, `border-amber-500/50`, `bg-amber-500/10` | `text-warning`, `border-warning/50`, `bg-warning/10` |
| `bg-green-500/10 text-green-600` | `bg-status-ok/10 text-status-ok` |
| `bg-blue-500/10 text-blue-600` | `bg-status-waiting/10 text-status-waiting` |
| `bg-purple-500/10 text-purple-600` | `bg-role-org-owner/10 text-role-org-owner` |
| `text-white` on colored bg | `text-primary-foreground` |
| `bg-red-600`, `bg-orange-600`, `bg-amber-600` | `bg-status-critical`, `bg-priority-urgent`, `bg-warning` |

**DRY opportunity:** Delete local `getPriorityColor()` and `getItemStatus()`, import from `status-colors.ts`.

---

#### 2. `src/components/queue/WorkOrderAlertTile.tsx` — **~80 instances, 675 lines**
Contains 7 alert blocks (lines 369–530) each with hardcoded `bg-red-500/10 border-red-500/30 text-red-600` patterns.

**Token replacements needed:**
| Alert Type | Current Colors | Token |
|---|---|---|
| Overdue | `bg-red-500/10 border-red-500/30 text-red-500 text-red-600` | `bg-status-critical/10 border-status-critical/30 text-status-critical` |
| On Hold | `bg-amber-500/10 border-amber-500/30 text-amber-500 text-amber-700` | `bg-warning/10 border-warning/30 text-warning` |
| Stale (≥5d) | `bg-red-500/10` → critical, else `bg-amber-500/10` | Conditional `status-critical` / `warning` |
| High Priority | `bg-red-500/10 text-red-500 animate-pulse text-red-600` | `bg-status-critical/10 text-status-critical` |
| No Operator | `bg-purple-500/10 border-purple-500/30 text-purple-500 text-purple-700` | `bg-role-org-owner/10 border-role-org-owner/30 text-role-org-owner` |
| Over Time | Same red/amber conditional | Same conditional tokens |
| Bottleneck | `bg-orange-500/10 border-orange-500/30 text-orange-500 text-orange-700` | `bg-priority-urgent/10 border-priority-urgent/30 text-priority-urgent` |
| In Progress | `bg-green-500/10 border-green-500/30` | `bg-status-ok/10 border-status-ok/30` |
| Needs Delivery | `border-red-500 bg-red-500/10` / orange / amber by priority | Priority tokens |
| Routing dots | `bg-green-500` / `bg-blue-500 animate-pulse` | `bg-status-ok` / `bg-status-waiting` |
| Completed by | `text-green-600` | `text-status-ok` |
| Over time bar | `[&>div]:bg-red-500` | `[&>div]:bg-status-critical` |
| Remaining text | `text-red-500` | `text-status-critical` |

**DRY opportunity:** Extract an `<AlertBlock severity="critical|warning|info">` sub-component that wraps the repeated `p-2.5 rounded-lg bg-{token}/10 border border-{token}/30` pattern — used 7+ times identically.

---

#### 3. `src/components/queue/QueueKanbanBoard.tsx` — **~25 instances, 295 lines**
- Quote badge: `border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10` → New `--item-type-quote` token or use `warning`
- ERP badge: `border-purple-500/50 text-purple-600 dark:text-purple-400 bg-purple-500/10` → `border-role-org-owner/50 text-role-org-owner bg-role-org-owner/10`
- Overdue row: `border-red-300 bg-red-50/50 dark:bg-red-900/10` → `border-status-critical/30 bg-status-critical/5`

---

#### 4. `src/components/queue/QueueListView.tsx` — **~8 instances**
Same quote/ERP badge patterns as KanbanBoard.

---

#### 5. `src/components/queue/QueueItemHeader.tsx` — **~10 instances**
Same duplicated patterns.

---

#### 6. `src/components/dashboard/userStatus.ts` — **~12 instances**
Config object uses raw Tailwind colors:
| Current | Token |
|---|---|
| `bg-green-500`, `text-green-400`, `border-green-500/50` | `bg-status-ok`, `text-status-ok`, `border-status-ok/50` |
| `bg-amber-500`, `text-amber-400`, `border-amber-500/50` | `bg-warning`, `text-warning`, `border-warning/50` |
| `bg-blue-500`, `text-blue-400`, `border-blue-500/50` | `bg-status-waiting`, `text-status-waiting`, `border-status-waiting/50` |

HSL hardcoded values (`hsl(142, 71%, 45%)`) should reference CSS variables instead.

---

#### 7–12. Other Queue/Alert files with remaining colors
- `src/components/queue/PartSpecsSection.tsx` — minor
- `src/components/queue/PlanningAssistantModal.tsx` — minor
- `src/components/admin/WorkOrderTable.tsx` — status color map
- `src/components/admin/ActivityLogs.tsx` — activity type colors
- `src/components/updates/UpdateCard.tsx` — `text-green-600 border-green-300` acknowledged badge
- `src/components/compliance/MFAEnrollmentGate.tsx` — `bg-blue-500/10 text-blue-500`

---

### P1 — Settings & Admin (10 files, ~200 instances)

| File | Lines | Instances | Key Issues |
|---|---|---|---|
| `src/components/settings/BillingSettings.tsx` | 405 | ~15 | `text-amber-500` crown, `border-green-500/30 bg-green-500/10` feature dots, `text-amber-600` warning |
| `src/components/settings/OrganizationSettings.tsx` | ~350 | ~8 | ITAR amber badges |
| `src/components/admin/MachineMonitorPanel.tsx` | ~300 | ~10 | Connection status colors |
| `src/components/admin/IssuesManagement.tsx` | ~250 | ~8 | Status color map |
| `src/components/admin/PerformanceUpdatesReview.tsx` | ~200 | ~8 | Review status colors |
| `src/components/admin/SystemUpdatesManager.tsx` | ~300 | ~10 | Category colors |
| `src/components/admin/DatabaseFunctionsReference.tsx` | ~200 | ~4 | Category badge colors |
| `src/components/admin/DevIssueQueue.tsx` | ~350 | ~12 | Priority + status maps |
| `src/components/settings/MyIssuesPanel.tsx` | ~250 | ~6 | Severity colors |
| `src/components/dimensions/DimensionRequestsPanel.tsx` | ~200 | ~6 | Amber pending badges |

---

### P2 — Feature/Marketing Pages (15 files, ~180 instances)

Most feature pages repeat the same `text-green-500` checkmark icon pattern. These can all be replaced with `text-status-ok`.

| File | Instances | Pattern |
|---|---|---|
| `ShiftHandoffSoftware.tsx` | 4 | `text-green-500` checkmarks |
| `ProductionControl.tsx` | 4 | Same |
| `ManufacturingVisibility.tsx` | 4 | Same |
| `DowntimeTracking.tsx` | 4 | Same |
| `MachineTimeTracking.tsx` | 4 | Same |
| `MachineShopSoftware.tsx` | 4 | Same |
| `WorkOrderTracking.tsx` | 3 | Gradient `via-blue-400` |
| `QualityManagement.tsx` | 3 | Same gradient |
| `TeamCollaboration.tsx` | 3 | Same gradient |
| `CNCOperatorTools.tsx` | 3 | Same gradient |
| `AIPlanningAssistant.tsx` | 8 | `text-amber-400`, `border-amber-500/40`, gradient `from-amber-400` |
| `DigitalExpeditor.tsx` | 4 | Various |
| `ProductionScheduling.tsx` | 4 | Various |
| `ManufacturingOversight.tsx` | 4 | Various |
| `ShiftHandoff.tsx` | 4 | Various |

**DRY opportunity:** The hero gradient `bg-gradient-to-r from-primary via-blue-400 to-primary` is used in 6+ feature pages — extract a `<GradientHeading>` component or define a `--hero-gradient` CSS variable.

---

### P3 — Type Definitions with Raw Colors (2 files, ~30 instances)

#### `src/types/machine.ts` (lines 156–177)
`MACHINE_STATE_CONFIG` and `ALARM_SEVERITY_CONFIG` contain hardcoded classes:
| Current | Token |
|---|---|
| `text-green-600 / bg-green-500` | `text-status-ok / bg-status-ok` |
| `text-blue-600 / bg-blue-500` | `text-status-waiting / bg-status-waiting` |
| `text-red-600 / bg-red-500` | `text-status-critical / bg-status-critical` |
| `text-purple-600 / bg-purple-500` | `text-role-org-owner / bg-role-org-owner` |
| `text-amber-600 / bg-amber-500` | `text-warning / bg-warning` |
| `text-cyan-600 / bg-cyan-500` | `text-info / bg-info` |

#### `src/components/dashboard/userStatus.ts` (see P0 #6 above)

---

### P4 — Queue Item Type Badges (4 files, ~80 instances)

Quote/ERP/WorkOrder badges are repeated identically across:
1. `QueueKanbanBoard.tsx`
2. `QueueListView.tsx`
3. `QueueItemHeader.tsx`
4. `StationCard.tsx`

**DRY opportunity:** Extract `<ItemTypeBadge type="quote|work_order|erp" />` component.

---

## Part B: Oversized Components Needing Decomposition

### Tier 1 — Critical (800+ lines, multiple responsibilities)

| File | Lines | Responsibilities | Recommended Split |
|---|---|---|---|
| **`StationCard.tsx`** | **961** | Station display, queue fetching, delivery sections, incoming items, machine context, queue items list, priority badges | Split into: `StationCardHeader`, `StationDeliveryAlert`, `StationIncomingAlert`, `StationQueueList`, `StationActiveJob`. Extract data fetching into `useStationCardData()` hook. |
| **`RoutingTemplateManagement.tsx`** | **911** | Template CRUD, step editing, reordering, dialog forms, table rendering | Split into: `RoutingTemplateTable`, `RoutingTemplateForm`, `RoutingStepEditor`. Extract `useRoutingTemplates()` hook. |
| **`WorkOrderRoutingEditor.tsx`** | **860** | Routing CRUD, step drag/reorder, template application, station assignment, dialog forms | Split into: `RoutingStepCard`, `RoutingStepForm`, `RoutingToolbar`. Share `OPERATION_TYPES` config with `RoutingTemplateManagement`. |
| **`OrganizationMemberManager.tsx`** | **798** | Member list, invite dialog, role management, remove member, search/filter | Split into: `MemberTable`, `InviteMemberDialog`, `MemberRoleSelect`. Extract `useMemberActions()` hook. |

### Tier 2 — Large (500–800 lines)

| File | Lines | Recommended Action |
|---|---|---|
| `WorkOrderAlertTile.tsx` | 675 | Extract alert blocks into `<WOAlertBlock>` sub-component, routing timeline into `<RoutingTimeline>`. Extract `useWOAlertData()` hook for the fetch logic. |
| `ERPConnectorSettings.tsx` | ~750 | Already refactored in previous batch. Verify no regressions. |
| `OperatorWorkflowPanel.tsx` | ~600 | Already refactored. Verify. |
| `RoleScopeTestRunner.tsx` | ~800 | Already refactored. Verify. |
| `BillingSettings.tsx` | 405 | Extract `<PlanCard>`, `<UsageMeter>`, `<FeatureGrid>` sub-components. |
| `QueueCalendarView.tsx` | ~350 | OK size but shares color logic — ensure uses shared utils. |

### Tier 3 — Duplication Between Files

| Duplicated Logic | Files | Fix |
|---|---|---|
| `getPriorityColor()` | `StationCard.tsx`, `WorkOrderAlertTile.tsx` (+ previously fixed queue files) | Delete local copies, import from `status-colors.ts` |
| `getItemStatus()` | `StationCard.tsx` | Move to `status-colors.ts` as `getQueueItemStatusStyle()` |
| `OPERATION_TYPES` config | `WorkOrderRoutingEditor.tsx`, `RoutingTemplateManagement.tsx` | Extract to `src/lib/routing-config.ts` |
| Quote/ERP/WO badge markup | 4 queue files + StationCard | Extract `<ItemTypeBadge>` component |
| Hero gradient text | 6+ feature pages | Extract `<GradientHeading>` or CSS variable |
| Benefit checkmark list | 6 feature pages | Extract `<BenefitList>` component |

---

## Part C: Proposed New Shared Utilities

### 1. `src/components/queue/AlertBlock.tsx`
```tsx
// Eliminates 7+ duplicated alert block patterns in WorkOrderAlertTile
interface AlertBlockProps {
  severity: "critical" | "warning" | "info" | "success";
  icon: React.ElementType;
  title: string;
  detail?: string;
  animate?: boolean;
}
```

### 2. `src/components/queue/ItemTypeBadge.tsx`
```tsx
// Eliminates 4+ duplicated badge patterns
interface ItemTypeBadgeProps {
  type: "quote" | "work_order" | "erp";
  size?: "sm" | "md";
}
```

### 3. `src/lib/routing-config.ts`
```ts
// Shared between WorkOrderRoutingEditor + RoutingTemplateManagement
export const OPERATION_TYPES = [...];
export const DEFAULT_ROUTING_STEPS = [...];
```

### 4. Update `src/types/machine.ts`
Replace raw colors in `MACHINE_STATE_CONFIG` and `ALARM_SEVERITY_CONFIG` with semantic tokens.

### 5. Update `src/components/dashboard/userStatus.ts`
Replace raw colors with semantic tokens + CSS variable references for HSL values.

---

## Execution Priority

| Phase | Scope | Impact | Est. Effort |
|---|---|---|---|
| **Phase 1** | `StationCard.tsx` — decompose + tokenize (961 lines → ~5 files) | Highest — most colors, most complex | Large |
| **Phase 2** | `WorkOrderAlertTile.tsx` — extract AlertBlock + tokenize | High — 7 repeated patterns | Medium |
| **Phase 3** | `userStatus.ts` + `machine.ts` — tokenize configs | Medium — config files | Small |
| **Phase 4** | Queue badge dedup — `ItemTypeBadge` component | Medium — 4 files | Small |
| **Phase 5** | `RoutingTemplateManagement` + `WorkOrderRoutingEditor` — share config + decompose | Medium — 1,771 combined lines | Large |
| **Phase 6** | `OrganizationMemberManager` — decompose | Medium — 798 lines | Medium |
| **Phase 7** | Feature pages — tokenize checkmarks + extract gradient | Low — marketing | Small |
| **Phase 8** | Settings/Admin — tokenize remaining | Low — admin-only | Small |

---

## Acceptance Criteria

- [ ] Zero local `getPriorityColor()` functions (all from `status-colors.ts`)
- [ ] Zero hardcoded Tailwind color classes in P0 files
- [ ] `StationCard.tsx` under 300 lines
- [ ] `WorkOrderAlertTile.tsx` under 300 lines
- [ ] `OPERATION_TYPES` defined once, shared
- [ ] All `MACHINE_STATE_CONFIG` and `USER_STATUS_CONFIG` use semantic tokens
- [ ] `ItemTypeBadge` component used in all queue views
- [ ] No visual regressions

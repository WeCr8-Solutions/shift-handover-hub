# PRD: Color Token Migration Plan

**Date:** 2026-03-10  
**Status:** Active  
**Total Files:** ~134 files with hardcoded colors  
**Total Instances:** ~2,371 hardcoded color references  

---

## Migration Rules

### Replacement Map

| Hardcoded Color | Semantic Token | Use Case |
|---|---|---|
| `text-green-500`, `text-green-400` | `text-status-ok` | Success indicators, checkmarks, running status |
| `bg-green-500`, `bg-green-400` | `bg-status-ok` | Success badges, running dots |
| `bg-green-500/10 text-green-600` | `bg-status-ok/10 text-status-ok` | Light success badges |
| `text-red-500`, `text-red-400` | `text-status-critical` | Error states, critical alerts |
| `bg-red-500`, `bg-red-400` | `bg-status-critical` | Critical badges, down status |
| `bg-red-500/10 text-red-600` | `bg-status-critical/10 text-status-critical` | Light error badges |
| `text-yellow-500`, `text-yellow-400` | `text-status-warning` | Warning states, setup status |
| `bg-yellow-500`, `bg-yellow-400` | `bg-status-warning` | Warning badges, setup dots |
| `bg-yellow-500/10 text-yellow-600` | `bg-status-warning/10 text-status-warning` | Light warning badges |
| `text-blue-500`, `text-blue-400` | `text-status-waiting` | Info states, in-progress, queued |
| `bg-blue-500`, `bg-blue-400` | `bg-status-waiting` | Info badges, waiting dots |
| `bg-blue-500/10 text-blue-600` | `bg-status-waiting/10 text-status-waiting` | Light info badges |
| `text-orange-500`, `text-orange-400` | `text-priority-urgent` | Urgent priority |
| `bg-orange-500` | `bg-priority-urgent` | Urgent badges |
| `bg-orange-500/10 text-orange-600` | `bg-priority-urgent/10 text-priority-urgent` | Light urgent badges |
| `text-amber-500`, `text-amber-600` | `text-warning` | Amber warnings (≈ yellow semantics) |
| `bg-amber-500`, `bg-amber-500/10` | `bg-warning`, `bg-warning/10` | Amber badges |
| `text-purple-500`, `text-purple-600` | `text-role-org-owner` | Role colors, queued status |
| `bg-purple-500` | `bg-role-org-owner` | Role badges |
| `text-indigo-500` | `text-role-org-admin` | Org admin role |
| `text-gray-500`, `text-gray-400` | `text-muted-foreground` | Muted/disabled text |
| `bg-gray-500`, `bg-gray-400` | `bg-muted` | Muted backgrounds |
| `bg-gray-500/10 text-gray-500` | `bg-muted text-muted-foreground` | Muted badges |
| `text-white` | `text-primary-foreground` or `text-foreground` | Text on colored bg / on dark bg |
| `bg-white` | `bg-background` or `bg-card` | Backgrounds |
| `bg-black/80` | `bg-background/80` or `bg-surface-overlay` | Overlays (keep in ui primitives) |
| `text-black` | `text-primary-foreground` | Text on light/colored bg |
| `text-sky-500` | `text-role-supervisor` | Supervisor role |
| `text-emerald-500`, `bg-emerald-500` | `text-status-ok`, `bg-status-ok` | Success (emerald ≈ green) |
| `text-cyan-500`, `bg-cyan-500` | `text-info`, `bg-info` | Info/purchasing |
| `text-teal-500`, `bg-teal-500` | `text-info`, `bg-info` | Info/receiving |
| `text-violet-500`, `bg-violet-500` | `text-role-org-owner`, `bg-role-org-owner` | Violet ≈ purple semantics |
| `text-rose-500`, `bg-rose-500` | `text-destructive`, `bg-destructive` | Destructive actions |
| Window decoration dots (`bg-red-400/60`, `bg-yellow-400/60`, `bg-green-400/60`) | **Keep as-is** | Decorative macOS-style dots (not semantic) |

### Special Cases

- **`text-white` on colored badges** → `text-primary-foreground` (dark text on bright bg)
- **Operation type colors** (quote, engineering, purchasing, etc.) → Add `--op-*` tokens in Phase 2 if needed, or use `chart-*` palette
- **`border-green-500/30`** → `border-status-ok/30`
- **Opacity variants** (`/10`, `/30`, `/50`) → Same token with opacity: `bg-status-ok/10`

---

## Batch Migration Plan

### Batch 1: Core Status Components (P0 — 15 files)
> Priority badges, status indicators, and alert systems used across the entire app

| # | File | Instances | Key Patterns |
|---|---|---|---|
| 1 | `src/components/queue/QueueItemHeader.tsx` | ~10 | Priority color function with `bg-red/orange/yellow/blue/gray + text-white` |
| 2 | `src/components/queue/QueueKanbanBoard.tsx` | ~10 | Same priority color function duplicated |
| 3 | `src/components/queue/QueueCalendarView.tsx` | ~10 | Same priority color function duplicated |
| 4 | `src/components/queue/QueueListView.tsx` | ~8 | Status color mapping |
| 5 | `src/components/queue/WorkOrderAlertTile.tsx` | ~15 | Priority + status colors |
| 6 | `src/components/alerts/SmartAlertCard.tsx` | ~50 | Alert type → severity color matrix |
| 7 | `src/components/operator/OperatorStationKanban.tsx` | ~8 | Priority dots |
| 8 | `src/components/operator/StationWorkOrderPicker.tsx` | ~10 | Priority badges |
| 9 | `src/components/updates/UpdateCard.tsx` | ~15 | Category + impact + status colors |
| 10 | `src/components/updates/SystemStatusIndicator.tsx` | ~6 | Operational/degraded/outage |
| 11 | `src/pages/ShopFloorDisplay.tsx` | ~8 | Priority color map |
| 12 | `src/components/settings/MyIssuesPanel.tsx` | ~6 | Severity colors |
| 13 | `src/components/admin/DevIssueQueue.tsx` | ~12 | Priority + status color maps |
| 14 | `src/components/admin/IssuesManagement.tsx` | ~8 | Status colors |
| 15 | `src/components/admin/PerformanceUpdatesReview.tsx` | ~8 | Review status colors |

**DRY opportunity:** Extract a shared `getPriorityColor()` and `getStatusColor()` utility into `src/lib/color-tokens.ts` — currently duplicated in 4+ queue files.

---

### Batch 2: Dashboard & Production Components (P0 — 12 files)
> Station cards, machine monitors, production metrics

| # | File | Instances | Key Patterns |
|---|---|---|---|
| 1 | `src/components/StationCard.tsx` | ~20 | `text-white` on priority badges, delivery icons |
| 2 | `src/components/admin/MachineMonitorPanel.tsx` | ~10 | Connection status (`text-green-500` wifi) |
| 3 | `src/components/ncr/NCRApprovalPanel.tsx` | ~8 | `bg-red-500/10 text-red-700` scrap warning |
| 4 | `src/components/routing/OutsideProcessingManager.tsx` | ~8 | Due date badges, calendar icons |
| 5 | `src/components/routing/WorkOrderRoutingEditor.tsx` | ~15 | Operation type colors |
| 6 | `src/components/admin/RoutingTemplateManagement.tsx` | ~12 | Same operation type colors (duplicated) |
| 7 | `src/components/admin/WorkOrderTable.tsx` | ~8 | Status color mapping |
| 8 | `src/components/admin/ActivityLogs.tsx` | ~10 | Activity type colors |
| 9 | `src/components/admin/SystemUpdatesManager.tsx` | ~10 | Category colors |
| 10 | `src/components/dimensions/DimensionRequestsPanel.tsx` | ~6 | Amber pending badges |
| 11 | `src/components/dimensions/DimensionCheckForm.tsx` | ~4 | Critical dimension badges |
| 12 | `src/components/JobPerformanceUpdateForm.tsx` | ~12 | Update type + priority colors |

**DRY opportunity:** Extract operation type color config into a shared constant — duplicated between `WorkOrderRoutingEditor` and `RoutingTemplateManagement`.

---

### Batch 3: Marketing & Mock Components (P1 — 12 files)
> Landing page mock dashboards and marketing previews

| # | File | Instances | Key Patterns |
|---|---|---|---|
| 1 | `src/components/marketing/MockAppPreviews.tsx` | ~15 | Status pills, machine dots |
| 2 | `src/components/marketing/MockUtilizationChart.tsx` | ~10 | Run/setup/idle/down legend |
| 3 | `src/components/marketing/MockExpeditorDashboard.tsx` | ~8 | Alert type colors |
| 4 | `src/components/marketing/MockWorkOrderTracker.tsx` | ~6 | Status dot/text pairs |
| 5 | `src/components/marketing/MockVisibilityDashboard.tsx` | ~8 | Station status colors |
| 6 | `src/components/marketing/MockProductionMetrics.tsx` | ~10 | Status + progress colors |
| 7 | `src/components/marketing/MockShiftTimeline.tsx` | ~3 | Window dots only |
| 8 | `src/components/marketing/MockScheduleCalendar.tsx` | ~3 | Window dots only |
| 9 | `src/components/marketing/MockOversightKPIs.tsx` | ~6 | KPI change indicators |
| 10 | `src/pages/features/DowntimeTracking.tsx` | ~4 | Benefit checkmarks |
| 11 | `src/pages/features/MachineTimeTracking.tsx` | ~4 | Benefit checkmarks |
| 12 | `src/pages/features/MachineShopSoftware.tsx` | ~4 | Benefit checkmarks |

**Note:** macOS window decoration dots (`bg-red-400/60`, `bg-yellow-400/60`, `bg-green-400/60`) are purely decorative — mark as exceptions, no migration needed.

---

### Batch 4: Role & Permission Components (P1 — 6 files)
> Role displays, permission matrices, org management

| # | File | Instances | Key Patterns |
|---|---|---|---|
| 1 | `src/components/admin/RolePermissionMatrix.tsx` | ~10 | Role header colors → `text-role-*` |
| 2 | `src/components/admin/RoleHierarchyTree.tsx` | ~8 | Role node colors → `bg-role-*` |
| 3 | `src/components/OrganizationMemberManager.tsx` | ~12 | Role badge colors |
| 4 | `src/components/settings/OrganizationSettings.tsx` | ~8 | Amber ITAR badges, blue team icons |
| 5 | `src/components/BulkUploadDialog.tsx` | ~6 | Result stats colors |
| 6 | `src/components/admin/DatabaseFunctionsReference.tsx` | ~4 | Category colors |

---

### Batch 5: Tools, Testing & Misc (P2 — 8 files)
> Testing panels, calculators, onboarding, pricing

| # | File | Instances | Key Patterns |
|---|---|---|---|
| 1 | `src/components/tools/ToleranceCalculator.tsx` | ~6 | Pass/warn/fail colors |
| 2 | `src/components/testing/RoleScopeTestRunner.tsx` | ~6 | Pass/fail icons |
| 3 | `src/components/testing/TestResultsPanel.tsx` | ~4 | Status icons |
| 4 | `src/components/onboarding/OrganizationSetup.tsx` | ~4 | Checkmark colors |
| 5 | `src/components/admin/NotificationQueueStatus.tsx` | ~4 | Status config colors |
| 6 | `src/components/admin/SeedTestDataButton.tsx` | ~2 | Amber note text |
| 7 | `src/pages/Pricing.tsx` | ~4 | Plan badges |
| 8 | `src/lib/workCenterIcons.tsx` | ~15 | Work center type colors → needs new `--wc-*` tokens or `chart-*` |

---

### Batch 6: Shared UI Primitives (P2 — 3 files)
> shadcn/ui base components — only change if clearly wrong

| # | File | Instances | Notes |
|---|---|---|---|
| 1 | `src/components/ui/alert-dialog.tsx` | ~2 | `bg-black/80` overlay — **keep or use `bg-surface-overlay`** |
| 2 | `src/components/ui/drawer.tsx` | ~2 | Same overlay pattern |
| 3 | `src/components/ui/dialog.tsx` | ~2 | Same overlay pattern |

**Decision:** These are shadcn defaults. Converting to `bg-surface-overlay` is optional but recommended for consistency.

---

## Shared Utilities to Extract (DRY)

### 1. `src/lib/status-colors.ts`
```ts
// Centralized color mappings — single source of truth
export function getPriorityColor(priority: string): string { ... }
export function getStatusColor(status: string): string { ... }
export function getMachineStateColor(state: string): string { ... }
export function getRoleColor(role: string): string { ... }

export const OPERATION_TYPE_COLORS = { ... } as const;
```

This replaces **4+ duplicated** `getPriorityColor` functions and **2 duplicated** operation type configs.

---

## Progress Tracker

| Batch | Files | Status | Notes |
|---|---|---|---|
| 1: Core Status | 15 | ⬜ TODO | Start here — highest impact |
| 2: Dashboard & Production | 12 | ⬜ TODO | |
| 3: Marketing & Mocks | 12 | ⬜ TODO | |
| 4: Role & Permissions | 6 | ⬜ TODO | |
| 5: Tools & Misc | 8 | ⬜ TODO | |
| 6: UI Primitives | 3 | ⬜ TODO | Optional |
| Shared Utilities | 1 | ⬜ TODO | Extract before Batch 1 |

---

## Acceptance Criteria

- [ ] Zero hardcoded Tailwind color classes in migrated files (except documented exceptions)
- [ ] All color mappings flow through CSS variables
- [ ] No duplicate `getPriorityColor` / status color functions
- [ ] Operation type colors defined once in shared config
- [ ] No visual regressions (colors render identically)

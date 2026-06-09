## Goal
Extend the URL-state pattern (`useUrlState` / `useUrlStateNumber`) so every tabbed panel, filter, and view-mode in the app survives Back, refresh, and deep-link — closing the gaps left after the Admin / Customer Success / Flyer Campaigns pass.

## Audit results

### Tier 1 — Top-level page tabs (highest impact, user explicitly hit these)
| File | Local state | Proposed URL key(s) |
|---|---|---|
| `src/pages/Settings.tsx` | `activeTab` | `tab` |
| `src/pages/Teams.tsx` | `activeTab` | `tab` |
| `src/pages/Queue.tsx` | `activeTab` (QueueTab) | `tab` (align w/ existing queue keys) |
| `src/pages/OperatorProfile.tsx` | `activeTab` + cert `filter` | `tab`, `cert` |
| `src/pages/Tools.tsx` | `category` | `cat` |
| `src/pages/Updates.tsx` | `category` | `cat` |
| `src/pages/admin/ManufacturingVisibility100Admin.tsx` | `tab` | `tab` |

### Tier 2 — Admin child panels (nested under `/admin?tab=…`)
Use a secondary key (`sub`, or panel-prefixed key) so they coexist with the parent `tab`.
| File | Local state | Proposed key(s) |
|---|---|---|
| `src/components/admin/OrgDetailView.tsx` | `activeTab` | `orgSub` |
| `src/components/admin/PromotionsHub.tsx` | `activeTab` | `promoSub` |
| `src/components/admin/WorkOrderManagement.tsx` | `statusFilter`, `selectedOrg` | `woStatus`, `woOrg` |
| `src/components/admin/UserManagement.tsx` | `selectedOrg` | `umOrg` |
| `src/components/admin/StationManagement.tsx` | `selectedOrg` | `smOrg` |
| `src/components/admin/MachineMonitorPanel.tsx` | `selectedOrg` | `mmOrg` |
| `src/components/admin/ActivityLogs.tsx` | `filter` | `act` |
| `src/components/admin/AdminAuditLog.tsx` | `categoryFilter` | `cat` |
| `src/components/admin/AuditHistoryCenter.tsx` | `range` | `range` |
| `src/components/admin/DataAccessLogs.tsx` | `filterTable`, `filterOp` | `tbl`, `op` |
| `src/components/admin/DevIssueQueue.tsx` | `filter` | `f` |
| `src/components/admin/EmailOperationsCenter.tsx` | `categoryFilter` | `cat` |
| `src/components/admin/IssuesManagement.tsx` | `statusFilter`, `severityFilter` | `s`, `sev` |
| `src/components/admin/LearnIdeasReview.tsx` | `statusFilter` | `s` |
| `src/components/admin/MachineLibraryManagement.tsx` | `filterManufacturer`, `filterType` | `mfr`, `type` |
| `src/components/admin/PerformanceUpdatesReview.tsx` | `statusFilter` | `s` |
| `src/components/admin/SystemUpdatesManager.tsx` | `filterCategory` | `cat` |
| `src/components/admin/UserJourneyDebugPanel.tsx` | `filterStatus` | `s` |
| `src/components/admin/CampaignMarketingGallery.tsx` | `kindFilter` | `kind` |
| `src/components/admin/ContactsExportTab.tsx` | `exportType` | `etype` |
| `src/components/admin/ConsoleLogViewer.tsx` | `levelFilter` | `lvl` |
| `src/components/admin/customer-success/CustomersLaunchpad.tsx` | `filter` | `f` |
| `src/components/admin/training-library/InspectionToolsCatalog.tsx` | `categorySlug`, `profession` | `cat`, `prof` |
| `src/components/admin/training-library/MachiningOperationsCatalog.tsx` | `categorySlug`, `profession`, `machine` | `cat`, `prof`, `mach` |
| `src/components/admin/brand-system/BrandVideoLibrary.tsx` | `filter` | `f` |

### Tier 3 — App-wide panels outside `/admin`
| File | Local state | Proposed key(s) |
|---|---|---|
| `src/components/alerts/SmartAlertPanel.tsx` | `typeFilter`, `sevFilter` | `t`, `sev` |
| `src/components/dashboard/ProductionAnalytics.tsx` | `shiftFilter` | `shift` |
| `src/components/dashboard/SupervisorDashboard.tsx` | `statusFilter` | `s` |
| `src/components/queue/QueueCalendarView.tsx` | `viewMode` (day/week/month) | `cal` |
| `src/components/work-orders/WorkOrderStatusList.tsx` | `stationFilter` | `station` |
| `src/components/station/MachineProfileMarketplace.tsx` | `activeTab`, `filterManufacturer`, `filterType` | `tab`, `mfr`, `type` |
| `src/components/oap/OapBrowseTemplatesDialog.tsx` | `vertical` | `vert` (dialog-scoped, optional) |
| `src/components/InviteCodeGenerator.tsx` | `activeTab` | `inviteTab` |
| `src/components/tools/TapDrillChart.tsx` | `tab` (thread family) | `thread` |

### Intentionally skipped
- `MarkdownEditor` edit/preview toggle — transient UI, not a "place I was".
- `ERPConnectorSettings` `newJoblineStatus` — form field, not view state.
- `LazyTabContent.test.tsx` — test fixture.
- Open/close booleans for dialogs, popovers, menus.
- `BlogAdmin` — already covered (draft persistence shipped earlier).

## Implementation approach

1. **Reuse existing primitive.** Every change is a one-line swap: `useState(default)` → `useUrlState<T>("key", default)`. No new hooks, no new deps.
2. **Key naming rules.**
   - Top-level page → short canonical key (`tab`, `cat`, `range`).
   - Admin child panel → panel-prefixed key (`woStatus`, `orgSub`, `promoSub`) so it coexists with `?tab=…` on `/admin`.
   - Never collide with existing keys already used by deep-linking (verify against `mem://technical/routing/deep-linking`).
3. **Defaults stay clean.** `useUrlState` already strips the param when value === default, so URLs only grow when the user actually changes something.
4. **Type safety.** For unions (e.g. `QueueTab`, `ShiftFilter`), pass the generic explicitly: `useUrlState<QueueTab>("tab", "all")`.
5. **No business-logic changes.** Pure presentation-state lift. Data hooks, RLS, queries untouched.
6. **Verify via build.** Rely on the harness build to catch type regressions; no manual `tsc` runs.

## Rollout order
1. Tier 1 (7 page-level tabs) — biggest UX win.
2. Tier 2 (admin child panels) — finishes the admin audit.
3. Tier 3 (operator/dashboard/marketplace) — wraps remaining surfaces.

Each tier is independent and shippable on its own.

## Out of scope
- Form-draft persistence for editors (Work Order create/edit, NCR, Handoff) — tracked separately under Phase 3 of `.lovable/navigation-state-rollout-plan.md`.
- Scroll-position work — already handled globally by `ScrollToTop` + `navigationMemory`.
- Cross-tab sync via `BroadcastChannel` — deferred.
- New Playwright specs per surface — can follow once the lifts are in.

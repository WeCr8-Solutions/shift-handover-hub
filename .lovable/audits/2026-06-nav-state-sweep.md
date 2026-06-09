# Navigation-State Sweep — 2026-06-09

Goal: every tab, filter, view-mode, and pagination control the user can change should survive Back, refresh, and deep-link sharing via URL search params.

Primitive: `useUrlState<T>(key, default)` from `src/hooks/useUrlState.ts` — strips the param when value === default so URLs only grow when the user actually changes something.

---

## URL-key registry

Keys are kept short and panel-scoped so multiple persisted panels can coexist on the same page (notably `/admin?tab=…&sub=…`).

### Global / top-level page keys
| Key | Used by | Values |
| --- | --- | --- |
| `tab` | `/admin`, `/teams`, `/queue`, `/tools` parent grids, `ManufacturingVisibility100Admin`, `MachineProfileMarketplace` | string |
| `view` | `/queue` (kanban/list/calendar) | `kanban` \| `list` \| `calendar` |
| `cat` | `/tools`, `/updates`, child filter panels with a single "category" axis | string |
| `sort` | `ManufacturingVisibility100Admin` | `recent` \| `score` \| `rank` |
| `ed` | `ManufacturingVisibility100Admin` (edition year) | string |
| `cert` | `OperatorProfile` certificate filter | `all` \| CertCategory |
| `thread` | `TapDrillChart` thread-family tab | ThreadTab |

### Admin child-panel keys (coexist with `?tab=…` on `/admin`)
| Key | Used by | Values |
| --- | --- | --- |
| `sub` | `CustomerSuccessPanel` | `customers` \| `concierge` \| `self-serve` |
| `orgSub` | `OrgDetailView` | string |
| `promoSub` | `PromotionsHub` | string |
| `flyerView` | `FlyerCampaigns` | string |
| `inviteTab` | `InviteCodeGenerator` | string |
| `woStatus`, `woOrg` | `WorkOrderManagement` | string |
| `umOrg` | `UserManagement` | string |
| `smOrg` | `StationManagement` | string |
| `mmOrg` | `MachineMonitorPanel` | string |
| `act` | `ActivityLogs` | ActivityType \| `all` |
| `tbl`, `op` | `DataAccessLogs` | string |
| `f` | `DevIssueQueue`, `CustomersLaunchpad`, `BrandVideoLibrary` | string |
| `s`, `sev` | `IssuesManagement`, `LearnIdeasReview`, `PerformanceUpdatesReview`, `UserJourneyDebugPanel`, `SupervisorDashboard` | string |
| `kind` | `CampaignMarketingGallery` | CampaignAssetKind \| `all` |
| `etype` | `ContactsExportTab` | ExportType |
| `lvl` | `ConsoleLogViewer` | LogLevel |
| `mfr`, `type` | `MachineLibraryManagement`, `MachineProfileMarketplace` | string |
| `prof`, `mach` | `InspectionToolsCatalog`, `MachiningOperationsCatalog` | string |

### App-wide non-admin keys
| Key | Used by | Values |
| --- | --- | --- |
| `alertType`, `alertSev` | `SmartAlertPanel` | SmartAlertType / SmartAlertSeverity \| `all` |
| `shift` | `ProductionAnalytics` | ShiftFilter |
| `station` | `WorkOrderStatusList` | string |
| `cal` | `QueueCalendarView` view-mode | `day` \| `week` \| `month` |

### Reserved (do not reuse for other surfaces)
- `tab`, `view`, `station`, `item`, `wo`, `type`, `status`, `assistant`, `action` on `/queue` (see `src/pages/Queue.tsx`).
- `tab` on `/admin` (top-level panel selector).
- `category` on `/blog`.

---

## Per-surface change log

### Tier 1 — Top-level page tabs
| File | State lifted | Verified |
| --- | --- | --- |
| `src/pages/Admin.tsx` | `activeTab` → `?tab` | ✓ |
| `src/pages/Teams.tsx` | `activeTab` → `?tab` | ✓ |
| `src/pages/Queue.tsx` | `activeTab` → `?tab`, `view` → `?view` (now writes back) | ✓ |
| `src/pages/Tools.tsx` | `category` → `?cat` | ✓ |
| `src/pages/Updates.tsx` | `category` → `?cat` | ✓ |
| `src/pages/OperatorProfile.tsx` | cert `filter` → `?cert` (main tab already URL-driven) | ✓ |
| `src/pages/admin/ManufacturingVisibility100Admin.tsx` | `tab`, `sort`, `edition` → `?tab`, `?sort`, `?ed` | ✓ |
| `src/pages/Settings.tsx` | **skipped** — already persists via location hash + `localStorage` | n/a |

### Tier 2 — Admin child panels
| File | State lifted |
| --- | --- |
| `src/components/admin/customer-success/CustomerSuccessPanel.tsx` | `tab` → `?sub` |
| `src/components/admin/FlyerCampaigns.tsx` | `activeView` → `?flyerView` |
| `src/components/admin/OrgDetailView.tsx` | `activeTab` → `?orgSub` |
| `src/components/admin/PromotionsHub.tsx` | `activeTab` → `?promoSub` |
| `src/components/admin/WorkOrderManagement.tsx` | `statusFilter`, `selectedOrg` → `?woStatus`, `?woOrg` |
| `src/components/admin/UserManagement.tsx` | `selectedOrg` → `?umOrg` |
| `src/components/admin/StationManagement.tsx` | `selectedOrg` → `?smOrg` |
| `src/components/admin/MachineMonitorPanel.tsx` | `selectedOrg` → `?mmOrg` |
| `src/components/admin/ActivityLogs.tsx` | `filter` → `?act` |
| `src/components/admin/AdminAuditLog.tsx` | `categoryFilter` → `?cat` |
| `src/components/admin/DataAccessLogs.tsx` | `filterTable`, `filterOp` → `?tbl`, `?op` |
| `src/components/admin/DevIssueQueue.tsx` | `filter` → `?f` |
| `src/components/admin/EmailOperationsCenter.tsx` | `categoryFilter` → `?cat` |
| `src/components/admin/IssuesManagement.tsx` | `statusFilter`, `severityFilter` → `?s`, `?sev` |
| `src/components/admin/LearnIdeasReview.tsx` | `statusFilter` → `?s` |
| `src/components/admin/MachineLibraryManagement.tsx` | `filterManufacturer`, `filterType` → `?mfr`, `?type` |
| `src/components/admin/PerformanceUpdatesReview.tsx` | `statusFilter` → `?s` |
| `src/components/admin/SystemUpdatesManager.tsx` | `filterCategory` → `?cat` |
| `src/components/admin/UserJourneyDebugPanel.tsx` | `filterStatus` → `?s` |
| `src/components/admin/CampaignMarketingGallery.tsx` | `kindFilter` → `?kind` |
| `src/components/admin/ContactsExportTab.tsx` | `exportType` → `?etype` |
| `src/components/admin/ConsoleLogViewer.tsx` | `levelFilter` → `?lvl` |
| `src/components/admin/customer-success/CustomersLaunchpad.tsx` | `filter` → `?f` |
| `src/components/admin/training-library/InspectionToolsCatalog.tsx` | `categorySlug`, `profession` → `?cat`, `?prof` |
| `src/components/admin/training-library/MachiningOperationsCatalog.tsx` | `categorySlug`, `profession`, `machine` → `?cat`, `?prof`, `?mach` |
| `src/components/admin/brand-system/BrandVideoLibrary.tsx` | `filter` → `?f` |
| `src/components/admin/AuditHistoryCenter.tsx` | **skipped** — already uses `setSearchParams` directly with explicit persist helper |

### Tier 3 — App-wide non-admin
| File | State lifted |
| --- | --- |
| `src/components/alerts/SmartAlertPanel.tsx` | `typeFilter`, `sevFilter` → `?alertType`, `?alertSev` |
| `src/components/dashboard/ProductionAnalytics.tsx` | `shiftFilter` → `?shift` |
| `src/components/dashboard/SupervisorDashboard.tsx` | `statusFilter` → `?s` |
| `src/components/queue/QueueCalendarView.tsx` | `viewMode` → `?cal` |
| `src/components/work-orders/WorkOrderStatusList.tsx` | `stationFilter` → `?station` |
| `src/components/station/MachineProfileMarketplace.tsx` | `activeTab`, `filterManufacturer`, `filterType` → `?tab`, `?mfr`, `?type` |
| `src/components/InviteCodeGenerator.tsx` | `activeTab` → `?inviteTab` |
| `src/components/tools/TapDrillChart.tsx` | `tab` → `?thread` |

---

## Intentionally NOT lifted (with reason)

| Surface | Reason |
| --- | --- |
| `src/components/admin/training-library/shared/MarkdownEditor.tsx` Edit/Preview | Transient editor toggle, not "place I was". |
| `src/components/tools/MrrCalculator.tsx`, `ThreadPitchCalculator.tsx` mode | Calculator input state — lives with the form, not navigation. |
| `src/components/settings/ERPConnectorSettings.tsx` | Form fields (`sapInstanceType`, `newJoblineStatus`), not view state. |
| `src/components/oap/OapBrowseTemplatesDialog.tsx` `vertical` | Lives inside a modal — dialog state shouldn't pollute the URL. |
| Open/close booleans for dialogs, popovers, menus, dropdowns | Same reason — transient UI. |
| `BlogAdmin` editor state | Already covered via `useDraftPersistence` (sessionStorage). |
| `Settings` page top-level tab | Already persisted via location hash + localStorage. |
| `AuditHistoryCenter` | Already syncs to `setSearchParams` with explicit helper. |

---

## Still pending (next sweeps)

### Form-draft persistence (Phase 3 of rollout plan)
- Work Order create / edit (`wo:new`, `wo:${id}`)
- NCR create (`ncr:new`, multi-step)
- Handoff form — fold existing auto-save into `useDraftPersistence`
- Profile editor — whitelisted fields only (no PII)
- Org settings sections

### Pagination / sort lifts on long lists
- `WorkOrderHistory`, `LearnIdeasReview`, `IssuesManagement`, `PerformanceUpdatesReview` — add `?page` and `?sort` via `useUrlStateNumber` / `useUrlState`.
- `Notifications` page filter + read state.

### Public / talent
- `/talent` search (`q`, `skill`, `location`, `page`, `sort`)
- `/handbook`, `/resources` index filters

### Test coverage
- `nav-state-admin-tabs.spec.ts`, `nav-state-queue.spec.ts`, `nav-state-teams.spec.ts`, `nav-state-analytics.spec.ts` (template: `e2e/nav-state-blog.spec.ts`).

---

## Verification checklist (per surface)

1. Open the panel, change a filter / tab.
2. Inspect URL — the param should appear.
3. Hard refresh — same view restored.
4. Reset filter to default — URL param disappears (no `?key=default` pollution).
5. Browser Back from a child detail returns with both filter AND scroll position intact (scroll handled globally by `ScrollToTop` + `navigationMemory`).

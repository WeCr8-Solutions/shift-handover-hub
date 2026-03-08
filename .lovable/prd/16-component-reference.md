# 16 — Component Reference

> Comprehensive catalog of all custom React components in the JobLine.ai application.
> Organized by functional domain with test status, access tier, and dependency mapping.

---

## 1  Purpose

This document provides a single-source inventory of every custom component, categorized by domain, with:
- File path and description
- Test coverage status (✅ tested / ❌ untested)
- Access tier (Public, Authenticated, Org-Scoped, Admin, Supervisor)
- Key props/dependencies

---

## 2  Component Domains

### 2.1  Queue Management (`src/components/queue/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `QueueKanbanBoard` | `QueueKanbanBoard.test.tsx` | ✅ 5 | Org-Scoped | Drag-drop kanban with 6 status columns |
| `QueueListView` | `QueueListView.test.tsx` | ✅ 5 | Org-Scoped | Tabular queue view with inline status change |
| `QueueFilters` | `QueueFilters.test.tsx` | ✅ 5 | Org-Scoped | Filter dropdowns for status/priority/type |
| `QueueCalendarView` | `QueueCalendarView.test.tsx` | ✅ 7 | Org-Scoped | Calendar-based due date view |
| `QueueStatsCards` | `QueueStatsCards.test.tsx` | ✅ 4 | Org-Scoped | Summary stat cards (total, active, overdue) |
| `QueueItemDetailDialog` | `QueueItemDetailDialog.handoff.test.tsx` | ✅ 3 | Org-Scoped | Full detail dialog with handoff integration |
| `QueueItemPreAdvanceValidation` | `QueueItemPreAdvanceValidation.test.ts` | ✅ 3 | Org-Scoped | Pre-advance routing validation logic |
| `QueueStateMachine` | `QueueStateMachine.test.ts` | ✅ 20 | Org-Scoped | Status transition rules & kanban drag validation |
| `CreateWorkOrderDialog` | — | ❌ | Org-Scoped | Multi-step WO creation with routing & part specs |
| `CreateQueueItemDialog` | — | ❌ | Org-Scoped | Generic queue item creation |
| `PartSpecsSection` | `PartSpecsSection.test.tsx` | ✅ 10 | Org-Scoped | Part specifications collapsible with catalog auto-fill |
| `RoutingSection` | — | ❌ | Org-Scoped | Routing step builder for WO creation |
| `WorkOrderAlertTile` | — | ❌ | Org-Scoped | Alert tile for overdue/stale WOs in list view |
| `PlanningAssistantModal` | — | ❌ | Org-Scoped | AI-powered planning suggestions |

### 2.2  Dashboard (`src/components/dashboard/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `OperatorDashboard` | — | ❌ | Authenticated | Operator's main view with check-in/handoff. Uses `useOrgContext()`, 10min background refresh. |
| `SupervisorDashboard` | `SupervisorDashboard.test.tsx` | ✅ 5 | Supervisor | Org-wide overview with station grid. Uses `useOrgContext()`. `ProductionAnalytics` lazy-loaded via `React.lazy()`. |
| `OperatorStationPanel` | `OperatorStationPanel.test.tsx` | ✅ 4 | Authenticated | Active station panel for checked-in operator |
| `StationCheckIn` | `StationCheckIn.test.tsx` | ✅ 4 | Authenticated | Station check-in/out flow |
| `StationDetailView` | — | ❌ | Org-Scoped | Detailed station view with active WO |
| `StationAlertTile` | — | ❌ | Org-Scoped | Alert indicators on station cards |
| `RefreshIndicator` | — | ❌ | Authenticated | Background refresh status indicator |
| `ProductionAnalytics` | `ProductionAnalytics.test.tsx` | ✅ 5 | Supervisor | Throughput/utilization charts. **Lazy-loaded** — defers ~200KB Recharts bundle. |
| `DashboardRefresh` | `DashboardRefresh.test.tsx` | ✅ 4 | Authenticated | Background refresh lifecycle |
| `DashboardErrorBoundary` | — | ❌ | Public | Class-based error boundary for dashboard sections. Catches render errors and shows retry UI instead of crashing the page. |

### 2.3  Handoff System (`src/components/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `HandoffCard` | `HandoffCard.test.tsx` | ✅ 6 | Org-Scoped | Handoff record card with status badge |
| `NewHandoffForm` | `NewHandoffForm.test.ts` | ✅ 4 | Authenticated | Handoff creation form with autofill |
| `ShiftStats` | `ShiftStats.test.tsx` | ✅ 3 | Org-Scoped | Running/Down/Recent handoff counts |

### 2.4  NCR & Quality (`src/components/ncr/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `NCRListView` | `NCRListView.test.tsx` | ✅ 7 | Org-Scoped | NCR table with status/disposition badges |
| `NCRApprovalPanel` | `NCRApprovalPanel.test.tsx` | ✅ 5 | Supervisor | Approve/reject pending NCRs |
| `CreateNCRDialog` | `CreateNCRDialog.test.tsx` | ✅ 7 | Org-Scoped | NCR creation with image upload |
| `QualityMetricsDashboard` | `QualityMetricsDashboard.test.tsx` | ✅ 5 | Org-Scoped | FPY, scrap rate, rework rate cards |
| `QuantitySummaryCard` | — | ❌ | Org-Scoped | Qty original/completed/scrap/rework summary |

### 2.5  Smart Alerts (`src/components/alerts/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `SmartAlertPanel` | `SmartAlertPanel.test.tsx` | ✅ 6 | Org-Scoped | Filterable alert panel (sidebar/full) |
| `SmartAlertCard` | `SmartAlertCard.test.tsx` | ✅ 8 | Org-Scoped | Individual alert card with severity styling |
| `SmartAlertSettings` | — | ❌ | Admin | Alert threshold configuration |

### 2.6  Operator Tools (`src/components/operator/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `OperatorStationKanban` | `OperatorStationKanban.test.tsx` | ✅ 5 | Authenticated | Station-scoped 3-column kanban |
| `StationWorkOrderPicker` | — | ❌ | Authenticated | WO selection for station context |
| `OperatorWorkflowPanel` | — | ❌ | Authenticated | Step-by-step WO workflow panel |

### 2.7  Routing (`src/components/routing/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `WorkOrderRoutingEditor` | — | ❌ | Org-Scoped | Multi-step routing builder with template support |
| `OutsideProcessingManager` | — | ❌ | Org-Scoped | External vendor routing management |

### 2.8  Station Components (`src/components/station/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `StationCard` | — | ❌ | Org-Scoped | Full station card with WO, operator, routing |
| `StationMachineContextDialog` | — | ❌ | Org-Scoped | Machine profile context attachment |
| `StationManualMachineEntry` | — | ❌ | Org-Scoped | Manual machine data entry |
| `StationManufacturerAttach` | — | ❌ | Org-Scoped | Manufacturer profile attachment |
| `MachineProfileMarketplace` | — | ❌ | Admin | Machine profile library browser |

### 2.9  Machine Monitoring (`src/components/machine/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `MachineStatusGrid` | — | ❌ | Org-Scoped | Grid of machine status tiles |
| `MachineCard` | — | ❌ | Org-Scoped | Individual machine status card |
| `AlarmFeed` | — | ❌ | Org-Scoped | Real-time alarm event feed |
| `MachineMonitoringGate` | — | ❌ | Org-Scoped | Entitlement gate for monitoring |

### 2.10  Settings (`src/components/settings/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `PartCatalogManager` | `PartCatalogManager.test.tsx` | ✅ 5 | Org-Scoped | Part catalog CRUD |
| `GeneralSettings` | — | ❌ | Org-Scoped | General org settings |
| `OrganizationSettings` | — | ❌ | Admin | Org config panel |
| `BillingSettings` | — | ❌ | Admin | Subscription/billing management |
| `ShiftSettings` | — | ❌ | Org-Scoped | Shift schedule configuration |
| `WorkCenterSettings` | — | ❌ | Org-Scoped | Work center type management |
| `NotificationSettings` | — | ❌ | Authenticated | User notification preferences |
| `ManufacturingSettings` | — | ❌ | Org-Scoped | Manufacturing config |
| `ERPConnectorSettings` | — | ❌ | Admin | ERP integration settings |
| `OnboardingSettings` | — | ❌ | Admin | Onboarding flow configuration |

### 2.11  Admin Components (`src/components/admin/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `UserManagement` | — | ❌ | Admin | User listing, role assignment |
| `TeamOversight` | — | ❌ | Admin | Team listing & membership |
| `OrganizationOversight` | — | ❌ | Admin | Org listing & management |
| `WorkOrderManagement` | — | ❌ | Admin | WO oversight & bulk ops |
| `WorkOrderHistory` | — | ❌ | Admin | Historical WO data |
| `StationManagement` | — | ❌ | Admin | Station CRUD |
| `ActivityLogs` | — | ❌ | Admin | Audit log viewer |
| `DataAccessLogs` | — | ❌ | Admin | Data access audit trail |
| `IssuesManagement` | — | ❌ | Admin | Issue tracker management |
| `DevIssueQueue` | — | ❌ | Admin | Dev issue priority queue |
| `DevSettingsPanel` | — | ❌ | Admin | Developer settings |
| `RLSHealthCheck` | — | ❌ | Admin | RLS policy health monitor |
| `RoleHierarchyTree` | — | ❌ | Admin | Visual role hierarchy |
| `RolePermissionMatrix` | — | ❌ | Admin | Permission matrix grid |
| `AdminStatsCards` | — | ❌ | Admin | Platform overview stats |
| `SeedTestDataButton` | — | ❌ | Admin | Test data seeder |
| `ChangelogManager` | — | ❌ | Admin | Changelog CRUD |
| `SystemUpdatesManager` | — | ❌ | Admin | System update management |
| `SmartAlertAdmin` | — | ❌ | Admin | Smart alert admin config |
| `RoutingTemplateManagement` | — | ❌ | Admin | Routing template CRUD |
| `MachineLibraryManagement` | — | ❌ | Admin | Machine library admin |
| `MachineMonitorPanel` | — | ❌ | Admin | Machine monitoring admin |
| `ShopFloorDisplayManagement` | — | ❌ | Admin | Shop floor display config |
| `PerformanceUpdatesReview` | — | ❌ | Admin | Performance update review |
| `UserJourneyDebugPanel` | — | ❌ | Admin | User journey debugging |
| `VisitorSurveyAnalytics` | — | ❌ | Admin | Visitor survey data |
| `ActAsBanner` | — | ❌ | Admin | Act-as impersonation banner |
| `DatabaseFunctionsReference` | — | ❌ | Admin | DB function docs |
| `EntitlementsReference` | — | ❌ | Admin | Entitlements docs |

### 2.12  Onboarding (`src/components/onboarding/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `WelcomeModal` | — | ❌ | Authenticated | First-time welcome dialog |
| `OrganizationSetup` | — | ❌ | Authenticated | Org creation wizard |
| `GuidedTour` | — | ❌ | Authenticated | React Joyride guided tour |
| `OnboardingProgress` | — | ❌ | Authenticated | Progress indicator |
| `OnboardingProvider` | — | ❌ | Authenticated | Context provider for onboarding state |
| `TourTriggerButton` | — | ❌ | Authenticated | Manual tour trigger |

### 2.13  Marketing & Landing (`src/components/marketing/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `MarketingNav` | — | ❌ | Public | Landing page navigation |
| `MarketingFooter` | — | ❌ | Public | Landing page footer |
| `LeadCaptureBar` | — | ❌ | Public | Email capture bar |
| `LeadCaptureModal` | — | ❌ | Public | Email capture modal |
| `AdPlacement` | — | ❌ | Public | Ad placement component |
| `VisitorSurveyModal` | — | ❌ | Public | Visitor survey popup |
| `MockAppPreviews` | — | ❌ | Public | App preview screenshots |
| `MockExpeditorDashboard` | — | ❌ | Public | Mock dashboard for marketing |
| `MockOperatorView` | — | ❌ | Public | Mock operator view |
| `MockOversightKPIs` | — | ❌ | Public | Mock KPI dashboard |
| `MockProductionMetrics` | — | ❌ | Public | Mock production charts |
| `MockScheduleCalendar` | — | ❌ | Public | Mock calendar view |
| `MockShiftTimeline` | — | ❌ | Public | Mock timeline |
| `MockShopFloorView` | — | ❌ | Public | Mock shop floor |
| `MockUtilizationChart` | — | ❌ | Public | Mock utilization chart |
| `MockVisibilityDashboard` | — | ❌ | Public | Mock visibility dashboard |
| `MockWorkOrderTracker` | — | ❌ | Public | Mock WO tracker |

### 2.14  Compliance (`src/components/compliance/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `MFAEnrollmentGate` | — | ❌ | Authenticated | MFA enforcement gate |
| `USPersonDeclarationGate` | — | ❌ | Authenticated | ITAR US person verification |

### 2.15  Help Center (`src/components/help/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `HelpSearch` | — | ❌ | Public | Help article search |
| `HelpSidebar` | — | ❌ | Public | Help category navigation |
| `ArticleContent` | — | ❌ | Public | Article renderer |
| `HelpBreadcrumb` | — | ❌ | Public | Breadcrumb navigation |
| `TableOfContents` | — | ❌ | Public | Article ToC |

### 2.16  Core Shared (`src/components/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `Header` | — | ❌ | Authenticated | App header with nav |
| `UserMenu` | — | ❌ | Authenticated | User dropdown menu |
| `NavLink` | — | ❌ | Authenticated | Navigation link |
| `StatusBadge` | `StatusBadge.test.tsx` | ✅ 12 | Public | Job state status badge |
| `TeamSelector` | — | ❌ | Authenticated | Team selection dropdown |
| `TeamManagement` | `TeamManagement.test.tsx` | ✅ 5 | Org-Scoped | Team CRUD & member management |
| `TeamStationManager` | — | ❌ | Org-Scoped | Station assignment within teams |
| `WorkCenterFilter` | — | ❌ | Org-Scoped | Work center type filter |
| `StationCard` | — | ❌ | Org-Scoped | Station overview card |
| `InviteCodeGenerator` | — | ❌ | Admin | Invite code creation |
| `InviteCodeRedemption` | — | ❌ | Authenticated | Invite code redemption |
| `InviteTeamMemberDialog` | — | ❌ | Org-Scoped | Team member invite dialog |
| `OrganizationMemberManager` | — | ❌ | Admin | Org member management |
| `BulkUploadDialog` | — | ❌ | Supervisor | Bulk data upload |
| `IssueReportDialog` | — | ❌ | Authenticated | Issue reporting dialog |
| `JobPerformanceUpdateForm` | — | ❌ | Authenticated | Job performance submission |
| `OperatorWorkflowPanel` | — | ❌ | Authenticated | Operator workflow steps |
| `SEOHead` | — | ❌ | Public | SEO meta tags |
| `AnalyticsProvider` | — | ❌ | Public | Analytics context |
| `BillingBanner` | — | ❌ | Authenticated | Subscription status banner |
| `EntitlementGate` | — | ❌ | Authenticated | Feature gating by plan |
| `ExpiredTrialGate` | — | ❌ | Authenticated | Trial expiration gate |
| `SharePromoDialog` | — | ❌ | Public | Referral promo dialog |
| `SocialShareModal` | — | ❌ | Public | Social sharing modal |
| `SupportJoblineModal` | — | ❌ | Public | Donation/support modal |
| `ReadinessChecklist` | — | ❌ | Admin | Production readiness checklist |

### 2.17  UI Primitives (`src/components/ui/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `Button` | `button.test.tsx` | ✅ 6 | Public | Button with variants |
| `SafeDeleteDialog` | — | ❌ | Authenticated | Confirmation dialog for destructive actions |
| *(40+ shadcn primitives)* | — | — | Public | Standard shadcn/ui components |

### 2.18  Testing (`src/components/testing/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `ProcessTestRunner` | — | ❌ | Admin | Process test execution |
| `RoleScopeTestRunner` | — | ❌ | Admin | Role/scope test execution |
| `TestCoverageCard` | — | ❌ | Admin | Coverage summary card |
| `TestHistoryList` | — | ❌ | Admin | Test run history |
| `TestResultsPanel` | — | ❌ | Admin | Test results display |
| `TestRunnerControls` | — | ❌ | Admin | Test runner controls |
| `TestSuiteSelector` | — | ❌ | Admin | Suite selection dropdown |

### 2.19  Updates (`src/components/updates/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `SystemStatusIndicator` | — | ❌ | Authenticated | System status dot |
| `UpdateAcknowledgeModal` | — | ❌ | Authenticated | Update acknowledgment dialog |
| `UpdateCard` | — | ❌ | Authenticated | System update card |
| `UpdateFilters` | — | ❌ | Authenticated | Update category filters |

### 2.20  Landing Demo (`src/components/landing/`)

| Component | Test File | Tests | Tier | Description |
|-----------|-----------|-------|------|-------------|
| `ShiftHandoffDemo` | — | ❌ | Public | Interactive handoff demo |

---

## 3  Test Coverage Summary

| Domain | Total | Tested | Coverage |
|--------|-------|--------|----------|
| Queue Management | 14 | 10 | 71% |
| Dashboard | 9 | 6 | 67% |
| Handoff | 3 | 3 | 100% |
| NCR & Quality | 5 | 4 | 80% |
| Smart Alerts | 3 | 2 | 67% |
| Operator Tools | 3 | 1 | 33% |
| Routing | 2 | 0 | 0% |
| Station | 5 | 0 | 0% |
| Machine Monitoring | 4 | 0 | 0% |
| Settings | 10 | 1 | 10% |
| Admin | 27 | 0 | 0% |
| Core Shared | 25 | 4 | 16% |
| **Total Core** | **110** | **31** | **28%** |

---

## 4  Testing Priorities (P0 → P2)

### P0 — Critical Path
- `CreateWorkOrderDialog` — Primary data entry point
- `WorkOrderRoutingEditor` — Routing engine UI
- `StationCard` — Station overview (used on every dashboard)
- `OperatorDashboard` — Primary operator interface

### P1 — High Impact
- `OperatorWorkflowPanel` — Operator step-by-step flow
- `StationWorkOrderPicker` — WO selection for operators
- `SmartAlertSettings` — Alert configuration
- `QuantitySummaryCard` — Qty tracking display
- `BulkUploadDialog` — Bulk data import

### P2 — Completeness
- Admin components (oversight panels)
- Settings components
- Marketing mock components
- Onboarding flow components

---

## 5  Barrel Export Registry

All domain-specific components must be exported via `index.ts` barrel files:

| Domain | Barrel File | Status |
|--------|-------------|--------|
| Queue | `src/components/queue/index.ts` | ✅ |
| NCR | `src/components/ncr/index.ts` | ✅ |
| Alerts | `src/components/alerts/index.ts` | ✅ |
| Operator | `src/components/operator/index.ts` | ✅ |
| Routing | `src/components/routing/index.ts` | ✅ |
| Machine | `src/components/machine/index.ts` | ✅ |
| Settings | `src/components/settings/index.ts` | ✅ |
| Onboarding | `src/components/onboarding/index.ts` | ✅ |
| Help | `src/components/help/index.ts` | ✅ |
| Testing | `src/components/testing/index.ts` | ✅ |

---

## 6  Standards Checklist

Every component MUST:
- [ ] Use `@/` path aliases for all imports
- [ ] Use semantic design tokens (no hardcoded colors)
- [ ] Accept typed props interface
- [ ] Handle loading/error/empty states
- [ ] Be registered in domain barrel export
- [ ] Have co-located unit test (`.test.tsx`)
- [ ] Use `useUserOrganization` for org-scoped data
- [ ] Follow hook-mediated data access pattern

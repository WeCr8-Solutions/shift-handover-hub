# PRD: Hooks Reference

**Version**: 1.0  
**Last Updated**: 2026-03-08  
**Status**: ✅ Living Document  
**Audience**: Platform Developers, SDK Admins  
**Related PRDs**: [11 — Component Standards](./11-component-standards.md), [01 — User Roles](./01-user-roles-access-control.md)

---

## 1. Overview

This document catalogs every custom React hook in the `src/hooks/` directory. Each entry defines the hook's **purpose**, **data scope**, **dependencies**, **exported API surface**, **test coverage**, and **access tier**.

### 1.1 Conventions

- All hooks follow the `use*` naming convention.
- Hooks that touch the database import `supabase` from `@/integrations/supabase/client`.
- Hooks are the **only** approved data-access layer for UI components (per PRD 11 §1).
- Organization-scoped hooks derive `organization_id` from `useUserOrganization()` unless overridden.

### 1.2 Access Tiers

| Tier | Description |
|------|-------------|
| **Public** | No auth required — utility or layout hooks |
| **Authenticated** | Requires logged-in user (`useAuth`) |
| **Org-Scoped** | Requires org membership; data filtered by `organization_id` |
| **Admin** | Requires platform `admin` or `developer` role |
| **Supervisor** | Requires org admin or `supervisor` role |

---

## 2. Hook Catalog

### 2.1 Authentication & Identity

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useAuth` | `contexts/AuthContext.tsx` | Public | Session state, `user`, `profile`, sign-in/out methods | — (context) |
| `useUserOrganization` | `useUserOrganization.ts` | Authenticated | Current user's org, org role, org loading state | — |
| `useUSPersonDeclaration` | `useUSPersonDeclaration.ts` | Authenticated | ITAR US-person declaration status and submission | — |
| `useMFAEnforcement` | `useMFAEnforcement.ts` | Authenticated | MFA enrollment gating and enforcement status | — |

### 2.2 Organization & Team Management

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useTeams` | `useTeams.ts` | Org-Scoped | CRUD for teams within the user's org | — |
| `useTeamMembers` | `useTeams.ts` | Org-Scoped | List/manage members of a specific team | — |
| `useOrganizationMembers` | `useOrganizationMembers.ts` | Org-Scoped | List/invite/remove org members, role assignment | — |
| `useOrganizationInvites` | `useOrganizationInvites.ts` | Org-Scoped | Invite code generation, redemption, expiry management | — |

### 2.3 Stations & Equipment

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useStations` | `useStations.ts` | Org-Scoped | Fetch stations + handoff records, org-filtered | `useStations.test.ts` ✅ |
| `useOperatorSessions` | `useOperatorSessions.ts` | Authenticated | Station check-in/out, active session tracking, realtime sync | `useOperatorSessions.test.ts` ✅ |
| `useStationEquipment` | `useStationEquipment.ts` | Org-Scoped | Equipment linked to a station (calibration, maintenance) | — |
| `useStationMachineProfile` | `useStationMachineProfile.ts` | Org-Scoped | Machine profile marketplace attachment & assignment | — |
| `useMachineMonitoring` | `useMachineMonitoring.ts` | Org-Scoped | Live machine status, OEE metrics, alarm state | — |

### 2.4 Work Orders & Queue

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useQueue` | `useQueue.ts` | Org-Scoped | Queue item CRUD, status transitions, reordering, filtering | `useQueue.test.ts` ✅ |
| `useWorkOrderHistory` | `useWorkOrderHistory.ts` | Org-Scoped | Historical WO audit trail and status change log | — |
| `useLoadBalancer` | `useLoadBalancer.ts` | Org-Scoped | Station load scoring and WO assignment recommendations | — |
| `usePlanningAssistant` | `usePlanningAssistant.ts` | Org-Scoped | AI-powered scheduling suggestions via edge function | — |
| `useQuoteSystem` | `useQuoteSystem.ts` | Org-Scoped | Quote system feature flag check from manufacturing prefs | — |

### 2.5 Quality & NCR

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useNCR` | `useNCR.ts` | Org-Scoped | NCR report CRUD, disposition workflow, approval/rejection | — |

### 2.6 Alerts & Notifications

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useSmartAlerts` | `useSmartAlerts.ts` | Org-Scoped | Computed alerts (overdue, stale, bottleneck, no-operator, over-time) | — |
| `useAlarmFeed` | `useAlarmFeed.ts` | Org-Scoped | Machine alarm feed from Zustand store (thin wrapper) | — |
| `useGlobalUpdates` | `useGlobalUpdates.ts` | Authenticated | System-wide update announcements, acknowledgement tracking | — |

### 2.7 Performance & Analytics

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useJobPerformanceUpdates` | `useJobPerformanceUpdates.ts` | Org-Scoped | Operator performance submissions (parts, notes, photos) | — |
| `useAnalytics` | `useAnalytics.ts` | Authenticated | Page view / event tracking, user identification, web vitals | — |
| `useAiChatUsage` | `useAiChatUsage.ts` | Org-Scoped | Daily AI chat usage metering per org | — |

### 2.8 Subscriptions & Billing

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useSubscription` | `useSubscription.ts` | Authenticated | Stripe subscription status, plan detection, portal URL | — |
| `useEntitlements` | `useEntitlements.ts` | Org-Scoped | Feature flags + usage limits from `entitlements` table | — |
| `useTrialStatus` | `useTrialStatus.ts` | Org-Scoped | Trial expiry detection, days remaining, grace period logic | — |

### 2.9 Communication

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useEmail` | `useEmail.ts` | Authenticated | Send transactional emails via `send-email` edge function | `useEmail.test.ts` ✅ |
| `useIssueReporter` | `useIssueReporter.ts` | Authenticated | Client-side error capture, issue submission via RPC | — |

### 2.10 Integrations & Connectors

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useERPConnector` | `useERPConnector.ts` | Org-Scoped | ERP connection management, sync triggering, status mapping | `useERPConnector.test.ts` ✅ |
| `useDNCConnector` | `useDNCConnector.ts` | Org-Scoped | DNC (Direct Numerical Control) protocol config & file transfer | — |
| `useJobLineRelay` | `useJobLineRelay.ts` | Org-Scoped | Machine identity registration and Zustand store bridge (singleton) | — |

### 2.11 Admin & Developer

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useAdminData` | `useAdminData.ts` | Admin | User management, role assignment, org oversight, realtime refresh | — |
| `useRoleArchitecture` | `useRoleArchitecture.ts` | Admin | Role definitions, DB function catalog, RLS policy introspection | — |
| `useActivityLog` | `useActivityLog.ts` | Org-Scoped | Write + query audit trail entries (`activity_logs` table) | — |
| `useDataAccessLog` | `useDataAccessLog.ts` | Admin | Data access audit logging (table, operation, record) | — |
| `useProcessTests` | `useProcessTests.ts` | Admin | In-app process test definitions and execution simulation | — |
| `useTestRunner` | `useTestRunner.ts` | Admin | Vitest suite registry, test execution, history, coverage | — |

### 2.12 Settings & Configuration

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useAppSettings` | `useAppSettings.ts` | Org-Scoped | Org/team/system settings CRUD from `app_settings` table | — |
| `useOrgRefreshInterval` | `useOrgRefreshInterval.ts` | Org-Scoped | Configurable polling interval per org preference | — |
| `useOnboarding` | `useOnboarding.ts` | Authenticated | Onboarding step tracking, completion state | — |

### 2.13 Shop Floor & Display

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useShopFloorDisplays` | `useShopFloorDisplays.ts` | Org-Scoped | Display registration CRUD, token generation/renewal, toggle active | `useShopFloorDisplays.test.ts` ✅ |

### 2.14 Data Operations

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useBulkUpload` | `useBulkUpload.ts` | Supervisor | Excel file parsing, validation, batch insert for WOs/stations | — |
| `useBackgroundRefresh` | `useBackgroundRefresh.ts` | Public | Configurable polling orchestrator with visibility-aware pause | — |

### 2.15 UI Utility

| Hook | File | Tier | Purpose | Test File |
|------|------|------|---------|-----------|
| `useIsMobile` | `use-mobile.tsx` | Public | Responsive breakpoint detection (< 1024px) | — |
| `useToast` | `use-toast.ts` | Public | Toast notification state management (shadcn) | — |

---

## 3. Dependency Graph (Key Relationships)

```
useAuth ──────────────────────────┐
  ├── useUserOrganization ────────┤
  │     ├── useTeams              │
  │     ├── useQueue              │
  │     ├── useStations           │
  │     ├── useSmartAlerts        │
  │     ├── useEntitlements       │
  │     ├── useAppSettings        │
  │     ├── useShopFloorDisplays  │
  │     └── useERPConnector       │
  ├── useAdminData                │
  ├── useSubscription             │
  ├── useAnalytics                │
  └── useEmail                    │
                                  │
useBackgroundRefresh (standalone) │
useIsMobile (standalone)          │
useToast (standalone)             ┘
```

---

## 4. Testing Summary

| Category | Hooks | Tested | Coverage |
|----------|-------|--------|----------|
| Auth & Identity | 4 | 0 | 0% |
| Org & Team | 4 | 0 | 0% |
| Stations & Equipment | 5 | 2 | 40% |
| Work Orders & Queue | 5 | 1 | 20% |
| Quality & NCR | 1 | 0 | 0% |
| Alerts & Notifications | 3 | 0 | 0% |
| Performance & Analytics | 3 | 0 | 0% |
| Subscriptions & Billing | 3 | 0 | 0% |
| Communication | 2 | 1 | 50% |
| Integrations & Connectors | 3 | 1 | 33% |
| Admin & Developer | 6 | 0 | 0% |
| Settings & Configuration | 3 | 0 | 0% |
| Shop Floor & Display | 1 | 1 | 100% |
| Data Operations | 2 | 0 | 0% |
| UI Utility | 2 | 0 | 0% |
| **Total** | **47** | **6** | **13%** |

### 4.1 Tested Hooks

1. `useStations` — org-scoping filter assertions
2. `useOperatorSessions` — check-in/out lifecycle, realtime subscription
3. `useQueue` — CRUD, status transitions, grouping, sorting
4. `useEmail` — edge function invocation for each template type
5. `useERPConnector` — connection management, sync triggering
6. `useShopFloorDisplays` — CRUD, token regeneration, toggle

### 4.2 Priority Test Gaps

| Priority | Hook | Reason |
|----------|------|--------|
| P0 | `useUserOrganization` | Foundation for all org-scoped hooks |
| P0 | `useEntitlements` | Gates feature access — incorrect behavior = security risk |
| P0 | `useSmartAlerts` | Complex computed logic — high regression risk |
| P1 | `useNCR` | Financial/quality impact — disposition logic |
| P1 | `useAdminData` | Multi-role access control logic |
| P1 | `useSubscription` | Billing state drives feature gating |
| P2 | `useTeams` | CRUD with role-based permission checks |
| P2 | `useBulkUpload` | Data integrity — batch parsing & validation |

---

## 5. Standards Checklist

Every hook in this project **must**:

- [ ] Import from `@/` aliases (never relative `../`)
- [ ] Use `useUserOrganization()` for org context (never raw query)
- [ ] Return typed interfaces (no `any` in public API)
- [ ] Handle loading, error, and empty states
- [ ] Be registered in this PRD when created
- [ ] Have a co-located `.test.ts` file for non-trivial logic
- [ ] Not import Zustand stores directly (use thin wrapper hooks per PRD 11)

---

## Cross-References

- **Component Standards**: [PRD 11](./11-component-standards.md) — hook-mediated data access pattern
- **Role Architecture**: [PRD 01](./01-user-roles-access-control.md) — access tier definitions
- **Testing Infrastructure**: [PRD 03](../../docs/prd/03-testing-and-production-checklist.md)

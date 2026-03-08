# PRD: Hooks Reference

**Version**: 2.0  
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
- Organization-scoped hooks derive `organization_id` from `useOrgContext()` (via `OrgProvider`) — **not** by independently calling `useUserOrganization()`.

### 1.2 Access Tiers

| Tier | Description |
|------|-------------|
| **Public** | No auth required — utility or layout hooks |
| **Authenticated** | Requires logged-in user (`useAuth`) |
| **Org-Scoped** | Requires org membership; data filtered by `organization_id` |
| **Admin** | Requires platform `admin` or `developer` role |
| **Supervisor** | Requires org admin or `supervisor` role |

### 1.3 Performance Tiers

| Tier | Description |
|------|-------------|
| **React Query** | Uses `@tanstack/react-query` with `staleTime`, `gcTime`, automatic dedup, and `refetchOnWindowFocus` |
| **React Query + Realtime** | React Query with Supabase Realtime channel that invalidates queries on changes (debounced 500ms) |
| **useState + Realtime** | Legacy pattern with local state and realtime subscription (candidate for React Query migration) |
| **Context-Derived** | Reads from a React Context provider — no direct DB queries |

---

## 2. Hook Catalog

### 2.1 Authentication & Identity

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useAuth` | `contexts/AuthContext.tsx` | Public | Context-Derived | Session state, `user`, `profile`, sign-in/out methods | — (context) |
| `useUserOrganization` | `useUserOrganization.ts` | Authenticated | **React Query** (5min stale) | Current user's org, org role, org loading state. **Parallelized** 3 queries via `Promise.all`. Wrapped in `OrgProvider` for app-wide sharing. | — |
| `useOrgContext` | `contexts/OrgContext.tsx` | Authenticated | Context-Derived | Reads cached org/team/role data from `OrgProvider` — **zero queries**. All org-scoped hooks should use this instead of calling `useUserOrganization()` directly. | — |
| `useUSPersonDeclaration` | `useUSPersonDeclaration.ts` | Authenticated | useState | ITAR US-person declaration status and submission | — |
| `useMFAEnforcement` | `useMFAEnforcement.ts` | Authenticated | useState | MFA enrollment gating and enforcement status | — |

### 2.2 Organization & Team Management

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useTeams` | `useTeams.ts` | Org-Scoped | useState | CRUD for teams within the user's org | — |
| `useTeamMembers` | `useTeams.ts` | Org-Scoped | useState | List/manage members of a specific team | — |
| `useOrganizationMembers` | `useOrganizationMembers.ts` | Org-Scoped | useState | List/invite/remove org members, role assignment | — |
| `useOrganizationInvites` | `useOrganizationInvites.ts` | Org-Scoped | useState | Invite code generation, redemption, expiry management | — |

### 2.3 Stations & Equipment

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useStations` | `useStations.ts` | Org-Scoped | **React Query + Realtime** | Fetch stations + handoff records + shift stats. 30s staleTime, 15min poll fallback, 500ms debounced realtime invalidation, `refetchIntervalInBackground: false`. Accepts `organizationId` as param (from `OrgContext`). | `useStations.test.ts` ✅ |
| `useOperatorSessions` | `useOperatorSessions.ts` | Authenticated | useState + backgroundRefresh | Station check-in/out, active session tracking, realtime sync. 10min background refresh minimum. | `useOperatorSessions.test.ts` ✅ |
| `useStationEquipment` | `useStationEquipment.ts` | Org-Scoped | useState | Equipment linked to a station (calibration, maintenance) | — |
| `useStationMachineProfile` | `useStationMachineProfile.ts` | Org-Scoped | useState | Machine profile marketplace attachment & assignment | — |
| `useMachineMonitoring` | `useMachineMonitoring.ts` | Org-Scoped | useState | Live machine status, OEE metrics, alarm state | — |

### 2.4 Work Orders & Queue

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useQueue` | `useQueue.ts` | Org-Scoped | **useState + Realtime** (debounced) | Queue item CRUD, status transitions, reordering, filtering. **500ms debounced** realtime handler, `document.hidden` guard, **optimistic updates** with rollback on `updateItem`. Uses `OrgContext` for org scoping. | `useQueue.test.ts` ✅ |
| `useWorkOrderHistory` | `useWorkOrderHistory.ts` | Org-Scoped | useState | Historical WO audit trail and status change log | — |
| `useLoadBalancer` | `useLoadBalancer.ts` | Org-Scoped | useState | Station load scoring and WO assignment recommendations | — |
| `usePlanningAssistant` | `usePlanningAssistant.ts` | Org-Scoped | useState | AI-powered scheduling suggestions via edge function | — |
| `useQuoteSystem` | `useQuoteSystem.ts` | Org-Scoped | useState | Quote system feature flag check from manufacturing prefs | — |

### 2.5 Quality & NCR

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useNCR` | `useNCR.ts` | Org-Scoped | useState | NCR report CRUD, disposition workflow, approval/rejection | — |

### 2.6 Alerts & Notifications

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useSmartAlerts` | `useSmartAlerts.ts` | Org-Scoped | **React Query** (60s stale, 5min poll) | **Single RPC call** to `compute_smart_alerts()` DB function. Replaces 8 parallel client queries. Computes 9 alert types server-side. `refetchIntervalInBackground: false`. Uses `OrgContext`. | — |
| `useAlarmFeed` | `useAlarmFeed.ts` | Org-Scoped | Context-Derived | Machine alarm feed from Zustand store (thin wrapper) | — |
| `useGlobalUpdates` | `useGlobalUpdates.ts` | Authenticated | useState | System-wide update announcements, acknowledgement tracking | — |

### 2.7 Performance & Analytics

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useJobPerformanceUpdates` | `useJobPerformanceUpdates.ts` | Org-Scoped | useState | Operator performance submissions (parts, notes, photos) | — |
| `useAnalytics` | `useAnalytics.ts` | Authenticated | useState | Page view / event tracking, user identification, web vitals | — |
| `useAiChatUsage` | `useAiChatUsage.ts` | Org-Scoped | useState | Daily AI chat usage metering per org | — |

### 2.8 Subscriptions & Billing

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useSubscription` | `useSubscription.ts` | Authenticated | useState | Stripe subscription status, plan detection, portal URL | — |
| `useEntitlements` | `useEntitlements.ts` | Org-Scoped | useState | Feature flags + usage limits from `entitlements` table | — |
| `useTrialStatus` | `useTrialStatus.ts` | Org-Scoped | useState | Trial expiry detection, days remaining, grace period logic | — |

### 2.9 Communication

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useEmail` | `useEmail.ts` | Authenticated | useState | Send transactional emails via `send-email` edge function | `useEmail.test.ts` ✅ |
| `useIssueReporter` | `useIssueReporter.ts` | Authenticated | useState | Client-side error capture, issue submission via RPC | — |

### 2.10 Integrations & Connectors

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useERPConnector` | `useERPConnector.ts` | Org-Scoped | useState | ERP connection management, sync triggering, status mapping | `useERPConnector.test.ts` ✅ |
| `useDNCConnector` | `useDNCConnector.ts` | Org-Scoped | useState | DNC (Direct Numerical Control) protocol config & file transfer | — |
| `useJobLineRelay` | `useJobLineRelay.ts` | Org-Scoped | useState | Machine identity registration and Zustand store bridge (singleton) | — |

### 2.11 Admin & Developer

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useAdminData` | `useAdminData.ts` | Admin | useState | User management, role assignment, org oversight, realtime refresh | — |
| `useRoleArchitecture` | `useRoleArchitecture.ts` | Admin | useState | Role definitions, DB function catalog, RLS policy introspection | — |
| `useActivityLog` | `useActivityLog.ts` | Org-Scoped | useState | Write + query audit trail entries (`activity_logs` table) | — |
| `useDataAccessLog` | `useDataAccessLog.ts` | Admin | useState | Data access audit logging (table, operation, record) | — |
| `useProcessTests` | `useProcessTests.ts` | Admin | useState | In-app process test definitions and execution simulation | — |
| `useTestRunner` | `useTestRunner.ts` | Admin | useState | Vitest suite registry, test execution, history, coverage | — |

### 2.12 Settings & Configuration

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useAppSettings` | `useAppSettings.ts` | Org-Scoped | useState | Org/team/system settings CRUD from `app_settings` table. Uses `OrgContext` for org ID. | — |
| `useOrgRefreshInterval` | `useOrgRefreshInterval.ts` | Org-Scoped | useState | Configurable polling interval per org preference | — |
| `useOnboarding` | `useOnboarding.ts` | Authenticated | useState | Onboarding step tracking, completion state | — |

### 2.13 Shop Floor & Display

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useShopFloorDisplays` | `useShopFloorDisplays.ts` | Org-Scoped | useState | Display registration CRUD, token generation/renewal, toggle active | `useShopFloorDisplays.test.ts` ✅ |

### 2.14 Data Operations

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useBulkUpload` | `useBulkUpload.ts` | Supervisor | useState | Excel file parsing, validation, batch insert for WOs/stations | — |
| `useBackgroundRefresh` | `useBackgroundRefresh.ts` | Public | useState | Configurable polling orchestrator with visibility-aware pause | — |

### 2.15 UI Utility

| Hook | File | Tier | Perf Tier | Purpose | Test File |
|------|------|------|-----------|---------|-----------|
| `useIsMobile` | `use-mobile.tsx` | Public | — | Responsive breakpoint detection (< 1024px) | — |
| `useToast` | `use-toast.ts` | Public | — | Toast notification state management (shadcn) | — |

---

## 3. Dependency Graph (Key Relationships)

```
useAuth ──────────────────────────────────┐
  ├── useUserOrganization (React Query)   │
  │     └── OrgProvider (single instance) │
  │           ├── useOrgContext() ←───────┤── consumed by:
  │           │     ├── useStations       │
  │           │     ├── useQueue          │
  │           │     ├── useSmartAlerts    │
  │           │     ├── useEntitlements   │
  │           │     ├── useAppSettings    │
  │           │     ├── useShopFloorDisplays │
  │           │     └── useERPConnector   │
  │           └── TeamProvider (derives)  │
  ├── useAdminData                        │
  ├── useSubscription                     │
  ├── useAnalytics                        │
  └── useEmail                            │
                                          │
useBackgroundRefresh (standalone)         │
useIsMobile (standalone)                  │
useToast (standalone)                     ┘
```

### 3.1 Provider Tree (top → bottom)

```
HelmetProvider
  QueryClientProvider (staleTime: 30s, gcTime: 5min)
    AuthProvider
      OrgProvider ← single useUserOrganization call, cached via React Query
        TeamProvider ← derives from OrgContext, no extra queries
          ActAsProvider
            OnboardingProvider
              ...Routes
```

---

## 4. Performance Architecture

### 4.1 React Query Configuration

```typescript
// Global defaults (App.tsx)
staleTime: 30_000,     // 30s — no refetch within window
gcTime: 300_000,       // 5min — cache retained
retry: 2,              // Automatic retry on failure
refetchOnWindowFocus: true
```

### 4.2 Per-Hook Performance Profile

| Hook | Cache | Stale | Poll | Realtime | Debounce | Visibility | Optimistic |
|------|-------|-------|------|----------|----------|------------|------------|
| `useUserOrganization` | React Query | 5min | — | ❌ | — | — | ❌ |
| `useStations` | React Query | 30s | 15min | ✅ | 500ms | ✅ | ❌ |
| `useHandoffRecords` | React Query | 30s | 15min | ✅ | 500ms | ✅ | ❌ |
| `useShiftStats` | React Query | 60s | — | ❌ | — | — | ❌ |
| `useSmartAlerts` | React Query | 60s | 5min | ❌ | — | ✅ | ❌ |
| `useQueue` | useState | — | — | ✅ | 500ms | ✅ (hidden) | ✅ (rollback) |
| `useOperatorSessions` | bgRefresh | — | 10min | ❌ | — | — | ❌ |
| `useAppSettings` | useState | — | — | ❌ | — | — | ❌ |

### 4.3 Server-Side Functions

| Function | Called By | Purpose |
|----------|----------|---------|
| `compute_smart_alerts()` | `useSmartAlerts` | Computes 9 alert types server-side, replacing 8 client queries |

### 4.4 Key Performance Metrics

| Metric | Before | After |
|--------|--------|-------|
| Dashboard mount queries | 18–22 | ≤ 8 |
| `useUserOrganization` instances | 5 | 1 (via OrgProvider) |
| Smart alert queries per cycle | 8–9 | 1 (RPC) |
| Background queries when tab hidden | All active | 0 |
| Status change UI feedback | ~500ms | < 100ms (optimistic) |

---

## 5. Testing Summary

| Category | Hooks | Tested | Coverage |
|----------|-------|--------|----------|
| Auth & Identity | 5 | 0 | 0% |
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
| **Total** | **48** | **6** | **13%** |

### 5.1 Tested Hooks

1. `useStations` — org-scoping filter assertions
2. `useOperatorSessions` — check-in/out lifecycle, realtime subscription
3. `useQueue` — CRUD, status transitions, grouping, sorting
4. `useEmail` — edge function invocation for each template type
5. `useERPConnector` — connection management, sync triggering
6. `useShopFloorDisplays` — CRUD, token regeneration, toggle

### 5.2 Priority Test Gaps

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

## 6. Standards Checklist

Every hook in this project **must**:

- [ ] Import from `@/` aliases (never relative `../`)
- [ ] Use `useOrgContext()` for org context (never independently call `useUserOrganization()`)
- [ ] Return typed interfaces (no `any` in public API)
- [ ] Handle loading, error, and empty states
- [ ] Be registered in this PRD when created
- [ ] Have a co-located `.test.ts` file for non-trivial logic
- [ ] Not import Zustand stores directly (use thin wrapper hooks per PRD 11)
- [ ] Use React Query for new data-fetching hooks (not raw `useState`/`useEffect`)
- [ ] Include `refetchIntervalInBackground: false` on any polling hook
- [ ] Debounce realtime invalidation (minimum 500ms) to prevent query storms

---

## Cross-References

- **Component Standards**: [PRD 11](./11-component-standards.md) — hook-mediated data access pattern
- **Role Architecture**: [PRD 01](./01-user-roles-access-control.md) — access tier definitions
- **Testing Infrastructure**: [PRD 03](../../docs/prd/03-testing-and-production-checklist.md)
- **Performance Audit**: [Component Performance Audit](../component-performance-audit.md) — detailed per-component analysis
- **Performance Report**: [Enhancement Report](../performance-enhancement-report.md) — phases 1–6 implementation details

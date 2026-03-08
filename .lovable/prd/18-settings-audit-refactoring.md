# PRD 18 — Settings Audit & Component Refactoring Plan

> **Last updated:** 2026-03-08  
> **Status:** Draft  
> **Owner:** Platform Engineering  
> **Related PRDs:** 01 (User Roles), 02 (Org/Team Management), 06 (Subscription/Billing), 11 (Component Standards)

---

## 1. Executive Summary

The Settings page (`/settings`) is the central configuration hub for all user, organization, and manufacturing preferences. After recent refactoring (splitting `useAppSettings` into domain hooks), several structural and UX improvements remain. This PRD documents the full audit findings and provides an actionable refactoring roadmap to ensure:

- **Faster perceived loading** via skeleton states and lazy tab rendering
- **Consistent component patterns** across all 11 settings tabs
- **Correct RBAC enforcement** (read-only vs editable states)
- **Easier development** when adding new settings tabs or fields

---

## 2. Current Architecture

### 2.1 Settings Page (`src/pages/Settings.tsx` — 254 lines)

The page renders 11 tabs via Radix `<Tabs>`. All tab content components are **eagerly imported** and rendered in the DOM regardless of which tab is active.

```
Tabs: general | organization | billing | manufacturing | shifts |
      work-centers | notifications | alerts | onboarding | erp | marketplace
```

### 2.2 Settings Components Inventory

| Component | File | Lines | Hook Dependency | Loading State | Dirty Tracking | RBAC |
|---|---|---|---|---|---|---|
| `GeneralSettings` | `GeneralSettings.tsx` | 265 | `useGeneralSettings` | ✅ Skeleton | ✅ | N/A (user-scoped) |
| `OrganizationSettings` | `OrganizationSettings.tsx` | 390 | `useOrgContext` + raw Supabase | ✅ Spinner | ❌ | ✅ isAdmin gate |
| `BillingSettings` | `BillingSettings.tsx` | 405 | `useSubscription` + `useEntitlements` + raw Supabase | ✅ Spinner | N/A | Dev/billing gate |
| `ManufacturingSettings` | `ManufacturingSettings.tsx` | 234 | `useGeneralSettings` | ✅ Skeleton | ✅ | Read-only overlay |
| `ShiftSettings` | `ShiftSettings.tsx` | 384 | `useShiftSchedules` | ✅ Spinner | N/A (CRUD) | Read-only overlay |
| `WorkCenterSettings` | `WorkCenterSettings.tsx` | 303 | `useWorkCenterConfigs` | ✅ Skeleton | N/A (CRUD) | Read-only overlay |
| `NotificationSettings` | `NotificationSettings.tsx` | 206 | `useNotificationPrefs` | ✅ Skeleton | ✅ | N/A (user-scoped) |
| `SmartAlertSettings` | `SmartAlertSettings.tsx` | ~200 | Props from `useSmartAlerts` | ❓ Unknown | ❓ | Read-only overlay |
| `OnboardingSettings` | `OnboardingSettings.tsx` | 195 | `useOnboardingContext` | ✅ null render | N/A | N/A |
| `ERPConnectorSettings` | `ERPConnectorSettings.tsx` | 773 | `useERPConnector` + many others | ✅ Spinner | ❌ | Entitlement gate |
| `PartCatalogManager` | `PartCatalogManager.tsx` | ~250+ | Unknown | ❓ | ❓ | Nested in manufacturing |
| `MachineProfileMarketplace` | (station/) | External | Unknown | ❓ | N/A | N/A |

### 2.3 Domain Hooks

| Hook | File | Data Source | Caching Strategy |
|---|---|---|---|
| `useGeneralSettings` | `useGeneralSettings.ts` | `app_settings` table | `useState` + manual fetch |
| `useShiftSchedules` | `useShiftSchedules.ts` | `shift_schedules` table | `useState` + manual fetch |
| `useNotificationPrefs` | `useNotificationPrefs.ts` | `notification_preferences` table | `useState` + manual fetch |
| `useWorkCenterConfigs` | `useWorkCenterConfigs.ts` | `work_center_config` table | `useState` + manual fetch |
| `useSmartAlerts` | `useSmartAlerts.ts` | Unknown | Unknown |
| `useAppSettings` | `useAppSettings.ts` (deprecated) | All four above | Barrel re-export |

---

## 3. Audit Findings

### 3.1 Performance Issues

| # | Issue | Impact | Severity |
|---|---|---|---|
| P1 | **All 11 tab components mount eagerly** — each fires its own data fetch on page load regardless of which tab the user visits | 11 parallel Supabase queries on every Settings page visit | 🔴 High |
| P2 | **Hooks use `useState` instead of React Query** — no deduplication, no stale-while-revalidate, no cache sharing between components | Redundant fetches when navigating away and back | 🟡 Medium |
| P3 | **`useGeneralSettings` is called by both GeneralSettings AND ManufacturingSettings** — two independent fetch cycles for the same `app_settings` table | Double network request for same data | 🟡 Medium |
| P4 | **ERPConnectorSettings is 773 lines** — imported eagerly even when hidden by entitlement gate | Unnecessarily large bundle for most users | 🟡 Medium |

### 3.2 UX / Consistency Issues

| # | Issue | Impact | Severity |
|---|---|---|---|
| U1 | **Inconsistent loading states** — some tabs use Skeleton cards, some use centered Spinner, OnboardingSettings returns `null` | Jarring visual inconsistency during load | 🟡 Medium |
| U2 | **No dirty-state tracking** on OrganizationSettings or ERPConnectorSettings | Users can navigate away losing unsaved changes without warning | 🟡 Medium |
| U3 | **OrganizationSettings uses `(organization as any).billing_email`** — type cast indicates missing type in OrgContext interface | Fragile code, no TypeScript safety | 🟡 Medium |
| U4 | **No "Discard changes" button** on any settings tab | Users must manually revert each field; no quick reset | 🟢 Low |
| U5 | **SHIFT_COLORS uses raw hex values** — not using design system tokens | Inconsistent with theming guidelines | 🟢 Low |
| U6 | **Marketplace tab has no data hook** — just static cards with `MachineProfileMarketplace` passed `null` props | Placeholder UX without clear loading/empty states | 🟢 Low |

### 3.3 RBAC / Security Issues

| # | Issue | Impact | Severity |
|---|---|---|---|
| R1 | **Read-only overlay uses `pointer-events-none opacity-75`** — screen readers and keyboard users can still interact with form elements | Accessibility gap in permission enforcement | 🟡 Medium |
| R2 | **No server-side validation of org role before save** — relies on RLS, but error messages are generic ("Failed to save") | Poor UX when operator accidentally tries to save | 🟢 Low |
| R3 | **OrganizationSettings compliance section visible to all admins** — no entitlement check for ITAR features | Feature leakage for non-ITAR orgs | 🟢 Low |

### 3.4 Developer Experience Issues

| # | Issue | Impact | Severity |
|---|---|---|---|
| D1 | **Adding a new tab requires editing Settings.tsx in 3 places** — tabs array, TabsContent block, and imports | Error-prone, violates DRY | 🟡 Medium |
| D2 | **No shared pattern for settings form state** — each component re-implements loading → form state → dirty check → save → toast | 500+ lines of duplicated boilerplate across components | 🟡 Medium |
| D3 | **`index.ts` barrel export is incomplete** — missing `OnboardingSettings`, `ERPConnectorSettings`, `PartCatalogManager` | Inconsistent import patterns | 🟢 Low |
| D4 | **No test coverage for any settings component** except `PartCatalogManager.test.tsx` | Zero confidence in refactoring | 🟡 Medium |

---

## 4. Refactoring Plan

### Phase 1: Performance — Lazy Tab Rendering (Priority: 🔴)

**Goal:** Only mount and fetch data for the active tab.

#### 4.1.1 Lazy TabsContent Wrapper

Create a `<LazyTabContent>` component that only renders children when the tab is first activated, and keeps them mounted after (to preserve form state).

```tsx
// src/components/settings/LazyTabContent.tsx
function LazyTabContent({ value, activeTab, children }: {
  value: string;
  activeTab: string;
  children: React.ReactNode;
}) {
  const [hasBeenActive, setHasBeenActive] = useState(false);

  useEffect(() => {
    if (activeTab === value) setHasBeenActive(true);
  }, [activeTab, value]);

  if (!hasBeenActive) return <TabsContent value={value} />;
  return <TabsContent value={value}>{children}</TabsContent>;
}
```

**Impact:** Reduces initial page load from 11 parallel queries to 1-2.

#### 4.1.2 React.lazy for ERPConnectorSettings

```tsx
const ERPConnectorSettings = React.lazy(() =>
  import("@/components/settings/ERPConnectorSettings").then(m => ({ default: m.ERPConnectorSettings }))
);
```

**Impact:** Removes 773-line component from main bundle for non-enterprise users.

#### 4.1.3 Migrate Hooks to React Query

Convert `useGeneralSettings`, `useShiftSchedules`, `useNotificationPrefs`, `useWorkCenterConfigs` from manual `useState` + `useEffect` to `useQuery` / `useMutation` pattern:

```tsx
// Example: useGeneralSettings with React Query
export function useGeneralSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["app-settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .order("setting_key");
      return (data ?? []) as AppSetting[];
    },
    enabled: !!user,
    staleTime: 2 * 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value, type }: { key: string; value: Record<string, unknown>; type: string }) => {
      // ... upsert logic
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["app-settings"] }),
  });

  return { settings, loading: isLoading, updateSetting: updateMutation.mutateAsync, getSetting };
}
```

**Benefits:**
- Automatic cache deduplication (GeneralSettings + ManufacturingSettings share one query)
- Stale-while-revalidate for instant tab switches
- Built-in loading/error states
- Optimistic updates possible

---

### Phase 2: Consistency — Shared Settings Form Pattern (Priority: 🟡)

**Goal:** Eliminate boilerplate across settings components.

#### 4.2.1 `useSettingsForm` Hook

Create a reusable hook that encapsulates the common form lifecycle:

```tsx
// src/hooks/useSettingsForm.ts
interface UseSettingsFormOptions<T> {
  settingKey: string;
  defaults: T;
  settingType?: string;
}

function useSettingsForm<T extends Record<string, unknown>>({
  settingKey,
  defaults,
  settingType = "general",
}: UseSettingsFormOptions<T>) {
  const { getSetting, updateSetting, loading } = useGeneralSettings();
  const { toast } = useToast();

  const [form, setForm] = useState<T>(defaults);
  const [initial, setInitial] = useState<T>(defaults);
  const [isSaving, setIsSaving] = useState(false);

  // Load from DB
  useEffect(() => {
    const saved = getSetting(settingKey);
    if (saved && typeof saved === "object") {
      const merged = { ...defaults, ...saved } as T;
      setForm(merged);
      setInitial(merged);
    }
  }, [getSetting, settingKey]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initial);

  const save = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateSetting(settingKey, form, settingType);
      if (error) {
        toast({ title: "Failed to save", description: error, variant: "destructive" });
      } else {
        setInitial(form);
        toast({ title: "Settings saved" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const discard = () => setForm(initial);

  const update = <K extends keyof T>(key: K, value: T[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return { form, update, isDirty, isSaving, save, discard, loading, setForm };
}
```

**Usage in GeneralSettings:**
```tsx
export function GeneralSettings() {
  const { form, update, isDirty, isSaving, save, discard, loading } =
    useSettingsForm({ settingKey: "general_preferences", defaults: DEFAULT_SETTINGS });

  if (loading) return <SettingsSkeleton rows={3} />;

  return (
    <>
      <Select value={form.timezone} onValueChange={v => update("timezone", v)}>...</Select>
      <SettingsFooter isDirty={isDirty} isSaving={isSaving} onSave={save} onDiscard={discard} />
    </>
  );
}
```

#### 4.2.2 Shared UI Components

| Component | Purpose | Used By |
|---|---|---|
| `SettingsSkeleton` | Consistent card skeleton with configurable row count | All tabs with `loading` state |
| `SettingsFooter` | Save/Discard buttons + "Unsaved changes" badge | General, Manufacturing, Notifications, Organization, ERP |
| `SettingsSwitchRow` | Label + description + Switch in bordered row | Notifications, Manufacturing, Work Centers |
| `ReadOnlyGate` | Wraps children with `aria-disabled`, removes tabIndex, shows notice | Manufacturing, Shifts, Work Centers, Alerts |

```tsx
// src/components/settings/SettingsSkeleton.tsx
export function SettingsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 py-6">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-4 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

```tsx
// src/components/settings/SettingsFooter.tsx
export function SettingsFooter({ isDirty, isSaving, onSave, onDiscard, label = "Save Settings" }: Props) {
  return (
    <div className="flex items-center justify-end gap-3">
      {isDirty && (
        <>
          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
            Unsaved changes
          </Badge>
          {onDiscard && (
            <Button variant="ghost" size="sm" onClick={onDiscard}>
              Discard
            </Button>
          )}
        </>
      )}
      <Button onClick={onSave} disabled={isSaving || !isDirty} className="gap-2">
        {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />{isDirty ? label : "Saved"}</>}
      </Button>
    </div>
  );
}
```

```tsx
// src/components/settings/ReadOnlyGate.tsx
export function ReadOnlyGate({ canEdit, children }: { canEdit: boolean; children: React.ReactNode }) {
  if (canEdit) return <>{children}</>;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          These settings are managed by your organization admin.
        </p>
      </div>
      <fieldset disabled className="opacity-75">
        {children}
      </fieldset>
    </div>
  );
}
```

> **Key improvement:** Using `<fieldset disabled>` instead of `pointer-events-none` properly disables all form elements for keyboard/screen-reader users (fixes R1).

---

### Phase 3: Settings Page Refactoring (Priority: 🟡)

**Goal:** Make adding new tabs a one-line operation.

#### 4.3.1 Tab Registry Pattern

Replace the current 3-place editing pattern with a declarative registry:

```tsx
// src/components/settings/settingsTabRegistry.tsx
import { lazy } from "react";

export interface SettingsTab {
  value: string;
  label: string;
  icon: LucideIcon;
  component: React.LazyExoticComponent<React.ComponentType> | React.ComponentType;
  show: (ctx: TabContext) => boolean;
  orgLevel?: boolean;  // requires canEditOrgSettings
}

export const SETTINGS_TABS: SettingsTab[] = [
  {
    value: "general",
    label: "General",
    icon: Settings2,
    component: GeneralSettings,
    show: () => true,
  },
  {
    value: "organization",
    label: "Organization",
    icon: Building2,
    component: OrganizationSettings,
    show: () => true,
  },
  {
    value: "billing",
    label: "Billing",
    icon: CreditCard,
    component: BillingSettings,
    show: ({ isDeveloper, canManageBilling }) => isDeveloper || canManageBilling,
  },
  // ... etc
  {
    value: "erp",
    label: "ERP",
    icon: Plug,
    component: lazy(() => import("./ERPConnectorSettings")),
    show: ({ isDeveloper, canManageBilling }) => isDeveloper || canManageBilling,
  },
];
```

**Settings.tsx becomes ~80 lines:**
```tsx
export default function Settings() {
  const ctx = useSettingsContext();
  const visibleTabs = SETTINGS_TABS.filter(t => t.show(ctx));

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        {visibleTabs.map(tab => <TabsTrigger key={tab.value} .../>)}
      </TabsList>
      {visibleTabs.map(tab => (
        <LazyTabContent key={tab.value} value={tab.value} activeTab={activeTab}>
          <ReadOnlyGate canEdit={!tab.orgLevel || ctx.canEditOrgSettings}>
            <Suspense fallback={<SettingsSkeleton />}>
              <tab.component />
            </Suspense>
          </ReadOnlyGate>
        </LazyTabContent>
      ))}
    </Tabs>
  );
}
```

**Adding a new tab = one object in the registry array.**

---

### Phase 4: Bug Fixes & Type Safety (Priority: 🟡)

| # | Fix | Details |
|---|---|---|
| F1 | Add `billing_email` to OrgContext `Organization` interface | Remove `(organization as any).billing_email` cast |
| F2 | Add dirty tracking to `OrganizationSettings` | Compare formData vs initial loaded state |
| F3 | Add dirty tracking to `ERPConnectorSettings` | Compare connection form state vs loaded connection |
| F4 | Update `index.ts` barrel export | Add `OnboardingSettings`, `ERPConnectorSettings` |
| F5 | Replace `SHIFT_COLORS` hex array with CSS custom properties | Use `hsl(var(--chart-1))` etc from design system |

---

### Phase 5: Testing (Priority: 🟡)

#### Minimum Test Coverage per Component

| Component | Test File | Key Scenarios |
|---|---|---|
| `GeneralSettings` | `GeneralSettings.test.tsx` | Loads defaults, saves changes, dirty badge shows |
| `ShiftSettings` | `ShiftSettings.test.tsx` | Create shift, edit shift, delete confirmation |
| `NotificationSettings` | `NotificationSettings.test.tsx` | Toggle preferences, save, quiet hours |
| `useSettingsForm` | `useSettingsForm.test.ts` | Load from hook, dirty detection, save/discard |
| `LazyTabContent` | `LazyTabContent.test.tsx` | Only renders when active, persists after first mount |
| `ReadOnlyGate` | `ReadOnlyGate.test.tsx` | Disabled fieldset when !canEdit |

---

## 5. Implementation Priority Matrix

```
              HIGH IMPACT
                  │
    ┌─────────────┼─────────────┐
    │  P1 Lazy    │  Phase 2    │
    │  Tabs       │  Shared     │
    │  (Quick)    │  Patterns   │
    │             │  (Medium)   │
LOW ├─────────────┼─────────────┤ HIGH
EFFORT│  F1-F5    │  Phase 3    │ EFFORT
    │  Bug Fixes  │  Tab        │
    │  (Quick)    │  Registry   │
    │             │  (Large)    │
    └─────────────┼─────────────┘
                  │
              LOW IMPACT
```

### Recommended Execution Order

1. **Sprint 1 (Quick wins):** F1–F5 bug fixes + P1 `LazyTabContent` wrapper
2. **Sprint 2 (Foundation):** `useSettingsForm` hook + shared UI components (`SettingsSkeleton`, `SettingsFooter`, `ReadOnlyGate`, `SettingsSwitchRow`)
3. **Sprint 3 (Migration):** Migrate GeneralSettings + ManufacturingSettings + NotificationSettings to `useSettingsForm`
4. **Sprint 4 (Architecture):** Tab registry pattern + React.lazy for ERP + migrate hooks to React Query
5. **Sprint 5 (Quality):** Unit tests for all components and hooks

---

## 6. Success Metrics

| Metric | Current | Target |
|---|---|---|
| Supabase queries on Settings page load | 11+ | 1-2 (active tab only) |
| Lines in Settings.tsx | 254 | < 100 |
| Boilerplate per new settings tab | ~80 lines + 3 edit points | ~10 lines (1 registry entry) |
| Components with dirty tracking | 3 of 11 | 8 of 11 (all form-based) |
| Components with consistent loading skeleton | 4 of 11 | 11 of 11 |
| Test files for settings components | 1 | 7+ |
| ERPConnectorSettings in main bundle | Always (773 lines) | Lazy-loaded for enterprise only |

---

## 7. File Reference

### New Files to Create

```
src/components/settings/LazyTabContent.tsx
src/components/settings/SettingsSkeleton.tsx
src/components/settings/SettingsFooter.tsx
src/components/settings/SettingsSwitchRow.tsx
src/components/settings/ReadOnlyGate.tsx
src/components/settings/settingsTabRegistry.tsx
src/hooks/useSettingsForm.ts
src/components/settings/__tests__/GeneralSettings.test.tsx
src/components/settings/__tests__/ShiftSettings.test.tsx
src/components/settings/__tests__/NotificationSettings.test.tsx
src/hooks/__tests__/useSettingsForm.test.ts
```

### Files to Modify

```
src/pages/Settings.tsx                    → Simplified via tab registry + LazyTabContent
src/hooks/useGeneralSettings.ts           → Migrate to React Query
src/hooks/useShiftSchedules.ts            → Migrate to React Query
src/hooks/useNotificationPrefs.ts         → Migrate to React Query
src/hooks/useWorkCenterConfigs.ts         → Migrate to React Query
src/components/settings/index.ts          → Add missing exports
src/components/settings/GeneralSettings.tsx        → Use useSettingsForm
src/components/settings/ManufacturingSettings.tsx  → Use useSettingsForm
src/components/settings/NotificationSettings.tsx   → Use useSettingsForm
src/components/settings/OrganizationSettings.tsx   → Add dirty tracking, fix type cast
src/components/settings/ERPConnectorSettings.tsx   → Add dirty tracking, export as default
src/contexts/OrgContext.tsx               → Add billing_email to Organization interface
```

---

## 8. Migration Notes

### Backward Compatibility

- `useAppSettings.ts` barrel hook is already marked `@deprecated` — no changes needed
- Tab URL hashes are not currently used, so tab registry migration is non-breaking
- React Query migration preserves the same return shape (`{ settings, loading, updateSetting, getSetting }`)

### Risk Mitigation

- Each phase is independently deployable
- Shared components are additive (no breaking changes to existing code)
- React Query migration can be done hook-by-hook with identical API surface

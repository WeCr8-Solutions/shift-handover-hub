/**
 * Settings module registry — single source of truth.
 *
 * Adding a new setting page = add ONE entry here. The Settings page
 * derives the sidebar nav, gating, lazy-loading, and content rendering
 * automatically from this list.
 */
import { lazy, Suspense } from "react";
import type { SmartAlertThresholds } from "@/hooks/useSmartAlerts";
import {
  Settings2,
  Factory,
  Bell,
  BellRing,
  Clock,
  Wrench,
  Building2,
  CreditCard,
  Bug,
  GraduationCap,
  Plug,
  Store,
  User,
  Cog,
  Globe,
  IdCard,
  type LucideIcon,
} from "lucide-react";

import { ReadOnlyGate } from "./ReadOnlyGate";
import { SettingsSkeleton } from "./SettingsSkeleton";
import { EntitlementGate } from "@/components/EntitlementGate";

// Eager (small, always-likely-visited)
import { GeneralSettings } from "./GeneralSettings";
import { NotificationSettings } from "./NotificationSettings";
import { OnboardingSettings } from "./OnboardingSettings";
import { MyIssuesPanel } from "./MyIssuesPanel";

// Lazy (heavier, less common)
const OrganizationSettings = lazy(() =>
  import("./OrganizationSettings").then((m) => ({ default: m.OrganizationSettings })),
);
const BillingSettings = lazy(() =>
  import("./BillingSettings").then((m) => ({ default: m.BillingSettings })),
);
const ManufacturingSettings = lazy(() =>
  import("./ManufacturingSettings").then((m) => ({ default: m.ManufacturingSettings })),
);
const PartCatalogManager = lazy(() =>
  import("./PartCatalogManager").then((m) => ({ default: m.PartCatalogManager })),
);
const ShiftSettings = lazy(() =>
  import("./ShiftSettings").then((m) => ({ default: m.ShiftSettings })),
);
const WorkCenterSettings = lazy(() =>
  import("./WorkCenterSettings").then((m) => ({ default: m.WorkCenterSettings })),
);
const SmartAlertSettingsLazy = lazy(() =>
  import("@/components/alerts/SmartAlertSettings").then((m) => ({
    default: m.SmartAlertSettings,
  })),
);
const ERPConnectorSettings = lazy(() =>
  import("./ERPConnectorSettings").then((m) => ({ default: m.ERPConnectorSettings })),
);
const MarketplacePanel = lazy(() => import("./panels/MarketplacePanel"));
const TalentProfileSettings = lazy(() => import("./panels/TalentProfileSettings"));

// ---------- Types ----------

export interface ModuleAccess {
  isDeveloper: boolean;
  canManageBilling: boolean;
  canEditOrgSettings: boolean;
  organizationRole: string | null;
}

export interface ModuleContext extends ModuleAccess {
  thresholds: SmartAlertThresholds;
  saveThresholds: (next: Partial<SmartAlertThresholds>) => Promise<void>;
}

export type GroupId = "personal" | "organization" | "production" | "platform";

export interface SettingsModule {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: GroupId;
  /** Indent under another module's id (e.g. "talent-profile" under "general") */
  parentId?: string;
  /** When true, displayed as org-level (lock icon if user can't edit) */
  orgLevel?: boolean;
  /** Visibility predicate. Receives access flags. Default: always show */
  show?: (a: ModuleAccess) => boolean;
  /** Wrap content with ReadOnlyGate when orgLevel + user can't edit */
  render: (ctx: ModuleContext) => React.ReactNode;
}

export interface SettingsGroupDef {
  id: GroupId;
  label: string;
  icon: LucideIcon;
  description: string;
}

// ---------- Group definitions ----------

export const SETTINGS_GROUPS: SettingsGroupDef[] = [
  { id: "personal", label: "Personal", icon: User, description: "Settings for your account" },
  { id: "organization", label: "Organization", icon: Building2, description: "Org-wide identity, billing, and add-ons" },
  { id: "production", label: "Production", icon: Cog, description: "Shop floor configuration" },
  { id: "platform", label: "Platform", icon: Globe, description: "External integrations" },
];

// ---------- Helpers ----------

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<SettingsSkeleton rows={3} />}>{node}</Suspense>
);

const orgGated = (canEdit: boolean, node: React.ReactNode) => (
  <ReadOnlyGate canEdit={canEdit}>{node}</ReadOnlyGate>
);

// ---------- Module registry ----------

export const SETTINGS_MODULES: SettingsModule[] = [
  // ===== Personal =====
  {
    id: "general",
    label: "General",
    description: "Theme, language, timezone",
    icon: Settings2,
    group: "personal",
    render: () => <GeneralSettings />,
  },
  {
    id: "talent-profile",
    label: "Talent Profile",
    description: "Public profile, visibility, outreach",
    icon: IdCard,
    group: "personal",
    parentId: "general",
    render: () => withSuspense(<TalentProfileSettings />),
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email, push, device alerts",
    icon: Bell,
    group: "personal",
    render: () => <NotificationSettings />,
  },
  {
    id: "onboarding",
    label: "Onboarding",
    description: "Tour and welcome flow",
    icon: GraduationCap,
    group: "personal",
    render: () => <OnboardingSettings />,
  },
  {
    id: "my-issues",
    label: "My Issues",
    description: "Issues you've reported",
    icon: Bug,
    group: "personal",
    render: () => <MyIssuesPanel />,
  },

  // ===== Organization =====
  {
    id: "organization",
    label: "Organization",
    description: "Profile, members, branding",
    icon: Building2,
    group: "organization",
    render: ({ isDeveloper }) =>
      withSuspense(<OrganizationSettings isDeveloper={isDeveloper} />),
  },
  {
    id: "billing",
    label: "Billing",
    description: "Subscription and payments",
    icon: CreditCard,
    group: "organization",
    show: (a) => a.isDeveloper || a.canManageBilling,
    render: () => withSuspense(<BillingSettings />),
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Machine profiles & add-ons",
    icon: Store,
    group: "organization",
    render: () => withSuspense(<MarketplacePanel />),
  },

  // ===== Production (shop floor / shift handoff) =====
  {
    id: "manufacturing",
    label: "Manufacturing",
    description: "Routing, parts, defaults",
    icon: Factory,
    group: "production",
    orgLevel: true,
    render: ({ canEditOrgSettings }) =>
      orgGated(
        canEditOrgSettings,
        withSuspense(
          <div className="space-y-6">
            <ManufacturingSettings />
            <PartCatalogManager />
          </div>,
        ),
      ),
  },
  {
    id: "shifts",
    label: "Shifts",
    description: "Shift schedules",
    icon: Clock,
    group: "production",
    orgLevel: true,
    render: ({ canEditOrgSettings }) =>
      orgGated(canEditOrgSettings, withSuspense(<ShiftSettings />)),
  },
  {
    id: "work-centers",
    label: "Work Centers",
    description: "Stations and equipment",
    icon: Wrench,
    group: "production",
    orgLevel: true,
    render: ({ canEditOrgSettings }) =>
      orgGated(canEditOrgSettings, withSuspense(<WorkCenterSettings />)),
  },
  {
    id: "alerts",
    label: "Smart Alerts",
    description: "Production alert thresholds",
    icon: BellRing,
    group: "production",
    orgLevel: true,
    render: ({ canEditOrgSettings, thresholds, saveThresholds }) =>
      orgGated(
        canEditOrgSettings,
        withSuspense(
          <SmartAlertSettingsLazy thresholds={thresholds} onSave={saveThresholds} />,
        ),
      ),
  },

  // ===== Platform integrations =====
  {
    id: "erp",
    label: "ERP Connector",
    description: "Sync with external ERP",
    icon: Plug,
    group: "platform",
    show: (a) => a.isDeveloper || a.canManageBilling,
    render: () =>
      withSuspense(
        <EntitlementGate feature="erp_connector" requiredPlan="enterprise">
          <ERPConnectorSettings />
        </EntitlementGate>,
      ),
  },
];

/** Resolve visible modules for a given access context */
export function getVisibleModules(access: ModuleAccess): SettingsModule[] {
  return SETTINGS_MODULES.filter((m) => (m.show ? m.show(access) : true));
}

import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { MyIssuesPanel } from "@/components/settings/MyIssuesPanel";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Settings2,
  Factory,
  Bell,
  BellRing,
  Clock,
  Wrench,
  Building2,
  CreditCard,
  Lock,
  Bug,
  GraduationCap,
  Plug,
  Store,
  Search,
  Menu,
  User,
  Cog,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useOrgContext } from "@/contexts/OrgContext";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { ManufacturingSettings } from "@/components/settings/ManufacturingSettings";
import { ShiftSettings } from "@/components/settings/ShiftSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { WorkCenterSettings } from "@/components/settings/WorkCenterSettings";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { OnboardingSettings } from "@/components/settings/OnboardingSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntitlementGate } from "@/components/EntitlementGate";
import { PartCatalogManager } from "@/components/settings/PartCatalogManager";
import { MachineProfileMarketplace } from "@/components/station/MachineProfileMarketplace";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { SmartAlertSettings } from "@/components/alerts/SmartAlertSettings";
import { LazyTabContent } from "@/components/settings/LazyTabContent";
import { ReadOnlyGate } from "@/components/settings/ReadOnlyGate";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";

const ERPConnectorSettings = lazy(() =>
  import("@/components/settings/ERPConnectorSettings").then((m) => ({
    default: m.ERPConnectorSettings,
  }))
);

const LAST_TAB_KEY = "settings_last_tab_v1";

interface TabDef {
  value: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
  orgLevel?: boolean;
  description?: string;
}

interface TabGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  items: TabDef[];
}

function DeveloperOnlyPlaceholder({ feature }: { feature: string }) {
  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardHeader className="pb-2 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">Developer Access Required</CardTitle>
        <CardDescription>{feature} information is restricted to SDK developers only.</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">Contact your system administrator to request developer access.</p>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, isReady } = useAuth();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();
  const { canManageBilling } = useTrialStatus();
  const { organizationRole } = useOrgContext();
  const { thresholds, saveThresholds } = useSmartAlerts();

  const showBillingTab = isDeveloper || canManageBilling;
  const showERPTab = isDeveloper || canManageBilling;

  const isOrgAdmin = organizationRole === "admin" || organizationRole === "owner";
  const isSupervisor = organizationRole === "supervisor";
  const canEditOrgSettings = isOrgAdmin || isSupervisor || isDeveloper;

  // Hash deep-link → localStorage → default
  const initialTab = (() => {
    const hash = location.hash.replace("#", "");
    if (hash) return hash;
    try {
      return localStorage.getItem(LAST_TAB_KEY) || "general";
    } catch {
      return "general";
    }
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Persist last-active tab + sync hash
  useEffect(() => {
    try {
      localStorage.setItem(LAST_TAB_KEY, activeTab);
    } catch {
      /* ignore */
    }
    if (location.hash.replace("#", "") !== activeTab) {
      navigate({ hash: `#${activeTab}` }, { replace: true });
    }
  }, [activeTab, location.hash, navigate]);

  useEffect(() => {
    if (isReady && !user) {
      navigate("/auth", { replace: true });
    }
  }, [isReady, user, navigate]);

  const groups: TabGroup[] = useMemo(
    () => [
      {
        id: "personal",
        label: "Personal",
        icon: User,
        description: "Settings that apply to your account on this device",
        items: [
          { value: "general", label: "General", icon: Settings2, show: true, description: "Theme, language, timezone" },
          { value: "notifications", label: "Notifications", icon: Bell, show: true, description: "Email, push, device alerts" },
          { value: "onboarding", label: "Onboarding", icon: GraduationCap, show: true, description: "Tour and welcome flow" },
          { value: "my-issues", label: "My Issues", icon: Bug, show: true, description: "Issues you've reported" },
        ],
      },
      {
        id: "organization",
        label: "Organization",
        icon: Building2,
        description: "Org-wide identity, billing, and add-ons",
        items: [
          { value: "organization", label: "Organization", icon: Building2, show: true, description: "Profile, members, branding" },
          { value: "billing", label: "Billing", icon: CreditCard, show: showBillingTab, description: "Subscription and payments" },
          { value: "marketplace", label: "Marketplace", icon: Store, show: true, description: "Machine profiles & add-ons" },
        ],
      },
      {
        id: "production",
        label: "Production",
        icon: Cog,
        description: "Shop floor configuration (admin/supervisor)",
        items: [
          { value: "manufacturing", label: "Manufacturing", icon: Factory, show: true, orgLevel: true, description: "Routing, parts, defaults" },
          { value: "shifts", label: "Shifts", icon: Clock, show: true, orgLevel: true, description: "Shift schedules" },
          { value: "work-centers", label: "Work Centers", icon: Wrench, show: true, orgLevel: true, description: "Stations and equipment" },
          { value: "alerts", label: "Smart Alerts", icon: BellRing, show: true, orgLevel: true, description: "Production alert thresholds" },
        ],
      },
      {
        id: "platform",
        label: "Platform",
        icon: Globe,
        description: "External integrations",
        items: [
          { value: "erp", label: "ERP Connector", icon: Plug, show: showERPTab, description: "Sync with external ERP" },
        ],
      },
    ],
    [showBillingTab, showERPTab]
  );

  // Filter by search
  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.show &&
            (q === "" ||
              i.label.toLowerCase().includes(q) ||
              i.description?.toLowerCase().includes(q))
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, search]);

  // Flat list of all visible values (for fallback if activeTab is hidden)
  const allVisibleValues = useMemo(
    () => groups.flatMap((g) => g.items.filter((i) => i.show).map((i) => i.value)),
    [groups]
  );

  useEffect(() => {
    if (!allVisibleValues.includes(activeTab) && allVisibleValues.length > 0) {
      setActiveTab(allVisibleValues[0]);
    }
  }, [allVisibleValues, activeTab]);

  if (authLoading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const NavList = ({ onSelect }: { onSelect?: () => void }) => (
    <nav aria-label="Settings sections" className="space-y-5">
      {visibleGroups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <div key={group.id}>
            <div className="mb-1.5 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <GroupIcon className="h-3 w-3" />
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                const locked = item.orgLevel && !canEditOrgSettings;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.value);
                      onSelect?.();
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {locked && (
                      <Lock
                        className={cn(
                          "h-3 w-3 shrink-0",
                          isActive ? "opacity-70" : "opacity-50"
                        )}
                        aria-label="Read-only"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {visibleGroups.length === 0 && (
        <p className="px-2 text-xs text-muted-foreground">No settings match "{search}".</p>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Settings2 className="h-6 w-6" />
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure your manufacturing environment and application preferences
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Mobile: search + nav trigger row */}
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                    <Menu className="h-4 w-4" />
                    Sections
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="border-b p-4">
                    <SheetTitle>Settings</SheetTitle>
                  </SheetHeader>
                  <div className="p-3">
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search settings…"
                        className="h-8 pl-7 text-xs"
                      />
                    </div>
                    <ScrollArea className="h-[calc(100vh-9rem)] pr-2">
                      <NavList onSelect={() => setMobileNavOpen(false)} />
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search settings…"
                    className="h-8 pl-7 text-xs"
                  />
                </div>
                <div className="rounded-lg border bg-card p-2">
                  <NavList />
                </div>
              </div>
            </aside>

            {/* Content panel */}
            <div className="min-w-0">
              <LazyTabContent value="general" activeTab={activeTab}>
                <GeneralSettings />
              </LazyTabContent>

              <LazyTabContent value="organization" activeTab={activeTab}>
                <OrganizationSettings isDeveloper={isDeveloper} />
              </LazyTabContent>

              <LazyTabContent value="billing" activeTab={activeTab}>
                {showBillingTab ? <BillingSettings /> : <DeveloperOnlyPlaceholder feature="Billing and subscription" />}
              </LazyTabContent>

              <LazyTabContent value="manufacturing" activeTab={activeTab}>
                <ReadOnlyGate canEdit={canEditOrgSettings}>
                  <div className="space-y-6">
                    <ManufacturingSettings />
                    <PartCatalogManager />
                  </div>
                </ReadOnlyGate>
              </LazyTabContent>

              <LazyTabContent value="shifts" activeTab={activeTab}>
                <ReadOnlyGate canEdit={canEditOrgSettings}>
                  <ShiftSettings />
                </ReadOnlyGate>
              </LazyTabContent>

              <LazyTabContent value="work-centers" activeTab={activeTab}>
                <ReadOnlyGate canEdit={canEditOrgSettings}>
                  <WorkCenterSettings />
                </ReadOnlyGate>
              </LazyTabContent>

              <LazyTabContent value="notifications" activeTab={activeTab}>
                <NotificationSettings />
              </LazyTabContent>

              <LazyTabContent value="alerts" activeTab={activeTab}>
                <ReadOnlyGate canEdit={canEditOrgSettings}>
                  <SmartAlertSettings thresholds={thresholds} onSave={saveThresholds} />
                </ReadOnlyGate>
              </LazyTabContent>

              <LazyTabContent value="onboarding" activeTab={activeTab}>
                <OnboardingSettings />
              </LazyTabContent>

              {showERPTab && (
                <LazyTabContent value="erp" activeTab={activeTab}>
                  <EntitlementGate feature="erp_connector" requiredPlan="enterprise">
                    <Suspense fallback={<SettingsSkeleton rows={3} />}>
                      <ERPConnectorSettings />
                    </Suspense>
                  </EntitlementGate>
                </LazyTabContent>
              )}

              <LazyTabContent value="marketplace" activeTab={activeTab}>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Marketplace
                      </CardTitle>
                      <CardDescription>
                        Browse and purchase verified machine profiles, tooling packages, and other add-ons for your stations.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Machine Profiles</CardTitle>
                      <CardDescription>Verified manufacturer specifications for your CNC machines.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MachineProfileMarketplace stationId={null} stationName={null} />
                    </CardContent>
                  </Card>
                </div>
              </LazyTabContent>

              <LazyTabContent value="my-issues" activeTab={activeTab}>
                <MyIssuesPanel />
              </LazyTabContent>
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

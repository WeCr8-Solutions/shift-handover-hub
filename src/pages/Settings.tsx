import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  GraduationCap,
  Plug,
  Store,
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

// Lazy-load heavy enterprise-only component
const ERPConnectorSettings = lazy(() =>
  import("@/components/settings/ERPConnectorSettings").then((m) => ({
    default: m.ERPConnectorSettings,
  }))
);

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
  const { user, loading: authLoading } = useAuth();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();
  const { canManageBilling } = useTrialStatus();
  const { organizationRole } = useOrgContext();
  const { thresholds, saveThresholds } = useSmartAlerts();
  const [activeTab, setActiveTab] = useState("general");

  const showBillingTab = isDeveloper || canManageBilling;
  const showERPTab = isDeveloper || canManageBilling;

  const isOrgAdmin = organizationRole === "admin" || organizationRole === "owner";
  const isSupervisor = organizationRole === "supervisor";
  const canEditOrgSettings = isOrgAdmin || isSupervisor || isDeveloper;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { value: "general", label: "General", icon: Settings2, show: true },
    { value: "organization", label: "Organization", icon: Building2, show: true },
    { value: "billing", label: "Billing", icon: CreditCard, show: showBillingTab },
    { value: "manufacturing", label: "Manufacturing", icon: Factory, show: true, orgLevel: true },
    { value: "shifts", label: "Shifts", icon: Clock, show: true, orgLevel: true },
    { value: "work-centers", label: "Work Centers", icon: Wrench, show: true, orgLevel: true },
    { value: "notifications", label: "Notifications", icon: Bell, show: true },
    { value: "alerts", label: "Alerts", icon: BellRing, show: true, orgLevel: true },
    { value: "onboarding", label: "Onboarding", icon: GraduationCap, show: true },
    { value: "erp", label: "ERP", icon: Plug, show: showERPTab },
    { value: "marketplace", label: "Marketplace", icon: Store, show: true },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Settings2 className="h-6 w-6" />
            Application Settings
          </h1>
          <p className="text-muted-foreground">Configure your manufacturing environment and application preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-auto w-max gap-2 bg-transparent p-0">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="border whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.label}
                    {tab.orgLevel && !canEditOrgSettings && (
                      <Lock className="ml-1.5 h-3 w-3 opacity-50" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

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
        </Tabs>
      </main>
    </div>
  );
}

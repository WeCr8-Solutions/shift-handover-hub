import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { ManufacturingSettings } from "@/components/settings/ManufacturingSettings";
import { ShiftSettings } from "@/components/settings/ShiftSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { WorkCenterSettings } from "@/components/settings/WorkCenterSettings";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { OnboardingSettings } from "@/components/settings/OnboardingSettings";
import { ERPConnectorSettings } from "@/components/settings/ERPConnectorSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntitlementGate } from "@/components/EntitlementGate";
import { PartCatalogManager } from "@/components/settings/PartCatalogManager";
import { MachineProfileMarketplace } from "@/components/station/MachineProfileMarketplace";

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
  const { loading: settingsLoading } = useAppSettings();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();
  const { canManageBilling } = useTrialStatus();
  const [activeTab, setActiveTab] = useState("general");

  const showBillingTab = isDeveloper || canManageBilling;
  const showERPTab = isDeveloper || canManageBilling;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || settingsLoading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 lg:grid-cols-8">
            <TabsTrigger
              value="general"
              className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>

            <TabsTrigger
              value="organization"
              className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Organization
            </TabsTrigger>

            {showBillingTab && (
              <TabsTrigger
                value="billing"
                className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </TabsTrigger>
            )}

            <TabsTrigger
              value="manufacturing"
              className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Factory className="mr-2 h-4 w-4" />
              Manufacturing
            </TabsTrigger>

            <TabsTrigger
              value="shifts"
              className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock className="mr-2 h-4 w-4" />
              Shifts
            </TabsTrigger>

            <TabsTrigger
              value="work-centers"
              className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Work Centers
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>

            <TabsTrigger
              value="onboarding"
              className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Onboarding
            </TabsTrigger>

            {showERPTab && (
              <TabsTrigger
                value="erp"
                className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Plug className="mr-2 h-4 w-4" />
                ERP
              </TabsTrigger>
            )}

            <TabsTrigger
              value="marketplace"
              className="border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Store className="mr-2 h-4 w-4" />
              Marketplace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="organization">
            <OrganizationSettings isDeveloper={isDeveloper} />
          </TabsContent>

          <TabsContent value="billing">
            {showBillingTab ? <BillingSettings /> : <DeveloperOnlyPlaceholder feature="Billing and subscription" />}
          </TabsContent>

          <TabsContent value="manufacturing">
            <div className="space-y-6">
              <ManufacturingSettings />
              <PartCatalogManager />
            </div>
          </TabsContent>

          <TabsContent value="shifts">
            <ShiftSettings />
          </TabsContent>

          <TabsContent value="work-centers">
            <WorkCenterSettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="onboarding">
            <OnboardingSettings />
          </TabsContent>

          {showERPTab && (
            <TabsContent value="erp">
              <EntitlementGate feature="erp_connector" requiredPlan="enterprise">
                <ERPConnectorSettings />
              </EntitlementGate>
            </TabsContent>
          )}

          <TabsContent value="marketplace">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Marketplace
                  </CardTitle>
                  <CardDescription>
                    Browse and purchase verified machine profiles, tooling packages, and other add-ons for your
                    stations.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Machine Profiles</CardTitle>
                  <CardDescription>
                    Verified manufacturer specifications for your CNC machines. Purchase profiles to unlock
                    station-level context and capability matching.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MachineProfileMarketplace stationId={null} stationName={null} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

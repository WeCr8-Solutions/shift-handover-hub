import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings2, Factory, Bell, Clock, Wrench, Building2, CreditCard, Lock, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAdminAccess } from "@/hooks/useAdminData";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { ManufacturingSettings } from "@/components/settings/ManufacturingSettings";
import { ShiftSettings } from "@/components/settings/ShiftSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { WorkCenterSettings } from "@/components/settings/WorkCenterSettings";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { OnboardingSettings } from "@/components/settings/OnboardingSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { loading: settingsLoading } = useAppSettings();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();
  const [activeTab, setActiveTab] = useState("general");

  if (authLoading || settingsLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Developer-only restricted content placeholder
  const DeveloperOnlyPlaceholder = ({ feature }: { feature: string }) => (
    <Card className="border-dashed border-muted-foreground/30">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">Developer Access Required</CardTitle>
        <CardDescription>
          {feature} information is restricted to SDK developers only.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Contact your system administrator to request developer access.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6" />
            Application Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your manufacturing environment and application preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="general" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="organization"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Organization
            </TabsTrigger>
            {/* Only show Billing tab for developers */}
            {isDeveloper && (
              <TabsTrigger 
                value="billing"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Billing
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="manufacturing"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              <Factory className="w-4 h-4 mr-2" />
              Manufacturing
            </TabsTrigger>
            <TabsTrigger 
              value="shifts"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              <Clock className="w-4 h-4 mr-2" />
              Shifts
            </TabsTrigger>
            <TabsTrigger 
              value="work-centers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Work Centers
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="onboarding"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Onboarding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="organization">
            <OrganizationSettings isDeveloper={isDeveloper} />
          </TabsContent>

          {/* Billing only accessible by developers */}
          <TabsContent value="billing">
            {isDeveloper ? (
              <BillingSettings />
            ) : (
              <DeveloperOnlyPlaceholder feature="Billing and subscription" />
            )}
          </TabsContent>

          <TabsContent value="manufacturing">
            <ManufacturingSettings />
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
        </Tabs>
      </main>
    </div>
  );
}

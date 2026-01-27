import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Settings2, Factory, Bell, Clock, Wrench, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { ManufacturingSettings } from "@/components/settings/ManufacturingSettings";
import { ShiftSettings } from "@/components/settings/ShiftSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { WorkCenterSettings } from "@/components/settings/WorkCenterSettings";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { loading: settingsLoading } = useAppSettings();
  const [activeTab, setActiveTab] = useState("general");

  if (authLoading || settingsLoading) {
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
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
          </TabsList>

          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="organization">
            <OrganizationSettings />
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
        </Tabs>
      </main>
    </div>
  );
}

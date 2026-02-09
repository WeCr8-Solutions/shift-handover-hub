import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess, useSystemStats } from "@/hooks/useAdminData";
import { Header } from "@/components/Header";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { UserManagement } from "@/components/admin/UserManagement";
import { StationManagement } from "@/components/admin/StationManagement";
import { OrganizationOversight } from "@/components/admin/OrganizationOversight";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { WorkOrderManagement } from "@/components/admin/WorkOrderManagement";
import { WorkOrderHistory } from "@/components/admin/WorkOrderHistory";
import { RoutingTemplateManagement } from "@/components/admin/RoutingTemplateManagement";
import { PerformanceUpdatesReview } from "@/components/admin/PerformanceUpdatesReview";
import { IssuesManagement } from "@/components/admin/IssuesManagement";
import { RLSHealthCheck } from "@/components/admin/RLSHealthCheck";
import { DevIssueQueue } from "@/components/admin/DevIssueQueue";
import { DevSettingsPanel } from "@/components/admin/DevSettingsPanel";
import { BulkUploadDialog } from "@/components/BulkUploadDialog";
import { SeedTestDataButton } from "@/components/admin/SeedTestDataButton";
import { TourTriggerButton } from "@/components/onboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, LayoutDashboard, Users, Wrench, Briefcase, Activity, FileSpreadsheet, Package, Route, Lightbulb, History, Bug, ShieldCheck, ListTodo, Settings2 } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isDeveloper, isSupervisor, hasAdminAccess, hasTestingAccess, loading: accessLoading } = useAdminAccess();
  const { stats, loading: statsLoading } = useSystemStats();
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!accessLoading && !hasAdminAccess && user) {
      navigate("/");
    }
  }, [accessLoading, hasAdminAccess, user, navigate]);

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                System management and oversight
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TourTriggerButton />
            <SeedTestDataButton />
            <Button variant="outline" onClick={() => setBulkUploadOpen(true)} data-tour="bulk-upload">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <Badge variant={isAdmin || isDeveloper ? "default" : "secondary"} className="gap-1">
              <Shield className="w-3 h-3" />
              {isAdmin ? "Administrator" : isDeveloper ? "Developer" : "Supervisor"}
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div data-tour="admin-stats">
          <AdminStatsCards stats={stats} loading={statsLoading} />
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList data-tour="admin-tabs" className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="work-orders" className="gap-2">
              <Package className="w-4 h-4" />
              Work Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="routing" className="gap-2">
              <Route className="w-4 h-4" />
              Routing
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="stations" className="gap-2">
              <Wrench className="w-4 h-4" />
              Stations
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2">
              <Bug className="w-4 h-4" />
              Issues
            </TabsTrigger>
            {/* Developer-only tabs - restricted to platform admin/developer roles */}
            {hasTestingAccess && (
              <>
                <TabsTrigger value="dev-queue" className="gap-2">
                  <ListTodo className="w-4 h-4" />
                  Dev Queue
                </TabsTrigger>
                <TabsTrigger value="dev-settings" className="gap-2">
                  <Settings2 className="w-4 h-4" />
                  Dev Settings
                </TabsTrigger>
                <TabsTrigger value="rls-health" className="gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  RLS Health
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OrganizationOversight isAdmin={isAdmin} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <UserManagement isAdmin={isAdmin} />
              <StationManagement isAdmin={isAdmin} />
            </div>
          </TabsContent>

          <TabsContent value="work-orders">
            <WorkOrderManagement isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="history">
            <WorkOrderHistory isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="routing">
            <RoutingTemplateManagement isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="stations">
            <StationManagement isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="organizations">
            <OrganizationOversight isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceUpdatesReview isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLogs />
          </TabsContent>

          <TabsContent value="issues">
            <IssuesManagement />
          </TabsContent>

          {/* Developer-only tab contents */}
          {hasTestingAccess && (
            <>
              <TabsContent value="dev-queue">
                <DevIssueQueue />
              </TabsContent>

              <TabsContent value="dev-settings">
                <DevSettingsPanel />
              </TabsContent>

              <TabsContent value="rls-health">
                <RLSHealthCheck />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <BulkUploadDialog 
        open={bulkUploadOpen} 
        onOpenChange={setBulkUploadOpen}
      />
    </div>
  );
}

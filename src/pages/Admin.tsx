import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess, useSystemStats } from "@/hooks/useAdminData";
import { Header } from "@/components/Header";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { TourTriggerButton } from "@/components/onboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, LayoutDashboard, Users, Wrench, Briefcase, Activity, FileSpreadsheet, Package, Route, Lightbulb, History, Bug, ShieldCheck, ListTodo, Settings2, Map, BookOpen, Cpu, MessageSquare, BellRing, Tv, Globe, Building, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminComponentAccess } from "@/types/admin";

// Lazy-load heavy admin panels (Phase 6 — code splitting)
const UserManagement = lazy(() => import("@/components/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const StationManagement = lazy(() => import("@/components/admin/StationManagement").then(m => ({ default: m.StationManagement })));
const OrganizationOversight = lazy(() => import("@/components/admin/OrganizationOversight").then(m => ({ default: m.OrganizationOversight })));
const ActivityLogs = lazy(() => import("@/components/admin/ActivityLogs").then(m => ({ default: m.ActivityLogs })));
const DataAccessLogs = lazy(() => import("@/components/admin/DataAccessLogs").then(m => ({ default: m.DataAccessLogs })));
const WorkOrderManagement = lazy(() => import("@/components/admin/WorkOrderManagement").then(m => ({ default: m.WorkOrderManagement })));
const WorkOrderHistory = lazy(() => import("@/components/admin/WorkOrderHistory").then(m => ({ default: m.WorkOrderHistory })));
const RoutingTemplateManagement = lazy(() => import("@/components/admin/RoutingTemplateManagement").then(m => ({ default: m.RoutingTemplateManagement })));
const PerformanceUpdatesReview = lazy(() => import("@/components/admin/PerformanceUpdatesReview").then(m => ({ default: m.PerformanceUpdatesReview })));
const IssuesManagement = lazy(() => import("@/components/admin/IssuesManagement").then(m => ({ default: m.IssuesManagement })));
const SystemUpdatesManager = lazy(() => import("@/components/admin/SystemUpdatesManager").then(m => ({ default: m.SystemUpdatesManager })));
const RLSHealthCheck = lazy(() => import("@/components/admin/RLSHealthCheck").then(m => ({ default: m.RLSHealthCheck })));
const DevIssueQueue = lazy(() => import("@/components/admin/DevIssueQueue").then(m => ({ default: m.DevIssueQueue })));
const DevSettingsPanel = lazy(() => import("@/components/admin/DevSettingsPanel").then(m => ({ default: m.DevSettingsPanel })));
const UserJourneyDebugPanel = lazy(() => import("@/components/admin/UserJourneyDebugPanel").then(m => ({ default: m.UserJourneyDebugPanel })));
const BulkUploadDialog = lazy(() => import("@/components/BulkUploadDialog").then(m => ({ default: m.BulkUploadDialog })));
const SeedTestDataButton = lazy(() => import("@/components/admin/SeedTestDataButton").then(m => ({ default: m.SeedTestDataButton })));
const MachineLibraryManagement = lazy(() => import("@/components/admin/MachineLibraryManagement").then(m => ({ default: m.MachineLibraryManagement })));
const MachineMonitorPanel = lazy(() => import("@/components/admin/MachineMonitorPanel").then(m => ({ default: m.MachineMonitorPanel })));
const VisitorSurveyAnalytics = lazy(() => import("@/components/admin/VisitorSurveyAnalytics").then(m => ({ default: m.VisitorSurveyAnalytics })));
const SmartAlertAdmin = lazy(() => import("@/components/admin/SmartAlertAdmin").then(m => ({ default: m.SmartAlertAdmin })));
const ShopFloorDisplayManagement = lazy(() => import("@/components/admin/ShopFloorDisplayManagement").then(m => ({ default: m.ShopFloorDisplayManagement })));
const NotificationQueueStatus = lazy(() => import("@/components/admin/NotificationQueueStatus").then(m => ({ default: m.NotificationQueueStatus })));
const PlatformOverviewTab = lazy(() => import("@/components/admin/PlatformOverviewTab").then(m => ({ default: m.PlatformOverviewTab })));
const BlogAdmin = lazy(() => import("@/components/admin/BlogAdmin").then(m => ({ default: m.BlogAdmin })));

const AdminTabFallback = () => <div className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></div>;

/** Small scope indicator badge for tabs */
function ScopeBadge({ scope }: { scope: "platform" | "org" }) {
  if (scope === "platform") {
    return <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 border-destructive/40 text-destructive"><Globe className="w-2.5 h-2.5" />Platform</Badge>;
  }
  return <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 border-primary/40 text-primary"><Building className="w-2.5 h-2.5" />Org</Badge>;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    isAdmin, isDeveloper, isSupervisor, isOrgAdmin, isOrgOwner,
    hasAdminAccess, hasTestingAccess, hasPlatformAccess, hasPlatformAdminAccess,
    hasOrgAdminAccess, hasOrgSupervisorAccess, organizationId,
    loading: accessLoading
  } = useAdminAccess();

  // Derive org scope: platform admins see everything (null), others see their org
  const scopedOrgId = hasPlatformAccess ? null : organizationId;

  const { stats, loading: statsLoading, lastUpdated: statsLastUpdated, fetchStats } = useSystemStats({ organizationId: scopedOrgId });
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  // Build structured access object for child components
  const access: AdminComponentAccess = {
    isPlatformAdmin: hasPlatformAdminAccess,
    canManageOrg: hasOrgAdminAccess,
    canManageProduction: hasOrgSupervisorAccess,
    organizationId: scopedOrgId,
  };

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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
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
                {hasPlatformAccess ? "System management and oversight" : "Organization management"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TourTriggerButton />
            {hasTestingAccess && <SeedTestDataButton />}
            <Button variant="outline" onClick={() => setBulkUploadOpen(true)} data-tour="bulk-upload">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <Badge variant={hasPlatformAccess ? "default" : "secondary"} className="gap-1">
              <Shield className="w-3 h-3" />
              {isAdmin ? "Platform Admin" : isDeveloper ? "SDK Developer" : isOrgOwner ? "Org Owner" : isOrgAdmin ? "Org Admin" : isSupervisor ? "Supervisor" : "Operator"}
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div data-tour="admin-stats">
          <AdminStatsCards 
            stats={stats} 
            loading={statsLoading} 
            lastUpdated={statsLastUpdated}
            onRefresh={fetchStats}
            hasPlatformAccess={hasPlatformAccess}
          />
        </div>

        {/* Management Tabs - Organized by Bucket System */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList data-tour="admin-tabs" className="flex-wrap h-auto gap-1 p-2">
            {/* Overview */}
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>

            {/* Platform Overview - SDK admins only */}
            {hasPlatformAccess && (
              <TabsTrigger value="platform-overview" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Platform</span>
              </TabsTrigger>
            )}
            
            {/* Separator */}
            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
            
            {/* ORG BUCKET: Organization & Team Structure */}
            <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden lg:inline">Org</span>
              <TabsTrigger value="organizations" className="gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">{hasPlatformAccess ? "Organizations" : "My Org"}</span>
                <span className="sm:hidden">Orgs</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="stations" className="gap-2">
                <Wrench className="w-4 h-4" />
                Stations
              </TabsTrigger>
            </div>
            
            {/* Separator */}
            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
            
            {/* PRODUCTION BUCKET: Work Orders & Routing */}
            <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden lg:inline">Production</span>
              <TabsTrigger value="work-orders" className="gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Work Orders</span>
                <span className="sm:hidden">WO</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="routing" className="gap-2">
                <Route className="w-4 h-4" />
                Routing
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">Performance</span>
                <span className="sm:hidden">Perf</span>
              </TabsTrigger>
              <TabsTrigger value="machine-monitor" className="gap-2">
                <Cpu className="w-4 h-4" />
                <span className="hidden sm:inline">Machines</span>
                <span className="sm:hidden">CNC</span>
              </TabsTrigger>
              <TabsTrigger value="smart-alerts" className="gap-2">
                <BellRing className="w-4 h-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="displays" className="gap-2">
                <Tv className="w-4 h-4" />
                <span className="hidden sm:inline">Displays</span>
              </TabsTrigger>
            </div>
            
            
            {/* ACTIVITY BUCKET: Logs & Issues - Platform Admin/Developer only */}
            {hasPlatformAccess && (
              <>
                {/* Separator */}
                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
                
                <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden lg:inline">Activity</span>
                    <TabsTrigger value="activity" className="gap-2">
                      <Activity className="w-4 h-4" />
                      <span className="hidden sm:inline">Activity</span>
                      <span className="sm:hidden">Log</span>
                    </TabsTrigger>
                    <TabsTrigger value="data-access" className="gap-2">
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Data Access</span>
                      <span className="sm:hidden">Audit</span>
                    </TabsTrigger>
                  <TabsTrigger value="issues" className="gap-2">
                    <Bug className="w-4 h-4" />
                    Issues
                  </TabsTrigger>
                  <TabsTrigger value="system-updates" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Updates</span>
                  </TabsTrigger>
                  <TabsTrigger value="surveys" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Surveys</span>
                  </TabsTrigger>
                  <TabsTrigger value="blog-admin" className="gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Blog</span>
                  </TabsTrigger>
                </div>
              </>
            )}
            
            {/* Developer-only tabs - DEV TOOLS BUCKET */}
            {hasTestingAccess && (
              <>
                {/* Separator */}
                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
                
                <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-destructive/10 border border-destructive/20">
                  <span className="text-[10px] text-destructive font-medium uppercase tracking-wider hidden lg:inline">Dev</span>
                  <TabsTrigger value="dev-queue" className="gap-2">
                    <ListTodo className="w-4 h-4" />
                    <span className="hidden sm:inline">Queue</span>
                  </TabsTrigger>
                  <TabsTrigger value="dev-settings" className="gap-2">
                    <Settings2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger value="rls-health" className="gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">RLS</span>
                  </TabsTrigger>
                  <TabsTrigger value="user-journey" className="gap-2">
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">Journey</span>
                  </TabsTrigger>
                  <TabsTrigger value="machine-library" className="gap-2">
                    <Cpu className="w-4 h-4" />
                    <span className="hidden sm:inline">Library</span>
                  </TabsTrigger>
                </div>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Suspense fallback={<AdminTabFallback />}>
              <OrganizationOversight access={access} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <UserManagement access={access} />
                <StationManagement access={access} />
              </div>
            </Suspense>
          </TabsContent>

          {hasPlatformAccess && (
            <TabsContent value="platform-overview">
              <Suspense fallback={<AdminTabFallback />}><PlatformOverviewTab /></Suspense>
            </TabsContent>
          )}

          <TabsContent value="work-orders">
            <Suspense fallback={<AdminTabFallback />}><WorkOrderManagement isAdmin={access.isPlatformAdmin} /></Suspense>
          </TabsContent>

          <TabsContent value="history">
            <Suspense fallback={<AdminTabFallback />}><WorkOrderHistory isAdmin={access.isPlatformAdmin} /></Suspense>
          </TabsContent>

          <TabsContent value="routing">
            <Suspense fallback={<AdminTabFallback />}><RoutingTemplateManagement isAdmin={access.isPlatformAdmin} canManageTemplates={access.canManageProduction} /></Suspense>
          </TabsContent>

          <TabsContent value="users">
            <Suspense fallback={<AdminTabFallback />}><UserManagement access={access} /></Suspense>
          </TabsContent>

          <TabsContent value="stations">
            <Suspense fallback={<AdminTabFallback />}><StationManagement access={access} /></Suspense>
          </TabsContent>

          <TabsContent value="organizations">
            <Suspense fallback={<AdminTabFallback />}><OrganizationOversight access={access} /></Suspense>
          </TabsContent>

          <TabsContent value="performance">
            <Suspense fallback={<AdminTabFallback />}><PerformanceUpdatesReview isAdmin={access.isPlatformAdmin} /></Suspense>
          </TabsContent>

          <TabsContent value="machine-monitor">
            <Suspense fallback={<AdminTabFallback />}><MachineMonitorPanel isAdmin={access.isPlatformAdmin} /></Suspense>
          </TabsContent>

          <TabsContent value="smart-alerts">
            <Suspense fallback={<AdminTabFallback />}><SmartAlertAdmin /></Suspense>
          </TabsContent>

          <TabsContent value="displays">
            <Suspense fallback={<AdminTabFallback />}><ShopFloorDisplayManagement /></Suspense>
          </TabsContent>

          {hasPlatformAccess && (
            <>
              <TabsContent value="activity">
                <Suspense fallback={<AdminTabFallback />}><ActivityLogs /></Suspense>
                </TabsContent>

                <TabsContent value="data-access">
                  <Suspense fallback={<AdminTabFallback />}><DataAccessLogs /></Suspense>
                </TabsContent>
  
                <TabsContent value="issues">
                <Suspense fallback={<AdminTabFallback />}><IssuesManagement /></Suspense>
              </TabsContent>

              <TabsContent value="system-updates">
                <Suspense fallback={<AdminTabFallback />}><SystemUpdatesManager /></Suspense>
              </TabsContent>

              <TabsContent value="surveys">
                <Suspense fallback={<AdminTabFallback />}><VisitorSurveyAnalytics /></Suspense>
              </TabsContent>
            </>
          )}

          {/* Developer-only tab contents */}
          {hasTestingAccess && (
            <>
              <TabsContent value="dev-queue">
                <Suspense fallback={<AdminTabFallback />}>
                  <div className="space-y-6">
                    <DevIssueQueue />
                    <NotificationQueueStatus />
                  </div>
                </Suspense>
              </TabsContent>

              <TabsContent value="dev-settings">
                <Suspense fallback={<AdminTabFallback />}><DevSettingsPanel /></Suspense>
              </TabsContent>

              <TabsContent value="rls-health">
                <Suspense fallback={<AdminTabFallback />}><RLSHealthCheck /></Suspense>
              </TabsContent>

              <TabsContent value="user-journey">
                <Suspense fallback={<AdminTabFallback />}><UserJourneyDebugPanel /></Suspense>
              </TabsContent>

              <TabsContent value="machine-library">
                <Suspense fallback={<AdminTabFallback />}><MachineLibraryManagement /></Suspense>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <Suspense fallback={null}>
        <BulkUploadDialog 
          open={bulkUploadOpen} 
          onOpenChange={setBulkUploadOpen}
        />
      </Suspense>
    </div>
  );
}

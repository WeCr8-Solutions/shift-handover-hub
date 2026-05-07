import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess, useSystemStats } from "@/hooks/useAdminData";
import { Header } from "@/components/Header";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { TourTriggerButton } from "@/components/onboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, LayoutDashboard, Users, Wrench, Briefcase, Activity, FileSpreadsheet, Package, Route, Lightbulb, History, Bug, ShieldCheck, ListTodo, Settings2, Map, BookOpen, Cpu, MessageSquare, BellRing, Tv, Globe, Building, FileText, Megaphone, Library } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminComponentAccess } from "@/types/admin";
import { OrgScopeSelect } from "@/components/admin/OrgScopeSelect";
import { toast } from "sonner";

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
const PromotionsHub = lazy(() => import("@/components/admin/PromotionsHub").then(m => ({ default: m.PromotionsHub })));
const TrainingLibraryPanel = lazy(() => import("@/components/admin/training-library/TrainingLibraryPanel").then(m => ({ default: m.TrainingLibraryPanel })));
const PlatformMentorRegistry = lazy(() => import("@/components/admin/mentors/PlatformMentorRegistry").then(m => ({ default: m.PlatformMentorRegistry })));

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
  const { user, loading: authLoading, isReady } = useAuth();
  const {
    isAdmin, isDeveloper, isSupervisor, isOrgAdmin, isOrgOwner,
    hasAdminAccess, hasTestingAccess, hasPlatformAccess, hasPlatformAdminAccess,
    hasOrgAdminAccess, hasOrgSupervisorAccess, organizationId,
    loading: accessLoading
  } = useAdminAccess();

  // Platform admins can override scope to a specific customer org.
  // Non-platform users are locked to their own org.
  const [platformOrgOverride, setPlatformOrgOverride] = useState<string | null>(null);
  const scopedOrgId = hasPlatformAccess
    ? platformOrgOverride
    : organizationId;

  const { stats, loading: statsLoading, lastUpdated: statsLastUpdated, fetchStats } = useSystemStats({ organizationId: scopedOrgId });
  const isMobile = useIsMobile();
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Build structured access object for child components
  const access: AdminComponentAccess = {
    isPlatformAdmin: hasPlatformAdminAccess,
    canManageOrg: hasOrgAdminAccess,
    canManageProduction: hasOrgSupervisorAccess,
    organizationId: scopedOrgId,
  };

  const accessConfirmedRef = useRef(false);

  useEffect(() => {
    if (isReady && !user) {
      navigate("/auth");
    }
  }, [isReady, user, navigate]);

  useEffect(() => {
    if (accessLoading) return;
    if (hasAdminAccess && user) {
      accessConfirmedRef.current = true;
      return;
    }
    // Session-loss case: previously had access, now revoked → notify + redirect
    if (!hasAdminAccess && user && accessConfirmedRef.current) {
      toast.error("Admin access revoked", {
        description: "Your role changed during this session. Returning to the dashboard.",
      });
      navigate("/");
      return;
    }
    // Initial-load case: no access from the start → silent redirect
    if (!hasAdminAccess && user && !accessConfirmedRef.current) {
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
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-2xl font-bold truncate">Admin Dashboard</h1>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                {hasPlatformAccess ? "System management and oversight" : "Organization management"}
              </p>
            </div>
            <Badge variant={hasPlatformAccess ? "default" : "secondary"} className="gap-1 ml-auto shrink-0 text-xs">
              <Shield className="w-3 h-3" />
              <span className="hidden sm:inline">{isAdmin ? "Platform Admin" : isDeveloper ? "SDK Developer" : isOrgOwner ? "Org Owner" : isOrgAdmin ? "Org Admin" : isSupervisor ? "Supervisor" : "Operator"}</span>
              <span className="sm:hidden">{isAdmin ? "Admin" : isDeveloper ? "Dev" : isOrgOwner ? "Owner" : isOrgAdmin ? "Admin" : isSupervisor ? "Super" : "Op"}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TourTriggerButton />
            {hasPlatformAccess && (
              <OrgScopeSelect
                value={platformOrgOverride}
                onChange={setPlatformOrgOverride}
              />
            )}
            {hasTestingAccess && <SeedTestDataButton />}
            <Button
              variant="outline"
              size={isMobile ? "icon" : "default"}
              onClick={() => {
                if (hasPlatformAccess && !scopedOrgId) {
                  toast.error("Pick an organization first", {
                    description: "Bulk upload writes into a single org. Use the scope selector above.",
                  });
                  return;
                }
                setBulkUploadOpen(true);
              }}
              data-tour="bulk-upload"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Bulk Upload</span>}
            </Button>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          {/* Mobile: grouped select dropdown */}
          {isMobile ? (
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full" data-tour="admin-tabs">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>General</SelectLabel>
                  <SelectItem value="overview">Overview</SelectItem>
                  {hasPlatformAccess && <SelectItem value="platform-overview">Platform</SelectItem>}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Organization</SelectLabel>
                  <SelectItem value="organizations">{hasPlatformAccess ? "Organizations" : "My Org"}</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="stations">Stations</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Production</SelectLabel>
                  <SelectItem value="work-orders">Work Orders</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="routing">Routing</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="machine-monitor">Machines</SelectItem>
                  <SelectItem value="smart-alerts">Alerts</SelectItem>
                  <SelectItem value="displays">Displays</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Training</SelectLabel>
                  <SelectItem value="training-library">Training Library</SelectItem>
                </SelectGroup>
                {hasPlatformAccess && (
                  <SelectGroup>
                    <SelectLabel>Activity</SelectLabel>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="data-access">Data Access</SelectItem>
                    <SelectItem value="issues">Issues</SelectItem>
                    <SelectItem value="system-updates">Updates</SelectItem>
                    <SelectItem value="surveys">Surveys</SelectItem>
                    <SelectItem value="blog-admin">Blog</SelectItem>
                    <SelectItem value="flyer-campaigns">Promotions</SelectItem>
                  </SelectGroup>
                )}
                {hasTestingAccess && (
                  <SelectGroup>
                    <SelectLabel>Dev Tools</SelectLabel>
                    <SelectItem value="dev-queue">Queue</SelectItem>
                    <SelectItem value="dev-settings">Settings</SelectItem>
                    <SelectItem value="rls-health">RLS</SelectItem>
                    <SelectItem value="user-journey">Journey</SelectItem>
                    <SelectItem value="machine-library">Library</SelectItem>
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          ) : (
            <TabsList data-tour="admin-tabs" className="flex-wrap h-auto gap-1 p-2">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              {hasPlatformAccess && (
                <TabsTrigger value="platform-overview" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Platform
                </TabsTrigger>
              )}
              <div className="w-px h-6 bg-border mx-1" />
              <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden lg:inline">Org</span>
                <TabsTrigger value="organizations" className="gap-2">
                  <Briefcase className="w-4 h-4" />
                  {hasPlatformAccess ? "Organizations" : "My Org"}
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
              <div className="w-px h-6 bg-border mx-1" />
              <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden lg:inline">Production</span>
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
                <TabsTrigger value="performance" className="gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="machine-monitor" className="gap-2">
                  <Cpu className="w-4 h-4" />
                  Machines
                </TabsTrigger>
                <TabsTrigger value="smart-alerts" className="gap-2">
                  <BellRing className="w-4 h-4" />
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="displays" className="gap-2">
                  <Tv className="w-4 h-4" />
                  Displays
                </TabsTrigger>
              </div>
              <div className="w-px h-6 bg-border mx-1" />
              <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden lg:inline">Training</span>
                <TabsTrigger value="training-library" className="gap-2">
                  <Library className="w-4 h-4" />
                  Library
                </TabsTrigger>
                {hasPlatformAccess && (
                  <TabsTrigger value="cert-mentors" className="gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Mentors
                  </TabsTrigger>
                )}
              </div>
              {hasPlatformAccess && (
                <>
                  <div className="w-px h-6 bg-border mx-1" />
                  <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden lg:inline">Activity</span>
                    <TabsTrigger value="activity" className="gap-2">
                      <Activity className="w-4 h-4" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="data-access" className="gap-2">
                      <Shield className="w-4 h-4" />
                      Data Access
                    </TabsTrigger>
                    <TabsTrigger value="issues" className="gap-2">
                      <Bug className="w-4 h-4" />
                      Issues
                    </TabsTrigger>
                    <TabsTrigger value="system-updates" className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      Updates
                    </TabsTrigger>
                    <TabsTrigger value="surveys" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Surveys
                    </TabsTrigger>
                    <TabsTrigger value="blog-admin" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Blog
                    </TabsTrigger>
                    <TabsTrigger value="flyer-campaigns" className="gap-2">
                      <Megaphone className="w-4 h-4" />
                      Promotions
                    </TabsTrigger>
                  </div>
                </>
              )}
              {hasTestingAccess && (
                <>
                  <div className="w-px h-6 bg-border mx-1" />
                  <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-destructive/10 border border-destructive/20">
                    <span className="text-[10px] text-destructive font-medium uppercase tracking-wider hidden lg:inline">Dev</span>
                    <TabsTrigger value="dev-queue" className="gap-2">
                      <ListTodo className="w-4 h-4" />
                      Queue
                    </TabsTrigger>
                    <TabsTrigger value="dev-settings" className="gap-2">
                      <Settings2 className="w-4 h-4" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="rls-health" className="gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      RLS
                    </TabsTrigger>
                    <TabsTrigger value="user-journey" className="gap-2">
                      <Map className="w-4 h-4" />
                      Journey
                    </TabsTrigger>
                    <TabsTrigger value="machine-library" className="gap-2">
                      <Cpu className="w-4 h-4" />
                      Library
                    </TabsTrigger>
                  </div>
                </>
              )}
            </TabsList>
          )}

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

          <TabsContent value="training-library">
            <Suspense fallback={<AdminTabFallback />}><TrainingLibraryPanel access={access} /></Suspense>
          </TabsContent>

          {hasPlatformAccess && (
            <TabsContent value="cert-mentors">
              <Suspense fallback={<AdminTabFallback />}>
                <PlatformMentorRegistry isPlatformAdmin={access.isPlatformAdmin} />
              </Suspense>
            </TabsContent>
          )}

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

              <TabsContent value="blog-admin">
                <Suspense fallback={<AdminTabFallback />}><BlogAdmin /></Suspense>
              </TabsContent>

              <TabsContent value="flyer-campaigns">
                <Suspense fallback={<AdminTabFallback />}><PromotionsHub organizationId={scopedOrgId} /></Suspense>
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

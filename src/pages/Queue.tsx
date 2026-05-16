import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQueue, QueueStatus, QueueItemType } from "@/hooks/useQueue";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useOrgContext } from "@/contexts/OrgContext";
import { useOperatorSessions } from "@/hooks/useOperatorSessions";
import { StationCheckIn } from "@/components/dashboard/StationCheckIn";
import { useNCR } from "@/hooks/useNCR";
import { useStations } from "@/hooks/useStations";
import { useBackgroundRefresh } from "@/hooks/useBackgroundRefresh";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { useOrgRefreshInterval } from "@/hooks/useOrgRefreshInterval";
import { useModuleContext } from "@/hooks/useModuleContext";
import { RefreshIndicator } from "@/components/dashboard/RefreshIndicator";
import { Header } from "@/components/Header";
import { QueueKanbanBoard } from "@/components/queue/QueueKanbanBoard";
import { QueueListView } from "@/components/queue/QueueListView";
import { QueueCalendarView } from "@/components/queue/QueueCalendarView";
import { QueueFilters } from "@/components/queue/QueueFilters";
import { CreateQueueItemDialog } from "@/components/queue/CreateQueueItemDialog";
import { QueueItemDetailDialog } from "@/components/queue/QueueItemDetailDialog";
import { QueueStatsCards } from "@/components/queue/QueueStatsCards";
import { DataSourceBanner } from "@/components/dashboard/DataSourceBanner";
import { WorkOrderRoutingEditor } from "@/components/routing/WorkOrderRoutingEditor";
import { OutsideProcessingManager } from "@/components/routing/OutsideProcessingManager";
import { WorkOrderHistory } from "@/components/admin/WorkOrderHistory";
import { SmartAlertPanel } from "@/components/alerts/SmartAlertPanel";
import { NCRApprovalPanel } from "@/components/ncr/NCRApprovalPanel";
import { QualityMetricsDashboard } from "@/components/ncr/QualityMetricsDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanningAssistantModal } from "@/components/queue/PlanningAssistantModal";
import {
  LayoutGrid,
  List,
  Plus,
  Calendar,
  Truck,
  GitBranch,
  Building2,
  Wrench,
  History,
  ShieldAlert,
} from "lucide-react";

type QueueTab = "queue" | "outside-processing" | "ncr" | "history";
type QueueView = "kanban" | "list" | "calendar";
type ViewScope = "organization" | "station";

export default function Queue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, isReady } = useAuth();
  const { hasAdminAccess, loading: accessLoading } = useAdminAccess();
  const { organization } = useOrgContext();
  const { activeSessions = [] } = useOperatorSessions();
  const { stations = [] } = useStations(null, organization?.id);

  const urlStationId = searchParams.get("station");
  const urlItemId = searchParams.get("item");
  const urlWorkOrder = searchParams.get("wo");
  const urlView = searchParams.get("view") as QueueView | null;
  const urlTab = searchParams.get("tab") as QueueTab | null;
  const urlTypeRaw = searchParams.get("type");
  const urlStatusRaw = searchParams.get("status");
  const urlTypes = urlTypeRaw ? (urlTypeRaw.split(",").filter(Boolean) as QueueItemType[]) : null;
  const urlStatuses = urlStatusRaw ? (urlStatusRaw.split(",").filter(Boolean) as QueueStatus[]) : null;
  const urlAssistant = searchParams.get("assistant");
  const urlAction = searchParams.get("action");

  const validTabs: QueueTab[] = ["queue", "outside-processing", "ncr", "history"];
  const validViews: QueueView[] = ["kanban", "list", "calendar"];

  const [activeTab, setActiveTab] = useState<QueueTab>(
    urlTab && validTabs.includes(urlTab) ? urlTab : "queue"
  );
  const [view, setView] = useState<QueueView>(
    urlView && validViews.includes(urlView) ? urlView : "kanban"
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(urlAction === "new");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(urlItemId);

  // Auto-open work order detail when navigated with ?item= param
  useEffect(() => {
    if (urlItemId) {
      setSelectedItemId(urlItemId);
    }
  }, [urlItemId]);

  // Deep-link sentinel: emit a status attribute so E2E + UX can distinguish
  // "drawer opened" from "item not visible due to RLS/filters".
  // (Effect runs once items load; no toast spam — the empty drawer is the UX cue.)

  const [routingEditorItem, setRoutingEditorItem] = useState<{
    id: string;
    work_order: string;
    part_number?: string;
  } | null>(null);

  const [viewScope, setViewScope] = useState<ViewScope>(urlStationId ? "station" : "organization");

  const [filters, setFilters] = useState<{
    status?: QueueStatus[];
    item_type?: QueueItemType[];
    station_id?: string;
    assigned_to?: string;
  }>({
    station_id: urlStationId || undefined,
    item_type: urlTypes ?? undefined,
    status: urlStatuses ?? undefined,
  });

  useEffect(() => {
    if (!accessLoading) {
      if (urlStationId) {
        setViewScope("station");
        setFilters((prev) => ({ ...prev, station_id: urlStationId }));
      } else if (!hasAdminAccess) {
        setViewScope("station");
        if (activeSessions.length > 0) {
          setFilters((prev) => ({
            ...prev,
            station_id: activeSessions[0]?.station_id || undefined,
          }));
        }
      } else {
        setViewScope("organization");
      }
    }
  }, [accessLoading, hasAdminAccess, urlStationId, activeSessions]);

  const {
    items = [],
    itemsByStatus,
    loading,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    addComment,
    getComments,
    getHistory,
    fetchItems,
  } = useQueue(filters);

  // Auto-open work order detail when navigated with ?wo= param (from handoff modal)
  useEffect(() => {
    if (urlWorkOrder && items.length > 0 && !selectedItemId) {
      const match = items.find((i) => i.work_order === urlWorkOrder);
      if (match) {
        setSelectedItemId(match.id);
      }
    }
  }, [urlWorkOrder, items, selectedItemId]);

  const { ncrs = [], approveNCR, rejectNCR } = useNCR();
  const pendingNCRs = ncrs.filter((n) => n.authorization_status === "pending");

  // Org-configured background refresh for queue data
  const refreshIntervalMs = useOrgRefreshInterval();
  const { isRefreshing, lastRefreshedAt, refresh: handleManualRefresh } =
    useBackgroundRefresh({
      key: `queue-${organization?.id}-${viewScope}-${filters.station_id || "all"}`,
      fetchers: [() => fetchItems?.() as unknown as Promise<unknown>],
      intervalMs: refreshIntervalMs,
      enabled: !!user,
    });

  // Smart alerts for queue view
  const { alerts: smartAlerts, loading: smartAlertsLoading } = useSmartAlerts({
    stationId: filters.station_id,
    refreshToken: lastRefreshedAt,
  });

  useEffect(() => {
    if (isReady && !user) {
      navigate("/auth", { replace: true });
    }
  }, [isReady, user, navigate]);

  useModuleContext({
    id: "queue",
    label: "Production Queue",
    data: {
      activeTab,
      viewScope,
      stationFilter: filters.station_id || null,
      organizationId: organization?.id ?? null,
    },
  });

  if (authLoading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-4xl space-y-4 px-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) || null : null;

  const qualityItems = items.filter((i) => i.qty_original != null && i.qty_original > 0 && !i.is_rework);

  const totalOriginal = qualityItems.reduce((sum, i) => sum + (i.qty_original ?? 0), 0);
  const totalScrap = qualityItems.reduce((sum, i) => sum + (i.qty_scrap ?? 0), 0);
  const totalRework = qualityItems.reduce((sum, i) => sum + (i.qty_rework ?? 0), 0);
  const totalCompleted = qualityItems.reduce((sum, i) => sum + (i.qty_completed ?? 0), 0);

  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending" || i.status === "queued").length,
    pendingWorkOrders: items.filter(
      (i) => (i.status === "pending" || i.status === "queued") && i.item_type === "work_order"
    ).length,
    quotes: items.filter((i) => i.item_type === "quote").length,
    inProgress: items.filter((i) => i.status === "in_progress").length,
    onHold: items.filter((i) => i.status === "on_hold").length,
    completed: items.filter((i) => i.status === "completed").length,
    overdue: items.filter((i) => i.due_date && new Date(i.due_date) < new Date() && i.status !== "completed").length,
    fpy: totalOriginal > 0 ? ((totalCompleted - totalRework) / totalOriginal) * 100 : undefined,
    scrapRate: totalOriginal > 0 ? (totalScrap / totalOriginal) * 100 : undefined,
    reworkRate: totalOriginal > 0 ? (totalRework / totalOriginal) * 100 : undefined,
  };

  const handleOpenRouting = (item: { id: string; work_order?: string | null; part_number?: string | null }) => {
    setRoutingEditorItem({
      id: item.id,
      work_order: item.work_order || "N/A",
      part_number: item.part_number || undefined,
    });
  };

  const handleScopeChange = (scope: ViewScope) => {
    setViewScope(scope);
    if (scope === "organization") {
      setFilters((prev) => ({ ...prev, station_id: undefined }));
    }
  };


  const deepLinkState = !urlItemId
    ? "none"
    : selectedItem
      ? "opened"
      : loading
        ? "loading"
        : "not-found";

  return (
    <div
      className="min-h-screen bg-background"
      data-testid="queue-page"
      data-deep-link-state={deepLinkState}
      data-deep-link-item={urlItemId ?? ""}
    >
      <Header />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                Queue Management
                <Badge
                  variant="outline"
                  className={
                    viewScope === "organization"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                  }
                >
                  {viewScope === "organization" ? (
                    <>
                      <Building2 className="mr-1 h-3 w-3" />
                      Organization
                    </>
                  ) : (
                    <>
                      <Wrench className="mr-1 h-3 w-3" />
                      Station
                    </>
                  )}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                {viewScope === "organization"
                  ? `All work orders across ${organization?.name || "organization"}`
                  : filters.station_id
                    ? "Viewing station-specific queue"
                    : "Select a station to view its queue"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasAdminAccess && (
              <div className="mr-2 flex items-center rounded-lg border p-1">
                <Button
                  variant={viewScope === "organization" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleScopeChange("organization")}
                  className="gap-1"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Org</span>
                </Button>
                <Button
                  variant={viewScope === "station" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleScopeChange("station")}
                  className="gap-1"
                >
                  <Wrench className="h-4 w-4" />
                  <span className="hidden sm:inline">Station</span>
                </Button>
              </div>
            )}

            <RefreshIndicator
              isRefreshing={isRefreshing}
              lastRefreshedAt={lastRefreshedAt}
              onRefresh={handleManualRefresh}
            />

            <Button onClick={() => setCreateDialogOpen(true)} data-tour="add-queue-item">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QueueTab)} data-tour="queue-tabs">
          <TabsList>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Work Queue
            </TabsTrigger>

            {viewScope === "organization" && (
              <TabsTrigger value="outside-processing" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Outside Processing
              </TabsTrigger>
            )}

            {hasAdminAccess && (
              <TabsTrigger value="ncr" className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                NCR Queue
                {pendingNCRs.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                    {pendingNCRs.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}

            {hasAdminAccess && (
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="queue" className="mt-6 space-y-6">
            <DataSourceBanner />

            {!hasAdminAccess && !accessLoading && activeSessions.length === 0 && !filters.station_id && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Wrench className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No active station</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Check in to a work station from the dashboard to view and manage your queue.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Go to dashboard
                  </Button>
                </CardContent>
              </Card>
            )}

            <QueueStatsCards stats={stats} />

            {smartAlerts.length > 0 && (
              <SmartAlertPanel
                alerts={smartAlerts}
                loading={smartAlertsLoading}
                variant="full"
                maxVisible={5}
              />
            )}

            <div className="flex items-center justify-between gap-4">
              <div data-tour="queue-filters">
                <QueueFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  showStationFilter={viewScope === "station"}
                  stations={stations.map(s => ({ id: s.id, name: s.name, station_id: s.station_id }))}
                />
              </div>

              <div className="flex items-center rounded-lg border p-1" data-tour="queue-views">
                <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setView("kanban")}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}>
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("calendar")}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loading && items.length === 0 ? (
              <div className="space-y-3 py-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {view === "kanban" && (
                  <QueueKanbanBoard
                    itemsByStatus={itemsByStatus}
                    onItemClick={setSelectedItemId}
                    onStatusChange={(itemId, newStatus) => updateItem(itemId, { status: newStatus })}
                    onReorder={reorderItems}
                  />
                )}

                {view === "list" && (
                  <QueueListView
                    items={items}
                    onItemClick={setSelectedItemId}
                    onStatusChange={(itemId, newStatus) => updateItem(itemId, { status: newStatus })}
                    onDelete={deleteItem}
                    onOpenRouting={handleOpenRouting}
                  />
                )}

                {view === "calendar" && <QueueCalendarView items={items} onItemClick={setSelectedItemId} />}
              </>
            )}
          </TabsContent>

          <TabsContent value="outside-processing" className="mt-6">
            <OutsideProcessingManager />
          </TabsContent>

          {hasAdminAccess && (
            <TabsContent value="ncr" className="mt-6 space-y-6">
              <NCRApprovalPanel ncrs={pendingNCRs} onApprove={approveNCR} onReject={rejectNCR} />
              <QualityMetricsDashboard items={items} />
            </TabsContent>
          )}

          {hasAdminAccess && (
            <TabsContent value="history" className="mt-6">
              <WorkOrderHistory isAdmin={true} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <CreateQueueItemDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onCreate={createItem} />

      <QueueItemDetailDialog
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItemId(null);
        }}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onAddComment={addComment}
        getComments={getComments}
        getHistory={getHistory}
        onOpenRouting={handleOpenRouting}
      />

      <Dialog
        open={!!routingEditorItem}
        onOpenChange={(open) => {
          if (!open) setRoutingEditorItem(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Production Routing
            </DialogTitle>
          </DialogHeader>

          {routingEditorItem && (
            <WorkOrderRoutingEditor
              queueItemId={routingEditorItem.id}
              workOrderNumber={routingEditorItem.work_order}
              partNumber={routingEditorItem.part_number}
              onClose={() => setRoutingEditorItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {hasAdminAccess && organization && <PlanningAssistantModal organizationId={organization.id} />}
    </div>
  );
}

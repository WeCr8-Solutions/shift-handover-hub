import { useState, useEffect, useMemo } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Package, Plus, Building2, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderRoutingEditor } from "@/components/routing/WorkOrderRoutingEditor";
import { CreateWorkOrderDialog } from "@/components/queue/CreateWorkOrderDialog";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAllOrganizations } from "@/hooks/useAdminData";
import { Database } from "@/integrations/supabase/types";
import { WorkOrderTable } from "./WorkOrderTable";
import { WorkOrderOrgBuckets, OrganizationBucket } from "./WorkOrderOrgBuckets";

type QueueStatus = Database["public"]["Enums"]["queue_status"];

interface QueueItem {
  id: string;
  title: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  status: QueueStatus;
  priority: string;
  quantity: number | null;
  due_date: string | null;
  created_at: string;
  station_id: string | null;
  organization_id: string | null;
  station?: { name: string; station_id: string } | null;
  team?: { name: string } | null;
  organization?: { name: string } | null;
}

interface WorkOrderManagementProps {
  isAdmin: boolean;
}

type ViewMode = "grouped" | "flat";

export function WorkOrderManagement({ isAdmin }: WorkOrderManagementProps) {
  const { toast } = useToast();
  const { organization } = useOrgContext();
  const { organizations } = useAllOrganizations();
  const [workOrders, setWorkOrders] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");  const [statusFilter, setStatusFilter] = useUrlState<string>("woStatus", "all");
  const [routingEditorItem, setRoutingEditorItem] = useState<QueueItem | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");  const [selectedOrg, setSelectedOrg] = useUrlState<string>("woOrg", "all");

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter]);

  const fetchWorkOrders = async () => {
    setLoading(true);
    let query = supabase
      .from("queue_items")
      .select(`*, station:stations(name, station_id), team:teams(name), organization:organizations(name)`)
      .eq("item_type", "work_order")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as QueueStatus);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching work orders:", error);
      toast({ title: "Error", description: "Failed to load work orders", variant: "destructive" });
    } else {
      setWorkOrders(data || []);
    }
    setLoading(false);
  };

  const organizationBuckets: OrganizationBucket[] = useMemo(() => {
    const buckets: Map<string, OrganizationBucket> = new Map();
    buckets.set("unassigned", {
      id: "unassigned", name: "Unassigned Work Orders", workOrders: [],
      stats: { total: 0, inProgress: 0, onHold: 0, overdue: 0 },
    });

    organizations.forEach(org => {
      buckets.set(org.id, {
        id: org.id, name: org.name, workOrders: [],
        stats: { total: 0, inProgress: 0, onHold: 0, overdue: 0 },
        ownerName: org.owner_name, ownerEmail: org.owner_email,
        subscriptionTier: org.subscription_tier, subscriptionStatus: org.subscription_status,
      });
    });

    workOrders.forEach(wo => {
      const searchMatch =
        wo.work_order?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.part_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.title?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!searchMatch) return;

      const orgId = wo.organization_id || "unassigned";
      const bucket = buckets.get(orgId) || buckets.get("unassigned")!;
      bucket.workOrders.push(wo);
      bucket.stats.total++;
      if (wo.status === "in_progress") bucket.stats.inProgress++;
      if (wo.status === "on_hold") bucket.stats.onHold++;
      if (wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed") bucket.stats.overdue++;
    });

    return Array.from(buckets.values())
      .filter(b => b.stats.total > 0)
      .filter(b => selectedOrg === "all" || b.id === selectedOrg)
      .sort((a, b) => b.stats.total - a.stats.total);
  }, [workOrders, organizations, searchQuery, selectedOrg]);

  const handleDeleteWorkOrder = async (wo: QueueItem) => {
    if (!isAdmin) return;
    const { error } = await supabase.from("queue_items").delete().eq("id", wo.id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete work order", variant: "destructive" });
    } else {
      toast({ title: "Work order deleted" });
      fetchWorkOrders();
    }
  };

  const handleStatusChange = async (wo: QueueItem, newStatus: QueueStatus) => {
    const { error } = await supabase.from("queue_items").update({ status: newStatus }).eq("id", wo.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      toast({ title: "Status updated" });
      fetchWorkOrders();
    }
  };

  const filteredWorkOrders = workOrders.filter(wo =>
    wo.work_order?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.part_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const globalStats = {
    total: workOrders.length,
    inProgress: workOrders.filter(wo => wo.status === "in_progress").length,
    onHold: workOrders.filter(wo => wo.status === "on_hold").length,
    overdue: workOrders.filter(wo => wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed").length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Work Order Management
                </CardTitle>
                <CardDescription>
                  {globalStats.total} work orders • {globalStats.inProgress} in progress • {globalStats.onHold} on hold
                  {globalStats.overdue > 0 && (
                    <span className="text-destructive ml-2">• {globalStats.overdue} overdue</span>
                  )}
                </CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="shrink-0">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Work Order</span>
              </Button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search work orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Building2 className="w-4 h-4 mr-2 shrink-0" />
                    <SelectValue placeholder="Filter by org" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grouped">
                      <span className="flex items-center gap-2"><FolderOpen className="w-4 h-4" />Grouped</span>
                    </SelectItem>
                    <SelectItem value="flat">Flat View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grouped" ? (
            <WorkOrderOrgBuckets
              buckets={organizationBuckets}
              isAdmin={isAdmin}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteWorkOrder}
              onEditRouting={setRoutingEditorItem}
            />
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <WorkOrderTable
                workOrders={filteredWorkOrders}
                showOrg
                isAdmin={isAdmin}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteWorkOrder}
                onEditRouting={setRoutingEditorItem}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Routing Editor Dialog */}
      <Dialog open={!!routingEditorItem} onOpenChange={(open) => !open && setRoutingEditorItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Work Order Routing</DialogTitle>
            <DialogDescription>Define the production flow for this work order</DialogDescription>
          </DialogHeader>
          {routingEditorItem && (
            <WorkOrderRoutingEditor
              queueItemId={routingEditorItem.id}
              workOrderNumber={routingEditorItem.work_order || routingEditorItem.title}
              partNumber={routingEditorItem.part_number || undefined}
              onClose={() => setRoutingEditorItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <CreateWorkOrderDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) fetchWorkOrders();
        }}
      />
    </>
  );
}

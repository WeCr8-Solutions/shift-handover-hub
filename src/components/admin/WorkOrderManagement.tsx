import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, MoreHorizontal, Search, Package, Route, Trash2, AlertCircle, Plus, Building2, FolderOpen, Wrench, Crown, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderRoutingEditor } from "@/components/routing/WorkOrderRoutingEditor";
import { CreateWorkOrderDialog } from "@/components/queue/CreateWorkOrderDialog";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useAllOrganizations } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";

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

interface OrganizationBucket {
  id: string;
  name: string;
  workOrders: QueueItem[];
  stats: {
    total: number;
    inProgress: number;
    onHold: number;
    overdue: number;
  };
  ownerName?: string | null;
  ownerEmail?: string | null;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
}

interface WorkOrderManagementProps {
  isAdmin: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  queued: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  on_hold: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  critical: "bg-red-500 text-white",
};

type ViewMode = "grouped" | "flat";

export function WorkOrderManagement({ isAdmin }: WorkOrderManagementProps) {
  const { toast } = useToast();
  const { organization } = useUserOrganization();
  const { organizations } = useAllOrganizations();
  const [workOrders, setWorkOrders] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routingEditorItem, setRoutingEditorItem] = useState<QueueItem | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [selectedOrg, setSelectedOrg] = useState<string>("all");

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter]);

  const fetchWorkOrders = async () => {
    setLoading(true);
    
    let query = supabase
      .from("queue_items")
      .select(`
        *,
        station:stations(name, station_id),
        team:teams(name),
        organization:organizations(name)
      `)
      .eq("item_type", "work_order")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as QueueStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching work orders:", error);
      toast({
        title: "Error",
        description: "Failed to load work orders",
        variant: "destructive",
      });
    } else {
      setWorkOrders(data || []);
    }
    setLoading(false);
  };

  // Group work orders by organization
  const organizationBuckets: OrganizationBucket[] = useMemo(() => {
    const buckets: Map<string, OrganizationBucket> = new Map();
    
    // Add "Unassigned" bucket
    buckets.set("unassigned", {
      id: "unassigned",
      name: "Unassigned Work Orders",
      workOrders: [],
      stats: { total: 0, inProgress: 0, onHold: 0, overdue: 0 },
      ownerName: null,
      ownerEmail: null,
      subscriptionTier: null,
      subscriptionStatus: null,
    });

    // Add organization buckets
    organizations.forEach(org => {
      buckets.set(org.id, {
        id: org.id,
        name: org.name,
        workOrders: [],
        stats: { total: 0, inProgress: 0, onHold: 0, overdue: 0 },
        ownerName: org.owner_name,
        ownerEmail: org.owner_email,
        subscriptionTier: org.subscription_tier,
        subscriptionStatus: org.subscription_status,
      });
    });

    // Filter and group work orders
    workOrders.forEach(wo => {
      // Apply search filter
      const searchMatch = 
        wo.work_order?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.part_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.title?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!searchMatch) return;

      const orgId = wo.organization_id || "unassigned";
      let bucket = buckets.get(orgId);
      
      // If org doesn't exist in our list, add to unassigned
      if (!bucket) {
        bucket = buckets.get("unassigned")!;
      }
      
      bucket.workOrders.push(wo);
      bucket.stats.total++;
      if (wo.status === "in_progress") bucket.stats.inProgress++;
      if (wo.status === "on_hold") bucket.stats.onHold++;
      if (wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed") {
        bucket.stats.overdue++;
      }
    });

    // Filter and sort
    return Array.from(buckets.values())
      .filter(b => b.stats.total > 0)
      .filter(b => selectedOrg === "all" || b.id === selectedOrg)
      .sort((a, b) => b.stats.total - a.stats.total);
  }, [workOrders, organizations, searchQuery, selectedOrg]);

  const handleDeleteWorkOrder = async (wo: QueueItem) => {
    if (!isAdmin) return;
    
    const { error } = await supabase
      .from("queue_items")
      .delete()
      .eq("id", wo.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete work order",
        variant: "destructive",
      });
    } else {
      toast({ title: "Work order deleted" });
      fetchWorkOrders();
    }
  };

  const handleStatusChange = async (wo: QueueItem, newStatus: QueueStatus) => {
    const { error } = await supabase
      .from("queue_items")
      .update({ status: newStatus })
      .eq("id", wo.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
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

  const renderWorkOrderRow = (wo: QueueItem, showOrg: boolean = false) => {
    const isOverdue = wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed";
    return (
      <TableRow key={wo.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{wo.work_order || wo.title}</p>
              <p className="text-xs text-muted-foreground">
                {wo.quantity && `Qty: ${wo.quantity}`}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="text-sm">{wo.part_number || "-"}</p>
            {wo.operation_number && (
              <p className="text-xs text-muted-foreground">Op: {wo.operation_number}</p>
            )}
          </div>
        </TableCell>
        {showOrg && (
          <TableCell>
            {wo.organization ? (
              <Badge variant="outline" className="gap-1">
                <Building2 className="w-3 h-3" />
                {wo.organization.name}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>
        )}
        <TableCell>
          {wo.station ? (
            <Badge variant="outline">{wo.station.name}</Badge>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </TableCell>
        <TableCell>
          <Select
            value={wo.status}
            onValueChange={(v) => handleStatusChange(wo, v as QueueStatus)}
          >
            <SelectTrigger className="w-[130px] h-8">
              <Badge className={STATUS_COLORS[wo.status] || ""}>
                {wo.status.replace("_", " ")}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Badge className={PRIORITY_COLORS[wo.priority] || ""}>
            {wo.priority}
          </Badge>
        </TableCell>
        <TableCell>
          {wo.due_date ? (
            <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
              {isOverdue && <AlertCircle className="w-3 h-3" />}
              <span className="text-sm">
                {format(new Date(wo.due_date), "MMM d, yyyy")}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setRoutingEditorItem(wo)}
                className="gap-2"
              >
                <Route className="w-4 h-4" />
                Edit Routing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => handleDeleteWorkOrder(wo)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
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
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Work Order
              </Button>
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by org" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grouped">
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Grouped
                    </span>
                  </SelectItem>
                  <SelectItem value="flat">Flat View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grouped" ? (
            organizationBuckets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No work orders found</p>
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={organizationBuckets.map(b => b.id)} className="space-y-3">
                {organizationBuckets.map((orgBucket) => (
                  <AccordionItem key={orgBucket.id} value={orgBucket.id} className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{orgBucket.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {orgBucket.stats.total} work order(s) • {orgBucket.stats.inProgress} in progress
                            {orgBucket.stats.overdue > 0 && (
                              <span className="text-destructive ml-1">• {orgBucket.stats.overdue} overdue</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mr-4">
                        <Badge variant="secondary">
                          <Package className="w-3 h-3 mr-1" />
                          {orgBucket.stats.total}
                        </Badge>
                        {orgBucket.stats.onHold > 0 && (
                          <Badge variant="destructive">
                            {orgBucket.stats.onHold} on hold
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {/* Organization Owner Card */}
                      {orgBucket.id !== "unassigned" && orgBucket.ownerName && (
                        <div className="mb-4 p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Crown className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{orgBucket.ownerName}</span>
                                  <Badge variant="default" className="gap-1 text-xs">
                                    <Crown className="w-3 h-3" />
                                    Owner
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {orgBucket.ownerEmail}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {orgBucket.subscriptionTier && (
                                <Badge variant="secondary" className="text-xs">
                                  {orgBucket.subscriptionTier}
                                </Badge>
                              )}
                              {orgBucket.subscriptionStatus && (
                                <Badge 
                                  variant={orgBucket.subscriptionStatus === "active" ? "outline" : "destructive"}
                                  className="text-xs"
                                >
                                  {orgBucket.subscriptionStatus}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Work Order</TableHead>
                              <TableHead>Part / Operation</TableHead>
                              <TableHead>Station</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orgBucket.workOrders.map((wo) => renderWorkOrderRow(wo, false))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )
          ) : (
            filteredWorkOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No work orders found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Part / Operation</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((wo) => renderWorkOrderRow(wo, true))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>

      {/* Routing Editor Dialog */}
      <Dialog open={!!routingEditorItem} onOpenChange={(open) => !open && setRoutingEditorItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Work Order Routing</DialogTitle>
            <DialogDescription>
              Define the production flow for this work order
            </DialogDescription>
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

      {/* Create Work Order Dialog */}
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

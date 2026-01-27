import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, MoreHorizontal, Search, Package, Route, Trash2, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderRoutingEditor } from "@/components/routing/WorkOrderRoutingEditor";
import { CreateWorkOrderDialog } from "@/components/queue/CreateWorkOrderDialog";
import { useUserOrganization } from "@/hooks/useUserOrganization";
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

export function WorkOrderManagement({ isAdmin }: WorkOrderManagementProps) {
  const { toast } = useToast();
  const { organization } = useUserOrganization();
  const [workOrders, setWorkOrders] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routingEditorItem, setRoutingEditorItem] = useState<QueueItem | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter, organization?.id]);

  const fetchWorkOrders = async () => {
    setLoading(true);
    
    let query = supabase
      .from("queue_items")
      .select(`
        *,
        station:stations(name, station_id),
        team:teams(name)
      `)
      .eq("item_type", "work_order")
      .order("created_at", { ascending: false })
      .limit(100);

    // Filter by organization for SaaS RLS
    if (organization?.id) {
      query = query.eq("organization_id", organization.id);
    }

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

  const stats = {
    total: workOrders.length,
    inProgress: workOrders.filter(wo => wo.status === "in_progress").length,
    onHold: workOrders.filter(wo => wo.status === "on_hold").length,
    overdue: workOrders.filter(wo => wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed").length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Work Order Management
              </CardTitle>
              <CardDescription>
                {stats.total} work orders • {stats.inProgress} in progress • {stats.onHold} on hold
                {stats.overdue > 0 && (
                  <span className="text-destructive ml-2">• {stats.overdue} overdue</span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Work Order
              </Button>
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
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWorkOrders.length === 0 ? (
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
                  <TableHead>Station</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkOrders.map((wo) => {
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
                })}
              </TableBody>
            </Table>
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

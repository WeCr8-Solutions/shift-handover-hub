import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QueueItem, QueueStatus, QueuePriority } from "@/hooks/useQueue";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreHorizontal, Trash2, Eye, Clock, AlertTriangle, GitBranch, Wrench, Plug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QueueListViewProps {
  items: QueueItem[];
  onItemClick: (itemId: string) => void;
  onStatusChange: (itemId: string, newStatus: QueueStatus) => Promise<{ error: string | null }>;
  onDelete: (itemId: string) => Promise<{ error: string | null }>;
}

interface StationInfo {
  id: string;
  name: string;
  station_id: string;
  work_center_type: string;
}

interface RoutingInfo {
  queue_item_id: string;
  current_step: number;
  total_steps: number;
  current_operation: string;
}

const statusOptions: { value: QueueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function getPriorityColor(priority: QueuePriority): string {
  switch (priority) {
    case "critical":
      return "bg-red-500 text-white";
    case "urgent":
      return "bg-orange-500 text-white";
    case "high":
      return "bg-yellow-500 text-white";
    case "normal":
      return "bg-blue-500 text-white";
    case "low":
      return "bg-gray-400 text-white";
  }
}

function getStatusColor(status: QueueStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case "queued":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
    case "on_hold":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
  }
}

function getTypeLabel(type: string): string {
  return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function QueueListView({ items, onItemClick, onStatusChange, onDelete }: QueueListViewProps) {
  const [stations, setStations] = useState<Map<string, StationInfo>>(new Map());
  const [routingInfo, setRoutingInfo] = useState<Map<string, RoutingInfo>>(new Map());

  // Fetch station info for all items
  useEffect(() => {
    const stationIds = [...new Set(items.filter(i => i.station_id).map(i => i.station_id!))];
    if (stationIds.length === 0) return;

    const fetchStations = async () => {
      const { data } = await supabase
        .from("stations")
        .select("id, name, station_id, work_center_type")
        .in("id", stationIds);
      
      if (data) {
        const stationMap = new Map<string, StationInfo>();
        data.forEach(s => stationMap.set(s.id, s));
        setStations(stationMap);
      }
    };

    fetchStations();
  }, [items]);

  // Fetch routing info for all items
  useEffect(() => {
    const itemIds = items.map(i => i.id);
    if (itemIds.length === 0) return;

    const fetchRouting = async () => {
      const { data } = await supabase
        .from("work_order_routing")
        .select("queue_item_id, step_number, operation_name, status")
        .in("queue_item_id", itemIds)
        .order("step_number", { ascending: true });

      if (data) {
        const routingMap = new Map<string, RoutingInfo>();
        
        // Group by queue_item_id
        const grouped = data.reduce((acc, step) => {
          if (!acc[step.queue_item_id]) acc[step.queue_item_id] = [];
          acc[step.queue_item_id].push(step);
          return acc;
        }, {} as Record<string, typeof data>);

        Object.entries(grouped).forEach(([queueItemId, steps]) => {
          const totalSteps = steps.length;
          // Find current step (first non-completed step, or last step if all done)
          const currentStepData = steps.find(s => s.status !== "completed") || steps[steps.length - 1];
          
          routingMap.set(queueItemId, {
            queue_item_id: queueItemId,
            current_step: currentStepData?.step_number || 1,
            total_steps: totalSteps,
            current_operation: currentStepData?.operation_name || "Unknown",
          });
        });

        setRoutingInfo(routingMap);
      }
    };

    fetchRouting();
  }, [items]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Queue Items
          <Badge variant="outline" className="ml-2">{items.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Work Order</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed";
              const station = item.station_id ? stations.get(item.station_id) : null;
              const routing = routingInfo.get(item.id);
              
              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    isOverdue && "bg-red-50 dark:bg-red-900/10"
                  )}
                >
                  <TableCell className="font-medium" onClick={() => onItemClick(item.id)}>
                    <div className="flex items-center gap-2">
                      {item.title}
                      {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {item.erp_source && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                          <Plug className="w-3 h-3 mr-0.5" />
                          ERP
                        </Badge>
                      )}
                    </div>
                    {item.part_number && (
                      <div className="text-xs text-muted-foreground">P/N: {item.part_number}</div>
                    )}
                  </TableCell>
                  
                  {/* Station Column */}
                  <TableCell onClick={() => onItemClick(item.id)}>
                    {station ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="font-mono text-xs">{station.station_id}</span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">{station.name}</div>
                              <div className="text-xs text-muted-foreground">{station.work_center_type}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-xs">Unassigned</span>
                    )}
                  </TableCell>
                  
                  {/* Stage/Routing Column */}
                  <TableCell onClick={() => onItemClick(item.id)}>
                    {routing ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5">
                              <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                              <Badge variant="outline" className="text-xs font-normal">
                                Step {routing.current_step}/{routing.total_steps}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">{routing.current_operation}</div>
                              <div className="text-xs text-muted-foreground">
                                Step {routing.current_step} of {routing.total_steps}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-xs">No routing</span>
                    )}
                  </TableCell>
                  
                  <TableCell onClick={() => onItemClick(item.id)}>
                    <Badge variant="outline">{getTypeLabel(item.item_type)}</Badge>
                  </TableCell>
                  <TableCell onClick={() => onItemClick(item.id)}>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) => onStatusChange(item.id, value as QueueStatus)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <Badge className={cn("mr-2", getStatusColor(option.value))}>
                              {option.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell onClick={() => onItemClick(item.id)}>
                    {item.work_order ? (
                      <span className="font-mono text-xs">{item.work_order}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={() => onItemClick(item.id)}>
                    {item.due_date ? (
                      <div className={cn("flex items-center gap-1", isOverdue && "text-red-600")}>
                        <Clock className="w-3 h-3" />
                        {format(new Date(item.due_date), "MMM d, yyyy")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onItemClick(item.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No queue items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
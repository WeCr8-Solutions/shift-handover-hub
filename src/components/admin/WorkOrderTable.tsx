import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Package, Route, Trash2, AlertCircle, Building2 } from "lucide-react";
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

export interface WorkOrderTableProps {
  workOrders: QueueItem[];
  showOrg?: boolean;
  isAdmin: boolean;
  onStatusChange: (wo: QueueItem, status: QueueStatus) => void;
  onDelete: (wo: QueueItem) => void;
  onEditRouting: (wo: QueueItem) => void;
}

export function WorkOrderTable({
  workOrders,
  showOrg = false,
  isAdmin,
  onStatusChange,
  onDelete,
  onEditRouting,
}: WorkOrderTableProps) {
  if (workOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No work orders found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Work Order</TableHead>
          <TableHead>Part / Operation</TableHead>
          {showOrg && <TableHead>Organization</TableHead>}
          <TableHead>Station</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workOrders.map((wo) => {
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
                <Select value={wo.status} onValueChange={(v) => onStatusChange(wo, v as QueueStatus)}>
                  <SelectTrigger className="w-[130px] h-8">
                    <Badge className={STATUS_COLORS[wo.status] || ""}>{wo.status.replace("_", " ")}</Badge>
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
                <Badge className={PRIORITY_COLORS[wo.priority] || ""}>{wo.priority}</Badge>
              </TableCell>
              <TableCell>
                {wo.due_date ? (
                  <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                    {isOverdue && <AlertCircle className="w-3 h-3" />}
                    <span className="text-sm">{format(new Date(wo.due_date), "MMM d, yyyy")}</span>
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
                    <DropdownMenuItem onClick={() => onEditRouting(wo)} className="gap-2">
                      <Route className="w-4 h-4" />
                      Edit Routing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => onDelete(wo)} className="gap-2 text-destructive focus:text-destructive">
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
  );
}

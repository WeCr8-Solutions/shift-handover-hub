import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueueItem, QueueStatus, QueuePriority } from "@/hooks/useQueue";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreHorizontal, Trash2, Eye, Clock, AlertTriangle } from "lucide-react";

interface QueueListViewProps {
  items: QueueItem[];
  onItemClick: (itemId: string) => void;
  onStatusChange: (itemId: string, newStatus: QueueStatus) => Promise<{ error: string | null }>;
  onDelete: (itemId: string) => Promise<{ error: string | null }>;
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
      return "bg-gray-100 text-gray-800";
    case "queued":
      return "bg-yellow-100 text-yellow-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "on_hold":
      return "bg-orange-100 text-orange-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
  }
}

function getTypeLabel(type: string): string {
  return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function QueueListView({ items, onItemClick, onStatusChange, onDelete }: QueueListViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
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
              
              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "cursor-pointer",
                    isOverdue && "bg-red-50 dark:bg-red-900/10"
                  )}
                >
                  <TableCell className="font-medium" onClick={() => onItemClick(item.id)}>
                    <div className="flex items-center gap-2">
                      {item.title}
                      {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
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
                    {item.work_order || "-"}
                  </TableCell>
                  <TableCell onClick={() => onItemClick(item.id)}>
                    {item.due_date ? (
                      <div className={cn("flex items-center gap-1", isOverdue && "text-red-600")}>
                        <Clock className="w-3 h-3" />
                        {format(new Date(item.due_date), "MMM d, yyyy")}
                      </div>
                    ) : (
                      "-"
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
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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

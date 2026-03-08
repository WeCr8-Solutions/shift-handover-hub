import { Badge } from "@/components/ui/badge";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QueueItem, QueuePriority, QueueStatus } from "@/hooks/useQueue";
import { Station } from "@/hooks/useStations";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Clock, FileText, Package, User } from "lucide-react";

export function getPriorityColor(priority: QueuePriority): string {
  switch (priority) {
    case "critical": return "bg-red-500 text-white";
    case "urgent": return "bg-orange-500 text-white";
    case "high": return "bg-yellow-500 text-white";
    case "normal": return "bg-blue-500 text-white";
    case "low": return "bg-gray-400 text-white";
  }
}

export function getStatusColor(status: QueueStatus): string {
  switch (status) {
    case "pending": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case "queued": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "on_hold": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
}

interface QueueItemHeaderProps {
  item: QueueItem;
  assignedStation: Station | null;
  isOverdue: boolean;
  elapsedTime: string | null;
  assignedUserName?: string | null;
  createdByName?: string | null;
}

export function QueueItemHeader({ item, assignedStation, isOverdue, elapsedTime, assignedUserName, createdByName }: QueueItemHeaderProps) {
  const isQuote = item.item_type === "quote";
  const isWorkOrder = item.item_type === "work_order";

  return (
    <DialogHeader className={cn(
      "rounded-t-lg -mx-6 -mt-6 px-6 pt-6 pb-4 mb-2",
      isQuote && "bg-amber-500/10 border-b border-amber-500/30",
      isWorkOrder && "bg-primary/5 border-b border-primary/20"
    )}>
      <div className="flex items-center gap-2 flex-wrap">
        {isQuote && <Badge className="bg-amber-500 text-white text-xs font-semibold px-3">QUOTE</Badge>}
        {isWorkOrder && <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3">WORK ORDER</Badge>}
        <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
        <Badge className={getStatusColor(item.status)}>{item.status.replace("_", " ")}</Badge>
        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
        {elapsedTime && (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Running: {elapsedTime}
          </Badge>
        )}
      </div>
      <DialogTitle className="flex items-center gap-2">
        {isQuote && <FileText className="w-5 h-5 text-amber-500" />}
        {isWorkOrder && <Package className="w-5 h-5 text-primary" />}
        {item.title}
      </DialogTitle>
      <DialogDescription>
        {isQuote ? "Quote" : isWorkOrder ? "Work Order" : "Item"} created {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        {createdByName && <span className="ml-1">by <span className="font-medium">{createdByName}</span></span>}
        {item.work_order && (
          <span className="ml-2 font-medium">
            • {isQuote ? "Quote #" : "WO #"}: {item.work_order}
          </span>
        )}
        {assignedStation && (
          <span className="ml-2">
            • Station: <span className="font-medium">{assignedStation.station_id}</span> ({assignedStation.name})
          </span>
        )}
        {assignedUserName && (
          <span className="ml-2">
            • <User className="w-3 h-3 inline" /> Assigned: <span className="font-medium">{assignedUserName}</span>
          </span>
        )}
      </DialogDescription>
    </DialogHeader>
  );
}

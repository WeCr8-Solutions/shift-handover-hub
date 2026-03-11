import { Badge } from "@/components/ui/badge";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QueueItem, QueuePriority, QueueStatus } from "@/hooks/useQueue";
import { Station } from "@/hooks/useStations";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Clock, FileText, Package, User } from "lucide-react";
import { getPriorityBadgeColor, getQueueStatusBadgeColor } from "@/lib/status-colors";
import { ItemTypeBadge } from "@/components/queue/ItemTypeBadge";

export function getPriorityColor(priority: QueuePriority): string {
  return getPriorityBadgeColor(priority);
}

export function getStatusColor(status: QueueStatus): string {
  return getQueueStatusBadgeColor(status);
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
      isQuote && "bg-warning/10 border-b border-warning/30",
      isWorkOrder && "bg-primary/5 border-b border-primary/20"
    )}>
      <div className="flex items-center gap-2 flex-wrap">
        {isQuote && <ItemTypeBadge type="quote" variant="solid" />}
        {isWorkOrder && <ItemTypeBadge type="work_order" variant="solid" />}
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
        {isQuote && <FileText className="w-5 h-5 text-warning" />}
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
        {item.part_number && (
          <span className="ml-2">
            • Part: <span className="font-medium">{item.part_number}</span>
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

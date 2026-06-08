import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QueueItem, QueueStatus, QueuePriority } from "@/hooks/useQueue";
import { cn } from "@/lib/utils";
import { Clock, User, Package, AlertTriangle, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { woToast } from "@/lib/woToast";
import { StationQuickActions, type QuickActionTarget } from "@/components/dashboard/StationQuickActions";
import { getPriorityBadgeColor, getQueueStatusColumnColor } from "@/lib/status-colors";
import { ItemTypeBadge } from "@/components/queue/ItemTypeBadge";

interface QueueKanbanBoardProps {
  itemsByStatus: Record<QueueStatus, QueueItem[]>;
  onItemClick: (itemId: string) => void;
  onStatusChange: (itemId: string, newStatus: QueueStatus) => Promise<{ error: string | null }>;
  onReorder: (itemId: string, newPosition: number) => Promise<{ error: string | null }>;
  /** When true, drag-to-change is blocked and onRequestStationCheckIn fires instead. */
  requiresStationCheckIn?: boolean;
  onRequestStationCheckIn?: () => void;
}

// Valid state transitions matching the DB trigger
const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  pending: ["queued", "cancelled"],
  queued: ["in_progress", "cancelled", "pending"],
  in_progress: ["on_hold", "completed", "queued", "cancelled"],
  on_hold: ["in_progress", "cancelled"],
  completed: ["pending"], // rework only
  cancelled: [], // terminal
};

const statusColumns: { status: QueueStatus; title: string; color: string }[] = [
  { status: "pending", title: "Pending", color: getQueueStatusColumnColor("pending") },
  { status: "queued", title: "Queued", color: getQueueStatusColumnColor("queued") },
  { status: "in_progress", title: "In Progress", color: getQueueStatusColumnColor("in_progress") },
  { status: "on_hold", title: "On Hold", color: getQueueStatusColumnColor("on_hold") },
  { status: "completed", title: "Completed", color: getQueueStatusColumnColor("completed") },
  { status: "cancelled", title: "Cancelled", color: getQueueStatusColumnColor("cancelled") },
];

function getPriorityColor(priority: QueuePriority): string {
  return getPriorityBadgeColor(priority);
}

function getTypeLabel(type: string): string {
  return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

interface QueueCardProps {
  item: QueueItem;
  onClick: () => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, item: QueueItem) => void;
  onDragEnd: () => void;
}

function QueueCard({ item, onClick, isDragging, onDragStart, onDragEnd }: QueueCardProps) {
  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed";

  const quickTarget: QuickActionTarget = {
    id: item.id,
    name: item.title,
    type: "work_order",
    status: item.status,
    stationId: item.station_id ?? undefined,
    workOrder: item.work_order ?? undefined,
  };

  return (
    <StationQuickActions target={quickTarget}>
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      {...(item.item_type === "quote" ? { "data-tour": "kanban-quote-card" } : item.item_type === "work_order" ? { "data-tour": "kanban-wo-card" } : {})}
      className={cn(
        "p-3 bg-card rounded-lg border shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        item.item_type === "quote" && "border-l-4 border-l-warning",
        item.item_type === "work_order" && "border-l-4 border-l-primary",
        isOverdue && "border-status-critical/30 bg-status-critical/5",
        isDragging && "opacity-50 scale-95"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 cursor-grab active:cursor-grabbing" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn("text-xs", getPriorityColor(item.priority))}>
              {item.priority}
            </Badge>
            {item.item_type === "quote" || item.item_type === "work_order" ? (
              <ItemTypeBadge type={item.item_type} />
            ) : (
              <span className="text-xs text-muted-foreground">
                {getTypeLabel(item.item_type)}
              </span>
            )}
            {item.erp_source && <ItemTypeBadge type="erp" />}
          </div>
          <h4 className="font-medium text-sm truncate">{item.title}</h4>
          {item.work_order && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Package className="w-3 h-3" />
              <span>{item.item_type === "quote" ? "Quote #" : "WO #"}: {item.work_order}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            {item.due_date && (
              <div className={cn("flex items-center gap-1 text-xs", isOverdue ? "text-status-critical" : "text-muted-foreground")}>
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
                <Clock className="w-3 h-3" />
                <span>{format(new Date(item.due_date), "MMM d")}</span>
              </div>
            )}
            {item.assigned_to && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>Assigned</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </StationQuickActions>
  );
}

export function QueueKanbanBoard({
  itemsByStatus,
  onItemClick,
  onStatusChange,
  onReorder,
  requiresStationCheckIn,
  onRequestStationCheckIn,
}: QueueKanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<QueueItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<QueueStatus | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const dragOverItemRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, item: QueueItem) => {
    if (requiresStationCheckIn) {
      e.preventDefault();
      woToast.blocked("Check-in required", "Check in to a station before changing work order status.");
      onRequestStationCheckIn?.();
      return;
    }
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
    setDropIndicatorIndex(null);
    dragOverItemRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, status: QueueStatus, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
    setDropIndicatorIndex(index);
  };

  const handleDragLeave = () => {
    setDropIndicatorIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: QueueStatus, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    // Validate transition before attempting
    if (draggedItem.status !== targetStatus) {
      const validTargets = VALID_TRANSITIONS[draggedItem.status] || [];
      if (!validTargets.includes(targetStatus)) {
        woToast.blocked(
          "Invalid status transition",
          `Cannot move from "${draggedItem.status.replace("_", " ")}" to "${targetStatus.replace("_", " ")}". Valid targets: ${validTargets.map(s => s.replace("_", " ")).join(", ") || "none"}`,
          draggedItem.work_order,
        );
        handleDragEnd();
        return;
      }
    }

    const columnItems = itemsByStatus[targetStatus] || [];
    
    // If dropping in a different column, change status first
    if (draggedItem.status !== targetStatus) {
      const result = await onStatusChange(draggedItem.id, targetStatus);
      if (result.error) {
        toast.error(result.error);
        handleDragEnd();
        return;
      }
    }
    
    // Calculate new position based on drop index
    let newPosition: number;
    if (columnItems.length === 0) {
      newPosition = 1;
    } else if (dropIndex === 0) {
      newPosition = (columnItems[0]?.position || 1) - 1;
    } else if (dropIndex >= columnItems.length) {
      newPosition = (columnItems[columnItems.length - 1]?.position || 0) + 1;
    } else {
      const prevItem = columnItems[dropIndex - 1];
      const nextItem = columnItems[dropIndex];
      newPosition = ((prevItem?.position || 0) + (nextItem?.position || 0)) / 2;
    }

    // Only reorder if position actually changes
    if (Math.abs(draggedItem.position - newPosition) > 0.001) {
      await onReorder(draggedItem.id, newPosition);
    }

    handleDragEnd();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statusColumns.map((column) => {
        const columnItems = (itemsByStatus[column.status] || []).sort((a, b) => a.position - b.position);
        const isDropTarget = dragOverColumn === column.status;

        return (
          <Card
            key={column.status}
            className={cn(
              "min-h-[400px] transition-colors",
              column.color,
              isDropTarget && "ring-2 ring-primary ring-offset-2"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(column.status);
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, column.status, columnItems.length)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                <Badge variant="secondary">{columnItems.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[350px]">
                <div className="space-y-2 pr-2">
                  {columnItems.map((item, index) => (
                    <div key={item.id}>
                      {/* Drop indicator before this item */}
                      {isDropTarget && dropIndicatorIndex === index && draggedItem?.id !== item.id && (
                        <div className="h-1 bg-primary rounded-full mb-2 animate-pulse" />
                      )}
                      <div
                        onDragOver={(e) => handleDragOver(e, column.status, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.status, index)}
                      >
                        <QueueCard
                          item={item}
                          onClick={() => onItemClick(item.id)}
                          isDragging={draggedItem?.id === item.id}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      </div>
                    </div>
                  ))}
                  {/* Drop indicator at the end */}
                  {isDropTarget && dropIndicatorIndex === columnItems.length && (
                    <div className="h-1 bg-primary rounded-full animate-pulse" />
                  )}
                  {columnItems.length === 0 && !isDropTarget && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No items
                    </div>
                  )}
                  {columnItems.length === 0 && isDropTarget && (
                    <div className="text-center py-8 text-sm text-primary border-2 border-dashed border-primary rounded-lg">
                      Drop here
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

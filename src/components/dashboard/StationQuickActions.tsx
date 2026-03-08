import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Eye,
  ListTodo,
  Pause,
  Play,
  AlertTriangle,
  ArrowUpRight,
  Clipboard,
  Settings,
  Truck,
} from "lucide-react";

export interface QuickActionTarget {
  /** Database ID for the station or work order */
  id: string;
  /** Display name shown in the menu header */
  name: string;
  /** What this target represents */
  type: "station" | "work_order";
  /** Current status for conditional actions */
  status?: string;
  /** Station ID (if target is a work order at a station) */
  stationId?: string;
  /** Work order number for display */
  workOrder?: string;
  /** Active queue item ID (for stations with an active work order) */
  activeItemId?: string;
}

interface StationQuickActionsProps {
  target: QuickActionTarget;
  children: React.ReactNode;
  onViewDetail?: (target: QuickActionTarget) => void;
  onNavigateToQueue?: (target: QuickActionTarget) => void;
  onCreateHandoff?: (target: QuickActionTarget) => void;
  onToggleHold?: (target: QuickActionTarget) => void;
  onRequestDelivery?: (target: QuickActionTarget) => void;
  onReportIssue?: (target: QuickActionTarget) => void;
  className?: string;
}

export function StationQuickActions({
  target,
  children,
  onViewDetail,
  onNavigateToQueue,
  onCreateHandoff,
  onToggleHold,
  onRequestDelivery,
  onReportIssue,
  className,
}: StationQuickActionsProps) {
  const navigate = useNavigate();

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(target);
    } else if (target.type === "work_order") {
      navigate(`/queue?item=${target.id}`);
    } else if (target.activeItemId) {
      navigate(`/queue?item=${target.activeItemId}`);
    } else {
      navigate(`/queue?station=${target.id}`);
    }
  };

  const handleGoToQueue = () => {
    if (onNavigateToQueue) {
      onNavigateToQueue(target);
    } else if (target.stationId) {
      navigate(`/queue?station=${target.stationId}`);
    } else {
      navigate(`/queue?station=${target.id}`);
    }
  };

  const isOnHold = target.status === "on_hold";
  const isStation = target.type === "station";

  return (
    <ContextMenu>
      <ContextMenuTrigger className={className} asChild>
        <div>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="flex items-center gap-2 text-xs">
          {isStation ? (
            <Settings className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ListTodo className="w-3 h-3 text-muted-foreground" />
          )}
          <span className="truncate">{target.name}</span>
          {target.workOrder && (
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              {target.workOrder}
            </span>
          )}
        </ContextMenuLabel>
        <ContextMenuSeparator />

        {/* View Detail */}
        <ContextMenuItem onClick={handleViewDetail} className="gap-2">
          <Eye className="w-3.5 h-3.5" />
          View Details
          <ArrowUpRight className="w-3 h-3 ml-auto text-muted-foreground" />
        </ContextMenuItem>

        {/* Go to Queue */}
        <ContextMenuItem onClick={handleGoToQueue} className="gap-2">
          <ListTodo className="w-3.5 h-3.5" />
          Open in Queue
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Handoff */}
        {isStation && (
          <ContextMenuItem
            onClick={() => onCreateHandoff?.(target)}
            className="gap-2"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Create Handoff Note
          </ContextMenuItem>
        )}

        {/* Toggle Hold */}
        {target.status && ["in_progress", "on_hold"].includes(target.status) && (
          <ContextMenuItem
            onClick={() => onToggleHold?.(target)}
            className="gap-2"
          >
            {isOnHold ? (
              <>
                <Play className="w-3.5 h-3.5 text-green-600" />
                Resume Work
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                Put on Hold
              </>
            )}
          </ContextMenuItem>
        )}

        {/* Request Delivery */}
        <ContextMenuItem
          onClick={() => onRequestDelivery?.(target)}
          className="gap-2"
        >
          <Truck className="w-3.5 h-3.5" />
          Request Delivery
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Report Issue */}
        <ContextMenuItem
          onClick={() => onReportIssue?.(target)}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Report Issue
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

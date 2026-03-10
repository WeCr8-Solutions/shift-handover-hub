import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { SmartAlert, SmartAlertType } from "@/hooks/useSmartAlerts";
import { StationQuickActions, type QuickActionTarget } from "@/components/dashboard/StationQuickActions";
import { getSmartAlertStyles } from "@/lib/status-colors";
import {
  AlertTriangle, Clock, Pause, Timer, Zap,
  AlertCircle, GitBranch, Package, ArrowRight, Users,
} from "lucide-react";

const ALERT_ICONS: Record<SmartAlertType, React.ElementType> = {
  overdue: AlertTriangle, on_hold: Pause, stale: Clock, over_time: Timer,
  high_priority_waiting: Zap, no_operator: Users, bottleneck: GitBranch,
  unassigned: Package, no_routing: AlertCircle,
};

interface SmartAlertCardProps {
  alert: SmartAlert;
  onClick?: (alert: SmartAlert) => void;
  compact?: boolean;
  onQuickAction?: (action: string, target: QuickActionTarget) => void;
}

export function SmartAlertCard({ alert, onClick, compact = false, onQuickAction }: SmartAlertCardProps) {
  const Icon = ALERT_ICONS[alert.type];
  const s = getSmartAlertStyles(alert.type, alert.severity);
  const isPulse = alert.type === "high_priority_waiting" && alert.severity === "critical";

  const quickTarget: QuickActionTarget = {
    id: alert.targetId,
    name: alert.title,
    type: alert.targetType === "station" ? "station" : "work_order",
    workOrder: alert.detail,
    activeItemId: alert.targetType === "work_order" ? alert.targetId : undefined,
  };

  const metricBadge = alert.metricLabel && (
    <Badge variant="outline" className={cn("text-[9px] px-1 py-0 flex-shrink-0", s.badgeBorder, s.badgeText)}>
      {alert.metricLabel}
    </Badge>
  );

  const cardContent = compact ? (
    <button
      className={cn("w-full p-2 rounded-md border transition-colors text-left hover:opacity-80", s.bg, s.border)}
      onClick={() => onClick?.(alert)}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3 h-3 flex-shrink-0", s.text, isPulse && "animate-pulse")} />
        <span className="text-xs font-medium truncate">{alert.title}</span>
        {metricBadge && <div className="ml-auto">{metricBadge}</div>}
      </div>
    </button>
  ) : (
    <button
      className={cn("w-full p-2.5 rounded-lg border transition-colors text-left hover:opacity-90", s.bg, s.border)}
      onClick={() => onClick?.(alert)}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4 flex-shrink-0", s.text, isPulse && "animate-pulse")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium truncate", s.text)}>{alert.title}</span>
            {metricBadge}
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{alert.detail}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );

  return (
    <StationQuickActions
      target={quickTarget}
      onViewDetail={(t) => onQuickAction?.("view", t)}
      onCreateHandoff={(t) => onQuickAction?.("handoff", t)}
      onToggleHold={(t) => onQuickAction?.("hold", t)}
      onRequestDelivery={(t) => onQuickAction?.("delivery", t)}
      onReportIssue={(t) => onQuickAction?.("issue", t)}
    >
      {cardContent}
    </StationQuickActions>
  );
}

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { SmartAlert, SmartAlertType } from "@/hooks/useSmartAlerts";
import { StationQuickActions, type QuickActionTarget } from "@/components/dashboard/StationQuickActions";
import { getSmartAlertStyles } from "@/lib/status-colors";
import {
  AlertTriangle, Clock, Pause, Timer, Zap,
  AlertCircle, GitBranch, Package, ArrowRight, Users, X,
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
  onDismiss?: (alert: SmartAlert) => void;
}

export function SmartAlertCard({ alert, onClick, compact = false, onQuickAction, onDismiss }: SmartAlertCardProps) {
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

  const dismissBtn = onDismiss && (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onDismiss(alert); }}
      className="flex-shrink-0 p-1 -m-1 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Dismiss alert"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );

  const cardContent = compact ? (
    <div className={cn("w-full rounded-md border transition-colors", s.bg, s.border, "flex items-center gap-2 pr-1")}>
      <button
        className="flex-1 min-w-0 p-2 text-left hover:opacity-80"
        onClick={() => onClick?.(alert)}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("w-3 h-3 flex-shrink-0", s.text, isPulse && "animate-pulse")} />
          <span className="text-xs font-medium truncate">{alert.title}</span>
          {metricBadge && <div className="ml-auto">{metricBadge}</div>}
        </div>
      </button>
      {dismissBtn}
    </div>
  ) : (
    <div className={cn("w-full rounded-lg border transition-colors", s.bg, s.border, "flex items-center gap-2 pr-2")}>
      <button
        className="flex-1 min-w-0 p-2.5 text-left hover:opacity-90"
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
      {dismissBtn}
    </div>
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

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { SmartAlert, SmartAlertType } from "@/hooks/useSmartAlerts";
import { StationQuickActions, type QuickActionTarget } from "@/components/dashboard/StationQuickActions";
import {
  AlertTriangle,
  Clock,
  Pause,
  Timer,
  Zap,
  AlertCircle,
  GitBranch,
  Package,
  ArrowRight,
  Users,
} from "lucide-react";

const ALERT_CONFIG: Record<
  SmartAlertType,
  {
    icon: React.ElementType;
    bg: { critical: string; warning: string; info: string };
    border: { critical: string; warning: string; info: string };
    text: { critical: string; warning: string; info: string };
    badgeText: { critical: string; warning: string; info: string };
    badgeBorder: { critical: string; warning: string; info: string };
  }
> = {
  overdue: {
    icon: AlertTriangle,
    bg: { critical: "bg-red-500/10", warning: "bg-red-500/10", info: "bg-red-500/5" },
    border: { critical: "border-red-500/30", warning: "border-red-500/30", info: "border-red-500/20" },
    text: { critical: "text-red-600", warning: "text-red-500", info: "text-red-500" },
    badgeText: { critical: "text-red-500", warning: "text-red-500", info: "text-red-500" },
    badgeBorder: { critical: "border-red-500/50", warning: "border-red-500/50", info: "border-red-500/30" },
  },
  on_hold: {
    icon: Pause,
    bg: { critical: "bg-amber-500/10", warning: "bg-amber-500/10", info: "bg-amber-500/5" },
    border: { critical: "border-amber-500/30", warning: "border-amber-500/30", info: "border-amber-500/20" },
    text: { critical: "text-amber-600", warning: "text-amber-500", info: "text-amber-500" },
    badgeText: { critical: "text-amber-600", warning: "text-amber-500", info: "text-amber-500" },
    badgeBorder: { critical: "border-amber-500/50", warning: "border-amber-500/50", info: "border-amber-500/30" },
  },
  stale: {
    icon: Clock,
    bg: { critical: "bg-red-500/10", warning: "bg-orange-500/10", info: "bg-orange-500/5" },
    border: { critical: "border-red-500/30", warning: "border-orange-500/30", info: "border-orange-500/20" },
    text: { critical: "text-red-600", warning: "text-orange-600", info: "text-orange-500" },
    badgeText: { critical: "text-red-500", warning: "text-orange-500", info: "text-orange-500" },
    badgeBorder: { critical: "border-red-500/50", warning: "border-orange-500/50", info: "border-orange-500/30" },
  },
  over_time: {
    icon: Timer,
    bg: { critical: "bg-red-500/10", warning: "bg-amber-500/10", info: "bg-amber-500/5" },
    border: { critical: "border-red-500/30", warning: "border-amber-500/30", info: "border-amber-500/20" },
    text: { critical: "text-red-600", warning: "text-amber-600", info: "text-amber-500" },
    badgeText: { critical: "text-red-500", warning: "text-amber-600", info: "text-amber-500" },
    badgeBorder: { critical: "border-red-500/50", warning: "border-amber-500/50", info: "border-amber-500/30" },
  },
  high_priority_waiting: {
    icon: Zap,
    bg: { critical: "bg-red-500/10", warning: "bg-red-500/10", info: "bg-red-500/5" },
    border: { critical: "border-red-500/30", warning: "border-red-500/30", info: "border-red-500/20" },
    text: { critical: "text-red-600", warning: "text-red-500", info: "text-red-500" },
    badgeText: { critical: "text-red-500", warning: "text-red-500", info: "text-red-500" },
    badgeBorder: { critical: "border-red-500/50", warning: "border-red-500/50", info: "border-red-500/30" },
  },
  no_operator: {
    icon: Users,
    bg: { critical: "bg-purple-500/10", warning: "bg-purple-500/10", info: "bg-purple-500/5" },
    border: { critical: "border-purple-500/30", warning: "border-purple-500/30", info: "border-purple-500/20" },
    text: { critical: "text-purple-600", warning: "text-purple-600", info: "text-purple-500" },
    badgeText: { critical: "text-purple-500", warning: "text-purple-500", info: "text-purple-500" },
    badgeBorder: { critical: "border-purple-500/50", warning: "border-purple-500/50", info: "border-purple-500/30" },
  },
  bottleneck: {
    icon: GitBranch,
    bg: { critical: "bg-orange-500/10", warning: "bg-orange-500/10", info: "bg-orange-500/5" },
    border: { critical: "border-orange-500/30", warning: "border-orange-500/30", info: "border-orange-500/20" },
    text: { critical: "text-orange-600", warning: "text-orange-600", info: "text-orange-500" },
    badgeText: { critical: "text-orange-600", warning: "text-orange-500", info: "text-orange-500" },
    badgeBorder: { critical: "border-orange-500/50", warning: "border-orange-500/50", info: "border-orange-500/30" },
  },
  unassigned: {
    icon: Package,
    bg: { critical: "bg-muted/80", warning: "bg-muted/50", info: "bg-muted/30" },
    border: { critical: "border-border", warning: "border-border", info: "border-border" },
    text: { critical: "text-foreground", warning: "text-muted-foreground", info: "text-muted-foreground" },
    badgeText: { critical: "text-muted-foreground", warning: "text-muted-foreground", info: "text-muted-foreground" },
    badgeBorder: { critical: "border-border", warning: "border-border", info: "border-border" },
  },
  no_routing: {
    icon: AlertCircle,
    bg: { critical: "bg-muted/50", warning: "bg-muted/50", info: "bg-muted/30" },
    border: { critical: "border-border", warning: "border-border", info: "border-border" },
    text: { critical: "text-foreground", warning: "text-muted-foreground", info: "text-muted-foreground" },
    badgeText: { critical: "text-muted-foreground", warning: "text-muted-foreground", info: "text-muted-foreground" },
    badgeBorder: { critical: "border-border", warning: "border-border", info: "border-border" },
  },
};

interface SmartAlertCardProps {
  alert: SmartAlert;
  onClick?: (alert: SmartAlert) => void;
  compact?: boolean;
  onQuickAction?: (action: string, target: QuickActionTarget) => void;
}

export function SmartAlertCard({ alert, onClick, compact = false, onQuickAction }: SmartAlertCardProps) {
  const config = ALERT_CONFIG[alert.type];
  const Icon = config.icon;
  const sev = alert.severity;

  const quickTarget: QuickActionTarget = {
    id: alert.targetId,
    name: alert.title,
    type: alert.targetType === "station" ? "station" : "work_order",
    workOrder: alert.detail,
    // For work_order alerts, targetId is the queue item — use it as activeItemId for stations too
    activeItemId: alert.targetType === "work_order" ? alert.targetId : undefined,
  };

  const cardContent = compact ? (
    <button
      className={cn(
        "w-full p-2 rounded-md border transition-colors text-left hover:opacity-80",
        config.bg[sev],
        config.border[sev],
      )}
      onClick={() => onClick?.(alert)}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "w-3 h-3 flex-shrink-0",
            config.text[sev],
            alert.type === "high_priority_waiting" && alert.severity === "critical" && "animate-pulse",
          )}
        />
        <span className="text-xs font-medium truncate">{alert.title}</span>
        {alert.metricLabel && (
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1 py-0 ml-auto flex-shrink-0",
              config.badgeBorder[sev],
              config.badgeText[sev],
            )}
          >
            {alert.metricLabel}
          </Badge>
        )}
      </div>
    </button>
  ) : (
    <button
      className={cn(
        "w-full p-2.5 rounded-lg border transition-colors text-left hover:opacity-90",
        config.bg[sev],
        config.border[sev],
      )}
      onClick={() => onClick?.(alert)}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "w-4 h-4 flex-shrink-0",
            config.text[sev],
            alert.type === "high_priority_waiting" && alert.severity === "critical" && "animate-pulse",
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium truncate", config.text[sev])}>
              {alert.title}
            </span>
            {alert.metricLabel && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-1.5 py-0 flex-shrink-0",
                  config.badgeBorder[sev],
                  config.badgeText[sev],
                )}
              >
                {alert.metricLabel}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {alert.detail}
          </p>
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

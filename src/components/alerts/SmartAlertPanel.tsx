import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmartAlertCard } from "./SmartAlertCard";
import type { SmartAlert, SmartAlertType, SmartAlertSeverity } from "@/hooks/useSmartAlerts";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  BellRing,
} from "lucide-react";

const DISMISS_KEY = "dismissed_smart_alerts_v1";
const DISMISS_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function loadDismissed(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    return Object.fromEntries(Object.entries(parsed).filter(([, ts]) => now - ts < DISMISS_TTL_MS));
  } catch { return {}; }
}

function persistDismissed(map: Record<string, number>) {
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

const TYPE_LABELS: Record<SmartAlertType, string> = {
  overdue: "Overdue",
  on_hold: "On Hold",
  stale: "Stale",
  over_time: "Over Time",
  high_priority_waiting: "Priority Waiting",
  no_operator: "No Operator",
  bottleneck: "Bottleneck",
  unassigned: "Unassigned",
  no_routing: "No Routing",
};

const SEVERITY_ORDER: SmartAlertSeverity[] = ["critical", "warning", "info"];

interface SmartAlertPanelProps {
  alerts: SmartAlert[];
  loading?: boolean;
  /** Show as sidebar card (compact) or full-width panel */
  variant?: "sidebar" | "full";
  maxVisible?: number;
  onNavigateToItem?: (alert: SmartAlert) => void;
  className?: string;
}

export function SmartAlertPanel({
  alerts,
  loading,
  variant = "sidebar",
  maxVisible = 10,
  onNavigateToItem,
  className,
}: SmartAlertPanelProps) {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<SmartAlertType | "all">("all");
  const [sevFilter, setSevFilter] = useState<SmartAlertSeverity | "all">("all");
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Record<string, number>>(() => loadDismissed());

  useEffect(() => {
    const handler = () => setDismissed(loadDismissed());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleDismiss = useCallback((a: SmartAlert) => {
    setDismissed((prev) => {
      const next = { ...prev, [a.id]: Date.now() };
      persistDismissed(next);
      return next;
    });
  }, []);

  const visibleAlerts = useMemo(() => alerts.filter((a) => !dismissed[a.id]), [alerts, dismissed]);

  const filtered = useMemo(() => {
    let items = visibleAlerts;
    if (typeFilter !== "all") items = items.filter((a) => a.type === typeFilter);
    if (sevFilter !== "all") items = items.filter((a) => a.severity === sevFilter);
    return items;
  }, [visibleAlerts, typeFilter, sevFilter]);

  const visible = expanded ? filtered : filtered.slice(0, maxVisible);
  const hasMore = filtered.length > maxVisible;

  // Severity summary (excludes dismissed)
  const sevCounts = useMemo(() => {
    const m = { critical: 0, warning: 0, info: 0 };
    visibleAlerts.forEach((a) => m[a.severity]++);
    return m;
  }, [visibleAlerts]);

  // Active type tabs
  const activeTypes = useMemo(() => {
    const set = new Set<SmartAlertType>();
    alerts.forEach((a) => set.add(a.type));
    return Array.from(set);
  }, [alerts]);

  const handleClick = (alert: SmartAlert) => {
    if (onNavigateToItem) {
      onNavigateToItem(alert);
    } else if (alert.targetType === "work_order" && alert.targetId) {
      navigate(`/queue?item=${alert.targetId}`);
    } else if (alert.targetType === "station" && alert.targetId) {
      navigate(`/queue?station=${alert.targetId}`);
    } else {
      navigate("/queue");
    }
  };

  if (alerts.length === 0 && !loading) return null;

  const isSidebar = variant === "sidebar";
  const compact = isSidebar;

  return (
    <div className={cn("bg-card border border-border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Smart Alerts</span>
          </div>
          <div className="flex items-center gap-1.5">
            {sevCounts.critical > 0 && (
              <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0">{sevCounts.critical}</Badge>
            )}
            {sevCounts.warning > 0 && (
              <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0">{sevCounts.warning}</Badge>
            )}
            {sevCounts.info > 0 && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{sevCounts.info}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Filter row (full variant) */}
      {!isSidebar && activeTypes.length > 1 && (
        <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2 flex-wrap">
          <Filter className="w-3 h-3 text-muted-foreground flex-shrink-0" />

          {/* Severity chips */}
          <div className="flex items-center gap-1 mr-2">
            {SEVERITY_ORDER.map((sev) =>
              sevCounts[sev] > 0 ? (
                <button
                  key={sev}
                  onClick={() => setSevFilter((p) => (p === sev ? "all" : sev))}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors font-medium",
                    sevFilter === sev
                      ? sev === "critical"
                        ? "bg-red-500 text-white border-red-500"
                        : sev === "warning"
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-secondary text-foreground border-border"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50",
                  )}
                >
                  {sev.charAt(0).toUpperCase() + sev.slice(1)} ({sevCounts[sev]})
                </button>
              ) : null,
            )}
          </div>

          {/* Type chips */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                typeFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50",
              )}
            >
              All
            </button>
            {activeTypes.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter((p) => (p === t ? "all" : t))}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                  typeFilter === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50",
                )}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alert list */}
      <div className={cn("p-3 space-y-1.5", isSidebar && "max-h-[400px] overflow-y-auto")}>
        {loading && alerts.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Loading alerts…</p>
        )}

        {visible.map((alert) => (
          <SmartAlertCard
            key={alert.id}
            alert={alert}
            onClick={handleClick}
            compact={compact}
          />
        ))}

        {hasMore && !expanded && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="w-3 h-3 mr-1" />
            Show {filtered.length - maxVisible} more
          </Button>
        )}

        {expanded && hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground"
            onClick={() => setExpanded(false)}
          >
            Show less
          </Button>
        )}
      </div>
    </div>
  );
}

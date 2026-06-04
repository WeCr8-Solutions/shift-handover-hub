import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type StatusLabel } from "./stationStatus";

interface KPIData {
  running: number;
  setup: number;
  down: number;
  waiting: number;
  total: number;
  handoffs: number;
}

interface DashboardKPICardsProps {
  kpis: KPIData;
  statusFilter: StatusLabel | "all";
  onStatusFilterChange: (filter: StatusLabel | "all") => void;
}

export function DashboardKPICards({ kpis, statusFilter, onStatusFilterChange }: DashboardKPICardsProps) {
  const cards = [
    {
      label: "Running",
      value: kpis.running,
      total: kpis.total,
      color: STATUS_CONFIG.running.bgClass,
      textColor: STATUS_CONFIG.running.textClass,
      filterKey: "running" as StatusLabel,
    },
    {
      label: "Setup",
      value: kpis.setup,
      color: STATUS_CONFIG.setup.bgClass,
      textColor: STATUS_CONFIG.setup.textClass,
      filterKey: "setup" as StatusLabel,
    },
    {
      label: "Waiting",
      value: kpis.waiting,
      color: STATUS_CONFIG.waiting.bgClass,
      textColor: STATUS_CONFIG.waiting.textClass,
      filterKey: "waiting" as StatusLabel,
    },
    {
      label: "Down",
      value: kpis.down,
      color: STATUS_CONFIG.down.bgClass,
      textColor: STATUS_CONFIG.down.textClass,
      filterKey: "down" as StatusLabel,
    },
    {
      label: "Idle",
      value: Math.max(0, kpis.total - kpis.running - kpis.setup - kpis.down - kpis.waiting),
      color: STATUS_CONFIG.idle.bgClass,
      textColor: STATUS_CONFIG.idle.textClass,
      filterKey: "idle" as StatusLabel,
    },
    {
      label: "Handoffs",
      value: kpis.handoffs,
      color: "bg-primary",
      textColor: "text-primary",
      filterKey: undefined,
    },
  ] as const;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">

        {cards.map((kpi) => {
          const isActive = kpi.filterKey && statusFilter === kpi.filterKey;
          return (
            <button
              key={kpi.label}
              className={cn(
                "bg-card border rounded-lg p-3 text-left transition-all",
                kpi.filterKey ? "cursor-pointer hover:border-primary/50" : "cursor-default",
                isActive ? "border-primary ring-1 ring-primary/30" : "border-border",
              )}
              onClick={() => {
                if (!kpi.filterKey) return;
                onStatusFilterChange(statusFilter === kpi.filterKey ? "all" : kpi.filterKey);
              }}
              aria-pressed={isActive || false}
              aria-label={kpi.filterKey ? `Filter by ${kpi.label}` : kpi.label}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("w-2 h-2 rounded-full", kpi.color)} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <span className={cn("text-2xl font-bold font-mono", kpi.textColor)}>
                {kpi.value}
                {"total" in kpi && kpi.total !== undefined && (
                  <span className="text-sm text-muted-foreground font-normal">/{kpi.total}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active filter indicator */}
      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1">
            <div className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[statusFilter].bgClass)} />
            Showing: {STATUS_CONFIG[statusFilter].displayName} stations
          </Badge>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => onStatusFilterChange("all")}>
            Clear filter
          </Button>
        </div>
      )}
    </>
  );
}

import { useMemo, useCallback, useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useStations, useHandoffRecords } from "@/hooks/useStations";
import { useOrgContext } from "@/contexts/OrgContext";
import { RefreshIndicator } from "./RefreshIndicator";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { DashboardKPICards } from "./DashboardKPICards";
import { DashboardAlertSection } from "./DashboardAlertSection";
import { StationListTable } from "./StationListTable";

import {
  Factory,
  Clock,
  ArrowRight,
  Package,
  Plus,
  Monitor,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
const ProductionAnalytics = lazy(() => import("./ProductionAnalytics").then(m => ({ default: m.ProductionAnalytics })));
import {
  STATUS_CONFIG,
  JOB_STATES,
  getStatusFromJobState,
  type StatusLabel,
} from "./stationStatus";

interface SupervisorDashboardProps {
  onNewHandoff: () => void;
  onPerformanceUpdate: () => void;
  onCreateWorkOrder: () => void;
  onSwitchToOperatorView?: () => void;
  onViewStation?: (stationId: string, stationName: string) => void;
  onViewHandoff?: (handoffId: string) => void;
}

export function SupervisorDashboard({
  onNewHandoff,
  onPerformanceUpdate,
  onCreateWorkOrder,
  onSwitchToOperatorView,
  onViewStation,
  onViewHandoff,
}: SupervisorDashboardProps) {
  const navigate = useNavigate();
  const { currentTeam, setCurrentTeam, teams } = useCurrentTeam();
  const { organization } = useOrgContext();
  const {
    stations: dbStations,
    loading: stationsLoading,
    refreshStations,
  } = useStations(currentTeam?.id, organization?.id);
  const {
    records: dbRecords,
    loading: recordsLoading,
    refreshRecords,
  } = useHandoffRecords(currentTeam?.id, organization?.id);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!stationsLoading && !recordsLoading) {
      setLastRefreshedAt(new Date());
    }
  }, [stationsLoading, recordsLoading, dbStations, dbRecords]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([refreshStations(), refreshRecords()]);
    setIsRefreshing(false);
    setLastRefreshedAt(new Date());
  }, [refreshStations, refreshRecords]);

  const isLoading = stationsLoading || recordsLoading;

  // Status filter
  const [statusFilter, setStatusFilter] = useState<StatusLabel | "all">("all");

  // Smart alerts
  const { alerts: smartAlerts, loading: smartAlertsLoading } = useSmartAlerts({
    refreshToken: lastRefreshedAt,
  });
  const woAlerts = useMemo(() => smartAlerts.filter(a => a.targetType === "work_order"), [smartAlerts]);
  const stationAlerts = useMemo(() => smartAlerts.filter(a => a.targetType === "station"), [smartAlerts]);

  // Alert collapse state
  const [woAlertsOpen, setWoAlertsOpen] = useState(true);
  const [stationAlertsOpen, setStationAlertsOpen] = useState(true);

  const orgName = organization?.name || "Organization";
  const scopeLabel = currentTeam?.name || `${orgName} · All Teams`;

  // KPIs
  const kpis = useMemo(() => {
    let running = 0, down = 0, setup = 0, waiting = 0;
    dbStations.forEach((s) => {
      const status = getStatusFromJobState(s.current_status?.current_job_state);
      switch (status) {
        case "running": running++; break;
        case "down": down++; break;
        case "setup": setup++; break;
        case "waiting": waiting++; break;
      }
    });
    return { running, down, setup, waiting, total: dbStations.length, handoffs: dbRecords.length };
  }, [dbStations, dbRecords]);

  // Attention items
  const attentionItems = useMemo(() => {
    const items: { label: string; detail: string; severity: "critical" | "warning" | "info"; stationId: string; stationName: string }[] = [];
    dbStations.forEach((s) => {
      const state = s.current_status?.current_job_state;
      const status = getStatusFromJobState(state);
      if (state === JOB_STATES.MACHINE_DOWN) {
        items.push({ label: `${s.name} is DOWN`, detail: s.current_status?.condition_notes || "No details", severity: "critical", stationId: s.id, stationName: s.name });
      }
      if (state?.includes("Waiting") || state === JOB_STATES.ON_HOLD) {
        items.push({ label: `${s.name} is waiting`, detail: state || "", severity: "warning", stationId: s.id, stationName: s.name });
      }
      if (status === "idle" && s.is_active) {
        const operatorName = s.current_status?.current_operator_name;
        items.push({ label: `${s.name} is idle`, detail: operatorName ? `Operator: ${operatorName} · No active job` : "No operator · No active job", severity: "info", stationId: s.id, stationName: s.name });
      }
    });
    return items;
  }, [dbStations]);

  // Active stations
  const activeStations = useMemo(() => {
    return dbStations
      .filter((s) => s.is_active)
      .map((s) => {
        const status = s.current_status;
        const partsComplete = status?.parts_complete ?? 0;
        const partsRequired = status?.parts_required ?? 1;
        const progress = partsRequired > 0 ? Math.round((partsComplete / partsRequired) * 100) : 0;
        const stateLabel = getStatusFromJobState(status?.current_job_state);
        return {
          id: s.station_id,
          dbId: s.id,
          name: s.name,
          teamId: s.team_id,
          teamName: s.team?.name || null,
          workCenter: s.work_center,
          workCenterType: s.work_center_type,
          operator: status?.current_operator_name || "—",
          workOrder: status?.current_job_work_order || "—",
          partNumber: status?.current_job_part_number || "",
          progress,
          status: stateLabel,
        };
      })
      .filter((s) => statusFilter === "all" || s.status === statusFilter);
  }, [dbStations, statusFilter]);

  // Filtered stations for analytics
  const filteredStationsForAnalytics = useMemo(() => {
    if (statusFilter === "all") return dbStations;
    return dbStations.filter((s) => {
      if (!s.is_active) return false;
      return getStatusFromJobState(s.current_status?.current_job_state) === statusFilter;
    });
  }, [dbStations, statusFilter]);

  // Recent handoffs
  const recentHandoffs = useMemo(() => {
    return dbRecords.slice(0, 4).map((r) => ({
      id: r.id,
      station: r.machine_id,
      from: r.outgoing_operator_name,
      to: r.incoming_operator_name,
      time: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      state: r.primary_state,
    }));
  }, [dbRecords]);

  // Utilization
  const utilization = useMemo(() => {
    const total = dbStations.length;
    if (total === 0) return { pct: 0, running: 0, setup: 0, idle: 0, down: 0 };
    const idle = total - kpis.running - kpis.setup - kpis.down - kpis.waiting;
    return {
      pct: Math.round((kpis.running / total) * 100),
      running: Math.round((kpis.running / total) * 100),
      setup: Math.round((kpis.setup / total) * 100),
      idle: Math.round((Math.max(0, idle) / total) * 100),
      down: Math.round((kpis.down / total) * 100),
    };
  }, [dbStations.length, kpis]);

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading dashboard">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <Skeleton className="h-4 w-32" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="flex-1 h-1.5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Factory className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Production Floor</h2>
            <p className="text-xs text-muted-foreground">
              {scopeLabel} • {kpis.total} Station{kpis.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RefreshIndicator isRefreshing={isRefreshing} lastRefreshedAt={lastRefreshedAt} onRefresh={handleManualRefresh} />
          <Button variant="outline" size="sm" className="gap-2" onClick={onNewHandoff}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Handoff</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={onCreateWorkOrder}>
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Work Order</span>
          </Button>
          {onSwitchToOperatorView && (
            <Button variant="secondary" size="sm" className="gap-2" onClick={onSwitchToOperatorView}>
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Operator View</span>
            </Button>
          )}
        </div>
      </div>

      {/* Team Filter */}
      {teams.length > 1 && (
        <>
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-xs text-muted-foreground shrink-0">Scope:</span>
            <select
              value={currentTeam?.id || "__all__"}
              onChange={(e) => {
                if (e.target.value === "__all__") setCurrentTeam(null);
                else {
                  const team = teams.find((t) => t.id === e.target.value);
                  setCurrentTeam(team || null);
                }
              }}
              className="w-full h-8 rounded-md border border-border bg-secondary/50 text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="__all__">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Scope:</span>
            <button
              onClick={() => setCurrentTeam(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                !currentTeam
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              <Factory className="w-3 h-3 inline mr-1" />
              All Teams
            </button>
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setCurrentTeam(team)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  currentTeam?.id === team.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                <Users className="w-3 h-3 inline mr-1" />
                {team.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* KPI Cards */}
      <DashboardKPICards kpis={kpis} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />

      {/* Alerts */}
      <DashboardAlertSection
        woAlerts={woAlerts}
        stationAlerts={stationAlerts}
        attentionItems={attentionItems}
        smartAlertsLoading={smartAlertsLoading}
        woAlertsOpen={woAlertsOpen}
        onWoAlertsOpenChange={setWoAlertsOpen}
        stationAlertsOpen={stationAlertsOpen}
        onStationAlertsOpenChange={setStationAlertsOpen}
        onViewStation={onViewStation}
      />

      {/* Main Grid: Station List + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-4">
        <StationListTable activeStations={activeStations} onViewStation={onViewStation} />

        {/* Sidebar: Utilization + Recent Handoffs */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Shift Utilization</span>
              <span className="text-xl font-bold text-primary font-mono">{utilization.pct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 36 36" className="w-16 h-16 flex-shrink-0" aria-hidden="true">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${utilization.pct} ${100 - utilization.pct}`} strokeDashoffset="25" strokeLinecap="round" />
              </svg>
              <div className="flex-1 space-y-1.5">
                {[
                  { label: "Running", pct: `${utilization.running}%`, color: STATUS_CONFIG.running.bgClass },
                  { label: "Setup", pct: `${utilization.setup}%`, color: STATUS_CONFIG.setup.bgClass },
                  { label: "Idle", pct: `${utilization.idle}%`, color: STATUS_CONFIG.idle.bgClass },
                  { label: "Down", pct: `${utilization.down}%`, color: STATUS_CONFIG.down.bgClass },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", s.color)} />
                    <span className="text-[10px] text-muted-foreground flex-1">{s.label}</span>
                    <span className="text-[10px] font-mono font-medium">{s.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Recent Handoffs</span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {recentHandoffs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No handoffs yet</p>
              ) : (
                recentHandoffs.map((h) => {
                  const handoffStatus = getStatusFromJobState(h.state);
                  const statusConfig = STATUS_CONFIG[handoffStatus];
                  return (
                    <div key={h.id} className="p-2.5 rounded-md bg-secondary/20 border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-medium">{h.station}</span>
                        <span className="text-[10px] text-muted-foreground">{h.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground text-xs">{h.from}</span>
                        <ArrowRight className="w-3 h-3 text-primary" />
                        <span className="font-medium text-xs">{h.to}</span>
                      </div>
                      <Badge variant="outline" className={cn("mt-1 text-[9px] px-1.5 py-0", statusConfig.borderClass, statusConfig.textClass)}>
                        {h.state}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Production Analytics — lazy loaded */}
      <Suspense fallback={<div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">Loading analytics…</div>}>
        <ProductionAnalytics stations={filteredStationsForAnalytics} handoffs={dbRecords} isRefreshing={isRefreshing} lastRefreshedAt={lastRefreshedAt} onRefresh={handleManualRefresh} />
      </Suspense>
    </div>
  );
}

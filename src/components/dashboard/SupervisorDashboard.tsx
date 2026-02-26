import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useStations, useHandoffRecords } from "@/hooks/useStations";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import {
  Factory,
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2,
  Lightbulb,
  Package,
  Plus,
  ListTodo,
  Eye,
  Monitor,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupervisorDashboardProps {
  onNewHandoff: () => void;
  onPerformanceUpdate: () => void;
  onCreateWorkOrder: () => void;
  onSwitchToOperatorView?: () => void;
  onViewStation?: (stationId: string, stationName: string) => void;
}

export function SupervisorDashboard({
  onNewHandoff,
  onPerformanceUpdate,
  onCreateWorkOrder,
  onSwitchToOperatorView,
  onViewStation,
}: SupervisorDashboardProps) {
  const navigate = useNavigate();
  const { currentTeam, setCurrentTeam, teams } = useCurrentTeam();
  const { organization } = useUserOrganization();
  const { stations: dbStations, loading: stationsLoading } = useStations(currentTeam?.id);
  const { records: dbRecords, loading: recordsLoading } = useHandoffRecords(currentTeam?.id);

  const isLoading = stationsLoading || recordsLoading;

  const orgName = organization?.name || "Organization";
  const scopeLabel = currentTeam?.name || `${orgName} · All Teams`;

  // Compute KPIs from real station data
  const kpis = useMemo(() => {
    const running = dbStations.filter(
      (s) => s.current_status?.current_job_state === "Part Running" || s.current_status?.current_job_state === "Processing"
    ).length;
    const down = dbStations.filter(
      (s) => s.current_status?.current_job_state === "Machine Down / Issue"
    ).length;
    const setup = dbStations.filter(
      (s) =>
        s.current_status?.current_job_state === "Setup in Progress" ||
        s.current_status?.current_job_state === "First Article in Process"
    ).length;
    const waiting = dbStations.filter(
      (s) =>
        s.current_status?.current_job_state?.includes("Waiting") ||
        s.current_status?.current_job_state === "On Hold"
    ).length;
    const total = dbStations.length;
    return { running, down, setup, waiting, total, handoffs: dbRecords.length };
  }, [dbStations, dbRecords]);

  // Attention items
  const attentionItems = useMemo(() => {
    const items: { label: string; detail: string; severity: "critical" | "warning" | "info" }[] = [];
    dbStations.forEach((s) => {
      if (s.current_status?.current_job_state === "Machine Down / Issue") {
        items.push({
          label: `${s.name} is DOWN`,
          detail: s.current_status.condition_notes || "No details",
          severity: "critical",
        });
      }
      if (
        s.current_status?.current_job_state?.includes("Waiting") ||
        s.current_status?.current_job_state === "On Hold"
      ) {
        items.push({
          label: `${s.name} is waiting`,
          detail: s.current_status?.current_job_state || "",
          severity: "warning",
        });
      }
    });
    return items;
  }, [dbStations]);

  // Active station list
  const activeStations = useMemo(() => {
    return dbStations
      .filter((s) => s.is_active)
      .map((s) => {
        const status = s.current_status;
        const partsComplete = status?.parts_complete || 0;
        const partsRequired = status?.parts_required || 1;
        const progress = partsRequired > 0 ? Math.round((partsComplete / partsRequired) * 100) : 0;
        let stateLabel: "running" | "setup" | "down" | "waiting" | "idle" = "idle";
        const state = status?.current_job_state || "";
        if (state === "Part Running" || state === "Processing") stateLabel = "running";
        else if (state === "Setup in Progress" || state === "First Article in Process") stateLabel = "setup";
        else if (state === "Machine Down / Issue") stateLabel = "down";
        else if (state.includes("Waiting") || state === "On Hold") stateLabel = "waiting";

        return {
          id: s.station_id,
          dbId: s.id,
          name: s.name,
          teamId: s.team_id,
          operator: status?.current_operator_name || "—",
          workOrder: status?.current_job_work_order || "—",
          partNumber: status?.current_job_part_number || "",
          progress,
          status: stateLabel,
        };
      });
  }, [dbStations]);

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
    if (dbStations.length === 0) return { pct: 0, running: 0, setup: 0, idle: 0, down: 0 };
    const total = dbStations.length || 1;
    return {
      pct: Math.round((kpis.running / total) * 100),
      running: Math.round((kpis.running / total) * 100),
      setup: Math.round((kpis.setup / total) * 100),
      idle: Math.round(((total - kpis.running - kpis.setup - kpis.down - kpis.waiting) / total) * 100),
      down: Math.round((kpis.down / total) * 100),
    };
  }, [dbStations, kpis]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "running": return "bg-green-400";
      case "setup": return "bg-amber-400";
      case "down": return "bg-red-400";
      case "waiting": return "bg-blue-400";
      default: return "bg-muted";
    }
  };

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
        <div className="flex gap-2 flex-wrap">
          {onSwitchToOperatorView && (
            <Button variant="outline" onClick={onSwitchToOperatorView} size="sm" className="gap-2">
              <Monitor className="w-4 h-4" /> Operator View
            </Button>
          )}
          <Button onClick={onCreateWorkOrder} className="gap-2 bg-primary" size="sm">
            <Package className="w-4 h-4" /> Add Work Order
          </Button>
          <Button variant="outline" onClick={() => navigate("/queue")} size="sm" className="gap-2">
            <ListTodo className="w-4 h-4" /> Queue
          </Button>
          <Button variant="outline" onClick={onPerformanceUpdate} size="sm" className="gap-2">
            <Lightbulb className="w-4 h-4" /> Performance Update
          </Button>
          <Button variant="outline" onClick={onNewHandoff} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Handoff
          </Button>
        </div>
      </div>

      {/* Team Filter Chips — only shown in org-wide view */}
      {!currentTeam && teams.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="default"
            className="cursor-pointer text-xs px-3 py-1"
          >
            <Factory className="w-3 h-3 mr-1" />
            All Teams
          </Badge>
          {teams.map((team) => (
            <Badge
              key={team.id}
              variant="outline"
              className="cursor-pointer text-xs px-3 py-1 hover:bg-secondary transition-colors"
              onClick={() => setCurrentTeam(team)}
            >
              <Users className="w-3 h-3 mr-1" />
              {team.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Back to All Teams chip when filtering by team */}
      {currentTeam && teams.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="cursor-pointer text-xs px-3 py-1 hover:bg-secondary transition-colors"
            onClick={() => setCurrentTeam(null)}
          >
            <Factory className="w-3 h-3 mr-1" />
            ← All Teams
          </Badge>
          <Badge variant="default" className="text-xs px-3 py-1">
            <Users className="w-3 h-3 mr-1" />
            {currentTeam.name}
          </Badge>
          {teams
            .filter((t) => t.id !== currentTeam.id)
            .map((team) => (
              <Badge
                key={team.id}
                variant="outline"
                className="cursor-pointer text-xs px-3 py-1 hover:bg-secondary transition-colors"
                onClick={() => setCurrentTeam(team)}
              >
                <Users className="w-3 h-3 mr-1" />
                {team.name}
              </Badge>
            ))}
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Running", value: kpis.running, total: kpis.total, color: "bg-green-500", textColor: "text-green-400" },
          { label: "Down", value: kpis.down, total: kpis.total, color: "bg-red-500", textColor: "text-red-400" },
          { label: "In Setup", value: kpis.setup, total: kpis.total, color: "bg-amber-500", textColor: "text-amber-400" },
          { label: "Waiting", value: kpis.waiting, total: kpis.total, color: "bg-blue-500", textColor: "text-blue-400" },
          { label: "Handoffs", value: kpis.handoffs, total: undefined, color: "bg-primary", textColor: "text-primary" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-2 h-2 rounded-full", kpi.color)} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <span className={cn("text-2xl font-bold font-mono", kpi.textColor)}>
              {kpi.value}
              {kpi.total !== undefined && (
                <span className="text-sm text-muted-foreground font-normal">/{kpi.total}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Attention Required */}
      {attentionItems.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="font-semibold text-sm">Attention Required</span>
            <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-400 ml-auto">
              {attentionItems.length} item{attentionItems.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="space-y-2">
            {attentionItems.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md border",
                  item.severity === "critical"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    item.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{item.label}</span>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Station List + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Active Stations Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Active Stations</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Live</span>
            </div>
          </div>
          {activeStations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No stations configured. <button onClick={() => navigate("/teams")} className="text-primary underline">Add stations</button>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {activeStations.map((station) => (
                <div
                  key={station.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5",
                    onViewStation && "cursor-pointer hover:bg-secondary/40 transition-colors"
                  )}
                  onClick={() => onViewStation?.(station.dbId, station.name)}
                >
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusColor(station.status))} />
                  <span className="text-xs font-mono font-medium w-20 flex-shrink-0">{station.id}</span>
                  <span className="text-xs text-muted-foreground w-20 truncate flex-shrink-0">{station.operator}</span>
                  <span className="text-xs font-mono text-primary w-20 flex-shrink-0">{station.workOrder}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        station.status === "running" ? "bg-green-500" :
                        station.status === "setup" ? "bg-amber-500" :
                        station.status === "down" ? "bg-red-500" : "bg-blue-500"
                      )}
                      style={{ width: `${station.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">
                    {station.progress}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Utilization + Recent Handoffs */}
        <div className="space-y-4">
          {/* Utilization Card */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Shift Utilization</span>
              <span className="text-xl font-bold text-primary font-mono">{utilization.pct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 36 36" className="w-16 h-16 flex-shrink-0">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="3"
                  strokeDasharray={`${utilization.pct} ${100 - utilization.pct}`}
                  strokeDashoffset="25" strokeLinecap="round"
                />
              </svg>
              <div className="flex-1 space-y-1.5">
                {[
                  { label: "Running", pct: `${utilization.running}%`, color: "bg-green-500" },
                  { label: "Setup", pct: `${utilization.setup}%`, color: "bg-amber-500" },
                  { label: "Idle", pct: `${utilization.idle}%`, color: "bg-muted" },
                  { label: "Down", pct: `${utilization.down}%`, color: "bg-red-500" },
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

          {/* Recent Handoffs */}
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
                recentHandoffs.map((h) => (
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
                    <Badge variant="outline" className={cn(
                      "mt-1 text-[9px] px-1.5 py-0",
                      h.state === "Part Running" ? "border-green-500/50 text-green-400" :
                      h.state === "Setup in Progress" ? "border-amber-500/50 text-amber-400" :
                      "border-muted-foreground/30"
                    )}>
                      {h.state}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

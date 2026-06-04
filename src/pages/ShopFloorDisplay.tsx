import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Factory,
  AlertTriangle,
  Clock,
  Monitor,
  Wrench,
  RefreshCw,
  Tv,
  XCircle,
  Users,
} from "lucide-react";

interface DisplayConfig {
  valid: boolean;
  reason?: string;
  display_id?: string;
  organization_id?: string;
  display_name?: string;
  display_mode?: "supervisor" | "operator";
  team_ids?: string[];
  refresh_interval_seconds?: number;
  auto_rotate_enabled?: boolean;
  auto_rotate_interval_seconds?: number;
  dark_mode?: "auto" | "always" | "never";
  alert_sound_enabled?: boolean;
}

interface StationData {
  id: string;
  name: string;
  station_id: string;
  work_center: string;
  work_center_type: string;
  is_active: boolean;
  team_id: string | null;
  team_name: string | null;
  current_status: {
    current_job_state: string | null;
    current_job_work_order: string | null;
    current_job_part_number: string | null;
    current_operator_name: string | null;
    current_operator_id: string | null;
    parts_complete: number | null;
    parts_required: number | null;
    condition_notes: string | null;
    condition_status: string | null;
  } | null;
}

interface QueueItemData {
  id: string;
  title: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  station_id: string | null;
  station_name: string | null;
  team_name: string | null;
  quantity: number | null;
  qty_completed: number | null;
  qty_open: number | null;
  assigned_to: string | null;
}

export default function ShopFloorDisplay() {
  const { displayId } = useParams<{ displayId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [config, setConfig] = useState<DisplayConfig | null>(null);
  const [stations, setStations] = useState<StationData[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItemData[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Fetch all data via the secure RPC (validates token + returns org-scoped data)
  const fetchData = useCallback(async () => {
    if (!token) return;
    const { data, error: err } = await supabase.rpc("fetch_display_data", { _token: token });
    if (err || !data) {
      setError("Failed to fetch display data");
      return;
    }
    const result = data as any;
    if (!result.valid) {
      setError(result.reason || "Token invalid or expired");
      return;
    }

    // Set config on first call
    setConfig({
      valid: true,
      display_id: result.display_id,
      organization_id: result.organization_id,
      display_name: result.display_name,
      display_mode: result.display_mode,
      team_ids: result.team_ids,
      refresh_interval_seconds: result.refresh_interval_seconds,
      auto_rotate_enabled: result.auto_rotate_enabled,
      auto_rotate_interval_seconds: result.auto_rotate_interval_seconds,
      dark_mode: result.dark_mode,
      alert_sound_enabled: result.alert_sound_enabled,
    });

    setStations((result.stations || []) as StationData[]);
    setQueueItems((result.queue_items || []) as QueueItemData[]);
    setLastRefresh(new Date());
  }, [token]);

  // Initial validation + data fetch
  useEffect(() => {
    if (!token) {
      setError("No display token provided");
      return;
    }
    fetchData();
  }, [token, fetchData]);

  // Apply dark mode
  useEffect(() => {
    if (!config) return;
    if (config.dark_mode === "always") {
      document.documentElement.classList.add("dark");
    } else if (config.dark_mode === "never") {
      document.documentElement.classList.remove("dark");
    }
  }, [config?.dark_mode]);

  // Periodic refresh
  useEffect(() => {
    if (!config) return;
    const interval = setInterval(fetchData, (config.refresh_interval_seconds || 30) * 1000);
    return () => clearInterval(interval);
  }, [config, fetchData]);

  // ── Error screen ──
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Display Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Contact your organization admin to set up or renew this display.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Tv className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Connecting display…</p>
        </div>
      </div>
    );
  }

  if (config.display_mode === "operator") {
    return <OperatorDisplay config={config} stations={stations} queueItems={queueItems} lastRefresh={lastRefresh} />;
  }

  return <SupervisorDisplay config={config} stations={stations} queueItems={queueItems} lastRefresh={lastRefresh} />;
}

/* ── Status helpers ── */
// Unified with src/components/dashboard/stationStatus.ts so the wall display
// matches the in-app dashboard for Running / Setup / Waiting / Down / Idle.
import { getStatusConfig, getStatusFromJobState, STATUS_CONFIG } from "@/components/dashboard/stationStatus";

function getStatusInfo(state: string | null | undefined): { label: string; color: string; bg: string } {
  const cfg = getStatusConfig(state);
  return { label: cfg.displayName, color: cfg.textClass, bg: cfg.bgClass };
}


const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  urgent: "bg-warning text-primary-foreground",
  high: "bg-priority-urgent text-primary-foreground",
  normal: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
};

/* ── Supervisor Display ── */

function SupervisorDisplay({ config, stations, queueItems, lastRefresh }: {
  config: DisplayConfig;
  stations: StationData[];
  queueItems: QueueItemData[];
  lastRefresh: Date;
}) {
  // Group stations by team for team-scoped displays
  const teamGroups = useMemo(() => {
    const teams = new Map<string, { name: string; stations: StationData[] }>();
    stations.forEach(s => {
      const key = s.team_id || "__none__";
      if (!teams.has(key)) teams.set(key, { name: s.team_name || "Unassigned", stations: [] });
      teams.get(key)!.stations.push(s);
    });
    return teams;
  }, [stations]);

  const hasMultipleTeams = teamGroups.size > 1;

  const kpis = useMemo(() => {
    let running = 0, down = 0, setup = 0, waiting = 0, idle = 0;
    stations.forEach(s => {
      const status = getStatusFromJobState(s.current_status?.current_job_state);
      if (status === "running") running++;
      else if (status === "down") down++;
      else if (status === "setup") setup++;
      else if (status === "waiting") waiting++;
      else idle++;
    });
    return { running, down, setup, waiting, idle, total: stations.length };
  }, [stations]);

  const overdueItems = queueItems.filter(q => q.due_date && new Date(q.due_date) < new Date());

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">{config.display_name}</h1>
            {hasMultipleTeams && (
              <p className="text-xs text-muted-foreground">
                {teamGroups.size} team{teamGroups.size !== 1 ? "s" : ""} · {stations.length} station{stations.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {lastRefresh.toLocaleTimeString()}
          </span>
          <Badge variant="outline" className="text-[9px]">SUPERVISOR</Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Running", value: kpis.running, color: STATUS_CONFIG.running.textClass, bg: STATUS_CONFIG.running.bgClass },
          { label: "Setup", value: kpis.setup, color: STATUS_CONFIG.setup.textClass, bg: STATUS_CONFIG.setup.bgClass },
          { label: "Waiting", value: kpis.waiting, color: STATUS_CONFIG.waiting.textClass, bg: STATUS_CONFIG.waiting.bgClass },
          { label: "Down", value: kpis.down, color: STATUS_CONFIG.down.textClass, bg: STATUS_CONFIG.down.bgClass },
          { label: "Idle", value: kpis.idle, color: STATUS_CONFIG.idle.textClass, bg: STATUS_CONFIG.idle.bgClass },
          { label: "WOs Active", value: queueItems.length, color: "text-primary", bg: "bg-primary" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-2.5 h-2.5 rounded-full", k.bg)} />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <span className={cn("text-3xl font-bold font-mono", k.color)}>{k.value}</span>
          </div>
        ))}
      </div>


      {/* Alert banner */}
      {(kpis.down > 0 || overdueItems.length > 0) && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="text-sm">
            {kpis.down > 0 && <span className="font-semibold text-destructive">{kpis.down} station{kpis.down !== 1 ? "s" : ""} DOWN</span>}
            {kpis.down > 0 && overdueItems.length > 0 && <span className="text-muted-foreground"> · </span>}
            {overdueItems.length > 0 && <span className="font-semibold text-destructive">{overdueItems.length} overdue WO{overdueItems.length !== 1 ? "s" : ""}</span>}
          </div>
        </div>
      )}


      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Station Grid */}
        <div className="lg:col-span-2 space-y-4">
          {hasMultipleTeams ? (
            // Render stations grouped by team
            Array.from(teamGroups.entries()).map(([teamId, group]) => (
              <div key={teamId} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{group.name}</span>
                  <Badge variant="outline" className="text-[9px] ml-auto">{group.stations.length}</Badge>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-px bg-border">
                  {group.stations.map(station => (
                    <StationCell key={station.id} station={station} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Stations ({stations.length})</span>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-px bg-border">
                {stations.map(station => (
                  <StationCell key={station.id} station={station} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WO Queue sidebar */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Active Work Orders</span>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {queueItems.slice(0, 20).map(item => (
              <div key={item.id} className="px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-xs font-medium truncate">{item.work_order || item.title}</span>
                  <Badge className={cn("text-[8px] px-1", PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.normal)}>
                    {item.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{item.part_number || "—"}</span>
                  <span>{item.status}</span>
                </div>
                {item.station_name && (
                  <span className="text-[10px] text-muted-foreground">@ {item.station_name}</span>
                )}
                {item.qty_completed != null && item.quantity != null && (
                  <span className="text-[10px] font-mono text-muted-foreground ml-2">
                    {item.qty_completed}/{item.quantity}
                  </span>
                )}
                {item.due_date && new Date(item.due_date) < new Date() && (
                  <Badge variant="destructive" className="text-[8px] mt-0.5">OVERDUE</Badge>
                )}
              </div>
            ))}
            {queueItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No active work orders</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Station Cell (shared) ── */
function StationCell({ station }: { station: StationData }) {
  const status = getStatusFromJobState(station.current_status?.current_job_state);
  const cfg = STATUS_CONFIG[status];
  const progress = station.current_status?.parts_required
    ? Math.round(((station.current_status?.parts_complete || 0) / station.current_status.parts_required) * 100)
    : 0;

  return (
    <div className={cn("bg-card p-3 space-y-1.5 border-l-2", cfg.borderClass)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm truncate">{station.name}</span>
        <Badge className={cn("text-[9px] shrink-0 text-white border-transparent", cfg.bgClass)}>
          {cfg.displayName}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground truncate">
        {station.current_status?.current_job_work_order || "No active job"}
      </p>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">
          {station.current_status?.current_operator_name || "No operator"}
        </span>
        {station.current_status?.parts_required ? (
          <span className="font-mono">
            {station.current_status.parts_complete || 0}/{station.current_status.parts_required}
          </span>
        ) : null}
      </div>
      {station.current_status?.condition_notes && (
        <p className="text-[10px] text-chart-3 truncate" title={station.current_status.condition_notes}>
          ⚠ {station.current_status.condition_notes}
        </p>
      )}
      {progress > 0 && (
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

/* ── Operator Display ── */

function OperatorDisplay({ config, stations, queueItems, lastRefresh }: {
  config: DisplayConfig;
  stations: StationData[];
  queueItems: QueueItemData[];
  lastRefresh: Date;
}) {
  // Group queue items by station
  const queueByStation = useMemo(() => {
    const map: Record<string, QueueItemData[]> = {};
    queueItems.forEach(q => {
      if (q.station_id) {
        if (!map[q.station_id]) map[q.station_id] = [];
        map[q.station_id].push(q);
      }
    });
    return map;
  }, [queueItems]);

  const criticalAlerts = useMemo(() => {
    const alerts: string[] = [];
    stations.forEach(s => {
      const info = getStatusInfo(s.current_status?.current_job_state);
      if (info.label === "DOWN") alerts.push(`${s.name} is DOWN`);
    });
    queueItems.forEach(q => {
      if (q.due_date && new Date(q.due_date) < new Date() && q.priority === "critical") {
        alerts.push(`${q.work_order || q.title} OVERDUE`);
      }
    });
    return alerts;
  }, [stations, queueItems]);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 space-y-4">
      {/* Critical alert banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-destructive/15 border-2 border-destructive/40 rounded-xl p-4 flex items-center gap-4 animate-pulse">
          <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
          <div className="text-lg font-bold text-destructive">
            {criticalAlerts.join(" · ")}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tv className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{config.display_name}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{lastRefresh.toLocaleTimeString()}</span>
          <Badge variant="outline" className="text-[9px]">OPERATOR</Badge>
        </div>
      </div>

      {/* Large station cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {stations.map(station => {
          const info = getStatusInfo(station.current_status?.current_job_state);
          const stationQueue = queueByStation[station.id] || [];
          const queued = stationQueue.filter(q => q.status === "queued").length;
          const inProgress = stationQueue.filter(q => q.status === "in_progress").length;
          const onHold = stationQueue.filter(q => q.status === "on_hold").length;
          const progress = station.current_status?.parts_required
            ? Math.round(((station.current_status?.parts_complete || 0) / station.current_status.parts_required) * 100)
            : 0;

          return (
            <div
              key={station.id}
              className={cn(
                "bg-card border-2 rounded-xl p-5 space-y-3",
                info.label === "DOWN" ? "border-destructive" :
                info.label === "Running" ? "border-primary/50" :
                "border-border"
              )}
            >
              {/* Station name + status */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold truncate">{station.name}</h2>
                <Badge className={cn(
                  "text-sm px-3 py-1",
                  info.label === "DOWN" ? "bg-destructive text-destructive-foreground" :
                  info.label === "Running" ? "bg-primary text-primary-foreground" :
                  "bg-secondary text-secondary-foreground"
                )}>
                  {info.label}
                </Badge>
              </div>

              {/* Team name */}
              {station.team_name && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {station.team_name}
                </p>
              )}

              {/* Active WO */}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Active Job</p>
                <p className="text-lg font-mono font-semibold">
                  {station.current_status?.current_job_work_order || "—"}
                </p>
                {station.current_status?.current_job_part_number && (
                  <p className="text-sm text-muted-foreground">{station.current_status.current_job_part_number}</p>
                )}
              </div>

              {/* Operator */}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Operator</p>
                <p className="text-base font-medium">
                  {station.current_status?.current_operator_name || "None"}
                </p>
              </div>

              {/* Condition notes */}
              {station.current_status?.condition_notes && (
                <div className="bg-chart-3/10 border border-chart-3/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-chart-3 font-medium">⚠ {station.current_status.condition_notes}</p>
                </div>
              )}

              {/* Progress bar */}
              {station.current_status?.parts_required ? (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono font-semibold">
                      {station.current_status.parts_complete || 0} / {station.current_status.parts_required}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
              ) : null}

              {/* Queue summary */}
              <div className="flex items-center gap-3 pt-1 border-t border-border">
                <div className="text-center flex-1">
                  <p className="text-lg font-bold font-mono">{queued}</p>
                  <p className="text-[10px] text-muted-foreground">Queued</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-lg font-bold font-mono text-primary">{inProgress}</p>
                  <p className="text-[10px] text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-lg font-bold font-mono">{onHold}</p>
                  <p className="text-[10px] text-muted-foreground">On Hold</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

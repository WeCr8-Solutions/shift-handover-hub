import { useMemo, useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Filter, Activity, RefreshCw, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

// Use shared status configuration
import {
  STATUS_CONFIG,
  STATUS_COLORS,
  getStatusFromJobState,
  type StatusLabel,
} from "./stationStatus";

interface StationData {
  id: string;
  station_id: string;
  name: string;
  is_active: boolean;
  team_id: string | null;
  work_center?: string;
  work_center_type?: string;
  team?: { id: string; name: string } | null;
  current_status?: {
    current_job_state: string | null;
    current_operator_name: string | null;
    current_job_work_order: string | null;
    current_job_part_number: string | null;
    parts_complete: number | null;
    parts_required: number | null;
    condition_notes: string | null;
  } | null;
}

interface HandoffRecord {
  id: string;
  machine_id: string;
  primary_state: string;
  parts_completed_this_shift: number;
  shift: string;
  created_at: string;
  outgoing_operator_name: string;
  incoming_operator_name: string;
  work_order: string;
  part_number: string;
  scrap_count: number;
  rework_count: number;
}

interface ProductionAnalyticsProps {
  stations: StationData[];
  handoffs: HandoffRecord[];
  refreshIntervalMs?: number; // Org-configurable: 300000 = 5min
}

type ShiftFilter = "all" | "Day" | "Swing" | "Night";
type ChartView = "output" | "status" | "team" | "workcenter" | "trend";

export function ProductionAnalytics({
  stations,
  handoffs,
  refreshIntervalMs = 300000, // Default 5 minutes
}: ProductionAnalyticsProps) {
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [chartView, setChartView] = useState<ChartView>("output");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh logic (org-controlled interval)
  useEffect(() => {
    if (refreshIntervalMs <= 0) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [refreshIntervalMs]);

  // Manual refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    // Reset spinner after 1s (or use promise if parent fetch returns)
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Reduced motion (SSR-safe now via effect)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handleChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Filter handoffs by shift
  const filteredHandoffs = useMemo(() => {
    if (shiftFilter === "all") return handoffs;
    return handoffs.filter((h) => h.shift === shiftFilter);
  }, [handoffs, shiftFilter]);

  // Station output data (parts per station) — includes team & work center context
  const stationOutputData = useMemo(() => {
    const map = new Map<string, { name: string; teamName: string; workCenter: string; parts: number; scrap: number; rework: number }>();

    // From current station status
    stations.forEach((s) => {
      if (!s.is_active) return;
      const key = s.id; // Use unique DB id
      const teamName = s.team?.name || "Unassigned";
      const workCenter = s.work_center || "—";
      const label = `${s.name}`;
      const existing = map.get(key) || { name: label, teamName, workCenter, parts: 0, scrap: 0, rework: 0 };
      existing.parts += s.current_status?.parts_complete ?? 0;
      map.set(key, existing);
    });

    // Supplement with handoff data (keyed by machine_id which maps to station_id display code)
    filteredHandoffs.forEach((h) => {
      const stationName = h.machine_id;
      // Try to find matching station to enrich with team/work center
      const matchStation = stations.find((s) => s.station_id === stationName || s.name === stationName);
      const teamName = matchStation?.team?.name || "—";
      const workCenter = matchStation?.work_center || "—";
      const key = matchStation?.id || `handoff-${stationName}`;
      const existing = map.get(key) || { name: stationName, teamName, workCenter, parts: 0, scrap: 0, rework: 0 };
      existing.parts += h.parts_completed_this_shift ?? 0;
      existing.scrap += h.scrap_count ?? 0;
      existing.rework += h.rework_count ?? 0;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .filter((d) => d.parts > 0 || d.scrap > 0)
      .sort((a, b) => b.parts - a.parts)
      .slice(0, 10);
  }, [stations, filteredHandoffs]);

  // Work center aggregation for grouped analytics
  const workCenterData = useMemo(() => {
    const map = new Map<string, { workCenter: string; stations: number; running: number; setup: number; down: number; waiting: number; idle: number }>();

    stations.forEach((s) => {
      if (!s.is_active) return;
      const wc = s.work_center || "Other";
      const existing = map.get(wc) || { workCenter: wc, stations: 0, running: 0, setup: 0, down: 0, waiting: 0, idle: 0 };
      existing.stations++;
      const status = getStatusFromJobState(s.current_status?.current_job_state);
      existing[status]++;
      map.set(wc, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.stations - a.stations);
  }, [stations]);

  // Team aggregation
  const teamData = useMemo(() => {
    const map = new Map<string, { team: string; stations: number; running: number; setup: number; down: number; waiting: number; idle: number }>();

    stations.forEach((s) => {
      if (!s.is_active) return;
      const teamName = s.team?.name || "Unassigned";
      const existing = map.get(teamName) || { team: teamName, stations: 0, running: 0, setup: 0, down: 0, waiting: 0, idle: 0 };
      existing.stations++;
      const status = getStatusFromJobState(s.current_status?.current_job_state);
      existing[status]++;
      map.set(teamName, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.stations - a.stations);
  }, [stations]);

  // Status distribution for pie chart using shared config
  const statusDistribution = useMemo(() => {
    const counts = { running: 0, setup: 0, waiting: 0, down: 0, idle: 0 };

    stations.forEach((s) => {
      if (!s.is_active) return;
      const status = getStatusFromJobState(s.current_status?.current_job_state);
      counts[status]++;
    });

    return [
      { name: STATUS_CONFIG.running.displayName, value: counts.running, color: STATUS_COLORS.running },
      { name: STATUS_CONFIG.setup.displayName, value: counts.setup, color: STATUS_COLORS.setup },
      { name: STATUS_CONFIG.waiting.displayName, value: counts.waiting, color: STATUS_COLORS.waiting },
      { name: STATUS_CONFIG.down.displayName, value: counts.down, color: STATUS_COLORS.down },
      { name: STATUS_CONFIG.idle.displayName, value: counts.idle, color: STATUS_COLORS.idle },
    ].filter((d) => d.value > 0);
  }, [stations]);

  // Handoff trend data (grouped by hour, filtered to today only)
  const trendData = useMemo(() => {
    const hours = new Map<string, { hour: string; handoffs: number; parts: number; scrap: number }>();

    // Create 24h slots
    for (let i = 0; i < 24; i++) {
      const label = `${i.toString().padStart(2, "0")}:00`;
      hours.set(label, { hour: label, handoffs: 0, parts: 0, scrap: 0 });
    }

    const today = new Date();
    const todayString = today.toDateString();

    filteredHandoffs.forEach((h) => {
      const date = new Date(h.created_at);
      // Only include today's handoffs
      if (date.toDateString() !== todayString) return;

      const hourLabel = `${date.getHours().toString().padStart(2, "0")}:00`;
      const slot = hours.get(hourLabel);
      if (slot) {
        slot.handoffs++;
        slot.parts += h.parts_completed_this_shift ?? 0;
        slot.scrap += h.scrap_count ?? 0;
      }
    });

    return Array.from(hours.values());
  }, [filteredHandoffs]);

  const totalParts = stationOutputData.reduce((sum, d) => sum + d.parts, 0);
  const totalScrap = stationOutputData.reduce((sum, d) => sum + d.scrap, 0);

  // Safe yield calculation
  const yieldRate = totalParts > 0 ? Math.round(((totalParts - totalScrap) / totalParts) * 100) : 100;

  // Safe percentage calculation for status distribution
  const activeStationCount = stations.filter((s) => s.is_active).length;
  const getStatusPercentage = (value: number) => {
    if (activeStationCount === 0) return 0;
    return Math.round((value / activeStationCount) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Section Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Production Analytics</h3>
          <Badge variant="outline" className="text-[10px]">
            Live
          </Badge>
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="h-7 px-2"
            title="Refresh data"
          >
            <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Shift Filter */}
          <div
            className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5"
            role="group"
            aria-label="Shift filter"
          >
            <Filter className="w-3 h-3 text-muted-foreground ml-2" aria-hidden="true" />
            {(["all", "Day", "Swing", "Night"] as ShiftFilter[]).map((shift) => (
              <button
                key={shift}
                onClick={() => setShiftFilter(shift)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  shiftFilter === shift
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={shiftFilter === shift}
              >
                {shift === "all" ? "All Shifts" : shift}
              </button>
            ))}
          </div>
          {/* Chart View Toggle */}
          <div
            className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5"
            role="group"
            aria-label="Chart view"
          >
            {[
              { key: "output" as ChartView, icon: BarChart3, label: "Output" },
              { key: "status" as ChartView, icon: PieChartIcon, label: "Status" },
              { key: "team" as ChartView, icon: Users, label: "Teams" },
              { key: "workcenter" as ChartView, icon: Wrench, label: "Work Centers" },
              { key: "trend" as ChartView, icon: TrendingUp, label: "Trend" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setChartView(key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  chartView === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={chartView === key}
              >
                <Icon className="w-3 h-3" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stat Chips */}
      <div className="flex gap-3 flex-wrap" role="group" aria-label="Production summary">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
          <Activity className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Total Parts</span>
          <span className="text-sm font-bold font-mono text-green-400">{totalParts}</span>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Yield</span>
          <span className="text-sm font-bold font-mono text-primary">{yieldRate}%</span>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Handoffs</span>
          <span className="text-sm font-bold font-mono text-amber-400">{filteredHandoffs.length}</span>
        </div>
        {totalScrap > 0 && (
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Scrap</span>
            <span className="text-sm font-bold font-mono text-red-400">{totalScrap}</span>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="bg-card border border-border rounded-lg p-4">
        {chartView === "output" && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Parts completed by station</p>
            {stationOutputData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No production data yet. Submit handoffs to see output metrics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={stationOutputData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  role="img"
                  aria-label={`Bar chart showing parts completed. Top station: ${stationOutputData[0]?.name} with ${stationOutputData[0]?.parts} parts.`}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0]?.payload;
                      return (
                        <div className="bg-card border border-border rounded-lg p-2.5 text-xs shadow-lg">
                          <p className="font-medium text-foreground mb-1">{label}</p>
                          {data?.teamName && (
                            <p className="text-muted-foreground">Team: {data.teamName}</p>
                          )}
                          {data?.workCenter && data.workCenter !== "—" && (
                            <p className="text-muted-foreground mb-1">Work Center: {data.workCenter}</p>
                          )}
                          {payload.map((p: any, i: number) => (
                            <p key={i} style={{ color: p.color }}>
                              {p.name}: {p.value}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="parts"
                    name="Good Parts"
                    fill={STATUS_COLORS.running}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={!prefersReducedMotion}
                  />
                  <Bar
                    dataKey="scrap"
                    name="Scrap"
                    fill={STATUS_COLORS.down}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={!prefersReducedMotion}
                  />
                  <Bar
                    dataKey="rework"
                    name="Rework"
                    fill={STATUS_COLORS.setup}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={!prefersReducedMotion}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {chartView === "status" && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Current station status distribution</p>
            {statusDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No active stations.
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={250}>
                  <PieChart role="img" aria-label="Pie chart showing station status distribution">
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={prefersReducedMotion ? 0 : 800}
                    >
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {statusDistribution.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} aria-hidden="true" />
                      <span className="text-sm flex-1">{d.name}</span>
                      <span className="text-sm font-bold font-mono">{d.value}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {getStatusPercentage(d.value)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {chartView === "team" && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Station status by team</p>
            {teamData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No teams configured.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={teamData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  role="img"
                  aria-label="Stacked bar chart showing station status by team"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="team"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="running" name="Running" stackId="a" fill={STATUS_COLORS.running} isAnimationActive={!prefersReducedMotion} />
                  <Bar dataKey="setup" name="Setup" stackId="a" fill={STATUS_COLORS.setup} isAnimationActive={!prefersReducedMotion} />
                  <Bar dataKey="waiting" name="Waiting" stackId="a" fill={STATUS_COLORS.waiting} isAnimationActive={!prefersReducedMotion} />
                  <Bar dataKey="down" name="Down" stackId="a" fill={STATUS_COLORS.down} isAnimationActive={!prefersReducedMotion} />
                  <Bar dataKey="idle" name="Idle" stackId="a" fill={STATUS_COLORS.idle} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {chartView === "workcenter" && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Station status by work center</p>
            {workCenterData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No work centers configured.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={workCenterData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  role="img"
                  aria-label="Stacked bar chart showing station status by work center"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="workCenter"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="running" name="Running" stackId="a" fill={STATUS_COLORS.running} isAnimationActive={!prefersReducedMotion} />
                  <Bar dataKey="setup" name="Setup" stackId="a" fill={STATUS_COLORS.setup} isAnimationActive={!prefersReducedMotion} />
                  <Bar dataKey="waiting" name="Waiting" stackId="a" fill={STATUS_COLORS.waiting} isAnimationActive={!prefersReducedMotion} />
                  <Bar dataKey="down" name="Down" stackId="a" fill={STATUS_COLORS.down} isAnimationActive={!prefersReducedMotion} />
                  <Bar dataKey="idle" name="Idle" stackId="a" fill={STATUS_COLORS.idle} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {chartView === "trend" && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Handoff activity & parts output (today)</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={trendData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                role="img"
                aria-label="Area chart showing handoff activity and parts output throughout the day"
              >
                <defs>
                  <linearGradient id="gradParts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={STATUS_COLORS.running} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={STATUS_COLORS.running} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradHandoffs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Area
                  type="monotone"
                  dataKey="parts"
                  name="Parts"
                  stroke={STATUS_COLORS.running}
                  fill="url(#gradParts)"
                  strokeWidth={2}
                  isAnimationActive={!prefersReducedMotion}
                />
                <Area
                  type="monotone"
                  dataKey="handoffs"
                  name="Handoffs"
                  stroke="hsl(var(--primary))"
                  fill="url(#gradHandoffs)"
                  strokeWidth={2}
                  isAnimationActive={!prefersReducedMotion}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

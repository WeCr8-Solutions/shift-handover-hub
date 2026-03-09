import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { RefreshIndicator } from "./RefreshIndicator";
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
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Filter, Activity, Users, Wrench } from "lucide-react";
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
  isRefreshing?: boolean;
  lastRefreshedAt?: Date | null;
  onRefresh?: () => void;
}

type ShiftFilter = "all" | "Day" | "Swing" | "Night";
type ChartView = "output" | "status" | "team" | "workcenter" | "trend";

// ─── Helpers ──────────────────────────────────────────────

/** Safe numeric add — coerce nulls/undefined/NaN to 0 */
function safeAdd(a: number, b: number | null | undefined): number {
  return a + (Number(b) || 0);
}

/** Truncate label for chart axis display */
function truncateLabel(label: string, maxLen = 14): string {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + "…" : label;
}

/** Format large numbers compactly for display */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ProductionAnalytics({
  stations,
  handoffs,
  isRefreshing = false,
  lastRefreshedAt = null,
  onRefresh,
}: ProductionAnalyticsProps) {
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [chartView, setChartView] = useState<ChartView>("output");

  // Reduced motion
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

  // Station output data — safe numeric accumulation
  const stationOutputData = useMemo(() => {
    const map = new Map<string, { name: string; teamName: string; workCenter: string; status: StatusLabel; parts: number; scrap: number; rework: number }>();

    stations.forEach((s) => {
      if (!s.is_active) return;
      const key = s.id;
      const teamName = s.team?.name || "Unassigned";
      const workCenter = s.work_center || "—";
      const status = getStatusFromJobState(s.current_status?.current_job_state);
      const existing = map.get(key) || { name: s.name, teamName, workCenter, status, parts: 0, scrap: 0, rework: 0 };
      existing.parts = safeAdd(existing.parts, s.current_status?.parts_complete);
      map.set(key, existing);
    });

    filteredHandoffs.forEach((h) => {
      const stationName = h.machine_id;
      const matchStation = stations.find((s) => s.station_id === stationName || s.name === stationName);
      const teamName = matchStation?.team?.name || "—";
      const workCenter = matchStation?.work_center || "—";
      const status = matchStation ? getStatusFromJobState(matchStation.current_status?.current_job_state) : ("idle" as StatusLabel);
      const key = matchStation?.id || `handoff-${stationName}`;
      const existing = map.get(key) || { name: stationName, teamName, workCenter, status, parts: 0, scrap: 0, rework: 0 };
      existing.parts = safeAdd(existing.parts, h.parts_completed_this_shift);
      existing.scrap = safeAdd(existing.scrap, h.scrap_count);
      existing.rework = safeAdd(existing.rework, h.rework_count);
      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.parts - a.parts)
      .slice(0, 15);
  }, [stations, filteredHandoffs]);

  // Work center aggregation
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

  // Status distribution for pie chart
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

  // Handoff trend data
  const trendData = useMemo(() => {
    const today = new Date();
    const todayString = today.toDateString();

    const hasTodayData = filteredHandoffs.some(
      (h) => new Date(h.created_at).toDateString() === todayString,
    );

    if (hasTodayData) {
      const hours = new Map<string, { label: string; handoffs: number; parts: number; scrap: number }>();
      for (let i = 0; i < 24; i++) {
        const label = `${i.toString().padStart(2, "0")}:00`;
        hours.set(label, { label, handoffs: 0, parts: 0, scrap: 0 });
      }
      filteredHandoffs.forEach((h) => {
        const date = new Date(h.created_at);
        if (date.toDateString() !== todayString) return;
        const hourLabel = `${date.getHours().toString().padStart(2, "0")}:00`;
        const slot = hours.get(hourLabel);
        if (slot) {
          slot.handoffs++;
          slot.parts = safeAdd(slot.parts, h.parts_completed_this_shift);
          slot.scrap = safeAdd(slot.scrap, h.scrap_count);
        }
      });
      return { mode: "hourly" as const, data: Array.from(hours.values()) };
    } else {
      const days = new Map<string, { label: string; handoffs: number; parts: number; scrap: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const key = d.toDateString();
        days.set(key, { label, handoffs: 0, parts: 0, scrap: 0 });
      }
      filteredHandoffs.forEach((h) => {
        const date = new Date(h.created_at);
        const key = date.toDateString();
        const slot = days.get(key);
        if (slot) {
          slot.handoffs++;
          slot.parts = safeAdd(slot.parts, h.parts_completed_this_shift);
          slot.scrap = safeAdd(slot.scrap, h.scrap_count);
        }
      });
      return { mode: "daily" as const, data: Array.from(days.values()) };
    }
  }, [filteredHandoffs]);

  const totalParts = stationOutputData.reduce((sum, d) => sum + d.parts, 0);
  const totalScrap = stationOutputData.reduce((sum, d) => sum + d.scrap, 0);
  const yieldRate = totalParts > 0 ? Math.round(((totalParts - totalScrap) / totalParts) * 100) : 100;

  const activeStationCount = stations.filter((s) => s.is_active).length;
  const getStatusPercentage = (value: number) => {
    if (activeStationCount === 0) return 0;
    return Math.round((value / activeStationCount) * 100);
  };

  // Shared tooltip style
  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Section Header with Filters — scrollable on small screens */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <BarChart3 className="w-5 h-5 text-primary shrink-0" />
          <h3 className="font-semibold text-base">Production Analytics</h3>
          <Badge variant="outline" className="text-[10px]">Live</Badge>
          {onRefresh && (
            <RefreshIndicator
              isRefreshing={isRefreshing}
              lastRefreshedAt={lastRefreshedAt}
              onRefresh={onRefresh}
              className="h-7 w-7"
            />
          )}
        </div>

        {/* Filters — stacked on mobile to prevent selector overflow */}
        <div className="space-y-2 min-w-0">
          {/* Shift Filter */}
          <div className="w-full min-w-0 overflow-x-auto pb-1 -mb-1 scrollbar-none">
            <div
              className="inline-flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5"
              role="group"
              aria-label="Shift filter"
            >
              <Filter className="w-3 h-3 text-muted-foreground ml-2 shrink-0" aria-hidden="true" />
              {(["all", "Day", "Swing", "Night"] as ShiftFilter[]).map((shift) => (
                <button
                  key={shift}
                  onClick={() => setShiftFilter(shift)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
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
          </div>

          {/* Chart View Toggle */}
          <div className="w-full min-w-0 overflow-x-auto pb-1 -mb-1 scrollbar-none">
            <div
              className="inline-flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5"
              role="group"
              aria-label="Chart view"
            >
              {[
                { key: "output" as ChartView, icon: BarChart3, label: "Output" },
                { key: "status" as ChartView, icon: PieChartIcon, label: "Status" },
                { key: "team" as ChartView, icon: Users, label: "Teams" },
                { key: "workcenter" as ChartView, icon: Wrench, label: "Work Ctrs" },
                { key: "trend" as ChartView, icon: TrendingUp, label: "Trend" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setChartView(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    chartView === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={chartView === key}
                >
                  <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Chips — scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mb-1 scrollbar-none" role="group" aria-label="Production summary">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shrink-0">
          <Activity className="w-3.5 h-3.5 text-[hsl(var(--state-running))]" aria-hidden="true" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Total Parts</span>
          <span className="text-sm font-bold font-mono text-[hsl(var(--state-running))]">{formatCount(totalParts)}</span>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Yield</span>
          <span className="text-sm font-bold font-mono text-primary">{yieldRate}%</span>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shrink-0">
          <BarChart3 className="w-3.5 h-3.5 text-[hsl(var(--state-setup))]" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Handoffs</span>
          <span className="text-sm font-bold font-mono text-[hsl(var(--state-setup))]">{formatCount(filteredHandoffs.length)}</span>
        </div>
        {totalScrap > 0 && (
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--state-down))] shrink-0" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Scrap</span>
            <span className="text-sm font-bold font-mono text-[hsl(var(--state-down))]">{formatCount(totalScrap)}</span>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="bg-card border border-border rounded-lg p-4 overflow-hidden">
        {chartView === "output" && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Parts completed by station</p>
            {stationOutputData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No production data yet. Submit handoffs to see output metrics.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <div style={{ minWidth: Math.max(600, stationOutputData.length * 60) }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stationOutputData}
                      margin={{ top: 5, right: 10, left: -10, bottom: 10 }}
                      role="img"
                      aria-label={`Bar chart showing parts completed. Top station: ${stationOutputData[0]?.name} with ${stationOutputData[0]?.parts} parts.`}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                        height={60}
                        tick={({ x, y, payload }: any) => {
                          const entry = stationOutputData.find((d) => d.name === payload.value);
                          const status = entry?.status as StatusLabel | undefined;
                          const statusColor = status ? STATUS_COLORS[status] : "hsl(var(--muted-foreground))";
                          const statusLabel = status ? STATUS_CONFIG[status].displayName : "";
                          const displayName = truncateLabel(payload.value);
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text
                                x={0}
                                y={0}
                                dy={12}
                                textAnchor="middle"
                                fontSize={10}
                                fill="hsl(var(--muted-foreground))"
                              >
                                <title>{payload.value}</title>
                                {displayName}
                              </text>
                              {statusLabel && (
                                <g transform="translate(0, 28)">
                                  <circle cx={-(statusLabel.length * 2.7) / 2 - 5} cy={0} r={3} fill={statusColor} />
                                  <text
                                    x={0}
                                    y={0}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={9}
                                    fontWeight={600}
                                    fill={statusColor}
                                  >
                                    {statusLabel}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCount(v)}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0]?.payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-2.5 text-xs shadow-lg max-w-[240px]">
                              <p className="font-medium text-foreground mb-1 truncate">{label}</p>
                              {data?.teamName && (
                                <p className="text-muted-foreground truncate">Team: {data.teamName}</p>
                              )}
                              {data?.workCenter && data.workCenter !== "—" && (
                                <p className="text-muted-foreground truncate">Work Center: {data.workCenter}</p>
                              )}
                              {payload.map((p: any, i: number) => (
                                <p key={i} style={{ color: p.color }}>
                                  {p.name}: {formatCount(p.value)}
                                </p>
                              ))}
                              {data?.status && (
                                <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border">
                                  <span
                                    className="inline-block w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: STATUS_COLORS[data.status as StatusLabel] }}
                                  />
                                  <span className="font-medium" style={{ color: STATUS_COLORS[data.status as StatusLabel] }}>
                                    {STATUS_CONFIG[data.status as StatusLabel]?.displayName}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="parts" name="Good Parts" fill={STATUS_COLORS.running} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="scrap" name="Scrap" fill={STATUS_COLORS.down} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="rework" name="Rework" fill={STATUS_COLORS.setup} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                <div className="w-full sm:w-1/2 max-w-[260px]">
                  <ResponsiveContainer width="100%" height={250}>
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
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  {statusDistribution.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} aria-hidden="true" />
                      <span className="text-sm flex-1 truncate">{d.name}</span>
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
              <div className="overflow-x-auto scrollbar-none">
                <div style={{ minWidth: Math.max(500, teamData.length * 80) }}>
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
                        tickFormatter={(v) => truncateLabel(v, 16)}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="running" name="Running" stackId="a" fill={STATUS_COLORS.running} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="setup" name="Setup" stackId="a" fill={STATUS_COLORS.setup} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="waiting" name="Waiting" stackId="a" fill={STATUS_COLORS.waiting} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="down" name="Down" stackId="a" fill={STATUS_COLORS.down} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="idle" name="Idle" stackId="a" fill={STATUS_COLORS.idle} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
              <div className="overflow-x-auto scrollbar-none">
                <div style={{ minWidth: Math.max(500, workCenterData.length * 80) }}>
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
                        tickFormatter={(v) => truncateLabel(v, 16)}
                        angle={-20}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="running" name="Running" stackId="a" fill={STATUS_COLORS.running} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="setup" name="Setup" stackId="a" fill={STATUS_COLORS.setup} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="waiting" name="Waiting" stackId="a" fill={STATUS_COLORS.waiting} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="down" name="Down" stackId="a" fill={STATUS_COLORS.down} isAnimationActive={!prefersReducedMotion} />
                      <Bar dataKey="idle" name="Idle" stackId="a" fill={STATUS_COLORS.idle} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {chartView === "trend" && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              {trendData.mode === "hourly"
                ? "Handoff activity & parts output (today, hourly)"
                : "Handoff activity & parts output (last 7 days)"}
            </p>
            {trendData.data.every((d) => d.handoffs === 0 && d.parts === 0) ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No handoff data in this period. Submit handoffs to see trend metrics.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <div className="min-w-[500px]">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={trendData.data}
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                      role="img"
                      aria-label={`Area chart showing handoff activity and parts output ${trendData.mode === "hourly" ? "throughout today" : "over the last 7 days"}`}
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
                        dataKey="label"
                        tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                        interval={trendData.mode === "hourly" ? 2 : 0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCount(v)}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      <Area type="monotone" dataKey="parts" name="Parts" stroke={STATUS_COLORS.running} fill="url(#gradParts)" strokeWidth={2} isAnimationActive={!prefersReducedMotion} />
                      <Area type="monotone" dataKey="handoffs" name="Handoffs" stroke="hsl(var(--primary))" fill="url(#gradHandoffs)" strokeWidth={2} isAnimationActive={!prefersReducedMotion} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

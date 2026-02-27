import { useMemo, useState } from "react";
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
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Filter,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StationData {
  id: string;
  station_id: string;
  name: string;
  is_active: boolean;
  team_id: string | null;
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
}

type ShiftFilter = "all" | "Day" | "Swing" | "Night";
type ChartView = "output" | "status" | "trend";

const STATUS_COLORS = {
  running: "hsl(142, 71%, 45%)",
  setup: "hsl(38, 92%, 50%)",
  waiting: "hsl(217, 91%, 60%)",
  down: "hsl(0, 84%, 60%)",
  idle: "hsl(215, 14%, 34%)",
};

export function ProductionAnalytics({ stations, handoffs }: ProductionAnalyticsProps) {
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [chartView, setChartView] = useState<ChartView>("output");

  // Filter handoffs by shift
  const filteredHandoffs = useMemo(() => {
    if (shiftFilter === "all") return handoffs;
    return handoffs.filter((h) => h.shift === shiftFilter);
  }, [handoffs, shiftFilter]);

  // Station output data (parts per station)
  const stationOutputData = useMemo(() => {
    const map = new Map<string, { name: string; parts: number; scrap: number; rework: number }>();
    
    // From current station status
    stations.forEach((s) => {
      if (!s.is_active) return;
      const existing = map.get(s.station_id) || { name: s.name, parts: 0, scrap: 0, rework: 0 };
      existing.parts += s.current_status?.parts_complete || 0;
      map.set(s.station_id, existing);
    });

    // Supplement with handoff data
    filteredHandoffs.forEach((h) => {
      const stationName = h.machine_id;
      const existing = map.get(stationName) || { name: stationName, parts: 0, scrap: 0, rework: 0 };
      existing.parts += h.parts_completed_this_shift || 0;
      existing.scrap += h.scrap_count || 0;
      existing.rework += h.rework_count || 0;
      map.set(stationName, existing);
    });

    return Array.from(map.values())
      .filter((d) => d.parts > 0 || d.scrap > 0)
      .sort((a, b) => b.parts - a.parts)
      .slice(0, 10);
  }, [stations, filteredHandoffs]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const counts = { running: 0, setup: 0, waiting: 0, down: 0, idle: 0 };
    stations.forEach((s) => {
      if (!s.is_active) return;
      const state = s.current_status?.current_job_state || "";
      if (state === "Part Running" || state === "Processing") counts.running++;
      else if (state === "Setup in Progress" || state === "First Article in Process") counts.setup++;
      else if (state === "Machine Down / Issue") counts.down++;
      else if (state.includes("Waiting") || state === "On Hold") counts.waiting++;
      else counts.idle++;
    });
    return [
      { name: "Running", value: counts.running, color: STATUS_COLORS.running },
      { name: "Setup", value: counts.setup, color: STATUS_COLORS.setup },
      { name: "Waiting", value: counts.waiting, color: STATUS_COLORS.waiting },
      { name: "Down", value: counts.down, color: STATUS_COLORS.down },
      { name: "Idle", value: counts.idle, color: STATUS_COLORS.idle },
    ].filter((d) => d.value > 0);
  }, [stations]);

  // Handoff trend data (grouped by hour)
  const trendData = useMemo(() => {
    const hours = new Map<string, { hour: string; handoffs: number; parts: number; scrap: number }>();
    
    // Create 24h slots
    for (let i = 0; i < 24; i++) {
      const label = `${i.toString().padStart(2, "0")}:00`;
      hours.set(label, { hour: label, handoffs: 0, parts: 0, scrap: 0 });
    }

    filteredHandoffs.forEach((h) => {
      const date = new Date(h.created_at);
      const hourLabel = `${date.getHours().toString().padStart(2, "0")}:00`;
      const slot = hours.get(hourLabel);
      if (slot) {
        slot.handoffs++;
        slot.parts += h.parts_completed_this_shift || 0;
        slot.scrap += h.scrap_count || 0;
      }
    });

    return Array.from(hours.values());
  }, [filteredHandoffs]);

  const totalParts = stationOutputData.reduce((sum, d) => sum + d.parts, 0);
  const totalScrap = stationOutputData.reduce((sum, d) => sum + d.scrap, 0);
  const yieldRate = totalParts > 0 ? Math.round(((totalParts - totalScrap) / totalParts) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Section Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Production Analytics</h3>
          <Badge variant="outline" className="text-[10px]">Live</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Shift Filter */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
            <Filter className="w-3 h-3 text-muted-foreground ml-2" />
            {(["all", "Day", "Swing", "Night"] as ShiftFilter[]).map((shift) => (
              <button
                key={shift}
                onClick={() => setShiftFilter(shift)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  shiftFilter === shift
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {shift === "all" ? "All Shifts" : shift}
              </button>
            ))}
          </div>
          {/* Chart View Toggle */}
          <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
            {([
              { key: "output" as ChartView, icon: BarChart3, label: "Output" },
              { key: "status" as ChartView, icon: PieChartIcon, label: "Status" },
              { key: "trend" as ChartView, icon: TrendingUp, label: "Trend" },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setChartView(key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  chartView === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stat Chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
          <Activity className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-muted-foreground">Total Parts</span>
          <span className="text-sm font-bold font-mono text-green-400">{totalParts}</span>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">Yield</span>
          <span className="text-sm font-bold font-mono text-primary">{yieldRate}%</span>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-muted-foreground">Handoffs</span>
          <span className="text-sm font-bold font-mono text-amber-400">{filteredHandoffs.length}</span>
        </div>
        {totalScrap > 0 && (
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
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
                <BarChart data={stationOutputData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="parts" name="Good Parts" fill={STATUS_COLORS.running} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="scrap" name="Scrap" fill={STATUS_COLORS.down} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rework" name="Rework" fill={STATUS_COLORS.setup} radius={[4, 4, 0, 0]} />
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
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
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
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm flex-1">{d.name}</span>
                      <span className="text-sm font-bold font-mono">{d.value}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {Math.round((d.value / stations.filter(s => s.is_active).length) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {chartView === "trend" && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Handoff activity & parts output (24h)</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
                />
                <Area
                  type="monotone"
                  dataKey="handoffs"
                  name="Handoffs"
                  stroke="hsl(var(--primary))"
                  fill="url(#gradHandoffs)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

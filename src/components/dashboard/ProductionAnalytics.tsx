import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { RefreshIndicator } from "./RefreshIndicator";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Filter, Activity, Users, Wrench, AlertOctagon } from "lucide-react";
import {
  STATUS_CONFIG, STATUS_COLORS, getStatusFromJobState, type StatusLabel,
} from "./stationStatus";
import {
  OutputChart, StatusPieChart, StackedStatusChart, TrendAreaChart, ParetoChart,
  StatChip, ToggleChipGroup, formatCount, safeAdd, type OutputEntry,
} from "./charts";
import { useDowntimeAnalytics } from "@/hooks/useDowntimeAnalytics";
import { useDowntimeReasons } from "@/hooks/useDowntimeReasons";
import { AnalyticsOnboardingBanner } from "./AnalyticsOnboardingBanner";

// ─── Types ─────────────────────────────────────────────────

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
  station_id?: string | null;
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
  /** Unfiltered active-station set used by the Status pie so it always shows the full distribution. Falls back to `stations`. */
  allStations?: StationData[];
  handoffs: HandoffRecord[];
  isRefreshing?: boolean;
  lastRefreshedAt?: Date | null;
  onRefresh?: () => void;
}

type ShiftFilter = "all" | "Day" | "Swing" | "Night";
type ChartView = "output" | "status" | "team" | "workcenter" | "trend" | "pareto";

// ─── Filter configs ────────────────────────────────────────

const SHIFT_OPTIONS = [
  { key: "all" as ShiftFilter, label: "All Shifts" },
  { key: "Day" as ShiftFilter, label: "Day" },
  { key: "Swing" as ShiftFilter, label: "Swing" },
  { key: "Night" as ShiftFilter, label: "Night" },
] as const;

const CHART_VIEW_OPTIONS = [
  { key: "output" as ChartView, icon: BarChart3, label: "Output" },
  { key: "status" as ChartView, icon: PieChartIcon, label: "Status" },
  { key: "team" as ChartView, icon: Users, label: "Teams" },
  { key: "workcenter" as ChartView, icon: Wrench, label: "Work Ctrs" },
  { key: "trend" as ChartView, icon: TrendingUp, label: "Trend" },
  { key: "pareto" as ChartView, icon: AlertOctagon, label: "Pareto" },
] as const;

// ─── Data hooks ────────────────────────────────────────────

function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefersReducedMotion;
}

function useStationOutputData(stations: StationData[], filteredHandoffs: HandoffRecord[]) {
  return useMemo(() => {
    // Lookup tables for fast handoff↔station matching. Prefer the FK `station_id`,
    // fall back to legacy machine_id / name matches for older handoff records.
    const stationById = new Map<string, StationData>();
    const stationByStationId = new Map<string, StationData>();
    const stationByName = new Map<string, StationData>();
    stations.forEach((s) => {
      stationById.set(s.id, s);
      if (s.station_id) stationByStationId.set(s.station_id, s);
      if (s.name) stationByName.set(s.name, s);
    });

    const map = new Map<string, OutputEntry>();
    const stationHasHandoff = new Set<string>();

    // 1) Sum production from handoffs — authoritative shift output.
    //    Only credit handoffs whose station is in the visible set so a status
    //    filter doesn't surface ghost rows for filtered-out stations.
    filteredHandoffs.forEach((h) => {
      const match =
        (h.station_id && stationById.get(h.station_id)) ||
        stationByStationId.get(h.machine_id) ||
        stationByName.get(h.machine_id);
      if (!match || !match.is_active) return;

      stationHasHandoff.add(match.id);
      const status = getStatusFromJobState(match.current_status?.current_job_state);
      const existing = map.get(match.id) || {
        name: match.name,
        teamName: match.team?.name || "Unassigned",
        workCenter: match.work_center || "—",
        status,
        parts: 0,
        scrap: 0,
        rework: 0,
      };
      existing.parts = safeAdd(existing.parts, h.parts_completed_this_shift);
      existing.scrap = safeAdd(existing.scrap, h.scrap_count);
      existing.rework = safeAdd(existing.rework, h.rework_count);
      map.set(match.id, existing);
    });

    // 2) For active stations with NO handoff in the current window, fall back
    //    to the live `parts_complete` counter so a running station still appears.
    //    This avoids the previous double-count (handoff sum + live counter).
    stations.forEach((s) => {
      if (!s.is_active) return;
      if (stationHasHandoff.has(s.id)) return;
      const liveParts = s.current_status?.parts_complete ?? 0;
      if (liveParts <= 0) return;
      const status = getStatusFromJobState(s.current_status?.current_job_state);
      map.set(s.id, {
        name: s.name,
        teamName: s.team?.name || "Unassigned",
        workCenter: s.work_center || "—",
        status,
        parts: liveParts,
        scrap: 0,
        rework: 0,
      });
    });

    return Array.from(map.values()).sort((a, b) => b.parts - a.parts).slice(0, 15);
  }, [stations, filteredHandoffs]);
}

function useGroupedStatusData(stations: StationData[], groupKey: "team" | "workCenter") {
  return useMemo(() => {
    const map = new Map<string, Record<string, any>>();
    const nameField = groupKey === "team" ? "team" : "workCenter";

    stations.forEach((s) => {
      if (!s.is_active) return;
      const group = groupKey === "team" ? (s.team?.name || "Unassigned") : (s.work_center || "Other");
      const existing = map.get(group) || { [nameField]: group, stations: 0, running: 0, setup: 0, down: 0, waiting: 0, idle: 0 };
      existing.stations++;
      existing[getStatusFromJobState(s.current_status?.current_job_state)]++;
      map.set(group, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.stations - a.stations);
  }, [stations, groupKey]);
}

function useStatusDistribution(stations: StationData[]) {
  return useMemo(() => {
    const counts = { running: 0, setup: 0, waiting: 0, down: 0, idle: 0 };
    stations.forEach((s) => {
      if (!s.is_active) return;
      counts[getStatusFromJobState(s.current_status?.current_job_state)]++;
    });
    return (Object.keys(counts) as StatusLabel[])
      .map((key) => ({ name: STATUS_CONFIG[key].displayName, value: counts[key], color: STATUS_COLORS[key] }))
      .filter((d) => d.value > 0);
  }, [stations]);
}

function useTrendData(filteredHandoffs: HandoffRecord[]) {
  return useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    const hasTodayData = filteredHandoffs.some((h) => new Date(h.created_at).toDateString() === todayStr);

    if (hasTodayData) {
      const hours = new Map<string, { label: string; handoffs: number; parts: number; scrap: number }>();
      for (let i = 0; i < 24; i++) {
        const label = `${i.toString().padStart(2, "0")}:00`;
        hours.set(label, { label, handoffs: 0, parts: 0, scrap: 0 });
      }
      filteredHandoffs.forEach((h) => {
        const d = new Date(h.created_at);
        if (d.toDateString() !== todayStr) return;
        const slot = hours.get(`${d.getHours().toString().padStart(2, "0")}:00`);
        if (slot) { slot.handoffs++; slot.parts = safeAdd(slot.parts, h.parts_completed_this_shift); slot.scrap = safeAdd(slot.scrap, h.scrap_count); }
      });
      return { mode: "hourly" as const, data: Array.from(hours.values()) };
    } else {
      const days = new Map<string, { label: string; handoffs: number; parts: number; scrap: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        days.set(d.toDateString(), { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), handoffs: 0, parts: 0, scrap: 0 });
      }
      filteredHandoffs.forEach((h) => {
        const slot = days.get(new Date(h.created_at).toDateString());
        if (slot) { slot.handoffs++; slot.parts = safeAdd(slot.parts, h.parts_completed_this_shift); slot.scrap = safeAdd(slot.scrap, h.scrap_count); }
      });
      return { mode: "daily" as const, data: Array.from(days.values()) };
    }
  }, [filteredHandoffs]);
}

// ─── Main Component ────────────────────────────────────────

export function ProductionAnalytics({
  stations, allStations, handoffs, isRefreshing = false, lastRefreshedAt = null, onRefresh,
}: ProductionAnalyticsProps) {
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [chartView, setChartView] = useState<ChartView>("output");
  const prefersReducedMotion = useReducedMotion();

  const filteredHandoffs = useMemo(
    () => shiftFilter === "all" ? handoffs : handoffs.filter((h) => h.shift === shiftFilter),
    [handoffs, shiftFilter],
  );

  // Status pie always reflects the full active-station set, independent of any
  // status filter applied by the parent — the pie IS the status legend.
  const stationsForPie = allStations ?? stations;

  const stationOutputData = useStationOutputData(stations, filteredHandoffs);
  const teamData = useGroupedStatusData(stations, "team");
  const workCenterData = useGroupedStatusData(stations, "workCenter");
  const statusDistribution = useStatusDistribution(stationsForPie);
  const trendData = useTrendData(filteredHandoffs);
  const { events: downtimeEvents } = useDowntimeAnalytics(30);
  const { reasons: downtimeReasons } = useDowntimeReasons();

  const totalParts = stationOutputData.reduce((s, d) => s + d.parts, 0);
  const totalScrap = stationOutputData.reduce((s, d) => s + d.scrap, 0);
  const yieldRate = totalParts > 0 ? Math.round(((totalParts - totalScrap) / totalParts) * 100) : 100;
  const activeCount = stationsForPie.filter((s) => s.is_active).length;

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <BarChart3 className="w-5 h-5 text-primary shrink-0" />
          <h3 className="font-semibold text-base">Production Analytics</h3>
          <Badge variant="outline" className="text-[10px]">Live</Badge>
          {onRefresh && (
            <RefreshIndicator isRefreshing={isRefreshing} lastRefreshedAt={lastRefreshedAt}
              onRefresh={onRefresh} className="h-7 w-7" />
          )}
        </div>

        <div className="space-y-2 min-w-0">
          <ToggleChipGroup<ShiftFilter> items={SHIFT_OPTIONS} value={shiftFilter}
            onChange={setShiftFilter} ariaLabel="Shift filter" />
          <ToggleChipGroup<ChartView> items={CHART_VIEW_OPTIONS} value={chartView}
            onChange={setChartView} ariaLabel="Chart view" showIcon />
        </div>
      </div>

      {/* Summary Stat Chips */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mb-1 scrollbar-none" role="group" aria-label="Production summary">
        <StatChip icon={Activity} label="Total Parts" value={formatCount(totalParts)} valueClass="text-state-running" />
        <StatChip icon={TrendingUp} label="Yield" value={`${yieldRate}%`} valueClass="text-primary" />
        <StatChip icon={BarChart3} label="Handoffs" value={formatCount(filteredHandoffs.length)} valueClass="text-state-setup" />
        {totalScrap > 0 && (
          <StatChip dotColor="bg-state-down" label="Scrap" value={formatCount(totalScrap)} valueClass="text-state-down" />
        )}
      </div>

      {/* Chart Area */}
      <div className="bg-card border border-border rounded-lg p-4 overflow-hidden">
        {chartView === "trend" && (
          <div className="flex justify-end mb-2">
            <Badge variant="outline" className="text-[10px]">
              {trendData.mode === "hourly" ? "Today · hourly" : "Last 7 days"}
            </Badge>
          </div>
        )}
        {chartView === "pareto" && (
          <div className="flex justify-end mb-2">
            <Badge variant="outline" className="text-[10px]">Last 30 days · downtime reasons</Badge>
          </div>
        )}
        {chartView === "output" && <OutputChart data={stationOutputData} prefersReducedMotion={prefersReducedMotion} />}
        {chartView === "status" && <StatusPieChart data={statusDistribution} activeStationCount={activeCount} prefersReducedMotion={prefersReducedMotion} />}
        {chartView === "team" && <StackedStatusChart data={teamData} dataKey="team" subtitle="Station status by team" emptyMessage="No teams configured." ariaLabel="Stacked bar chart showing station status by team" prefersReducedMotion={prefersReducedMotion} />}
        {chartView === "workcenter" && <StackedStatusChart data={workCenterData} dataKey="workCenter" subtitle="Station status by work center" emptyMessage="No work centers configured." ariaLabel="Stacked bar chart showing station status by work center" prefersReducedMotion={prefersReducedMotion} rotateLabels />}
        {chartView === "trend" && <TrendAreaChart data={trendData.data} mode={trendData.mode} prefersReducedMotion={prefersReducedMotion} />}
        {chartView === "pareto" && <ParetoChart events={downtimeEvents} reasons={downtimeReasons} prefersReducedMotion={prefersReducedMotion} />}
      </div>
    </div>
  );
}

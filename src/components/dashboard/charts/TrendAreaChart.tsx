import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { STATUS_COLORS } from "../stationStatus";
import {
  CHART_AXIS_STYLE, CHART_GRID_PROPS, CHART_AXIS_LINE, CHART_TOOLTIP_STYLE,
  ChartContainer, ChartEmptyState, formatCount,
} from "./chart-primitives";

interface TrendDataPoint {
  label: string;
  handoffs: number;
  parts: number;
  scrap: number;
}

interface TrendAreaChartProps {
  data: TrendDataPoint[];
  mode: "hourly" | "daily";
  prefersReducedMotion: boolean;
}

export function TrendAreaChart({ data, mode, prefersReducedMotion }: TrendAreaChartProps) {
  const subtitle = mode === "hourly"
    ? "Handoff activity & parts output (today, hourly)"
    : "Handoff activity & parts output (last 7 days)";

  const isEmpty = data.every((d) => d.handoffs === 0 && d.parts === 0);

  return (
    <ChartContainer subtitle={subtitle}>
      {isEmpty ? (
        <ChartEmptyState message="No handoff data in this period. Submit handoffs to see trend metrics." />
      ) : (
        <div className="overflow-x-auto scrollbar-none">
          <div className="min-w-[500px]">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                role="img" aria-label={`Area chart showing handoff activity ${mode === "hourly" ? "throughout today" : "over the last 7 days"}`}>
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
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="label" tick={{ ...CHART_AXIS_STYLE, fontSize: 9 }}
                  axisLine={CHART_AXIS_LINE} tickLine={false}
                  interval={mode === "hourly" ? 2 : 0} />
                <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={formatCount} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="parts" name="Parts" stroke={STATUS_COLORS.running}
                  fill="url(#gradParts)" strokeWidth={2} isAnimationActive={!prefersReducedMotion} />
                <Area type="monotone" dataKey="handoffs" name="Handoffs" stroke="hsl(var(--primary))"
                  fill="url(#gradHandoffs)" strokeWidth={2} isAnimationActive={!prefersReducedMotion} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartContainer>
  );
}

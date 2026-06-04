import { useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  CHART_AXIS_STYLE, CHART_GRID_PROPS, CHART_AXIS_LINE,
  ChartContainer, ChartEmptyState, truncateLabel, formatCount,
} from "./chart-primitives";
import { findReasonLabel } from "@/lib/downtimeReasons";

export interface ParetoSource {
  reason_code: string | null;
  duration_minutes: number | null;
}

interface ParetoChartProps {
  events: ParetoSource[];
  reasons: { code: string; label: string }[];
  prefersReducedMotion?: boolean;
  metric?: "duration" | "occurrences";
  topN?: number;
}

interface ParetoBar {
  code: string;
  label: string;
  value: number;
  cumulativePct: number;
}

const BAR_COLOR = "hsl(var(--primary))";
const LINE_COLOR = "hsl(var(--state-down))";

/**
 * Classic Pareto chart: descending bars + cumulative % line.
 * Used for downtime reasons / scrap reasons / any frequency-or-magnitude
 * series where the 80/20 view is useful.
 */
export function ParetoChart({
  events, reasons, prefersReducedMotion = false, metric = "duration", topN = 10,
}: ParetoChartProps) {
  const data = useMemo<ParetoBar[]>(() => {
    if (!events?.length) return [];
    const sums = new Map<string, { value: number; label: string }>();
    for (const e of events) {
      const code = e.reason_code ?? "uncategorized";
      const label = findReasonLabel(code, reasons);
      const v = metric === "duration" ? (e.duration_minutes ?? 0) : 1;
      const prev = sums.get(code);
      sums.set(code, { value: (prev?.value ?? 0) + v, label });
    }
    const sorted = Array.from(sums.entries())
      .map(([code, { value, label }]) => ({ code, label, value }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, topN);
    const total = top.reduce((s, x) => s + x.value, 0);
    let running = 0;
    return top.map((x) => {
      running += x.value;
      return {
        ...x,
        label: truncateLabel(x.label, 18),
        cumulativePct: total > 0 ? Math.round((running / total) * 100) : 0,
      };
    });
  }, [events, reasons, metric, topN]);

  if (!data.length) {
    return (
      <ChartEmptyState message="No downtime recorded in this window. Log downtime from the station panel so this Pareto chart can highlight the biggest losses." />
    );
  }

  return (
    <ChartContainer subtitle="Top downtime reasons — bars show magnitude, line shows cumulative %">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 32, left: 0, bottom: 32 }}>
          <CartesianGrid {...CHART_GRID_PROPS} />
          <XAxis
            dataKey="label"
            {...CHART_AXIS_STYLE}
            {...CHART_AXIS_LINE}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="left"
            {...CHART_AXIS_STYLE}
            {...CHART_AXIS_LINE}
            tickFormatter={(v) => formatCount(v)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            {...CHART_AXIS_STYLE}
            {...CHART_AXIS_LINE}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: any, name: string) => {
              if (name === "Cumulative %") return [`${value}%`, name];
              return [
                metric === "duration" ? `${formatCount(Number(value))} min` : formatCount(Number(value)),
                metric === "duration" ? "Downtime" : "Events",
              ];
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="value"
            name={metric === "duration" ? "Downtime" : "Events"}
            isAnimationActive={!prefersReducedMotion}
            radius={[4, 4, 0, 0]}
          >
            {data.map((d, i) => (
              <Cell key={d.code} fill={BAR_COLOR} fillOpacity={1 - i * 0.06} />
            ))}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePct"
            name="Cumulative %"
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={!prefersReducedMotion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users } from "lucide-react";
import { STATUS_COLORS } from "../stationStatus";
import {
  CHART_AXIS_STYLE, CHART_GRID_PROPS, CHART_AXIS_LINE, CHART_TOOLTIP_STYLE,
  ChartContainer, ChartEmptyState, ScrollableChartWrapper, truncateLabel,
} from "./chart-primitives";

interface StackedStatusChartProps {
  data: Record<string, any>[];
  dataKey: string;
  subtitle: string;
  emptyMessage: string;
  ariaLabel: string;
  prefersReducedMotion: boolean;
  rotateLabels?: boolean;
}

export function StackedStatusChart({
  data, dataKey, subtitle, emptyMessage, ariaLabel,
  prefersReducedMotion, rotateLabels = false,
}: StackedStatusChartProps) {
  return (
    <ChartContainer subtitle={subtitle}>
      {data.length === 0 ? (
        <ChartEmptyState
          icon={Users}
          title="Awaiting structure"
          message={emptyMessage}
          hint="Assign stations to a team or work center"
        />
      ) : (
        <ScrollableChartWrapper minWidth={Math.max(500, data.length * 80)}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              role="img" aria-label={ariaLabel}>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey={dataKey} tick={CHART_AXIS_STYLE} axisLine={CHART_AXIS_LINE}
                tickLine={false} tickFormatter={(v) => truncateLabel(v, 16)}
                {...(rotateLabels ? { angle: -20, textAnchor: "end", height: 50 } : {})} />
              <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="running" name="Running" stackId="a" fill={STATUS_COLORS.running} isAnimationActive={!prefersReducedMotion} />
              <Bar dataKey="setup" name="Setup" stackId="a" fill={STATUS_COLORS.setup} isAnimationActive={!prefersReducedMotion} />
              <Bar dataKey="waiting" name="Waiting" stackId="a" fill={STATUS_COLORS.waiting} isAnimationActive={!prefersReducedMotion} />
              <Bar dataKey="down" name="Down" stackId="a" fill={STATUS_COLORS.down} isAnimationActive={!prefersReducedMotion} />
              <Bar dataKey="idle" name="Idle" stackId="a" fill={STATUS_COLORS.idle} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
            </BarChart>
          </ResponsiveContainer>
        </ScrollableChartWrapper>
      )}
    </ChartContainer>
  );
}

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Factory } from "lucide-react";
import { ChartContainer, ChartEmptyState, CHART_TOOLTIP_STYLE } from "./chart-primitives";

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

interface StatusPieChartProps {
  data: StatusSlice[];
  activeStationCount: number;
  prefersReducedMotion: boolean;
}

export function StatusPieChart({ data, activeStationCount, prefersReducedMotion }: StatusPieChartProps) {
  const getPercentage = (v: number) => activeStationCount === 0 ? 0 : Math.round((v / activeStationCount) * 100);

  return (
    <ChartContainer subtitle="Current station status distribution">
      {data.length === 0 ? (
        <ChartEmptyState
          icon={Factory}
          title="No active stations yet"
          message="Add your first station and operators will start populating live status here as they check in."
          hint="Settings → Stations to add one"
        />
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="w-full sm:w-1/2 max-w-[260px]">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart role="img" aria-label="Pie chart showing station status distribution">
                <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  paddingAngle={3} dataKey="value" animationBegin={0}
                  animationDuration={prefersReducedMotion ? 0 : 800}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3 w-full">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} aria-hidden="true" />
                <span className="text-sm flex-1 truncate">{d.name}</span>
                <span className="text-sm font-bold font-mono">{d.value}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{getPercentage(d.value)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartContainer>
  );
}

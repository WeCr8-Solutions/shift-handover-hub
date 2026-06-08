import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { STATUS_COLORS, STATUS_CONFIG, type StatusLabel } from "../stationStatus";
import {
  CHART_AXIS_STYLE, CHART_GRID_PROPS, CHART_AXIS_LINE,
  ChartContainer, ChartEmptyState, ScrollableChartWrapper,
  truncateLabel, formatCount,
} from "./chart-primitives";

interface OutputEntry {
  name: string;
  teamName: string;
  workCenter: string;
  status: StatusLabel;
  parts: number;
  scrap: number;
  rework: number;
}

interface OutputChartProps {
  data: OutputEntry[];
  prefersReducedMotion: boolean;
}

function OutputTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 text-xs shadow-lg max-w-[240px]">
      <p className="font-medium text-foreground mb-1 truncate">{label}</p>
      {data?.teamName && <p className="text-muted-foreground truncate">Team: {data.teamName}</p>}
      {data?.workCenter && data.workCenter !== "—" && (
        <p className="text-muted-foreground truncate">Work Center: {data.workCenter}</p>
      )}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatCount(p.value)}</p>
      ))}
      {data?.status && (
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border">
          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[data.status as StatusLabel] }} />
          <span className="font-medium" style={{ color: STATUS_COLORS[data.status as StatusLabel] }}>
            {STATUS_CONFIG[data.status as StatusLabel]?.displayName}
          </span>
        </div>
      )}
    </div>
  );
}

function StatusXAxisTick({ x, y, payload, data }: any) {
  const entry = data.find((d: OutputEntry) => d.name === payload.value);
  const status = entry?.status;
  const statusColor = status ? STATUS_COLORS[status] : "hsl(var(--muted-foreground))";
  const statusLabel = status ? STATUS_CONFIG[status].displayName : "";
  const displayName = truncateLabel(payload.value);

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">
        <title>{payload.value}</title>
        {displayName}
      </text>
      {statusLabel && (
        <g transform="translate(0, 28)">
          <circle cx={-(statusLabel.length * 2.7) / 2 - 5} cy={0} r={3} fill={statusColor} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={600} fill={statusColor}>
            {statusLabel}
          </text>
        </g>
      )}
    </g>
  );
}

export function OutputChart({ data, prefersReducedMotion }: OutputChartProps) {
  return (
    <ChartContainer subtitle="Parts completed by station">
      {data.length === 0 ? (
        <ChartEmptyState
          icon={BarChart3}
          title="Output is ready to track"
          message="Parts-per-station builds up automatically as operators submit shift handoffs."
          hint="Submit a handoff to populate"
        />

      ) : (
        <ScrollableChartWrapper minWidth={Math.max(600, data.length * 60)}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}
              role="img" aria-label={`Bar chart showing parts completed. Top station: ${data[0]?.name} with ${data[0]?.parts} parts.`}>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="name" axisLine={CHART_AXIS_LINE} tickLine={false} height={60}
                tick={(props: any) => <StatusXAxisTick {...props} data={data} />} />
              <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={formatCount} />
              <Tooltip content={<OutputTooltip />} />
              <Bar dataKey="parts" name="Good Parts" fill={STATUS_COLORS.running} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
              <Bar dataKey="scrap" name="Scrap" fill={STATUS_COLORS.down} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
              <Bar dataKey="rework" name="Rework" fill={STATUS_COLORS.setup} radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
            </BarChart>
          </ResponsiveContainer>
        </ScrollableChartWrapper>
      )}
    </ChartContainer>
  );
}

export type { OutputEntry };

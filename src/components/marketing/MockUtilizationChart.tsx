import { Badge } from "@/components/ui/badge";

function AppWindowChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
          <div className="w-3 h-3 rounded-full bg-green-400/60" />
        </div>
        <span className="text-xs text-muted-foreground ml-2 font-medium">{title}</span>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

const machines = [
  { id: "CNC-01", run: 72, setup: 12, idle: 8, down: 8 },
  { id: "LATHE-02", run: 58, setup: 20, idle: 15, down: 7 },
  { id: "MILL-03", run: 45, setup: 10, idle: 40, down: 5 },
  { id: "CNC-04", run: 30, setup: 8, idle: 12, down: 50 },
];

const colors = {
  run: "bg-status-ok",
  setup: "bg-status-warning",
  idle: "bg-muted-foreground/50",
  down: "bg-status-critical",
};

export function MockUtilizationChart() {
  return (
    <AppWindowChrome title="JobLine — Machine Utilization (Today)">
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utilization Breakdown</span>
          <Badge variant="outline" className="text-[10px]">2nd Shift</Badge>
        </div>

        <div className="space-y-3">
          {machines.map((m) => (
            <div key={m.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">{m.id}</span>
                <span className="text-muted-foreground">{m.run}% utilized</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                <div className={`${colors.run} rounded-l-full`} style={{ width: `${m.run}%` }} />
                <div className={colors.setup} style={{ width: `${m.setup}%` }} />
                <div className={colors.idle} style={{ width: `${m.idle}%` }} />
                <div className={`${colors.down} rounded-r-full`} style={{ width: `${m.down}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-status-ok" /> Run Time</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-status-warning" /> Setup</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground/50" /> Idle</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-status-critical" /> Down</span>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/40 p-2 text-center border border-border">
            <span className="text-[10px] text-muted-foreground block">Avg Utilization</span>
            <span className="font-bold text-foreground">51%</span>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 text-center border border-border">
            <span className="text-[10px] text-muted-foreground block">Total Downtime</span>
            <span className="font-bold text-status-critical">2h 47m</span>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 text-center border border-border">
            <span className="text-[10px] text-muted-foreground block">Setup Time</span>
            <span className="font-bold text-status-warning">1h 32m</span>
          </div>
        </div>
      </div>
    </AppWindowChrome>
  );
}

import { Badge } from "@/components/ui/badge";
import { AppWindowChrome } from "./AppWindowChrome";

const stations = [
  { id: "CNC-01", parts: 142, target: 200, scrap: 2, rework: 0, status: "Running" },
  { id: "LATHE-02", parts: 0, target: 80, scrap: 0, rework: 0, status: "Setup" },
  { id: "MILL-03", parts: 0, target: 120, scrap: 0, rework: 0, status: "Idle" },
  { id: "CNC-04", parts: 67, target: 150, scrap: 4, rework: 1, status: "Down" },
];

const statusColor: Record<string, string> = {
  Running: "bg-status-ok",
  Setup: "bg-status-warning",
  Idle: "bg-muted-foreground",
  Down: "bg-status-critical",
};

export function MockProductionMetrics() {
  return (
    <AppWindowChrome title="JobLine — Production Analytics">
      <div className="space-y-4 text-sm">
        {/* Summary row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Production</span>
          <Badge variant="outline" className="text-[10px]">2nd Shift · Live</Badge>
        </div>

        {/* Station bars */}
        <div className="space-y-3">
          {stations.map((s) => {
            const pct = Math.round((s.parts / s.target) * 100);
            return (
              <div key={s.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColor[s.status]}`} />
                    <span className="font-semibold">{s.id}</span>
                    <span className="text-muted-foreground">{s.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{s.parts}/{s.target} parts</span>
                    {s.scrap > 0 && <span className="text-status-critical">{s.scrap} scrap</span>}
                    {s.rework > 0 && <span className="text-status-warning">{s.rework} rework</span>}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-status-ok" : pct >= 50 ? "bg-primary" : pct > 0 ? "bg-status-warning" : "bg-muted"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quality summary */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="rounded-lg bg-muted/40 p-2 text-center border border-border">
            <span className="text-[10px] text-muted-foreground block">Total Parts</span>
            <span className="font-bold text-foreground">209</span>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 text-center border border-border">
            <span className="text-[10px] text-muted-foreground block">Scrap Rate</span>
            <span className="font-bold text-status-critical">2.9%</span>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 text-center border border-border">
            <span className="text-[10px] text-muted-foreground block">On Target</span>
            <span className="font-bold text-status-ok">1 of 4</span>
          </div>
        </div>
      </div>
    </AppWindowChrome>
  );
}

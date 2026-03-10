import { Badge } from "@/components/ui/badge";
import { AppWindowChrome } from "./AppWindowChrome";

const kpis = [
  { label: "Floor Utilization", value: "72%", trend: "+4%", good: true },
  { label: "Jobs Active", value: "12", trend: "", good: true },
  { label: "On-Time Delivery", value: "94%", trend: "+2%", good: true },
  { label: "Open Alerts", value: "3", trend: "", good: false },
];

const liveFeed = [
  { time: "2:47 PM", event: "CNC-01 completed Op 20 — BRKT-4510 (142/200 parts)", type: "success" },
  { time: "2:35 PM", event: "CNC-04 spindle alarm triggered — maintenance dispatched", type: "error" },
  { time: "2:22 PM", event: "WO-1852 moved to Setup on LATHE-02 by J. Kim", type: "info" },
  { time: "2:10 PM", event: "Quality hold released on WO-1840 — passed re-inspection", type: "success" },
  { time: "1:58 PM", event: "Shift handoff submitted for MILL-03 (1st → 2nd)", type: "info" },
];

const typeColors: Record<string, string> = {
  success: "bg-status-ok",
  error: "bg-status-critical",
  info: "bg-status-waiting",
};

export function MockVisibilityDashboard() {
  return (
    <AppWindowChrome title="JobLine — Real-Time Floor View">
      <div className="space-y-4 text-sm">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg bg-muted/40 p-2.5 text-center border border-border">
              <span className="text-[10px] text-muted-foreground block">{k.label}</span>
              <span className={`font-bold text-lg ${k.good ? "text-foreground" : "text-status-critical"}`}>{k.value}</span>
              {k.trend && (
                <span className={`text-[10px] block ${k.good ? "text-status-ok" : "text-status-critical"}`}>{k.trend} vs last shift</span>
              )}
            </div>
          ))}
        </div>

        {/* Mini floor map */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Station Map</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "CNC-01", c: "bg-status-ok" }, { id: "CNC-02", c: "bg-status-ok" },
              { id: "LATHE-01", c: "bg-status-warning" }, { id: "LATHE-02", c: "bg-status-warning" },
              { id: "MILL-01", c: "bg-status-ok" }, { id: "MILL-02", c: "bg-status-ok" },
              { id: "MILL-03", c: "bg-muted-foreground" }, { id: "CNC-04", c: "bg-status-critical" },
            ].map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-muted/30 border border-border">
                <span className={`w-2 h-2 rounded-full ${s.c}`} />
                <span className="text-[10px] font-medium">{s.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live feed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity Feed</span>
            <Badge variant="outline" className="text-[10px] gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-ok animate-pulse" />
              Live
            </Badge>
          </div>
          <div className="space-y-1.5">
            {liveFeed.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-[10px] text-muted-foreground shrink-0 w-14 pt-0.5">{e.time}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${typeColors[e.type]} mt-1.5 shrink-0`} />
                <span className="text-muted-foreground">{e.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppWindowChrome>
  );
}

import { Badge } from "@/components/ui/badge";
import { AppWindowChrome } from "./AppWindowChrome";

const machines = [
  { id: "CNC-01", type: "CNC Mill", model: "Haas VF-2SS", status: "Running", color: "bg-status-ok", job: "WO-1847", op: "Op 20 — Finish Mill", tool: "T3 — 1/2\" EM", rpm: "8,500", feed: "45 ipm" },
  { id: "LATHE-02", type: "CNC Lathe", model: "Mazak QT-250", status: "Setup", color: "bg-status-warning", job: "WO-1852", op: "Op 10 — Rough Turn", tool: "T1 — CNMG Insert", rpm: "—", feed: "—" },
  { id: "MILL-03", type: "VMC", model: "Doosan DNM 500", status: "Idle", color: "bg-muted-foreground", job: "—", op: "Awaiting assignment", tool: "—", rpm: "—", feed: "—" },
  { id: "CNC-04", type: "5-Axis", model: "DMG MORI DMU 50", status: "Down", color: "bg-status-critical", job: "WO-1839", op: "Op 30 — Contour", tool: "T7 — Ball Nose", rpm: "—", feed: "—" },
];

export function MockShopFloorView() {
  return (
    <AppWindowChrome title="JobLine — Shop Floor · 4 Stations">
      <div className="space-y-4 text-sm">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Machine Overview</span>
            <div className="flex gap-1.5">
              {[
                { c: "bg-green-500", n: 4 },
                { c: "bg-yellow-500", n: 2 },
                { c: "bg-muted-foreground", n: 1 },
                { c: "bg-red-500", n: 1 },
              ].map((s) => (
                <span key={s.c} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.c}`} /> {s.n}
                </span>
              ))}
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">2nd Shift</Badge>
        </div>

        {/* Machine cards */}
        <div className="space-y-2">
          {machines.map((m) => (
            <div key={m.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex-shrink-0 w-20">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${m.color}`} />
                  <span className="font-semibold text-xs">{m.id}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{m.type}</div>
                <div className="text-[10px] text-muted-foreground">{m.model}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{m.job}</span>
                  <span className="text-[10px] text-muted-foreground">{m.op}</span>
                </div>
                {m.status === "Running" && (
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span>Tool: <span className="text-foreground">{m.tool}</span></span>
                    <span>RPM: <span className="text-foreground">{m.rpm}</span></span>
                    <span>Feed: <span className="text-foreground">{m.feed}</span></span>
                  </div>
                )}
                {m.status === "Setup" && (
                  <div className="text-[10px] text-muted-foreground">
                    Loading tool: <span className="text-foreground">{m.tool}</span> · Est. 12 min remaining
                  </div>
                )}
                {m.status === "Down" && (
                  <div className="text-[10px] text-red-400">⚠ Spindle alarm — maintenance notified 14 min ago</div>
                )}
              </div>
              <Badge
                variant={m.status === "Running" ? "default" : m.status === "Down" ? "destructive" : "secondary"}
                className="text-[10px] px-1.5 py-0 shrink-0"
              >
                {m.status}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>4 stations · 3 operators on floor</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </AppWindowChrome>
  );
}

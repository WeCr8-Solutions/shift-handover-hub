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

const alerts = [
  { type: "overdue", label: "OVERDUE", wo: "WO-1839", part: "CVR-900", station: "CNC-04", note: "Machine down — spindle alarm since 2:15 PM", color: "text-red-400" },
  { type: "at-risk", label: "AT RISK", wo: "WO-1847", part: "BRKT-4510", station: "CNC-01", note: "Due tomorrow — 58 parts remaining, tolerance trending high", color: "text-yellow-400" },
  { type: "blocked", label: "BLOCKED", wo: "WO-1855", part: "SHAFT-220", station: "—", note: "Waiting on outside processing (heat treat) — ETA unknown", color: "text-orange-400" },
];

const floorSummary = [
  { label: "Running", count: 4, color: "bg-green-500" },
  { label: "Setup", count: 2, color: "bg-yellow-500" },
  { label: "Down", count: 1, color: "bg-red-500" },
  { label: "Idle", count: 1, color: "bg-muted-foreground" },
];

export function MockExpeditorDashboard() {
  return (
    <AppWindowChrome title="JobLine — Expeditor Dashboard">
      <div className="space-y-4 text-sm">
        {/* Floor summary bar */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Floor Status</span>
          <div className="flex-1 flex h-3 rounded-full overflow-hidden">
            {floorSummary.map((s) => (
              <div key={s.label} className={`${s.color}`} style={{ flex: s.count }} />
            ))}
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            {floorSummary.map((s) => (
              <span key={s.label} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                {s.count} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Priority alerts */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Priority Alerts</div>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.wo} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${a.color} border-current shrink-0`}>
                  {a.label}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs">{a.wo}</span>
                    <span className="text-xs text-muted-foreground">{a.part}</span>
                    {a.station !== "—" && (
                      <span className="text-[10px] text-muted-foreground">@ {a.station}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>3 alerts · 12 active jobs · 8 stations monitored</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </AppWindowChrome>
  );
}

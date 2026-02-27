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

const kpis = [
  { label: "Parts Complete Today", value: "347", change: "+12%", up: true },
  { label: "On-Time Delivery", value: "94%", change: "+3%", up: true },
  { label: "Scrap Rate", value: "1.2%", change: "-0.4%", up: false },
  { label: "Machine Utilization", value: "78%", change: "+5%", up: true },
];

const shiftSummary = [
  { shift: "1st Shift (6am–2pm)", lead: "M. Torres", stations: 8, active: 7, issues: 0 },
  { shift: "2nd Shift (2pm–10pm)", lead: "S. Chen", stations: 8, active: 6, issues: 1 },
  { shift: "3rd Shift (10pm–6am)", lead: "R. Patel", stations: 5, active: 4, issues: 0 },
];

export function MockOversightKPIs() {
  return (
    <AppWindowChrome title="JobLine — Shop Owner Dashboard">
      <div className="space-y-4 text-sm">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg bg-muted/40 p-3 border border-border">
              <div className="text-[10px] text-muted-foreground mb-1">{k.label}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">{k.value}</span>
                <span className={`text-[10px] font-medium ${k.label === "Scrap Rate" ? "text-green-400" : k.up ? "text-green-400" : "text-red-400"}`}>
                  {k.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Shift overview */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shift Overview</div>
          <div className="space-y-2">
            {shiftSummary.map((s) => (
              <div key={s.shift} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                <div>
                  <span className="text-xs font-medium">{s.shift}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">Lead: {s.lead}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-muted-foreground">{s.active}/{s.stations} stations active</span>
                  {s.issues > 0 ? (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-3.5">{s.issues} alert</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-3.5 text-green-400">Clear</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Updated 30 seconds ago · Viewing as: <strong className="text-foreground">Shop Owner</strong>
        </div>
      </div>
    </AppWindowChrome>
  );
}

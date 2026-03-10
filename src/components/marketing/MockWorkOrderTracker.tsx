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

const routingSteps = [
  { op: "Op 10", name: "Rough Turn", station: "LATHE-02", status: "complete", parts: "200/200" },
  { op: "Op 20", name: "Finish Mill", station: "CNC-01", status: "in-progress", parts: "142/200" },
  { op: "Op 30", name: "Deburr", station: "BENCH-01", status: "pending", parts: "—" },
  { op: "Op 40", name: "Heat Treat", station: "OUTSIDE", status: "pending", parts: "—" },
  { op: "Op 50", name: "Final Inspect", station: "QA-01", status: "pending", parts: "—" },
];

const statusStyles: Record<string, { dot: string; text: string; label: string }> = {
  complete: { dot: "bg-status-ok", text: "text-status-ok", label: "Complete" },
  "in-progress": { dot: "bg-status-waiting", text: "text-status-waiting", label: "In Progress" },
  pending: { dot: "bg-muted-foreground/50", text: "text-muted-foreground", label: "Pending" },
};

export function MockWorkOrderTracker() {
  return (
    <AppWindowChrome title="JobLine — Work Order Detail · WO-1847">
      <div className="space-y-4 text-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-base">WO-1847</span>
            <span className="text-muted-foreground ml-2 text-xs">BRKT-4510 Rev C</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="destructive" className="text-[10px]">Rush</Badge>
            <Badge variant="outline" className="text-[10px]">Due: Mar 1</Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">40%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "40%" }} />
          </div>
        </div>

        {/* Routing steps */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Routing</div>
          <div className="space-y-1">
            {routingSteps.map((step, i) => {
              const s = statusStyles[step.status];
              return (
                <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border ${step.status === "in-progress" ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}>
                  {/* Step connector */}
                  <div className="flex flex-col items-center w-5 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    {i < routingSteps.length - 1 && (
                      <span className="w-px h-3 bg-border mt-0.5" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div>
                      <span className="text-xs font-medium">{step.op} — {step.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">@ {step.station}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {step.parts !== "—" && (
                        <span className="text-[10px] text-muted-foreground">{step.parts}</span>
                      )}
                      <span className={`text-[10px] font-medium ${s.text}`}>{s.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1">
          <span>Customer: <span className="text-foreground font-medium">Precision Parts Inc.</span></span>
          <span>Qty: <span className="text-foreground font-medium">200</span></span>
          <span>Material: <span className="text-foreground font-medium">6061-T6 Al</span></span>
        </div>
      </div>
    </AppWindowChrome>
  );
}

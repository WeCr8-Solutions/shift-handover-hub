import { Badge } from "@/components/ui/badge";

function AppWindowChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden max-w-sm mx-auto">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
          <div className="w-3 h-3 rounded-full bg-green-400/60" />
        </div>
        <span className="text-xs text-muted-foreground ml-2 font-medium">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function MockOperatorView() {
  return (
    <AppWindowChrome title="JobLine — Operator (Mobile)">
      <div className="space-y-3 text-sm">
        {/* Station header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">CNC-01</div>
            <div className="text-[10px] text-muted-foreground">Checked in · 2nd Shift</div>
          </div>
          <Badge className="text-[10px] bg-status-ok/20 text-status-ok border-status-ok/30">Running</Badge>
        </div>

        {/* Current job */}
        <div className="rounded-lg bg-muted/40 p-3 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Current Job</span>
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-3.5">Rush</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Work Order</span>
              <span className="font-medium">WO-1847</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Part</span>
              <span className="font-medium">BRKT-4510 Rev C</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Operation</span>
              <span className="font-medium">Op 20 — Finish Mill</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Progress</span>
              <span className="font-medium">142 / 200</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-lg bg-primary/10 border border-primary/30 p-2.5 text-center text-xs font-medium text-primary">
            Update Count
          </button>
          <button className="rounded-lg bg-muted/40 border border-border p-2.5 text-center text-xs font-medium text-foreground">
            Log Issue
          </button>
        </div>

        {/* Incoming handoff note */}
        <div className="rounded-lg bg-status-warning/10 border border-status-warning/20 p-2.5">
          <div className="text-[10px] font-semibold text-status-warning mb-1">📋 Handoff Note from 1st Shift</div>
          <div className="text-xs text-foreground">OD tolerance trending high — verify offset before resuming. Tool #3 insert changed at part 130.</div>
          <div className="text-[10px] text-muted-foreground mt-1">— Mike Torres, 2:00 PM</div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 rounded-lg bg-muted/40 border border-border p-2 text-center text-[10px] font-medium text-muted-foreground">
            Submit Improvement
          </button>
          <button className="flex-1 rounded-lg bg-muted/40 border border-border p-2 text-center text-[10px] font-medium text-muted-foreground">
            End-of-Shift Handoff
          </button>
        </div>
      </div>
    </AppWindowChrome>
  );
}

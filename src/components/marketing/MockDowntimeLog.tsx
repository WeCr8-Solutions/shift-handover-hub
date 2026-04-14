import { Wrench, Clock, AlertTriangle } from "lucide-react";

export function MockDowntimeLog() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg max-w-md mx-auto">
      <h3 className="font-semibold text-lg mb-4">Maintenance Log</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Wrench className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-foreground">CNC Lathe #3 — Belt replacement</p>
            <p className="text-xs text-muted-foreground">Completed · 45 min downtime</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-foreground">Mill #7 — Spindle inspection due</p>
            <p className="text-xs text-muted-foreground">Scheduled · Apr 18</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-foreground">Press Brake — Hydraulic leak</p>
            <p className="text-xs text-muted-foreground">Overdue · 2 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

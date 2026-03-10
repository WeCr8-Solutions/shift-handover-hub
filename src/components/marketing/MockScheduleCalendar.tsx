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

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const jobs = [
  { wo: "WO-1847", part: "BRKT-4510", day: 0, span: 3, pri: "Rush", color: "bg-status-critical/20 border-status-critical/40 text-status-critical" },
  { wo: "WO-1855", part: "SHAFT-220", day: 1, span: 2, pri: "High", color: "bg-primary/20 border-primary/40 text-primary" },
  { wo: "WO-1860", part: "HSG-110", day: 3, span: 2, pri: "Normal", color: "bg-muted border-border text-foreground" },
  { wo: "WO-1852", part: "FLNG-300", day: 0, span: 2, pri: "Normal", color: "bg-muted border-border text-foreground" },
  { wo: "WO-1858", part: "PIN-070", day: 2, span: 3, pri: "High", color: "bg-primary/20 border-primary/40 text-primary" },
  { wo: "WO-1863", part: "CVR-410", day: 4, span: 1, pri: "Normal", color: "bg-muted border-border text-foreground" },
];

const stations = ["CNC-01", "LATHE-02", "MILL-03"];

export function MockScheduleCalendar() {
  return (
    <AppWindowChrome title="JobLine — Production Schedule (Week View)">
      <div className="space-y-3">
        {/* Day headers */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1">
          <div />
          {days.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Station rows */}
        {stations.map((station, si) => {
          const stationJobs = jobs.filter((_, i) => i % 3 === si);
          return (
            <div key={station} className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 items-center">
              <div className="text-xs font-semibold text-foreground">{station}</div>
              {days.map((_, di) => {
                const job = stationJobs.find((j) => j.day === di);
                if (job) {
                  return (
                    <div
                      key={di}
                      className={`rounded-md border p-1.5 ${job.color}`}
                      style={{ gridColumn: `span ${Math.min(job.span, 5 - di)}` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold">{job.wo}</span>
                        <Badge
                          variant={job.pri === "Rush" ? "destructive" : job.pri === "High" ? "default" : "secondary"}
                          className="text-[9px] px-1 py-0 h-3.5"
                        >
                          {job.pri}
                        </Badge>
                      </div>
                      <div className="text-[10px] opacity-80">{job.part}</div>
                    </div>
                  );
                }
                // Check if this cell is covered by a spanning job
                const covered = stationJobs.some((j) => di > j.day && di < j.day + j.span);
                if (covered) return null;
                return <div key={di} className="h-10 rounded-md bg-muted/20 border border-border/30" />;
              })}
            </div>
          );
        })}

        <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/40" /> Rush</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/40" /> High Priority</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted" /> Normal</span>
          <span className="ml-auto">Drag to reschedule</span>
        </div>
      </div>
    </AppWindowChrome>
  );
}

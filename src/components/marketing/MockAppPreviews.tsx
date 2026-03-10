import { Badge } from "@/components/ui/badge";

/* ── Shared app-window chrome ─────────────────────────── */

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

/* ── 1. MockHandoffForm ───────────────────────────────── */

export function MockHandoffForm() {
  return (
    <AppWindowChrome title="JobLine — Shift Handoff Form">
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base">CNC-01 · End-of-Shift Handoff</span>
          <Badge variant="outline" className="text-xs">1st → 2nd Shift</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Outgoing Operator" value="D. Martinez" />
          <Field label="Incoming Operator" value="Mike Torres" />
          <Field label="Work Order" value="WO-2024-1847" />
          <Field label="Part Number" value="BRKT-4510 Rev C" />
        </div>

        <div className="flex items-center gap-3">
          <StatusPill color="bg-status-ok" label="Running" />
          <span className="text-muted-foreground">Op 20 — Finish Mill</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Metric label="Parts Complete" value="142 / 200" />
          <Metric label="Scrap" value="2" />
          <Metric label="Rework" value="0" />
        </div>

        <div className="rounded-lg bg-muted/40 p-3 border border-border">
          <span className="text-xs font-medium text-muted-foreground block mb-1">Quality Notes</span>
          <span className="text-foreground">OD tolerance trending high on last 5 parts — verify offset before resuming. Tool #3 insert changed at part 130.</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Dims verified ✓</span>
          <div className="h-2 w-2 rounded-full bg-green-500 ml-3" />
          <span className="text-xs text-muted-foreground">Material ready ✓</span>
        </div>
      </div>
    </AppWindowChrome>
  );
}

/* ── 2. MockStationDashboard ──────────────────────────── */

const stations = [
  { id: "CNC-01", status: "Running", color: "bg-status-ok", operator: "M. Torres", job: "WO-1847", parts: "142/200" },
  { id: "LATHE-02", status: "Setup", color: "bg-status-warning", operator: "J. Kim", job: "WO-1852", parts: "0/80" },
  { id: "MILL-03", status: "Idle", color: "bg-muted-foreground", operator: "—", job: "—", parts: "—" },
  { id: "CNC-04", status: "Down", color: "bg-status-critical", operator: "R. Patel", job: "WO-1839", parts: "67/150" },
];

export function MockStationDashboard() {
  return (
    <AppWindowChrome title="JobLine — Station Dashboard">
      <div className="grid grid-cols-2 gap-3">
        {stations.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{s.id}</span>
              <StatusPill color={s.color} label={s.status} />
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Operator: <span className="text-foreground">{s.operator}</span></div>
              <div>Job: <span className="text-foreground">{s.job}</span></div>
              <div>Parts: <span className="text-foreground">{s.parts}</span></div>
            </div>
          </div>
        ))}
      </div>
    </AppWindowChrome>
  );
}

/* ── 3. MockQueueBoard ────────────────────────────────── */

const columns = [
  { title: "Queued", items: [{ wo: "WO-1855", part: "SHAFT-220", pri: "High", due: "Mar 3" }, { wo: "WO-1860", part: "HSG-110", pri: "Normal", due: "Mar 5" }] },
  { title: "In Progress", items: [{ wo: "WO-1847", part: "BRKT-4510", pri: "Rush", due: "Mar 1" }, { wo: "WO-1852", part: "FLNG-300", pri: "Normal", due: "Mar 4" }] },
  { title: "Complete", items: [{ wo: "WO-1840", part: "PIN-050", pri: "Normal", due: "Feb 28" }, { wo: "WO-1838", part: "CVR-900", pri: "High", due: "Feb 27" }] },
];

export function MockQueueBoard() {
  return (
    <AppWindowChrome title="JobLine — Work Order Queue">
      <div className="grid grid-cols-3 gap-3">
        {columns.map((col) => (
          <div key={col.title} className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.title} ({col.items.length})</div>
            {col.items.map((item) => (
              <div key={item.wo} className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{item.wo}</span>
                  <Badge variant={item.pri === "Rush" ? "destructive" : item.pri === "High" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {item.pri}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{item.part}</div>
                <div className="text-[10px] text-muted-foreground">Due: {item.due}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </AppWindowChrome>
  );
}

/* ── 4. MockDowntimeLog ───────────────────────────────── */

const downtimeRows = [
  { station: "CNC-04", reason: "Spindle Alarm", type: "Unplanned", dur: "47 min", resolved: true },
  { station: "MILL-03", reason: "Tool Change", type: "Planned", dur: "12 min", resolved: true },
  { station: "LATHE-02", reason: "Material Wait", type: "Unplanned", dur: "23 min", resolved: true },
  { station: "CNC-01", reason: "Program Edit", type: "Planned", dur: "8 min", resolved: false },
];

export function MockDowntimeLog() {
  return (
    <AppWindowChrome title="JobLine — Downtime Log">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 font-medium">Station</th>
              <th className="text-left py-2 font-medium">Reason Code</th>
              <th className="text-left py-2 font-medium">Type</th>
              <th className="text-left py-2 font-medium">Duration</th>
              <th className="text-left py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {downtimeRows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2 font-medium text-foreground">{r.station}</td>
                <td className="py-2 text-foreground">{r.reason}</td>
                <td className="py-2">
                  <Badge variant={r.type === "Unplanned" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {r.type}
                  </Badge>
                </td>
                <td className="py-2 text-foreground">{r.dur}</td>
                <td className="py-2">
                  <span className={`inline-flex items-center gap-1 ${r.resolved ? "text-status-ok" : "text-status-warning"}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${r.resolved ? "bg-status-ok" : "bg-status-warning"}`} />
                    {r.resolved ? "Resolved" : "Active"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppWindowChrome>
  );
}

/* ── 5. MockTeamPanel ─────────────────────────────────── */

export function MockTeamPanel() {
  return (
    <AppWindowChrome title="JobLine — Team Management">
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Precision Parts Inc.</div>
            <div className="text-xs text-muted-foreground">Organization · 3 teams · 18 members</div>
          </div>
          <Badge className="text-[10px]">Pro Plan</Badge>
        </div>

        <div className="space-y-2">
          {[
            { team: "Day Shift", members: 8, lead: "Mike Torres" },
            { team: "Swing Shift", members: 6, lead: "Sarah Chen" },
            { team: "Night Shift", members: 4, lead: "Raj Patel" },
          ].map((t) => (
            <div key={t.team} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
              <div>
                <span className="font-medium text-xs">{t.team}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{t.members} members · Lead: {t.lead}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">Active</Badge>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
          <div className="text-xs">
            <span className="font-medium">QR Invite</span>
            <span className="text-muted-foreground ml-2">Scan to join — expires in 15 days</span>
          </div>
          <div className="w-10 h-10 bg-foreground/10 rounded grid place-items-center">
            <div className="w-7 h-7 border-2 border-foreground/30 rounded-sm grid grid-cols-3 gap-px p-0.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`rounded-[1px] ${[0,2,3,6,8].includes(i) ? "bg-foreground/40" : "bg-transparent"}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">Seats used: <span className="text-foreground font-medium">18 / 25</span></div>
      </div>
    </AppWindowChrome>
  );
}

/* ── 6. MockQualityCard ───────────────────────────────── */

export function MockQualityCard() {
  return (
    <AppWindowChrome title="JobLine — Non-Conformance Report">
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold">NCR-2024-0089</span>
          <div className="flex gap-2">
            <Badge variant="destructive" className="text-[10px]">Major</Badge>
            <Badge variant="outline" className="text-[10px]">Under Review</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Work Order" value="WO-1847" />
          <Field label="Part Number" value="BRKT-4510 Rev C" />
          <Field label="Station" value="CNC-01" />
          <Field label="Reported By" value="M. Torres" />
        </div>

        <div className="rounded-lg bg-muted/40 p-3 border border-border">
          <span className="text-xs font-medium text-muted-foreground block mb-1">Description</span>
          <span className="text-foreground">OD dimension out of tolerance on parts 68-72. Measured 1.2520" vs spec 1.2500" ±.0010". Suspected tool wear after insert change at part 65.</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Disposition</span>
            <Badge variant="secondary" className="text-[10px]">Rework</Badge>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Corrective Action</span>
            <span className="text-xs text-foreground">Verify tool offset after every insert change. Add to setup checklist.</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Qty Affected: <strong className="text-foreground">5</strong></span>
          <span>Scrap: <strong className="text-foreground">0</strong></span>
          <span>Rework: <strong className="text-foreground">5</strong></span>
        </div>
      </div>
    </AppWindowChrome>
  );
}

/* ── Tiny helpers ─────────────────────────────────────── */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2 text-center border border-border">
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function StatusPill({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

import { Badge } from "@/components/ui/badge";
import { AppWindowChrome } from "./AppWindowChrome";

const handoffs = [
  {
    station: "CNC-01",
    shift: "1st → 2nd",
    time: "2:55 PM",
    outgoing: "D. Martinez",
    incoming: "M. Torres",
    job: "WO-1847 · BRKT-4510",
    parts: "98 → 142",
    status: "complete",
    notes: "Tool #3 insert changed at part 130. OD trending high.",
    verified: true,
  },
  {
    station: "LATHE-02",
    shift: "1st → 2nd",
    time: "3:02 PM",
    outgoing: "T. Nguyen",
    incoming: "J. Kim",
    job: "WO-1852 · FLNG-300",
    parts: "80 → 0 (new job)",
    status: "complete",
    notes: "New setup required. Program verified, material staged.",
    verified: true,
  },
  {
    station: "CNC-04",
    shift: "1st → 2nd",
    time: "3:10 PM",
    outgoing: "A. Singh",
    incoming: "R. Patel",
    job: "WO-1839 · CVR-900",
    parts: "67/150",
    status: "flagged",
    notes: "Machine went down at 1:45 PM — spindle alarm. Maintenance called.",
    verified: false,
  },
  {
    station: "MILL-03",
    shift: "1st → 2nd",
    time: "—",
    outgoing: "—",
    incoming: "—",
    job: "—",
    parts: "—",
    status: "pending",
    notes: "Station idle — no handoff needed",
    verified: false,
  },
];

export function MockShiftTimeline() {
  return (
    <AppWindowChrome title="JobLine — Shift Change Log · Feb 27">
      <div className="space-y-4 text-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">1st → 2nd Shift Transition</span>
            <span className="text-xs text-muted-foreground ml-2">4 stations</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="text-[10px]">3 Complete</Badge>
            <Badge variant="destructive" className="text-[10px]">1 Flagged</Badge>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {handoffs.map((h, i) => (
            <div key={i} className={`p-3 rounded-lg border ${
              h.status === "flagged" ? "bg-status-critical/5 border-status-critical/20" :
              h.status === "pending" ? "bg-muted/20 border-border/50" :
              "bg-muted/30 border-border"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs">{h.station}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{h.shift}</Badge>
                  {h.time !== "—" && (
                    <span className="text-[10px] text-muted-foreground">{h.time}</span>
                  )}
                </div>
                {h.status === "complete" && (
                  <span className="text-[10px] text-status-ok flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-ok" /> Verified
                  </span>
                )}
                {h.status === "flagged" && (
                  <span className="text-[10px] text-status-critical flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-critical" /> Needs Attention
                  </span>
                )}
                {h.status === "pending" && (
                  <span className="text-[10px] text-muted-foreground">No handoff</span>
                )}
              </div>

              {h.status !== "pending" && (
                <>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-1">
                    <span>{h.outgoing} → {h.incoming}</span>
                    <span>{h.job}</span>
                    <span>Parts: {h.parts}</span>
                  </div>
                  <div className={`text-[10px] ${h.status === "flagged" ? "text-status-critical" : "text-muted-foreground"}`}>
                    {h.notes}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>Avg handoff time: 4.2 min · Supervisor: Karen White ✓</span>
          <span>Completed at 3:15 PM</span>
        </div>
      </div>
    </AppWindowChrome>
  );
}

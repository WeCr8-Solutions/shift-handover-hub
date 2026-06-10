import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Loader2 } from "lucide-react";
import { useStationMachineMatrix } from "@/hooks/useStationMachineMatrix";

const NONE = "__none__";

function purchaseLabel(p: { machine?: { manufacturer?: string | null; model?: string | null; machine_type?: string | null } | null }) {
  const m = p.machine;
  if (!m) return "Purchased machine";
  return [m.manufacturer, m.model].filter(Boolean).join(" ") || m.machine_type || "Purchased machine";
}

interface Props {
  organizationId: string | null;
}

export function StationMachineMatrix({ organizationId }: Props) {
  const { query, assign } = useStationMachineMatrix(organizationId);
  const { stations = [], purchases = [], assignments = [] } = query.data ?? {};
  const assignedByStation = useMemo(() => {
    const m = new Map<string, string>();
    assignments.forEach((a) => m.set(a.station_id, a.purchase_id));
    return m;
  }, [assignments]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="w-4 h-4" /> Station ↔ machine assignments
              <Badge variant="secondary" className="text-[10px]">{stations.length}</Badge>
            </CardTitle>
            <CardDescription>
              Each station holds one purchased machine at a time. Picking a different one replaces the existing assignment.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}
        {!query.isLoading && stations.length === 0 && (
          <div className="border border-dashed rounded-md p-6 text-center text-xs text-muted-foreground">
            No stations yet. Add stations in the Stations tab first.
          </div>
        )}
        {!query.isLoading && stations.length > 0 && purchases.length === 0 && (
          <div className="border border-dashed rounded-md p-4 text-center text-xs text-muted-foreground mb-3">
            No purchased machines yet. The org marketplace must contain at least one active purchase before assignments can be made.
          </div>
        )}

        <div className="space-y-2">
          {stations.map((s) => {
            const current = assignedByStation.get(s.id) ?? "";
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 border rounded-md p-3">
                <div className="flex-1 min-w-[10rem]">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {s.station_id} · {s.work_center}
                  </div>
                </div>
                <Select
                  value={current === "" ? NONE : current}
                  onValueChange={(v) =>
                    assign.mutate({ stationId: s.id, purchaseId: v === NONE ? null : v })
                  }
                  disabled={assign.isPending}
                >
                  <SelectTrigger className="w-72 h-8 text-xs"><SelectValue placeholder="No machine assigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE} className="text-xs">— No machine —</SelectItem>
                    {purchases.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{purchaseLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

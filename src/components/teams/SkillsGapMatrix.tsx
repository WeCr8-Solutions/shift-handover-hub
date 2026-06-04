/**
 * SkillsGapMatrix — supervisor view rendering operators (rows) by stations
 * (columns) with a coverage heatmap. Empty columns are highlighted as
 * uncovered work centers; low-coverage columns (only 1 trained operator) are
 * flagged as bus-factor risks.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, XCircle, Search } from "lucide-react";
import { useSkillsGapMatrix } from "@/hooks/useSkillsGapMatrix";

const PROF_COLOR: Record<string, string> = {
  beginner: "bg-status-waiting/20 text-status-waiting border-status-waiting/30",
  intermediate: "bg-primary/15 text-primary border-primary/30",
  advanced: "bg-status-ok/20 text-status-ok border-status-ok/30",
  expert: "bg-status-ok/30 text-status-ok border-status-ok/40 font-semibold",
};

export function SkillsGapMatrix() {
  const { data, isLoading } = useSkillsGapMatrix();
  const [filter, setFilter] = useState("");

  const filteredOperators = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data.operators;
    return data.operators.filter((o) => o.display_name.toLowerCase().includes(q));
  }, [data, filter]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.operators.length === 0 || data.stations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Add team members and stations to see your skills-gap matrix.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="skills-gap-matrix">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">Skills-Gap Matrix</CardTitle>
            <CardDescription>
              Coverage of every active station by your operators. Matches use station
              <code className="mx-1 px-1 rounded bg-muted text-xs">work_center_type</code> against operator skills.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="gap-1 border-status-error/40 text-status-error">
              <XCircle className="h-3 w-3" /> {data.totalGaps} uncovered
            </Badge>
            <Badge variant="outline" className="gap-1 border-status-waiting/40 text-status-waiting">
              <AlertTriangle className="h-3 w-3" />{" "}
              {Object.values(data.coverage).filter((c) => c === 1).length} single-operator
            </Badge>
            <Badge variant="outline" className="gap-1 border-status-ok/40 text-status-ok">
              <CheckCircle2 className="h-3 w-3" />{" "}
              {Object.values(data.coverage).filter((c) => c >= 2).length} resilient
            </Badge>
          </div>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter operators…"
            className="pl-8 h-8 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/40 sticky top-0">
                <th className="text-left p-2 border-b border-r min-w-[180px] sticky left-0 bg-muted/40 z-10">
                  Operator
                </th>
                {data.stations.map((s) => {
                  const cov = data.coverage[s.id] ?? 0;
                  const tone =
                    cov === 0 ? "text-status-error" : cov === 1 ? "text-status-waiting" : "text-status-ok";
                  return (
                    <th key={s.id} className="text-left p-2 border-b border-r whitespace-nowrap">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">{s.work_center_type}</div>
                      <div className={`text-[10px] mt-0.5 ${tone}`}>{cov} trained</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredOperators.map((op) => (
                <tr key={op.user_id} className="hover:bg-muted/20">
                  <td className="p-2 border-b border-r sticky left-0 bg-background z-10">
                    <div className="font-medium">{op.display_name}</div>
                    <div className="text-[10px] text-muted-foreground">{op.skills.length} skills logged</div>
                  </td>
                  {data.stations.map((s) => {
                    const cell = data.cells[`${op.user_id}::${s.id}`];
                    return (
                      <td key={s.id} className="p-2 border-b border-r text-center">
                        {cell?.has ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${PROF_COLOR[cell.proficiency ?? "intermediate"] ?? ""}`}
                          >
                            {cell.proficiency ?? "yes"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

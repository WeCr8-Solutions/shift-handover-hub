import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useWOPerformance, type WOPerformanceRow } from "@/hooks/useWOPerformance";
import { useCurrentTeam } from "@/contexts/TeamContext";

const scheduleVariant: Record<WOPerformanceRow["schedule_status"], string> = {
  on_time: "bg-status-ok/10 text-status-ok border-status-ok/30",
  on_track: "bg-status-ok/10 text-status-ok border-status-ok/30",
  late: "bg-warning/10 text-warning border-warning/30",
  at_risk: "bg-warning/10 text-warning border-warning/30",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

export default function WorkOrderPerformance() {
  const { currentTeam } = useCurrentTeam();
  const { rows, loading, error, refresh } = useWOPerformance({ teamId: currentTeam?.id, limit: 200 });

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Helmet>
        <title>Work Order Performance | JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link to="/work-orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Work Orders
          </Link>
          <h1 className="text-2xl font-bold mt-1">WO Performance</h1>
          <p className="text-sm text-muted-foreground">
            Live cycle, setup variance, and schedule status across open work orders.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Open work orders {rows.length > 0 && <span className="text-muted-foreground font-normal">({rows.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No open work orders.</p>
          ) : (
            <ScrollArea className="h-[640px] pr-3">
              <ul className="space-y-2">
                {rows.map((r) => (
                  <li key={r.queue_item_id} className="rounded-md border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-mono text-sm truncate">
                          {r.work_order || "—"}
                          {r.part_number && <span className="text-muted-foreground"> · {r.part_number}</span>}
                          {r.operation_number && <span className="text-muted-foreground"> · op {r.operation_number}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.station_name || "Unassigned"}
                          {r.current_operator_name && ` · ${r.current_operator_name}`}
                          {r.current_phase && ` · ${r.current_phase}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={scheduleVariant[r.schedule_status]}>
                          {r.schedule_status.replace("_", " ")}
                        </Badge>
                        {r.priority && (
                          <Badge variant="secondary" className="text-xs capitalize">{r.priority}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Completion</p>
                        <div className="flex items-center gap-2">
                          <Progress value={r.pct_complete} className="h-1.5" />
                          <span className="font-mono">{Math.round(r.pct_complete)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Qty (done/total)</p>
                        <p className="font-mono">{r.qty_completed ?? 0}/{r.qty_original ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Setup variance</p>
                        <p className="font-mono">
                          {r.setup_variance_pct == null ? "—" : `${r.setup_variance_pct > 0 ? "+" : ""}${Math.round(r.setup_variance_pct)}%`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due</p>
                        <p className="font-mono">
                          {r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

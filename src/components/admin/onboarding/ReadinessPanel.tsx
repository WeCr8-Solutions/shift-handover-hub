import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { useProductionReadiness } from "@/hooks/useOnboardingEngagements";

const COUNT_LABELS: Record<string, string> = {
  departments: "Departments",
  stations: "Active stations",
  equipment: "Equipment",
  admins: "Org admins",
  operators: "Operators/supervisors",
  routing_templates: "Routing templates",
  branding: "Branding",
  subscriptions: "Active subscription",
  erp_connections: "ERP connections",
};

export function ReadinessPanel({ organizationId }: { organizationId: string }) {
  const { data, isLoading, refetch, isFetching } = useProductionReadiness(organizationId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking live data...
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  const ready = data.ready;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {ready ? <ShieldCheck className="w-4 h-4 text-status-ok" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
          Production readiness ({ready ? "ready" : "blocked"})
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-auto text-xs underline text-muted-foreground"
            disabled={isFetching}
          >
            {isFetching ? "Re-checking..." : "Re-check"}
          </button>
        </CardTitle>
        <CardDescription className="text-xs">
          Live counts pulled from the customer's database. Activation is blocked while any item is missing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(COUNT_LABELS).map(([k, label]) => {
            const v = (data.counts as any)?.[k];
            const ok = typeof v === "number" ? v > 0 : !!v;
            return (
              <div key={k} className="rounded border p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Badge variant={ok ? "secondary" : "outline"} className={ok ? "text-status-ok" : "text-destructive"}>
                  {typeof v === "number" ? v : String(v)}
                </Badge>
              </div>
            );
          })}
          <div className="rounded border p-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ITAR posture</span>
            <Badge variant="outline">{(data.counts as any)?.itar ? "ITAR" : "Standard"}</Badge>
          </div>
          <div className="rounded border p-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ERP persistence</span>
            <Badge variant="outline">{String((data.counts as any)?.erp_persistence_mode ?? "—")}</Badge>
          </div>
        </div>

        {!ready && data.blockers.length > 0 && (
          <div className="rounded border border-destructive/40 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" /> Blockers
            </div>
            <ul className="text-xs space-y-0.5">
              {data.blockers.map((b, i) => (
                <li key={i} className="flex items-start gap-2"><span>•</span>{b}</li>
              ))}
            </ul>
          </div>
        )}
        {ready && (
          <div className="rounded border border-status-ok/40 p-3 text-xs flex items-center gap-2 text-status-ok">
            <CheckCircle2 className="w-4 h-4" /> All required data is present. Ready to activate.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

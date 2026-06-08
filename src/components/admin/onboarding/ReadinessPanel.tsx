import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck, DollarSign, FileSignature, FlaskConical, X } from "lucide-react";
import { useProductionReadiness, type Engagement } from "@/hooks/useOnboardingEngagements";
import { supabase } from "@/integrations/supabase/client";
import { woToast } from "@/lib/woToast";

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
  stations_with_equipment: "Stations w/ equipment",
  members_signed_in: "Members signed in",
  queue_items_with_routing: "Queue items routed",
};

interface SmokeStep { name: string; ok: boolean; detail?: string }

export function ReadinessPanel({ organizationId, engagement }: { organizationId: string; engagement?: Engagement }) {
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

  const paymentOk = engagement ? ["paid", "waived"].includes(engagement.payment_status) : true;
  const contractOk = engagement
    ? engagement.purchased_via === "stripe" ||
      engagement.payment_status === "waived" ||
      !!engagement.contract_signed_at
    : true;
  const ready = data.ready && paymentOk && contractOk;
  const extraBlockers: string[] = [];
  if (engagement && !paymentOk) extraBlockers.push(`Payment status is ${engagement.payment_status}`);
  if (engagement && !contractOk) extraBlockers.push("Signed contract is not on file");
  const allBlockers = [...data.blockers, ...extraBlockers];

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
          {engagement && (
            <>
              <div className="rounded border p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Payment</span>
                <Badge
                  variant="outline"
                  className={paymentOk ? "text-status-ok border-status-ok/40" : "text-destructive border-destructive/40"}
                >
                  {engagement.payment_status}
                </Badge>
              </div>
              <div className="rounded border p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><FileSignature className="w-3 h-3" /> Contract</span>
                <Badge
                  variant="outline"
                  className={contractOk ? "text-status-ok border-status-ok/40" : "text-destructive border-destructive/40"}
                >
                  {engagement.purchased_via === "stripe"
                    ? "N/A (Stripe)"
                    : engagement.contract_signed_at
                      ? "On file"
                      : engagement.payment_status === "waived"
                        ? "Waived"
                        : "Required"}
                </Badge>
              </div>
            </>
          )}
        </div>

        {!ready && allBlockers.length > 0 && (
          <div className="rounded border border-destructive/40 p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" /> Blockers
            </div>
            <ul className="text-xs space-y-0.5">
              {allBlockers.map((b, i) => (
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

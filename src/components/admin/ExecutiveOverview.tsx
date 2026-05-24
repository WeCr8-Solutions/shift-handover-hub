import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Building,
  AlertTriangle,
  CheckCircle2,
  Mail,
  ShieldCheck,
  TrendingDown,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface OrgHealthSnapshot {
  id: string;
  organization_id: string;
  snapshot_date: string;
  active_user_count: number | null;
  work_order_count_30d: number | null;
  subscription_tier: string | null;
  seat_utilization_pct: number | null;
  has_past_due_invoice: boolean;
  policy_acceptance_pct: number | null;
  risk_flags: string[];
  health_score: number | null;
  last_active_at: string | null;
}

interface DeliveryStatusCounts {
  delivered: number;
  bounced: number;
  complained: number;
  failed: number;
  total: number;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  highlight?: "good" | "warn" | "bad";
}) {
  const highlightClass =
    highlight === "good"
      ? "text-green-600"
      : highlight === "warn"
      ? "text-yellow-600"
      : highlight === "bad"
      ? "text-red-600"
      : "";

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold ${highlightClass}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveOverview() {
  const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ["org-health-snapshots-latest"],
    queryFn: async () => {
      // Get the most recent snapshot per org
      const { data, error } = await (supabase as any)
        .from("org_health_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as OrgHealthSnapshot[];
      // Deduplicate to latest per org
      const byOrg = new Map<string, OrgHealthSnapshot>();
      for (const r of rows) {
        if (!byOrg.has(r.organization_id)) byOrg.set(r.organization_id, r);
      }
      return Array.from(byOrg.values());
    },
  });

  const { data: deliveryCounts, isLoading: deliveryLoading } = useQuery({
    queryKey: ["exec-email-delivery-summary"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_delivery_events")
        .select("status");
      if (error) throw error;
      const counts: DeliveryStatusCounts = {
        delivered: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
        total: 0,
      };
      for (const row of (data ?? []) as { status: string }[]) {
        counts.total++;
        if (row.status === "delivered") counts.delivered++;
        else if (row.status === "bounced") counts.bounced++;
        else if (row.status === "complained") counts.complained++;
        else if (row.status === "failed") counts.failed++;
      }
      return counts;
    },
  });

  const { data: openReports } = useQuery({
    queryKey: ["exec-open-abuse-reports"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("talent_abuse_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: policyStats } = useQuery({
    queryKey: ["exec-policy-acceptance-stats"],
    queryFn: async () => {
      const { data: versions, error: vErr } = await (supabase as any)
        .from("policy_versions")
        .select("id")
        .eq("approval_state", "published");
      if (vErr) throw vErr;
      const { data: acceptances, error: aErr } = await (supabase as any)
        .from("policy_acceptances")
        .select("id", { count: "exact", head: true });
      if (aErr) throw aErr;
      return {
        publishedVersions: (versions ?? []).length,
        totalAcceptances: acceptances ?? 0,
      };
    },
  });

  const atRiskOrgs = (snapshots ?? []).filter(
    (s) => s.risk_flags.length > 0 || s.has_past_due_invoice || (s.health_score != null && s.health_score < 5)
  );

  const avgHealth =
    snapshots?.length
      ? (
          (snapshots.reduce((sum, s) => sum + (s.health_score ?? 0), 0) / snapshots.length)
        ).toFixed(1)
      : "—";

  const deliveryRate =
    deliveryCounts && deliveryCounts.total > 0
      ? Math.round((deliveryCounts.delivered / deliveryCounts.total) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Executive Overview</h2>
        <p className="text-sm text-muted-foreground">
          Platform health indicators across legal, billing, email, and talent operations.
        </p>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          icon={<Building className="w-5 h-5" />}
          label="Tracked Orgs"
          value={snapshotsLoading ? "—" : (snapshots?.length ?? 0)}
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="Avg Health Score"
          value={snapshotsLoading ? "—" : avgHealth}
          sub="out of 10"
          highlight={
            avgHealth === "—" ? undefined : parseFloat(avgHealth) >= 7 ? "good" : parseFloat(avgHealth) >= 4 ? "warn" : "bad"
          }
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="At-Risk Orgs"
          value={snapshotsLoading ? "—" : atRiskOrgs.length}
          highlight={atRiskOrgs.length === 0 ? "good" : "bad"}
        />
        <StatCard
          icon={<Mail className="w-5 h-5" />}
          label="Email Delivery"
          value={deliveryLoading ? "—" : deliveryRate != null ? `${deliveryRate}%` : "—"}
          sub={deliveryCounts ? `${deliveryCounts.total} total` : undefined}
          highlight={deliveryRate != null ? (deliveryRate >= 95 ? "good" : deliveryRate >= 85 ? "warn" : "bad") : undefined}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Policy Acceptances"
          value={policyStats?.totalAcceptances ?? "—"}
          sub={policyStats ? `${policyStats.publishedVersions} published versions` : undefined}
          highlight={policyStats?.totalAcceptances ? "good" : undefined}
        />
        <StatCard
          icon={<ShieldCheck className="w-5 h-5" />}
          label="Open Abuse Reports"
          value={openReports ?? "—"}
          highlight={openReports === 0 ? "good" : openReports != null && openReports > 0 ? "bad" : undefined}
        />
      </div>

      {/* At-risk org list */}
      {atRiskOrgs.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              At-Risk Organizations ({atRiskOrgs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Org</th>
                    <th className="px-4 py-2 font-medium">Health</th>
                    <th className="px-4 py-2 font-medium">Tier</th>
                    <th className="px-4 py-2 font-medium">Flags</th>
                    <th className="px-4 py-2 font-medium">Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskOrgs.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{s.organization_id.slice(0, 8)}…</td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={
                            s.health_score == null
                              ? "outline"
                              : s.health_score >= 7
                              ? "default"
                              : s.health_score >= 4
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {s.health_score ?? "—"}/10
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground capitalize">
                        {s.subscription_tier ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {s.has_past_due_invoice && (
                            <Badge variant="destructive" className="text-xs">Past Due</Badge>
                          )}
                          {s.risk_flags.map((f) => (
                            <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {format(new Date(s.snapshot_date), "MMM d")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* All orgs table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Organization Health Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {snapshotsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !snapshots?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No health snapshots yet</p>
              <p className="text-sm mt-1">
                Snapshots are populated by the nightly health-snapshot job (Phase 5).
              </p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <table className="w-full text-sm">
                <thead className="border-b sticky top-0 bg-background">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Org</th>
                    <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Tier</th>
                    <th className="px-4 py-2.5 font-medium">Health</th>
                    <th className="px-4 py-2.5 font-medium hidden md:table-cell">Active Users</th>
                    <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Seat Util.</th>
                    <th className="px-4 py-2.5 font-medium">Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{s.organization_id.slice(0, 8)}…</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground capitalize hidden sm:table-cell">
                        {s.subscription_tier ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={
                            s.health_score == null
                              ? "outline"
                              : s.health_score >= 7
                              ? "default"
                              : s.health_score >= 4
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {s.health_score ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs hidden md:table-cell">
                        {s.active_user_count ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-xs hidden lg:table-cell">
                        {s.seat_utilization_pct != null ? `${s.seat_utilization_pct}%` : "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {format(new Date(s.snapshot_date), "MMM d")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

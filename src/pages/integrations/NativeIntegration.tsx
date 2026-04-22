import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Database, ArrowLeft, Cloud, Plug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { Header } from "@/components/Header";

interface CheckResult {
  label: string;
  ok: boolean;
  detail?: string;
}

export default function NativeIntegration() {
  const { organization } = useOrgContext();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);

  const runHealthCheck = async () => {
    if (!organization?.id) return;
    setRunning(true);
    const out: CheckResult[] = [];

    // 1. Auth session
    const { data: sess } = await supabase.auth.getSession();
    out.push({
      label: "Authenticated session",
      ok: !!sess?.session,
      detail: sess?.session ? `User ${sess.session.user.email}` : "No session",
    });

    // 2. Org access
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organization.id)
      .maybeSingle();
    out.push({
      label: "Organization read access",
      ok: !!org && !orgErr,
      detail: org?.name ?? orgErr?.message,
    });

    // 3. Stations
    const { count: stationCount, error: stErr } = await supabase
      .from("stations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id);
    out.push({
      label: "Stations table reachable",
      ok: !stErr,
      detail: stErr?.message ?? `${stationCount ?? 0} stations`,
    });

    // 4. Queue items
    const { count: qCount, error: qErr } = await supabase
      .from("queue_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id);
    out.push({
      label: "Work orders reachable",
      ok: !qErr,
      detail: qErr?.message ?? `${qCount ?? 0} items in queue`,
    });

    // 5. Realtime subscription
    try {
      const ch = supabase.channel(`health-${Date.now()}`);
      const subbed = await new Promise<boolean>((resolve) => {
        const t = setTimeout(() => resolve(false), 3000);
        ch.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(t);
            resolve(true);
          }
        });
      });
      await supabase.removeChannel(ch);
      out.push({ label: "Realtime channel", ok: subbed, detail: subbed ? "Connected" : "Timeout" });
    } catch (e) {
      out.push({ label: "Realtime channel", ok: false, detail: String(e) });
    }

    setResults(out);
    setRunning(false);
  };

  const allPass = results.length > 0 && results.every((r) => r.ok);

  return (
    <>
      <Helmet>
        <title>Native (Lovable Cloud) Integration · JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="container max-w-4xl py-8 space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/settings">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Settings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Cloud className="w-8 h-8 text-primary" /> Native (Lovable Cloud)
          </h1>
          <p className="text-muted-foreground mt-1">
            Your default workflow — all data stored in Lovable Cloud. No external ERP required.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" /> What this includes
            </CardTitle>
            <CardDescription>Everything you need to run a shop without an ERP integration.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              "Work orders, routing, and queue management",
              "Shift handoffs with attachments",
              "Operator dashboards and station cards",
              "NCRs, FAI, and quality tracking",
              "Real-time station status",
              "AI Planning Assistant",
              "Team management & RLS-scoped access",
              "Reports, exports, and audit logs",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-ok shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Health Check</CardTitle>
                <CardDescription>Verify connection, auth, and table access for this organization.</CardDescription>
              </div>
              {results.length > 0 && (
                <Badge variant={allPass ? "default" : "destructive"} className={allPass ? "bg-status-ok" : ""}>
                  {allPass ? "All checks passed" : "Issues found"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runHealthCheck} disabled={running || !organization?.id}>
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plug className="w-4 h-4 mr-2" />}
              Run Health Check
            </Button>

            {results.length > 0 && (
              <ul className="space-y-2">
                {results.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-md border bg-card p-3"
                  >
                    {r.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-status-ok shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{r.label}</p>
                      {r.detail && <p className="text-xs text-muted-foreground truncate">{r.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

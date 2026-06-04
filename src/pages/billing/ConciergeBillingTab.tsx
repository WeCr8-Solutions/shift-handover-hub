import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, Printer, Receipt, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";

interface EngRow {
  id: string;
  plan_tier: string;
  status: string;
  purchased_via: string;
  payment_status: string;
  payment_method: string | null;
  payment_amount_cents: number;
  payment_received_at: string | null;
  contract_signed_at: string | null;
  invoice_number: string | null;
  refunded_at: string | null;
  refund_amount_cents: number | null;
  started_at: string;
}

/**
 * Org-admin self-serve view of concierge engagements + invoices.
 * Mounted at /settings/billing/concierge.
 */
export default function ConciergeBillingTab() {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const [rows, setRows] = useState<EngRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !organizationId) { setLoading(false); return; }
      const [{ data: mem }, { data: eng }] = await Promise.all([
        supabase.from("organization_members").select("role").eq("user_id", user.id).eq("organization_id", organizationId).maybeSingle(),
        supabase.from("onboarding_engagements" as any)
          .select("id, plan_tier, status, purchased_via, payment_status, payment_method, payment_amount_cents, payment_received_at, contract_signed_at, invoice_number, refunded_at, refund_amount_cents, started_at")
          .eq("organization_id", organizationId)
          .order("started_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setIsOrgAdmin(["admin", "owner"].includes(String((mem as any)?.role ?? "")));
      setRows((eng ?? []) as unknown as EngRow[]);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user, organizationId]);

  if (loading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

  if (!isOrgAdmin) {
    return (
      <Card className="mx-auto max-w-xl mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Admins only</CardTitle>
          <CardDescription>Only organization admins or owners can view concierge billing details.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Helmet>
        <title>Concierge billing · JobLine.ai</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="w-5 h-5" /> Concierge billing
        </h1>
        <p className="text-sm text-muted-foreground">
          Invoices, receipts, and payment status for your concierge onboarding engagements.
          Manual refunds are handled by the JobLine.ai team — contact{" "}
          <a href="mailto:billing@jobline.ai" className="underline">billing@jobline.ai</a>.
        </p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No concierge engagements yet.{" "}
            <Link to="/onboarding-service" className="text-primary underline">Learn about Concierge Onboarding</Link>.
          </CardContent>
        </Card>
      ) : (
        rows.map((r) => {
          const amount = ((r.payment_amount_cents ?? 0) / 100).toFixed(2);
          const refunded = !!r.refunded_at;
          const statusVariant = refunded
            ? "border-muted-foreground/40 text-muted-foreground"
            : r.payment_status === "paid"
              ? "border-status-ok/40 text-status-ok"
              : r.payment_status === "waived"
                ? "border-primary/40 text-primary"
                : "border-amber-500/40 text-amber-600";
          return (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Invoice {r.invoice_number ?? r.id.slice(0, 8)}
                      <Badge variant="outline" className={statusVariant}>
                        {refunded ? "Refunded" : r.payment_status}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">{r.plan_tier}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Started {new Date(r.started_at).toLocaleDateString()}
                      {r.payment_received_at && <> · Paid {new Date(r.payment_received_at).toLocaleDateString()}</>}
                      {r.purchased_via && <> · via {r.purchased_via}</>}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <Link to={`/billing/concierge/invoice/${r.id}`} target="_blank" rel="noopener">
                        <Printer className="w-4 h-4" /> View / print invoice
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Receipt className="w-3 h-3" /> Amount</div>
                  <div className="font-semibold">${amount} USD</div>
                  {refunded && (
                    <div className="text-xs text-muted-foreground">
                      Refunded ${((r.refund_amount_cents ?? 0) / 100).toFixed(2)} on{" "}
                      {new Date(r.refunded_at!).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Contract</div>
                  <div>
                    {r.contract_signed_at
                      ? `Signed ${new Date(r.contract_signed_at).toLocaleDateString()}`
                      : r.purchased_via === "stripe"
                        ? "Stripe ToS"
                        : "Awaiting wet signature"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                  <div className="font-mono text-xs">{r.id}</div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

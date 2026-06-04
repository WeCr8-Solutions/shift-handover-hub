import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft } from "lucide-react";
import { useEngagement } from "@/hooks/useOnboardingEngagements";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Customer-facing self-serve concierge invoice.
 * RLS on onboarding_engagements restricts access to org admins of the
 * owning org and platform admins; if RLS blocks the row, useEngagement
 * returns null and we show a "not found" state.
 *
 * Print-friendly: a single Letter page rendered with Tailwind print: utilities.
 */
export default function ConciergeInvoicePdf() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: engagement, isLoading } = useEngagement(engagementId ?? null);

  useEffect(() => { document.title = "Concierge Invoice · JobLine.ai"; }, []);

  if (authLoading || isLoading) return <Skeleton className="h-screen w-full" />;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-sm">Sign in to view invoice.</div>;
  if (!engagement) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
        Invoice not found or you don't have access. If you believe this is an error,
        contact your platform administrator.
      </div>
    );
  }

  const e = engagement as typeof engagement & {
    invoice_number?: string | null;
    customer_tax_id?: string | null;
    customer_billing_address?: Record<string, string> | null;
    refund_amount_cents?: number | null;
    refunded_at?: string | null;
  };

  const total = (e.payment_amount_cents ?? 0) / 100;
  const refunded = (e.refund_amount_cents ?? 0) / 100;
  const isPaid = e.payment_status === "paid";
  const isRefunded = e.payment_status === "refunded";
  const billing = e.customer_billing_address ?? {};
  const invoiceNumber = e.invoice_number ?? `INV-${e.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`@media print { @page { size: Letter; margin: 0.5in; } body { background: white; } .no-print { display: none !important; } }`}</style>
      </Helmet>

      <div className="no-print sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/settings"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </Button>
        <Button onClick={() => window.print()} size="sm" className="gap-2">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      <section className="bg-white text-black mx-auto my-8 p-10 max-w-[8.5in] min-h-[10.5in] border print:border-0 print:my-0 print:p-0 relative">
        {isPaid && (
          <div className="absolute top-32 right-12 rotate-[-20deg] border-4 border-green-700 text-green-700 px-6 py-2 text-2xl font-extrabold tracking-widest opacity-80 print:opacity-100">
            PAID
          </div>
        )}
        {isRefunded && (
          <div className="absolute top-32 right-12 rotate-[-20deg] border-4 border-red-700 text-red-700 px-6 py-2 text-2xl font-extrabold tracking-widest">
            REFUNDED
          </div>
        )}

        <header className="flex items-start justify-between border-b border-black/30 pb-6">
          <div>
            <div className="text-2xl font-bold">JobLine.ai</div>
            <div className="text-xs text-black/70 mt-1">
              Concierge Onboarding Services<br />
              support@jobline.ai
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold uppercase tracking-wide">Invoice</div>
            <div className="text-sm mt-1">#{invoiceNumber}</div>
            <div className="text-xs text-black/70 mt-1">
              Issued: {new Date(e.started_at).toLocaleDateString()}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-8 mt-8 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-black/60 mb-2">Bill to</div>
            <div className="font-semibold">{e.organizations?.name ?? "—"}</div>
            {billing.line1 && <div>{billing.line1}</div>}
            {billing.line2 && <div>{billing.line2}</div>}
            {(billing.city || billing.state || billing.postal_code) && (
              <div>{[billing.city, billing.state, billing.postal_code].filter(Boolean).join(", ")}</div>
            )}
            {billing.country && <div>{billing.country}</div>}
            {e.customer_tax_id && <div className="mt-2 text-xs text-black/60">Tax ID: {e.customer_tax_id}</div>}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-black/60 mb-2">Payment</div>
            <div>Status: <span className="font-semibold capitalize">{e.payment_status}</span></div>
            {e.payment_method && <div>Method: <span className="capitalize">{e.payment_method.replace(/_/g, " ")}</span></div>}
            {e.payment_received_at && <div>Received: {new Date(e.payment_received_at).toLocaleDateString()}</div>}
            {e.payment_reference && <div className="text-xs text-black/60">Ref: {e.payment_reference}</div>}
          </div>
        </div>

        <table className="w-full mt-8 border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2 w-24">Qty</th>
              <th className="text-right py-2 w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/20">
              <td className="py-3">
                Concierge Onboarding — <span className="capitalize">{e.plan_tier}</span>
                <div className="text-xs text-black/60 mt-1">
                  Full white-glove setup: equipment, stations, users, routing, quality, ERP, training, documents.
                </div>
              </td>
              <td className="text-right py-3">1</td>
              <td className="text-right py-3">${total.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="text-right py-3 font-semibold">Total (USD)</td>
              <td className="text-right py-3 font-bold text-lg">${total.toFixed(2)}</td>
            </tr>
            {refunded > 0 && (
              <tr className="text-red-700">
                <td colSpan={2} className="text-right py-1">Refunded</td>
                <td className="text-right py-1">−${refunded.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {!isPaid && !isRefunded && (
          <div className="mt-8 border-t pt-4 text-xs">
            <div className="font-semibold mb-1">Remittance instructions</div>
            <div>Please reference invoice <strong>#{invoiceNumber}</strong> on payment.</div>
            <div className="mt-1">Accepted: Check, ACH, Wire, Credit card (via Stripe link).</div>
            <div className="mt-1">Contact <strong>billing@jobline.ai</strong> for wiring details or to request a Stripe link.</div>
          </div>
        )}

        <footer className="mt-12 pt-4 border-t border-black/20 text-[10px] text-black/60 flex justify-between">
          <span>JobLine.ai · Concierge Onboarding</span>
          <span>Engagement ID: {e.id}</span>
        </footer>
      </section>
    </div>
  );
}

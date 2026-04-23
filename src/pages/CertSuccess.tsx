import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Post-Stripe-checkout landing page for the $12 cert. Stripe redirects here
 * with ?session_id=cs_xxx. We poll oap_certificates / gca_certificates by
 * stripe_session_id (the webhook writes the row asynchronously).
 */
export default function CertSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [certId, setCertId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [programName, setProgramName] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setPolling(false);
      return;
    }
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const { data } = await supabase.rpc("lookup_cert_by_stripe_session", {
        _session_id: sessionId,
      });
      const found = Array.isArray(data) ? data[0] : null;
      if (found?.cert_id) {
        setCertId(found.cert_id);
        setRecipientEmail(found.recipient_email_masked ?? null);
        setRecipientName((found as any).recipient_name ?? null);
        setProgramName((found as any).program_name ?? null);
        setPolling(false);
        clearInterval(interval);
      } else if (attempts >= 20) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Certificate Purchase Successful | JobLine.ai"
        description="Thank you for your JobLine certificate purchase. Your certificate is being issued."
        canonical="https://jobline.ai/cert/success"
      />
      <MarketingNav />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full p-8 text-center space-y-6">
          {polling ? (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <div>
                <h1 className="text-2xl font-bold mb-2">Issuing your certificate…</h1>
                <p className="text-muted-foreground text-sm">
                  Payment received. We're generating your unique cert ID and sending the
                  confirmation to your email. This usually takes just a few seconds.
                </p>
              </div>
            </>
          ) : certId ? (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 grid place-items-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {recipientName ? `${recipientName.split(" ")[0]}, your certificate is ready 🎉` : "Your certificate is ready 🎉"}
                </h1>
                {programName && (
                  <p className="text-sm text-muted-foreground mb-1">{programName}</p>
                )}
                <p className="text-muted-foreground text-sm mb-6">
                  Cert ID: <span className="font-mono font-semibold text-foreground">{certId}</span>
                </p>
                <div className="text-left space-y-3 bg-muted/30 rounded-lg p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>A confirmation has been sent to <strong>{recipientEmail}</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>Anyone can verify it at <span className="font-mono">jobline.ai/verify/{certId}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link to={`/verify/${certId}`}>View / print certificate</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <div>
                <h1 className="text-2xl font-bold mb-2">Payment received</h1>
                <p className="text-muted-foreground text-sm">
                  Your certificate is still being issued. Check your email shortly — we'll send
                  your cert ID and verification link as soon as it's ready. If you don't see it
                  within a few minutes, contact <a href="mailto:hello@jobline.ai" className="text-primary underline">hello@jobline.ai</a>.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/">Back to home</Link>
              </Button>
            </>
          )}
        </Card>
      </main>

      <MarketingFooter />
    </div>
  );
}

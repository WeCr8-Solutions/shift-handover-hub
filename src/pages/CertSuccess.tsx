import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Mail, ShieldCheck, Loader2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Post-Stripe-checkout landing page for the $12 cert. Stripe redirects here
 * with ?session_id=cs_xxx. We poll oap_certificates / gca_certificates by
 * stripe_session_id (the webhook writes the row asynchronously).
 */
export default function CertSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { user } = useAuth();
  const [certId, setCertId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [programName, setProgramName] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<string | null>(null);
  const [publicUsername, setPublicUsername] = useState<string | null>(null);
  const [makingPublic, setMakingPublic] = useState(false);

  // Load current visibility for the signed-in user so we can surface the
  // "Make profile public" nudge after a successful cert purchase.
  useEffect(() => {
    if (!user?.id) return;
    void supabase
      .from("operator_profiles")
      .select("profile_visibility, public_username")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfileVisibility((data?.profile_visibility as string | undefined) ?? null);
        setPublicUsername((data?.public_username as string | undefined) ?? null);
      });
  }, [user?.id]);

  const makeProfilePublic = async () => {
    if (!user?.id) return;
    setMakingPublic(true);
    const { error } = await supabase
      .from("operator_profiles")
      .update({ profile_visibility: "public" } as never)
      .eq("user_id", user.id);
    setMakingPublic(false);
    if (!error) setProfileVisibility("public");
  };

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
        noindex
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

              {/* Make-public nudge for signed-in operators whose profile isn't already public */}
              {user && profileVisibility && profileVisibility !== "public" && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-left space-y-3">
                  <div className="flex items-start gap-2">
                    <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Share this achievement publicly</p>
                      <p className="text-xs text-muted-foreground">
                        Make your talent profile public so employers can see your verified credentials at
                        {publicUsername ? ` jobline.ai/talent/${publicUsername}` : " your public talent URL"}.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" onClick={makeProfilePublic} disabled={makingPublic} className="flex-1">
                      {makingPublic ? "Updating…" : "Make profile public"}
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link to="/operator/profile">Manage profile</Link>
                    </Button>
                  </div>
                </div>
              )}

              {user && profileVisibility === "public" && publicUsername && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs text-left flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Live on your public profile:{" "}
                    <Link to={`/talent/${publicUsername}`} className="text-primary underline font-mono">
                      /talent/{publicUsername}
                    </Link>
                  </span>
                </div>
              )}

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

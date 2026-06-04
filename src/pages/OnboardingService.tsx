import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

const INCLUDES = [
  "Equipment & stations imported and verified",
  "Users, roles & permissions provisioned",
  "Routing templates & quality checkpoints built",
  "ERP / JobBOSS / SAP connector configured (if applicable)",
  "OAP training programs assigned per role",
  "ITAR / US-Person posture confirmed before go-live",
  "Final walkthrough call with your supervisor",
  "Approved for production use by the JobLine team",
];

export default function OnboardingService() {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const status = params.get("status");

  async function buy() {
    if (!user) { window.location.href = "/auth?redirect=/onboarding-service"; return; }
    if (!organizationId) { toast.error("Create or join an organization first."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-concierge-checkout", {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Concierge Onboarding | JobLine.ai</title>
        <meta name="description" content="Have the JobLine.ai team set up your shop end-to-end. Log in to a production-ready facility." />
        <link rel="canonical" href="https://jobline.ai/onboarding-service" />
      </Helmet>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
            <Sparkles className="w-4 h-4" /> White-glove setup
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Concierge Onboarding</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We configure your equipment, users, routing, quality, and ERP integration so your team logs in
            to a production-ready JobLine.ai facility on day one.
          </p>
        </header>

        {status === "success" && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="py-4 text-sm">
              Payment received. Our onboarding team has been notified and your organization is now in
              <strong> concierge intake</strong>. You'll receive an email when setup is approved for production use.
            </CardContent>
          </Card>
        )}
        {status === "cancelled" && (
          <Card className="border-destructive/40">
            <CardContent className="py-4 text-sm">Checkout cancelled — no charge was made.</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between">
              <span>What's included</span>
              <span className="text-2xl">$1,500 <span className="text-sm text-muted-foreground font-normal">one-time</span></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {INCLUDES.map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" /> {line}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-3">
          <Button size="lg" onClick={buy} disabled={loading} aria-label="Purchase Concierge Onboarding">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting checkout…</> : "Purchase Concierge Onboarding"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Already approved? <Link to="/dashboard" className="underline">Go to your dashboard</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

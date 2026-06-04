import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Wrench, Loader2, DollarSign, FileSignature } from "lucide-react";

// Operators are blocked through ready_for_production so they don't begin work before
// the JobLine team flips the engagement to live. Org admins are allowed in during
// ready_for_production so they can do the final walkthrough.
const BLOCK_OPERATORS = new Set(["concierge_intake", "concierge_in_progress", "ready_for_production"]);
const BLOCK_ADMINS = new Set(["concierge_intake", "concierge_in_progress"]);

interface EngagementGate {
  payment_status: string | null;
  contract_signed_at: string | null;
  purchased_via: string | null;
}

/**
 * Customer-side gate shown while the JobLine team is configuring an org via
 * the Concierge Onboarding service. Platform admins (and the /onboarding-service,
 * /auth, /admin, /pricing, /onboarding-status, /concierge pages) bypass the gate.
 */
export function ConciergeInProgressSplash({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { organizationId: activeOrgId } = useOrganization();
  const location = useLocation();
  const [status, setStatus] = useState<string | null>(null);
  const [engagement, setEngagement] = useState<EngagementGate | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !activeOrgId) { setLoading(false); return; }
      const [{ data: org }, { data: pa }, { data: oa }] = await Promise.all([
        supabase.from("organizations").select("onboarding_status, onboarding_engagement_id").eq("id", activeOrgId).maybeSingle(),
        supabase.rpc("has_role" as any, { _user_id: user.id, _role: "admin" }),
        supabase.from("organization_members").select("role").eq("user_id", user.id).eq("organization_id", activeOrgId).maybeSingle(),
      ]);
      if (cancelled) return;
      setStatus((org as any)?.onboarding_status ?? null);
      setIsPlatformAdmin(Boolean(pa));
      setIsOrgAdmin(["admin", "owner"].includes(String((oa as any)?.role ?? "")));

      const engId = (org as any)?.onboarding_engagement_id;
      if (engId) {
        const { data: eng } = await supabase
          .from("onboarding_engagements" as any)
          .select("payment_status, contract_signed_at, purchased_via")
          .eq("id", engId)
          .maybeSingle();
        if (!cancelled) setEngagement((eng as any) ?? null);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user, activeOrgId]);

  const bypassRoutes = ["/auth", "/admin", "/onboarding-service", "/onboarding-status", "/pricing", "/", "/reset-password", "/concierge"];
  const shouldBypass = bypassRoutes.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

  if (loading || !user || !activeOrgId || isPlatformAdmin || shouldBypass) return <>{children}</>;
  if (!status) return <>{children}</>;
  const blocked = isOrgAdmin ? BLOCK_ADMINS.has(status) : BLOCK_OPERATORS.has(status);
  if (!blocked) return <>{children}</>;

  // Derive the most informative awaiting-state for the splash
  const awaitingPayment =
    engagement &&
    engagement.purchased_via !== "stripe" &&
    !["paid", "waived"].includes(engagement.payment_status ?? "");
  const awaitingContract =
    engagement &&
    !awaitingPayment &&
    engagement.purchased_via !== "stripe" &&
    engagement.payment_status !== "waived" &&
    !engagement.contract_signed_at;

  let Icon = Wrench;
  let title = "Your shop is being set up";
  let body =
    "The JobLine.ai onboarding team is configuring your equipment, stations, users, routing, and quality workflows. You'll get an email the moment your facility is approved for production use.";

  if (status === "ready_for_production") {
    Icon = ShieldCheck;
    title = "Final review in progress";
  }
  if (awaitingPayment) {
    Icon = DollarSign;
    title = "Concierge setup reserved — awaiting payment";
    body =
      "Your concierge engagement is reserved. We'll begin configuring your shop the moment payment clears. Questions? Email sales@jobline.ai.";
  } else if (awaitingContract) {
    Icon = FileSignature;
    title = "Awaiting signed agreement";
    body =
      "Payment has been received — we're waiting on your signed Master Services Agreement. Your sales rep will follow up shortly.";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-lg w-full border-primary/20">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 text-sm text-muted-foreground">
          <p>{body}</p>
          <p className="flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> Status: {status.replace(/_/g, " ")}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:sales@jobline.ai">Contact sales</a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

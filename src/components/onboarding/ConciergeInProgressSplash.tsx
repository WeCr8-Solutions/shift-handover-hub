import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Wrench, Loader2 } from "lucide-react";

// Operators are blocked through ready_for_production so they don't begin work before
// the JobLine team flips the engagement to live. Org admins are allowed in during
// ready_for_production so they can do the final walkthrough.
const BLOCK_OPERATORS = new Set(["concierge_intake", "concierge_in_progress", "ready_for_production"]);
const BLOCK_ADMINS = new Set(["concierge_intake", "concierge_in_progress"]);

/**
 * Customer-side gate shown while the JobLine team is configuring an org via
 * the Concierge Onboarding service. Platform admins (and the /onboarding-service,
 * /auth, /admin, /pricing, /onboarding-status pages) bypass the gate.
 */
export function ConciergeInProgressSplash({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { organizationId: activeOrgId } = useOrganization();
  const location = useLocation();
  const [status, setStatus] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !activeOrgId) { setLoading(false); return; }
      const [{ data: org }, { data: pa }, { data: oa }] = await Promise.all([
        supabase.from("organizations").select("onboarding_status").eq("id", activeOrgId).maybeSingle(),
        supabase.rpc("has_role" as any, { _user_id: user.id, _role: "admin" }),
        supabase.from("organization_members").select("role").eq("user_id", user.id).eq("organization_id", activeOrgId).maybeSingle(),
      ]);
      if (cancelled) return;
      setStatus((org as any)?.onboarding_status ?? null);
      setIsPlatformAdmin(Boolean(pa));
      setIsOrgAdmin(["admin", "owner"].includes(String((oa as any)?.role ?? "")));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user, activeOrgId]);

  const bypassRoutes = ["/auth", "/admin", "/onboarding-service", "/onboarding-status", "/pricing", "/", "/reset-password"];
  const shouldBypass = bypassRoutes.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

  if (loading || !user || !activeOrgId || isPlatformAdmin || shouldBypass) return <>{children}</>;
  if (!status) return <>{children}</>;
  const blocked = isOrgAdmin ? BLOCK_ADMINS.has(status) : BLOCK_OPERATORS.has(status);
  if (!blocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-lg w-full border-primary/20">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {status === "ready_for_production" ? (
              <ShieldCheck className="w-6 h-6 text-primary" />
            ) : (
              <Wrench className="w-6 h-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "ready_for_production" ? "Final review in progress" : "Your shop is being set up"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 text-sm text-muted-foreground">
          <p>
            The JobLine.ai onboarding team is configuring your equipment, stations, users, routing, and
            quality workflows. You'll get an email the moment your facility is approved for production use.
          </p>
          <p className="flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> Status: {status.replace(/_/g, " ")}
          </p>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

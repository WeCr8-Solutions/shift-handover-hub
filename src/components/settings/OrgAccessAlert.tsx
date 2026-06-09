import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Shown on /settings when the active user is the original creator of an
 * organization that has no owner. Lets them reclaim ownership via the
 * `claim_org_ownership` RPC, which is itself guarded server-side.
 */
export function OrgAccessAlert() {
  const { user } = useAuth();
  const { organization, organizationRole, refresh } = useOrgContext() as any;
  const { toast } = useToast();
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id || !organization?.id) {
        setCanClaim(false);
        return;
      }
      // Already has admin/owner access — no alert needed
      if (organizationRole === "owner" || organizationRole === "admin") {
        setCanClaim(false);
        return;
      }
      const [creatorRes, ownerRes] = await Promise.all([
        supabase.from("organizations").select("created_by").eq("id", organization.id).maybeSingle(),
        supabase
          .from("organization_members")
          .select("id")
          .eq("organization_id", organization.id)
          .eq("role", "owner")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      const isCreator = (creatorRes.data as any)?.created_by === user.id;
      const ownerExists = Boolean(ownerRes.data);
      setCanClaim(isCreator && !ownerExists);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, organization?.id, organizationRole]);

  if (!canClaim) return null;

  const handleClaim = async () => {
    if (!organization?.id) return;
    setClaiming(true);
    const { error } = await (supabase as any).rpc("claim_org_ownership", {
      _organization_id: organization.id,
    });
    setClaiming(false);
    if (error) {
      toast({ title: "Could not claim ownership", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ownership claimed", description: "You are now the owner of this organization." });
    if (typeof refresh === "function") refresh();
  };

  return (
    <Alert className="border-warning/40 bg-warning/5">
      <ShieldAlert className="w-4 h-4 text-warning" />
      <AlertTitle>This organization has no owner</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <span>
          You created <strong>{organization?.name}</strong> but never received owner access. Claim ownership to manage
          settings, members, and billing.
        </span>
        <Button onClick={handleClaim} disabled={claiming} size="sm">
          {claiming && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
          Claim ownership
        </Button>
      </AlertDescription>
    </Alert>
  );
}

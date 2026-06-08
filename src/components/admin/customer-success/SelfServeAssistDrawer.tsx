import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ShieldAlert } from "lucide-react";
import { ReadinessPanel } from "@/components/admin/onboarding/ReadinessPanel";
import { useAdminCustomers } from "@/hooks/useAdminCustomers";
import { useCreateEngagement, useProductionReadiness } from "@/hooks/useOnboardingEngagements";

export function SelfServeAssistDrawer({
  organizationId,
  onClose,
  onConverted,
}: {
  organizationId: string | null;
  onClose: () => void;
  onConverted: (engagementId: string) => void;
}) {
  const { data: customers } = useAdminCustomers();
  const org = customers?.find((c) => c.organization_id === organizationId) ?? null;
  const readiness = useProductionReadiness(organizationId);
  const create = useCreateEngagement();
  const [converting, setConverting] = useState(false);

  const convert = async () => {
    if (!organizationId) return;
    setConverting(true);
    try {
      const id = await create.mutateAsync({
        organization_id: organizationId,
        plan_tier: "complimentary",
        notes: "Converted from self-serve via admin assist drawer",
      });
      onConverted(id);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Sheet open={!!organizationId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {org?.organization_name ?? "Organization"}
            {org?.itar && (
              <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                <ShieldAlert className="w-3 h-3" /> ITAR
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Self-serve setup. Assist by reviewing readiness gaps below, or convert this org to a tracked
            concierge engagement for full checklist visibility.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Account snapshot</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>
                Subscription: <span className="capitalize">{org?.subscription_tier ?? "—"}</span> ·{" "}
                <span className="capitalize">{org?.subscription_status ?? "—"}</span>
              </div>
              {org?.trial_ends_at && (
                <div className="text-muted-foreground">
                  Trial ends: {new Date(org.trial_ends_at).toLocaleDateString()}
                </div>
              )}
              <div className="text-muted-foreground">
                Signed up: {org ? new Date(org.created_at).toLocaleDateString() : "—"}
              </div>
            </CardContent>
          </Card>

          {organizationId && <ReadinessPanel organizationId={organizationId} />}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Convert to concierge engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Creates a tracked engagement (no charge) so you get the full checklist, document uploads, and
                production-readiness gates for this customer. Use this when an account needs hands-on help.
              </p>
              <Button onClick={convert} disabled={converting || !organizationId} className="gap-2">
                <Briefcase className="w-4 h-4" />
                {converting ? "Creating..." : "Create complimentary engagement"}
              </Button>
              {readiness.data && !readiness.data.ready && (
                <div className="text-xs text-muted-foreground">
                  Production readiness: {readiness.data.blockers.length} blocker
                  {readiness.data.blockers.length === 1 ? "" : "s"} open.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

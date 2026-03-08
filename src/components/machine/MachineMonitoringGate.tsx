/**
 * src/components/machine/MachineMonitoringGate.tsx
 *
 * Wraps machine monitoring UI with entitlement check.
 * Shows upgrade prompt for non-entitled orgs.
 * Enterprise add-on or enterprise-tier feature.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Cpu, Sparkles, Zap } from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useSubscription, PRICING_TIERS } from "@/hooks/useSubscription";

interface MachineMonitoringGateProps {
  children: React.ReactNode;
  /** Show a compact inline banner instead of full card */
  compact?: boolean;
}

export function MachineMonitoringGate({ children, compact = false }: MachineMonitoringGateProps) {
  const { canAccess, plan, loading } = useEntitlements();
  const { createCheckout } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-muted h-24 rounded-lg" />;
  }

  const hasAccess = canAccess("machine_monitoring");

  if (hasAccess) {
    return <>{children}</>;
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 shrink-0">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Live Machine Monitoring</p>
          <p className="text-xs text-muted-foreground">
            Available as an Enterprise add-on. Connect CNC controllers for real-time status.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => createCheckout(PRICING_TIERS.enterprise.priceId)}
          className="gap-1.5 shrink-0"
        >
          <Sparkles className="w-3 h-3" />
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Cpu className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          Live Machine Monitoring
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Zap className="w-2.5 h-2.5" />
            Add-on
          </Badge>
        </CardTitle>
        <CardDescription>
          Connect your CNC machines for real-time spindle RPM, feed rates, active programs,
          alarm detection, and DNC file transfers — all directly in your station view.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground max-w-sm mx-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Live machine state
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Alarm detection
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            DNC file transfer
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Shift handoff data
          </div>
        </div>
        <Button
          onClick={() => createCheckout(PRICING_TIERS.enterprise.priceId)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to Enterprise
        </Button>
        <p className="text-xs text-muted-foreground">
          Currently on: <span className="font-medium">{plan}</span> plan
        </p>
      </CardContent>
    </Card>
  );
}

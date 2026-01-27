import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useSubscription } from "@/hooks/useSubscription";
import { PRICING_TIERS } from "@/hooks/useSubscription";

interface EntitlementGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  requiredPlan?: "single" | "team" | "enterprise";
}

export function EntitlementGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
  requiredPlan = "single",
}: EntitlementGateProps) {
  const { canAccess, plan, loading } = useEntitlements();
  const { createCheckout } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-muted h-24 rounded-lg" />;
  }

  const hasAccess = canAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  const tierInfo = PRICING_TIERS[requiredPlan];

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Upgrade Required</CardTitle>
        <CardDescription>
          This feature requires the {tierInfo.name} plan or higher
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Unlock {feature.replace(/_/g, " ")} and more premium features
        </p>
        <Button onClick={() => createCheckout(tierInfo.priceId)} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Upgrade to {tierInfo.name} - ${tierInfo.price}/mo
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Currently on: {plan} plan
        </p>
      </CardContent>
    </Card>
  );
}

interface LimitGateProps {
  limitKey: string;
  currentCount: number;
  children: ReactNode;
  onLimitReached?: () => void;
}

export function LimitGate({
  limitKey,
  currentCount,
  children,
  onLimitReached,
}: LimitGateProps) {
  const { isWithinLimit, getLimit, plan } = useEntitlements();
  const { createCheckout } = useSubscription();

  const withinLimit = isWithinLimit(limitKey, currentCount);
  const limit = getLimit(limitKey);

  if (withinLimit) {
    return <>{children}</>;
  }

  // If limit reached, optionally call callback
  if (onLimitReached) {
    onLimitReached();
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">Limit Reached</CardTitle>
        <CardDescription>
          You've used {currentCount} of {limit} {limitKey.replace(/_/g, " ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade your plan to increase your limits
        </p>
        <Button
          variant="outline"
          onClick={() => createCheckout(PRICING_TIERS.team.priceId)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade Plan
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Currently on: {plan} plan
        </p>
      </CardContent>
    </Card>
  );
}

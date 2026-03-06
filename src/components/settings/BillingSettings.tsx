import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, ExternalLink, Crown, Users, Package, BarChart3, AlertTriangle, Plus } from "lucide-react";
import { useSubscription, PRICING_TIERS } from "@/hooks/useSubscription";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export function BillingSettings() {
  const { organization } = useUserOrganization();
  const { tier, subscriptionEnd, isLoading, openCustomerPortal, createCheckout, updateSeats } = useSubscription();
  const {
    plan,
    features = {},
    limits = { users: 0, work_orders_per_month: 0, stations: 0 },
    loading: entitlementsLoading,
  } = useEntitlements();

  const [isRedirecting, setIsRedirecting] = useState(false);

  const [memberCount, setMemberCount] = useState(0);
  const [workOrderCount, setWorkOrderCount] = useState(0);
  const [stationCount, setStationCount] = useState(0);
  const [usageLoading, setUsageLoading] = useState(true);

  const [newSeatCount, setNewSeatCount] = useState<number>(10);
  const [isUpdatingSeats, setIsUpdatingSeats] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUsage = async () => {
      if (!organization?.id) {
        if (isMounted) {
          setMemberCount(0);
          setWorkOrderCount(0);
          setStationCount(0);
          setUsageLoading(false);
        }
        return;
      }

      setUsageLoading(true);

      try {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        const [members, workOrders, stations] = await Promise.all([
          supabase
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organization.id),
          supabase
            .from("queue_items")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organization.id)
            .eq("item_type", "work_order")
            .gte("created_at", monthStart),
          supabase.from("stations").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
        ]);

        if (!isMounted) return;

        setMemberCount(members.count ?? 0);
        setWorkOrderCount(workOrders.count ?? 0);
        setStationCount(stations.count ?? 0);
      } finally {
        if (isMounted) {
          setUsageLoading(false);
        }
      }
    };

    void fetchUsage();

    return () => {
      isMounted = false;
    };
  }, [organization?.id]);

  useEffect(() => {
    setNewSeatCount(Math.max(10, limits.users || 10));
  }, [limits.users]);

  const handleManageBilling = async () => {
    setIsRedirecting(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error("Error opening portal:", error);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setIsRedirecting(true);
    try {
      await createCheckout(priceId);
    } catch (error) {
      console.error("Error creating checkout:", error);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleUpdateSeats = async () => {
    if (newSeatCount < 10) {
      toast.error("Minimum seat count is 10");
      return;
    }

    setIsUpdatingSeats(true);

    try {
      await updateSeats(newSeatCount);
      toast.success(`Seats updated to ${newSeatCount}`);
    } catch (error) {
      console.error("Error updating seats:", error);
      toast.error("Failed to update seats");
    } finally {
      setIsUpdatingSeats(false);
    }
  };

  if (isLoading || entitlementsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const currentTier = tier ? PRICING_TIERS[tier] : null;
  const status = organization?.subscription_status || "free";
  const isEnterprise = plan === "enterprise";
  const safeUserLimit = Math.max(0, limits.users || 0);
  const safeWorkOrderLimit = Math.max(0, limits.work_orders_per_month || 0);
  const safeStationLimit = Math.max(0, limits.stations || 0);
  const seatUsagePercent = safeUserLimit > 0 ? Math.min((memberCount / safeUserLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Current Plan
          </CardTitle>
          <CardDescription>Your organization's subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{currentTier?.name || "Free Plan"}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentTier ? `$${currentTier.price}/month` : "No active subscription"}
                </p>
              </div>
            </div>

            <Badge
              variant={status === "active" ? "default" : status === "past_due" ? "destructive" : "secondary"}
              className="capitalize"
            >
              {status}
            </Badge>
          </div>

          {subscriptionEnd && (
            <p className="text-sm text-muted-foreground">
              {status === "active" ? "Renews" : "Access until"}: {format(new Date(subscriptionEnd), "MMMM d, yyyy")}
            </p>
          )}

          <div className="flex gap-3">
            {tier && (
              <Button variant="outline" onClick={handleManageBilling} disabled={isRedirecting}>
                {isRedirecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            )}

            {(!tier || tier === "single") && PRICING_TIERS.team && (
              <Button onClick={() => handleUpgrade(PRICING_TIERS.team.priceId)} disabled={isRedirecting}>
                Upgrade to Team
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isEnterprise && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seat Management
            </CardTitle>
            <CardDescription>
              Manage your Enterprise team seats. Base plan includes 10 seats, additional seats are $7.99/mo each.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Active Members</span>
                <span className="text-sm font-semibold">
                  {memberCount} / {safeUserLimit}
                </span>
              </div>
              <Progress value={seatUsagePercent} className="h-2" />
              {seatUsagePercent >= 80 && seatUsagePercent < 100 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Approaching seat limit — consider adding more seats
                </p>
              )}
              {seatUsagePercent >= 100 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Seat limit reached — add more seats to invite new members
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total seats:</span>
                <Input
                  type="number"
                  min={10}
                  value={newSeatCount}
                  onChange={(e) => setNewSeatCount(Math.max(10, Number.parseInt(e.target.value, 10) || 10))}
                  className="w-24"
                />
              </div>

              <Button
                onClick={handleUpdateSeats}
                disabled={isUpdatingSeats || newSeatCount === safeUserLimit || newSeatCount < 10}
                size="sm"
              >
                {isUpdatingSeats ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Update Seats
              </Button>

              {newSeatCount > 10 && (
                <span className="text-xs text-muted-foreground">
                  +{newSeatCount - 10} additional × $7.99 = ${((newSeatCount - 10) * 7.99).toFixed(2)}/mo extra
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage & Limits
          </CardTitle>
          <CardDescription>Your current usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Team Members
                </span>
                <span className="text-sm text-muted-foreground">/ {safeUserLimit}</span>
              </div>
              <Progress
                value={safeUserLimit > 0 ? Math.min((memberCount / safeUserLimit) * 100, 100) : 0}
                className="h-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {usageLoading ? "Loading..." : `${memberCount} used`}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Work Orders</span>
                <span className="text-sm text-muted-foreground">/ {safeWorkOrderLimit}/mo</span>
              </div>
              <Progress
                value={safeWorkOrderLimit > 0 ? Math.min((workOrderCount / safeWorkOrderLimit) * 100, 100) : 0}
                className="h-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {usageLoading ? "Loading..." : `${workOrderCount} this month`}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Stations</span>
                <span className="text-sm text-muted-foreground">/ {safeStationLimit}</span>
              </div>
              <Progress
                value={safeStationLimit > 0 ? Math.min((stationCount / safeStationLimit) * 100, 100) : 0}
                className="h-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {usageLoading ? "Loading..." : `${stationCount} configured`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Included Features</CardTitle>
          <CardDescription>Features available on your {plan} plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Object.entries(features).map(([feature, enabled]) => {
              const isBooleanEnabled = typeof enabled === "boolean" && enabled === true;

              return (
                <div
                  key={feature}
                  className={`rounded-lg border p-3 ${
                    isBooleanEnabled ? "border-green-500/30 bg-green-500/10" : "border-muted bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${isBooleanEnabled ? "bg-green-500" : "bg-muted-foreground"}`}
                    />
                    <span className={`text-sm capitalize ${isBooleanEnabled ? "" : "text-muted-foreground"}`}>
                      {feature.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {(!tier || tier !== "enterprise") && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>Get more features and higher limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(PRICING_TIERS)
                .filter(([key]) => key !== tier && key !== "single")
                .map(([key, tierInfo]) => (
                  <div key={key} className="rounded-lg border p-4 transition-colors hover:border-primary/50">
                    <h4 className="font-semibold">{tierInfo.name}</h4>
                    <p className="mt-1 text-2xl font-bold">
                      ${tierInfo.price}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {tierInfo.features.slice(0, 3).map((f, i) => (
                        <li key={i}>✓ {f}</li>
                      ))}
                    </ul>
                    <Button
                      className="mt-4 w-full"
                      variant={key === "enterprise" ? "default" : "outline"}
                      onClick={() => handleUpgrade(tierInfo.priceId)}
                      disabled={isRedirecting}
                    >
                      {key === "enterprise" ? "Upgrade to Enterprise" : "Upgrade"}
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

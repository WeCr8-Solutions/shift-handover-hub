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
  const { plan, features, limits, loading: entitlementsLoading } = useEntitlements();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Real usage counts
  const [memberCount, setMemberCount] = useState(0);
  const [workOrderCount, setWorkOrderCount] = useState(0);
  const [stationCount, setStationCount] = useState(0);
  const [usageLoading, setUsageLoading] = useState(true);

  // Seat management
  const [newSeatCount, setNewSeatCount] = useState<number>(10);
  const [isUpdatingSeats, setIsUpdatingSeats] = useState(false);

  useEffect(() => {
    if (!organization?.id) {
      setUsageLoading(false);
      return;
    }

    const fetchUsage = async () => {
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
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase
          .from("stations")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id),
      ]);

      setMemberCount(members.count ?? 0);
      setWorkOrderCount(workOrders.count ?? 0);
      setStationCount(stations.count ?? 0);
      setUsageLoading(false);
    };

    fetchUsage();
  }, [organization?.id]);

  useEffect(() => {
    setNewSeatCount(limits.users || 10);
  }, [limits.users]);

  const handleManageBilling = async () => {
    setIsRedirecting(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error("Error opening portal:", error);
    }
    setIsRedirecting(false);
  };

  const handleUpgrade = async (priceId: string) => {
    setIsRedirecting(true);
    try {
      await createCheckout(priceId);
    } catch (error) {
      console.error("Error creating checkout:", error);
    }
    setIsRedirecting(false);
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
    }
    setIsUpdatingSeats(false);
  };

  if (isLoading || entitlementsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const currentTier = tier ? PRICING_TIERS[tier] : null;
  const status = organization?.subscription_status || "free";
  const isEnterprise = plan === "enterprise";
  const seatUsagePercent = limits.users > 0 ? (memberCount / limits.users) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your organization's subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {currentTier?.name || "Free Plan"}
                </h3>
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
                {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Manage Billing
              </Button>
            )}
            {(!tier || tier === "single") && (
              <Button onClick={() => handleUpgrade(PRICING_TIERS.team.priceId)} disabled={isRedirecting}>
                Upgrade to Team
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Seat Management */}
      {isEnterprise && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Seat Management
            </CardTitle>
            <CardDescription>
              Manage your Enterprise team seats. Base plan includes 10 seats, additional seats are $7.99/mo each.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Active Members</span>
                <span className="text-sm font-semibold">{memberCount} / {limits.users}</span>
              </div>
              <Progress value={Math.min(seatUsagePercent, 100)} className="h-2" />
              {seatUsagePercent >= 80 && seatUsagePercent < 100 && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                  <AlertTriangle className="w-3 h-3" />
                  Approaching seat limit — consider adding more seats
                </p>
              )}
              {seatUsagePercent >= 100 && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                  <AlertTriangle className="w-3 h-3" />
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
                  onChange={(e) => setNewSeatCount(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-24"
                />
              </div>
              <Button
                onClick={handleUpdateSeats}
                disabled={isUpdatingSeats || newSeatCount === limits.users || newSeatCount < 10}
                size="sm"
              >
                {isUpdatingSeats ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
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

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Usage & Limits
          </CardTitle>
          <CardDescription>
            Your current usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members
                </span>
                <span className="text-sm text-muted-foreground">
                  / {limits.users}
                </span>
              </div>
              <Progress value={limits.users > 0 ? (memberCount / limits.users) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {usageLoading ? "Loading..." : `${memberCount} used`}
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Work Orders</span>
                <span className="text-sm text-muted-foreground">
                  / {limits.work_orders_per_month}/mo
                </span>
              </div>
              <Progress value={limits.work_orders_per_month > 0 ? (workOrderCount / limits.work_orders_per_month) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {usageLoading ? "Loading..." : `${workOrderCount} this month`}
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Stations</span>
                <span className="text-sm text-muted-foreground">
                  / {limits.stations}
                </span>
              </div>
              <Progress value={limits.stations > 0 ? (stationCount / limits.stations) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {usageLoading ? "Loading..." : `${stationCount} configured`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Included Features</CardTitle>
          <CardDescription>
            Features available on your {plan} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(features).map(([feature, enabled]) => (
              <div
                key={feature}
                className={`p-3 rounded-lg border ${typeof enabled === "boolean" && enabled ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-muted"}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${typeof enabled === "boolean" && enabled ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <span className={`text-sm capitalize ${typeof enabled === "boolean" && enabled ? "" : "text-muted-foreground"}`}>
                    {feature.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {(!tier || tier !== "enterprise") && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Get more features and higher limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PRICING_TIERS)
                .filter(([key]) => key !== tier && key !== "single")
                .map(([key, tierInfo]) => (
                  <div key={key} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                    <h4 className="font-semibold">{tierInfo.name}</h4>
                    <p className="text-2xl font-bold mt-1">
                      ${tierInfo.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {tierInfo.features.slice(0, 3).map((f, i) => (
                        <li key={i}>✓ {f}</li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-4"
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

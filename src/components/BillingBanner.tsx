import { AlertTriangle, CreditCard, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubscription } from "@/hooks/useSubscription";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export function BillingBanner() {
  const navigate = useNavigate();
  const { subscriptionEnd, openCustomerPortal } = useSubscription();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();
  const { isInTrial, isTrialExpired, trialDaysRemaining, trialEndsAt, canManageBilling } = useTrialStatus();
  const [dismissed, setDismissed] = useState(false);

  if (accessLoading || dismissed) return null;

  // Only show billing banners to developers or org owners (canManageBilling)
  if (!isDeveloper && !canManageBilling) return null;

  // Trial expiring soon (3 days or less)
  if (isInTrial && trialDaysRemaining <= 3 && trialEndsAt) {
    return (
      <Alert className="mb-4 border-amber-500/50 bg-amber-500/10 relative">
        <Clock className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-600">Trial Ending Soon</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Your free trial ends on {format(trialEndsAt, "MMMM d, yyyy")} ({trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining).
          </span>
          <div className="flex gap-2 mt-2 sm:mt-0">
            {canManageBilling && (
              <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
                <CreditCard className="w-4 h-4 mr-2" />
                Choose a Plan
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={() => setDismissed(true)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial expired
  if (isTrialExpired) {
    return (
      <Alert variant="destructive" className="mb-4 relative">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Trial Expired</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your 14-day free trial has ended. Subscribe to continue using JobLine.</span>
          <div className="flex gap-2 mt-2 sm:mt-0">
            {canManageBilling && (
              <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
                <CreditCard className="w-4 h-4 mr-2" />
                Choose a Plan
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={() => setDismissed(true)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Past due - payment failed (developers + org owners)
  if (canManageBilling) {
    // Cancellation pending
    if (subscriptionEnd) {
      const cancelAtPeriodEnd = false; // Would come from subscriptions table
      if (cancelAtPeriodEnd) {
        const endDate = new Date(subscriptionEnd);
        return (
          <Alert className="mb-4 border-amber-500/50 bg-amber-500/10 relative">
            <Clock className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600">Subscription Ending</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Your subscription will end on {format(endDate, "MMMM d, yyyy")}.
              </span>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button size="sm" variant="outline" onClick={() => openCustomerPortal()}>
                  Reactivate
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDismissed(true)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      }
    }
  }

  return null;
}

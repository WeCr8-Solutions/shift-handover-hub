import { AlertTriangle, CreditCard, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useState } from "react";
import { format } from "date-fns";

export function BillingBanner() {
  const { organization } = useUserOrganization();
  const { subscriptionEnd, openCustomerPortal } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !organization) return null;

  const status = organization.subscription_status;
  const cancelAtPeriodEnd = false; // Would come from subscriptions table

  // Past due - payment failed
  if (status === "past_due") {
    return (
      <Alert variant="destructive" className="mb-4 relative">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Payment Failed</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your payment method was declined. Please update your billing information to avoid service interruption.</span>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button size="sm" variant="outline" onClick={() => openCustomerPortal()}>
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setDismissed(true)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Cancellation pending
  if (cancelAtPeriodEnd && subscriptionEnd) {
    const endDate = new Date(subscriptionEnd);
    return (
      <Alert className="mb-4 border-amber-500/50 bg-amber-500/10 relative">
        <Clock className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-600">Subscription Ending</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Your subscription will end on {format(endDate, "MMMM d, yyyy")}. You'll retain access until then.
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

  // Trial ending soon (if you add trials)
  // if (status === "trialing" && trialEndsAt && daysUntilEnd <= 3) { ... }

  return null;
}

import { useState, useEffect, useMemo } from "react";
import { Gift, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOrgContext } from "@/contexts/OrgContext";
import { differenceInDays } from "date-fns";

const DISMISS_KEY_PREFIX = "complimentary_award_dismissed_";

export function ComplimentaryAwardBanner() {
  const { organization, loading } = useOrgContext();
  const [dismissed, setDismissed] = useState(false);
  const [permanentlyDismissed, setPermanentlyDismissed] = useState(false);

  const isComplimentary = useMemo(() => {
    if (!organization) return false;
    return organization.subscription_status === "complimentary";
  }, [organization]);

  const daysRemaining = useMemo(() => {
    if (!organization || !isComplimentary) return 0;
    const trialEndsAt = (organization as any).trial_ends_at;
    if (!trialEndsAt) return 0;
    const days = differenceInDays(new Date(trialEndsAt), new Date());
    return Math.max(0, days);
  }, [organization, isComplimentary]);

  // Check localStorage for permanent dismissal
  useEffect(() => {
    if (!organization) return;
    const key = DISMISS_KEY_PREFIX + organization.id;
    const stored = localStorage.getItem(key);
    if (stored === "true") {
      setPermanentlyDismissed(true);
    }
  }, [organization]);

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleDontShowAgain = () => {
    if (!organization) return;
    const key = DISMISS_KEY_PREFIX + organization.id;
    localStorage.setItem(key, "true");
    setPermanentlyDismissed(true);
    setDismissed(true);
  };

  if (loading || !isComplimentary || dismissed || permanentlyDismissed) {
    return null;
  }

  return (
    <Alert className="relative border-primary/30 bg-primary/5 mb-3">
      <Gift className="w-4 h-4 text-primary" />
      <AlertTitle className="text-xs sm:text-sm font-semibold pr-8">
        🎉 Complimentary Team Access Active
      </AlertTitle>
      <AlertDescription className="text-[10px] sm:text-xs text-muted-foreground mt-1">
        Your organization has been granted complimentary Team-tier access
        {daysRemaining > 0 && <> for <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong></>}.
        Enjoy full platform features at no cost!
      </AlertDescription>
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground px-2"
          onClick={handleDontShowAgain}
        >
          Don't show again
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 w-6 h-6"
        onClick={handleDismiss}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </Alert>
  );
}

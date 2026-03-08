import { useMemo } from "react";
import { useOrgContext } from "@/contexts/OrgContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminAccess } from "@/hooks/useAdminData";
import { differenceInDays, isPast } from "date-fns";

export function useTrialStatus() {
  const { organization, organizationRole, loading: orgLoading } = useOrgContext();
  const { subscribed, isLoading: subLoading } = useSubscription();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();

  const trialStatus = useMemo(() => {
    // Platform admins/developers ALWAYS bypass trial — even without an org
    const canBypassTrial = isDeveloper;

    if (!organization) {
      return {
        isInTrial: false,
        isTrialExpired: false,
        trialDaysRemaining: 0,
        trialEndsAt: null,
        canBypassTrial,
        isOrgOwner: false,
        canManageBilling: canBypassTrial,
      };
    }

    const trialEndsAt = (organization as any).trial_ends_at
      ? new Date((organization as any).trial_ends_at)
      : null;

    const isOrgOwner = organizationRole === "owner";
    const canBypassTrial = isDeveloper; // Platform admins/devs bypass
    const canManageBilling = isDeveloper || isOrgOwner;

    if (!trialEndsAt) {
      return {
        isInTrial: false,
        isTrialExpired: false,
        trialDaysRemaining: 0,
        trialEndsAt: null,
        canBypassTrial,
        isOrgOwner,
        canManageBilling,
      };
    }

    const now = new Date();
    const isExpired = isPast(trialEndsAt);
    const daysRemaining = isExpired ? 0 : differenceInDays(trialEndsAt, now);
    const status = organization.subscription_status;
    const hasActiveSubscription = subscribed || status === "active";

    return {
      isInTrial: !isExpired && !hasActiveSubscription && (status === "trial" || status === "free" || !status),
      isTrialExpired: isExpired && !hasActiveSubscription,
      trialDaysRemaining: daysRemaining,
      trialEndsAt,
      canBypassTrial,
      isOrgOwner,
      canManageBilling,
    };
  }, [organization, organizationRole, subscribed, isDeveloper]);

  return {
    ...trialStatus,
    loading: orgLoading || subLoading || accessLoading,
  };
}

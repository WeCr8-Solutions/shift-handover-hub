import { useMemo } from "react";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminAccess } from "@/hooks/useAdminData";
import { differenceInDays, isPast } from "date-fns";

export function useTrialStatus() {
  const { organization, organizationRole, loading: orgLoading } = useUserOrganization();
  const { subscribed, isLoading: subLoading } = useSubscription();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();

  const trialStatus = useMemo(() => {
    if (!organization) {
      return {
        isInTrial: false,
        isTrialExpired: false,
        trialDaysRemaining: 0,
        trialEndsAt: null,
        canBypassTrial: false,
        isOrgOwner: false,
        canManageBilling: false,
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

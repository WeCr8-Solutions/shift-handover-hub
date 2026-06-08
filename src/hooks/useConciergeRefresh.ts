import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Invalidates every Concierge query touched by a remediation action so the UI
 * reflects new readiness/invite/email/account state without a manual reload.
 */
export function useConciergeRefresh(engagementId: string | null, organizationId: string | null) {
  const qc = useQueryClient();
  return useCallback(() => {
    if (organizationId) {
      qc.invalidateQueries({ queryKey: ["production-readiness", organizationId] });
      qc.invalidateQueries({ queryKey: ["concierge-owner-status", organizationId] });
      qc.invalidateQueries({ queryKey: ["concierge-team-status", organizationId] });
    }
    if (engagementId) {
      qc.invalidateQueries({ queryKey: ["onboarding-users-roles", engagementId] });
      qc.invalidateQueries({ queryKey: ["intake-users-roles", engagementId] });
      qc.invalidateQueries({ queryKey: ["onboarding-readiness", engagementId] });
      qc.invalidateQueries({ queryKey: ["concierge-invite-email-status", engagementId] });
      qc.invalidateQueries({ queryKey: ["engagement", engagementId] });
    }
  }, [qc, engagementId, organizationId]);
}

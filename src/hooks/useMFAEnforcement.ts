import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "./useUserOrganization";

export interface MFAStatus {
  orgRequiresMFA: boolean;
  userHasMFAEnrolled: boolean;
  mfaCheckComplete: boolean;
  /** True when org requires MFA but user has not enrolled */
  mfaBlockingAccess: boolean;
}

/**
 * Checks whether the current user's organization requires MFA and whether
 * the user has completed enrollment.
 *
 * When mfaBlockingAccess = true, the app should redirect to an MFA enrollment
 * screen before allowing access to protected routes.
 */
export function useMFAEnforcement(): MFAStatus {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const [orgRequiresMFA, setOrgRequiresMFA] = useState(false);
  const [userHasMFAEnrolled, setUserHasMFAEnrolled] = useState(false);
  const [mfaCheckComplete, setMfaCheckComplete] = useState(false);

  const checkMFA = useCallback(async () => {
    if (!user || !organization) {
      setMfaCheckComplete(true);
      return;
    }

    try {
      // 1. Check if org requires MFA
      const { data: orgData } = await supabase
        .from("organizations")
        .select("mfa_required")
        .eq("id", organization.id)
        .maybeSingle();

      const requiresMFA = orgData?.mfa_required ?? false;
      setOrgRequiresMFA(requiresMFA);

      if (!requiresMFA) {
        setUserHasMFAEnrolled(true); // irrelevant when not required
        setMfaCheckComplete(true);
        return;
      }

      // 2. Check user's MFA enrollment via Supabase Auth
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasVerifiedFactor = factors?.totp?.some(
        (f) => f.status === "verified"
      ) ?? false;

      setUserHasMFAEnrolled(hasVerifiedFactor);
    } catch (err) {
      console.error("[useMFAEnforcement] Error checking MFA status:", err);
    } finally {
      setMfaCheckComplete(true);
    }
  }, [user, organization]);

  useEffect(() => {
    checkMFA();
  }, [checkMFA]);

  return {
    orgRequiresMFA,
    userHasMFAEnrolled,
    mfaCheckComplete,
    mfaBlockingAccess: orgRequiresMFA && !userHasMFAEnrolled,
  };
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

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
      setOrgRequiresMFA(false);
      setUserHasMFAEnrolled(false);
      setMfaCheckComplete(true);
      return;
    }

    setMfaCheckComplete(false);

    try {
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("mfa_required")
        .eq("id", organization.id)
        .maybeSingle();

      if (orgError) {
        throw orgError;
      }

      const requiresMFA = orgData?.mfa_required ?? false;
      setOrgRequiresMFA(requiresMFA);

      if (!requiresMFA) {
        setUserHasMFAEnrolled(true);
        return;
      }

      const { data, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        throw factorsError;
      }

      const hasVerifiedFactor = data?.totp?.some((f) => f.status === "verified") ?? false;

      setUserHasMFAEnrolled(hasVerifiedFactor);
    } catch (err) {
      console.error("[useMFAEnforcement] Error checking MFA status:", err);
      setOrgRequiresMFA(false);
      setUserHasMFAEnrolled(false);
    } finally {
      setMfaCheckComplete(true);
    }
  }, [user, organization]);

  useEffect(() => {
    void checkMFA();
  }, [checkMFA]);

  return {
    orgRequiresMFA,
    userHasMFAEnrolled,
    mfaCheckComplete,
    mfaBlockingAccess: mfaCheckComplete && orgRequiresMFA && !userHasMFAEnrolled,
  };
}

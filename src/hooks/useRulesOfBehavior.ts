import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

/** Version label stamped into profiles.rob_version on acceptance. */
export const ROB_VERSION = "1.0-2026-04";

/** Canonical text of the Rules of Behavior. Stored on the profile row at acceptance time. */
export const RULES_OF_BEHAVIOR_TEXT =
  "As a user of JobLine AI (the System), I agree to the following Rules of Behavior:\n\n" +
  "1. AUTHORIZED USE — I will use the System only for legitimate, work-related purposes authorized " +
  "by my organization. I will not access another user's data or attempt to exceed my assigned permissions.\n\n" +
  "2. ACCOUNT SECURITY — I am responsible for keeping my credentials confidential. I will not share " +
  "my password or authentication tokens. I will immediately report suspected unauthorized access to my " +
  "organization administrator.\n\n" +
  "3. SENSITIVE DATA — I will not store, transmit, or process classified, export-controlled (ITAR/EAR), " +
  "or personally identifiable information (PII) beyond what the System is authorized to handle. I will " +
  "follow my organization's data classification policy.\n\n" +
  "4. ACCEPTABLE USE — I will not introduce malware, attempt to circumvent access controls, conduct " +
  "unauthorized vulnerability testing, or use the System to harass, threaten, or harm others.\n\n" +
  "5. REPORTING — I will report security incidents, suspected breaches, or policy violations immediately " +
  "to my organization administrator or via the disclosure contact at security@jobline.ai.\n\n" +
  "6. MONITORING — I acknowledge that system activity may be logged and monitored for security and " +
  "compliance purposes. Use of the System constitutes consent to such monitoring.\n\n" +
  "7. ACKNOWLEDGMENT — I understand that violations of these Rules may result in suspension of access, " +
  "disciplinary action, or legal consequences under applicable law.";

export interface RulesOfBehaviorStatus {
  robRequired: boolean;
  robAccepted: boolean;
  checkComplete: boolean;
  /** True when the user is authenticated but has not yet accepted the current RoB version */
  robBlockingAccess: boolean;
  acceptRob: () => Promise<{ error: string | null }>;
}

export function useRulesOfBehavior(): RulesOfBehaviorStatus {
  const { user } = useAuth();
  const { organization, loading: orgLoading } = useOrgContext();

  const [robAccepted, setRobAccepted] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  const checkStatus = useCallback(async () => {
    // Only org members are subject to FedRAMP RoB. Public/talent visitors are not.
    if (!user || orgLoading || !organization) {
      setRobAccepted(false);
      setCheckComplete(!orgLoading);
      return;
    }

    setCheckComplete(false);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("rob_accepted_at, rob_version")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      const profile = data as { rob_accepted_at: string | null; rob_version: string | null } | null;
      const accepted =
        profile?.rob_accepted_at != null && profile?.rob_version === ROB_VERSION;

      setRobAccepted(accepted);
    } catch (err) {
      console.error("[useRulesOfBehavior] Error checking RoB status:", err);
      setRobAccepted(false);
    } finally {
      setCheckComplete(true);
    }
  }, [user, organization, orgLoading]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const acceptRob = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          rob_accepted_at: new Date().toISOString(),
          rob_version: ROB_VERSION,
        } as never)
        .eq("user_id", user.id);

      if (error) throw error;

      setRobAccepted(true);
      return { error: null };
    } catch (err) {
      console.error("[useRulesOfBehavior] Error accepting RoB:", err);
      return { error: err instanceof Error ? err.message : "Failed to record acceptance" };
    }
  }, [user]);

  // Only required when the user is authenticated (unauthenticated visitors are never blocked)
  const robRequired = !!user;
  const robBlockingAccess = robRequired && checkComplete && !robAccepted;

  return { robRequired, robAccepted, checkComplete, robBlockingAccess, acceptRob };
}

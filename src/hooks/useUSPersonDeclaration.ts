import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

const DECLARATION_TEXT =
  "I certify that I am a United States Person as defined under 22 C.F.R. § 120.15 " +
  "(a U.S. citizen, lawful permanent resident, protected individual, or entity " +
  "incorporated in the U.S.), OR that my access to this system has been authorized " +
  "under an applicable export license or other written authorization. I understand " +
  "that making a false certification may subject me to civil and criminal penalties " +
  "under the International Traffic in Arms Regulations (ITAR) and other applicable " +
  "U.S. export control laws.";

export const US_PERSON_DECLARATION_TEXT = DECLARATION_TEXT;

export interface USPersonDeclarationStatus {
  orgRequiresDeclaration: boolean;
  userHasDeclared: boolean;
  checkComplete: boolean;
  /** True when org requires declaration but user has not completed it */
  declarationBlockingAccess: boolean;
  submitDeclaration: () => Promise<{ error: string | null }>;
}

export function useUSPersonDeclaration(): USPersonDeclarationStatus {
  const { user } = useAuth();
  const { organization } = useUserOrganization();

  const [orgRequiresDeclaration, setOrgRequiresDeclaration] = useState(false);
  const [userHasDeclared, setUserHasDeclared] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user || !organization) {
      setOrgRequiresDeclaration(false);
      setUserHasDeclared(false);
      setCheckComplete(true);
      return;
    }

    setCheckComplete(false);

    try {
      const [orgResult, profileResult] = await Promise.all([
        supabase.from("organizations").select("requires_us_person_declaration").eq("id", organization.id).maybeSingle(),
        supabase.from("profiles").select("us_person_declared").eq("user_id", user.id).maybeSingle(),
      ]);

      if (orgResult.error) throw orgResult.error;
      if (profileResult.error) throw profileResult.error;

      const requiresDeclaration = orgResult.data?.requires_us_person_declaration ?? false;
      const hasDeclared = profileResult.data?.us_person_declared ?? false;

      setOrgRequiresDeclaration(requiresDeclaration);
      setUserHasDeclared(hasDeclared);
    } catch (err) {
      console.error("[useUSPersonDeclaration] Error checking status:", err);
      setOrgRequiresDeclaration(false);
      setUserHasDeclared(false);
    } finally {
      setCheckComplete(true);
    }
  }, [user, organization]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const submitDeclaration = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          us_person_declared: true,
          us_person_declared_at: new Date().toISOString(),
          us_person_declaration_text: DECLARATION_TEXT,
        })
        .eq("user_id", user.id);

      if (error) return { error: error.message };

      const { error: logError } = await supabase.from("activity_logs").insert({
        user_id: user.id,
        activity_type: "us_person_declaration" as any,
        description: "User completed US Person self-certification",
        organization_id: organization?.id ?? null,
        metadata: {
          declaration_text_hash: btoa(DECLARATION_TEXT).slice(0, 32),
        },
      });

      if (logError) {
        console.error("[useUSPersonDeclaration] Failed to log declaration:", logError);
      }

      setUserHasDeclared(true);
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { error: msg };
    }
  }, [user, organization]);

  return {
    orgRequiresDeclaration,
    userHasDeclared,
    checkComplete,
    declarationBlockingAccess: checkComplete && orgRequiresDeclaration && !userHasDeclared,
    submitDeclaration,
  };
}

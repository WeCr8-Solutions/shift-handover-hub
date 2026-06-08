/**
 * Customer-facing concierge intake wizard hooks.
 * Reads/writes onboarding_intake_responses + advances admin checklist via RPC.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { woToast } from "@/lib/woToast";

export type IntakeModuleKey =
  | "org_profile"
  | "equipment"
  | "stations"
  | "users_roles"
  | "routing"
  | "quality"
  | "erp"
  | "training"
  | "documents"
  | "review";

export interface IntakeResponse {
  id: string;
  engagement_id: string;
  organization_id: string;
  module_key: IntakeModuleKey;
  payload: Record<string, any>;
  submitted_at: string;
  version: number;
}

export function useActiveEngagement(orgId: string | null) {
  return useQuery({
    queryKey: ["active-engagement", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("onboarding_status, onboarding_engagement_id")
        .eq("id", orgId!)
        .maybeSingle();
      if (error) throw error;
      const engId = (data as any)?.onboarding_engagement_id;
      if (!engId) return null;
      const { data: eng, error: e2 } = await supabase
        .from("onboarding_engagements" as any)
        .select("id, status, percent_complete, payment_status, contract_signed_at, purchased_via, organization_id")
        .eq("id", engId)
        .maybeSingle();
      if (e2) throw e2;
      return eng as any;
    },
  });
}

export function useIntakeResponses(engagementId: string | null) {
  return useQuery({
    queryKey: ["intake-responses", engagementId],
    enabled: !!engagementId,
    queryFn: async (): Promise<IntakeResponse[]> => {
      const { data, error } = await supabase
        .from("onboarding_intake_responses" as any)
        .select("*")
        .eq("engagement_id", engagementId!);
      if (error) throw error;
      return (data ?? []) as unknown as IntakeResponse[];
    },
  });
}

export function useCustomerChecklist(engagementId: string | null) {
  return useQuery({
    queryKey: ["customer-checklist", engagementId],
    enabled: !!engagementId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_checklist_items" as any)
        .select("id, module_key, label, status, customer_blocker_note, required, sort_order")
        .eq("engagement_id", engagementId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useSubmitIntakeStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      engagementId: string;
      moduleKey: IntakeModuleKey;
      payload: Record<string, any>;
    }) => {
      const { error } = await supabase.rpc("submit_intake_step" as any, {
        p_engagement_id: input.engagementId,
        p_module_key: input.moduleKey,
        p_payload: input.payload,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["intake-responses", vars.engagementId] });
      qc.invalidateQueries({ queryKey: ["customer-checklist", vars.engagementId] });
      qc.invalidateQueries({ queryKey: ["active-engagement"] });
      woToast.success("Saved");
    },
    onError: (e: any) => woToast.error(e?.message ?? "Could not save"),
  });
}

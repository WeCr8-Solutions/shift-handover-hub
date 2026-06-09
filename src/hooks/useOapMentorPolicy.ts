/**
 * Per-org OAP mentor bypass policy.
 *
 * Defaults when no row exists:
 *   org_role_auto_mentors = true
 *   delay_day_fallback_enabled = true
 *   delay_days = 30
 *   allow_self_certify_on_delay = false
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OapMentorPolicy {
  organization_id: string;
  org_role_auto_mentors: boolean;
  delay_day_fallback_enabled: boolean;
  delay_days: number;
  allow_self_certify_on_delay: boolean;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
}

const TABLE = "oap_mentor_policy";

export const DEFAULT_POLICY: Omit<OapMentorPolicy, "organization_id" | "updated_by" | "updated_at"> = {
  org_role_auto_mentors: true,
  delay_day_fallback_enabled: true,
  delay_days: 30,
  allow_self_certify_on_delay: false,
  notes: null,
};

export function useOapMentorPolicy(orgId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["oap-mentor-policy", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<OapMentorPolicy> => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return {
          organization_id: orgId!,
          ...DEFAULT_POLICY,
          updated_by: null,
          updated_at: new Date().toISOString(),
        };
      }
      return data as OapMentorPolicy;
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<Omit<OapMentorPolicy, "organization_id" | "updated_at" | "updated_by">>) => {
      if (!orgId) throw new Error("Missing organization");
      const { data: auth } = await supabase.auth.getUser();
      const payload = {
        organization_id: orgId,
        ...DEFAULT_POLICY,
        ...(query.data ?? {}),
        ...patch,
        updated_by: auth.user?.id ?? null,
      };
      const { error } = await (supabase as any)
        .from(TABLE)
        .upsert(payload, { onConflict: "organization_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("OAP mentor policy updated");
      qc.invalidateQueries({ queryKey: ["oap-mentor-policy", orgId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save policy"),
  });

  return { policy: query.data, isLoading: query.isLoading, save };
}

/** Server-side authoritative check via SECURITY DEFINER RPC. */
export async function checkCanCertifyOap(userId: string, enrollmentId: string) {
  const { data, error } = await (supabase as any).rpc("can_certify_oap", {
    _user_id: userId,
    _enrollment_id: enrollmentId,
  });
  if (error) throw error;
  return data as {
    allowed: boolean;
    reason: string;
    role?: string;
    days_elapsed?: number;
    delay_days?: number;
  };
}

/**
 * Hooks for the platform-admin Onboarding Services workspace.
 * All writes are gated server-side by `has_role(admin|developer)`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Engagement {
  id: string;
  organization_id: string;
  purchased_via: "stripe" | "manual" | "complimentary";
  plan_tier: string;
  assigned_admin_id: string | null;
  status: "intake" | "in_progress" | "review" | "ready_for_production" | "live" | "cancelled";
  percent_complete: number;
  notes: string | null;
  started_at: string;
  ready_at: string | null;
  went_live_at: string | null;
  created_at: string;
  updated_at: string;
  payment_status: "unpaid" | "invoiced" | "paid" | "refunded" | "waived";
  payment_method: string | null;
  payment_reference: string | null;
  payment_amount_cents: number;
  payment_received_at: string | null;
  payment_proof_path: string | null;
  contract_signed_at: string | null;
  contract_signer_name: string | null;
  contract_signer_title: string | null;
  contract_proof_path: string | null;
  sales_rep_id: string | null;
  organizations?: { id: string; name: string; slug: string; requires_us_person_declaration: boolean | null } | null;
}

export interface ChecklistItem {
  id: string;
  engagement_id: string;
  organization_id: string;
  module_key: string;
  label: string;
  sort_order: number;
  required: boolean;
  status: "todo" | "in_progress" | "blocked" | "done" | "skipped";
  customer_blocker_note: string | null;
  completed_by: string | null;
  completed_at: string | null;
}

export function useEngagementsList() {
  return useQuery({
    queryKey: ["onboarding-engagements"],
    queryFn: async (): Promise<Engagement[]> => {
      const { data, error } = await supabase
        .from("onboarding_engagements" as any)
        .select("*, organizations:organization_id(id,name,slug,requires_us_person_declaration)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Engagement[];
    },
  });
}

export function useEngagement(engagementId: string | null) {
  return useQuery({
    queryKey: ["onboarding-engagement", engagementId],
    enabled: !!engagementId,
    queryFn: async (): Promise<Engagement | null> => {
      const { data, error } = await supabase
        .from("onboarding_engagements" as any)
        .select("*, organizations:organization_id(id,name,slug,requires_us_person_declaration)")
        .eq("id", engagementId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Engagement | null;
    },
  });
}

export function useChecklist(engagementId: string | null) {
  return useQuery({
    queryKey: ["onboarding-checklist", engagementId],
    enabled: !!engagementId,
    queryFn: async (): Promise<ChecklistItem[]> => {
      const { data, error } = await supabase
        .from("onboarding_checklist_items" as any)
        .select("*")
        .eq("engagement_id", engagementId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChecklistItem[];
    },
  });
}

export function useCreateEngagement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { organization_id: string; plan_tier?: string; notes?: string }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      const { data, error } = await supabase
        .from("onboarding_engagements" as any)
        .insert({
          organization_id: input.organization_id,
          plan_tier: input.plan_tier ?? "standard",
          notes: input.notes ?? null,
          purchased_via: "manual",
          created_by: uid,
          assigned_admin_id: uid,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Flip org status + seed checklist
      await supabase
        .from("organizations")
        .update({ onboarding_status: "concierge_in_progress", onboarding_engagement_id: (data as any).id })
        .eq("id", input.organization_id);

      await supabase.rpc("seed_onboarding_checklist" as any, { p_engagement_id: (data as any).id });
      return (data as any).id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
      toast.success("Engagement created");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create engagement"),
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: ChecklistItem["status"];
      customer_blocker_note?: string | null;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const patch: Record<string, unknown> = {};
      if (input.status !== undefined) {
        patch.status = input.status;
        patch.completed_at = input.status === "done" ? new Date().toISOString() : null;
        patch.completed_by = input.status === "done" ? userRes.user?.id ?? null : null;
      }
      if (input.customer_blocker_note !== undefined) patch.customer_blocker_note = input.customer_blocker_note;

      const { error } = await supabase
        .from("onboarding_checklist_items" as any)
        .update(patch)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["onboarding-checklist"] });
      qc.invalidateQueries({ queryKey: ["onboarding-engagement"] });
      qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update item"),
  });
}

export function useMarkReady() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (engagementId: string) => {
      const { error } = await supabase.rpc("mark_engagement_ready" as any, { p_engagement_id: engagementId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
      qc.invalidateQueries({ queryKey: ["onboarding-engagement"] });
      toast.success("Marked ready for production");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not mark ready"),
  });
}

export function useActivateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (engagementId: string) => {
      const { error } = await supabase.rpc("activate_org_for_production" as any, { p_engagement_id: engagementId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
      qc.invalidateQueries({ queryKey: ["onboarding-engagement"] });
      toast.success("Customer is now live");
    },
    onError: (e: any) => toast.error(e?.message ?? "Activation failed"),
  });
}

export function useOrgsForOnboarding() {
  // Orgs that don't currently have an active engagement
  return useQuery({
    queryKey: ["onboarding-eligible-orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, onboarding_status, requires_us_person_declaration")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface ReadinessResult {
  ready: boolean;
  blockers: string[];
  counts: Record<string, number | boolean | string>;
}

export function useProductionReadiness(orgId: string | null) {
  return useQuery({
    queryKey: ["onboarding-readiness", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<ReadinessResult | null> => {
      const { data, error } = await supabase.rpc("verify_org_production_ready" as any, { p_org_id: orgId });
      if (error) throw error;
      return data as unknown as ReadinessResult;
    },
  });
}

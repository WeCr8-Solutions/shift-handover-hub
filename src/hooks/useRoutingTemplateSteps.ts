/**
 * Concierge routing template steps CRUD + reorder.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoutingTemplateStep {
  id: string;
  template_id: string;
  step_number: number;
  operation_type: string;
  operation_name: string;
  work_center_type: string | null;
  setup_time_minutes: number | null;
  cycle_time_minutes: number | null;
  first_article_minutes: number | null;
  estimated_duration: number | null;
  instructions: string | null;
}

export function useRoutingTemplateSteps(templateId: string | null) {
  const qc = useQueryClient();
  const queryKey = ["concierge-routing-template-steps", templateId];

  const query = useQuery<RoutingTemplateStep[]>({
    queryKey,
    enabled: !!templateId,
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await (supabase as any)
        .from("routing_template_steps")
        .select("*")
        .eq("template_id", templateId)
        .order("step_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RoutingTemplateStep[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const upsert = useMutation({
    mutationFn: async (input: { stepId?: string | null; patch: Record<string, any> }) => {
      if (!templateId) throw new Error("Missing template");
      const { error } = await (supabase as any).rpc("concierge_upsert_template_step", {
        _template_id: templateId,
        _step_id: input.stepId ?? null,
        _patch: input.patch,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await (supabase as any).rpc("concierge_delete_template_step", { _step_id: stepId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Step deleted"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!templateId) throw new Error("Missing template");
      const { error } = await (supabase as any).rpc("concierge_reorder_template_steps", {
        _template_id: templateId, _ordered_step_ids: orderedIds,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e?.message ?? "Reorder failed"),
  });

  return { query, upsert, remove, reorder };
}

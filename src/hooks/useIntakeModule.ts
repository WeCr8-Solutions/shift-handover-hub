/**
 * Generic CRUD hook for concierge intake modules.
 * Dispatches to the live production table per `INTAKE_MODULE_CONFIGS`.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INTAKE_MODULE_CONFIGS } from "@/lib/concierge/intakeModuleSchema";

export function useIntakeModule(module: string, orgId: string | null | undefined) {
  const qc = useQueryClient();
  const config = INTAKE_MODULE_CONFIGS[module];
  const enabled = !!orgId && !!config;

  const list = useQuery({
    queryKey: ["intake-module", module, orgId],
    enabled,
    queryFn: async () => {
      if (!config) return [];
      const { data, error } = await (supabase as any)
        .from(config.table)
        .select("*")
        .eq(config.orgColumn, orgId!)
        .order(config.orderBy ?? "created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Record<string, any>[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["intake-module", module, orgId] });
    qc.invalidateQueries({ queryKey: ["concierge-select-options"] });
    qc.invalidateQueries({ queryKey: ["org-structure", orgId] });
  };

  const create = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!config || !orgId) throw new Error("Missing module config or organization");
      const payload: Record<string, any> = {
        ...(config.defaults ?? {}),
        ...values,
        [config.orgColumn]: orgId,
      };
      if (config.authDefaults) {
        const { data: u } = await supabase.auth.getUser();
        for (const [col, src] of Object.entries(config.authDefaults)) {
          if (payload[col] == null && src === "user_id") payload[col] = u.user?.id ?? null;
        }
      }
      const { error } = await (supabase as any).from(config.table).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${config?.noun ?? "Record"} created`);
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Create failed"),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; values: Record<string, any> }) => {
      if (!config) throw new Error("Missing module config");
      const { error } = await (supabase as any)
        .from(config.table)
        .update(input.values)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!config) throw new Error("Missing module config");
      const { error } = await (supabase as any).from(config.table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  return { list, create, update, remove, config };
}

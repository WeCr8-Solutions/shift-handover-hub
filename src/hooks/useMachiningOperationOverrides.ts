import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";

export interface MachiningOperationOverride {
  id: string;
  organization_id: string;
  operation_id: string;
  is_hidden: boolean;
  required_for_roles: string[];
  notes: string | null;
}

/**
 * Per-org overrides for canonical machining operations.
 * Lets supervisors/org admins hide an op or mark it as required-for-roles
 * without mutating the canonical seed.
 */
export function useMachiningOperationOverrides() {
  const { organization } = useOrgContext();
  const [overrides, setOverrides] = useState<MachiningOperationOverride[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!organization?.id) {
      setOverrides([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("org_machining_operation_overrides")
      .select("*")
      .eq("organization_id", organization.id);
    if (error) {
      console.error("override fetch failed", error);
      setOverrides([]);
    } else {
      setOverrides((data ?? []) as MachiningOperationOverride[]);
    }
    setLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsert = useCallback(
    async (
      operationId: string,
      patch: Partial<Omit<MachiningOperationOverride, "id" | "organization_id" | "operation_id">>
    ) => {
      if (!organization?.id) throw new Error("No organization");
      const existing = overrides.find((o) => o.operation_id === operationId);
      const payload = {
        organization_id: organization.id,
        operation_id: operationId,
        is_hidden: patch.is_hidden ?? existing?.is_hidden ?? false,
        required_for_roles:
          patch.required_for_roles ?? existing?.required_for_roles ?? [],
        notes: patch.notes ?? existing?.notes ?? null,
      };
      const { error } = await supabase
        .from("org_machining_operation_overrides")
        .upsert(payload, { onConflict: "organization_id,operation_id" });
      if (error) throw error;
      await refresh();
    },
    [organization?.id, overrides, refresh]
  );

  const clear = useCallback(
    async (operationId: string) => {
      if (!organization?.id) return;
      await supabase
        .from("org_machining_operation_overrides")
        .delete()
        .eq("organization_id", organization.id)
        .eq("operation_id", operationId);
      await refresh();
    },
    [organization?.id, refresh]
  );

  return { overrides, loading, refresh, upsert, clear };
}

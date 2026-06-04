import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { DEFAULT_DOWNTIME_REASONS, type DowntimeReason } from "@/lib/downtimeReasons";

export interface OrgDowntimeReason extends DowntimeReason {
  id: string;
  is_active: boolean;
}

/**
 * Fetch org-scoped downtime reason taxonomy. Falls back to canonical
 * defaults when the org hasn't customized any.
 */
export function useDowntimeReasons() {
  const { organization } = useOrgContext();
  const orgId = organization?.id;
  const [reasons, setReasons] = useState<OrgDowntimeReason[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!orgId) {
      setReasons(
        DEFAULT_DOWNTIME_REASONS.map((r) => ({
          ...r,
          id: `default:${r.code}`,
          is_active: true,
        })),
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("org_downtime_reasons" as any)
      .select("*")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true });

    if (error || !data || (data as any[]).length === 0) {
      setReasons(
        DEFAULT_DOWNTIME_REASONS.map((r) => ({
          ...r,
          id: `default:${r.code}`,
          is_active: true,
        })),
      );
    } else {
      setReasons(data as unknown as OrgDowntimeReason[]);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: Omit<DowntimeReason, "sort_order"> & { sort_order?: number }) => {
      if (!orgId) return { error: "No active organization" };
      const { error } = await supabase.from("org_downtime_reasons" as any).insert({
        organization_id: orgId,
        code: input.code,
        label: input.label,
        category: input.category,
        sort_order: input.sort_order ?? 500,
      });
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [orgId, refresh],
  );

  const update = useCallback(
    async (id: string, patch: Partial<OrgDowntimeReason>) => {
      const { error } = await supabase
        .from("org_downtime_reasons" as any)
        .update(patch as any)
        .eq("id", id);
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("org_downtime_reasons" as any)
        .delete()
        .eq("id", id);
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [refresh],
  );

  return { reasons, loading, refresh, create, update, remove };
}

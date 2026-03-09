import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { Json } from "@/integrations/supabase/types";

export interface WorkCenterConfig {
  id: string;
  organization_id: string | null;
  work_center_type: string;
  display_name: string;
  default_cycle_time: number | null;
  default_setup_time: number | null;
  requires_first_article: boolean;
  requires_qa_signoff: boolean;
  track_scrap: boolean;
  track_rework: boolean;
  custom_fields: Json;
  is_active: boolean;
  sort_order: number;
}

export function useWorkCenterConfigs() {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [workCenterConfigs, setWorkCenterConfigs] = useState<
    WorkCenterConfig[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from("work_center_config")
        .select("*")
        .order("sort_order");

      if (organization?.id) {
        query = query.eq("organization_id", organization.id);
      }

      const { data } = await query;

      if (data) {
        setWorkCenterConfigs(data as WorkCenterConfig[]);
      }
    } catch (error) {
      console.error("Error fetching work center configs:", error);
    }

    setLoading(false);
  }, [user, organization?.id]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const createWorkCenterConfig = async (
    config: Omit<WorkCenterConfig, "id">
  ) => {
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("work_center_config").insert({
      organization_id: organization?.id || null,
      work_center_type: config.work_center_type,
      display_name: config.display_name,
      default_cycle_time: config.default_cycle_time,
      default_setup_time: config.default_setup_time,
      requires_first_article: config.requires_first_article,
      requires_qa_signoff: config.requires_qa_signoff,
      track_scrap: config.track_scrap,
      track_rework: config.track_rework,
      is_active: config.is_active,
      sort_order: config.sort_order,
    });

    if (error) return { error: error.message };
    await fetchConfigs();
    return { error: null };
  };

  const updateWorkCenterConfig = async (
    id: string,
    updates: Partial<WorkCenterConfig>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { custom_fields, ...safeUpdates } = updates;
    const { error } = await supabase
      .from("work_center_config")
      .update(safeUpdates)
      .eq("id", id);

    if (error) return { error: error.message };
    await fetchConfigs();
    return { error: null };
  };

  return {
    workCenterConfigs,
    loading,
    refresh: fetchConfigs,
    createWorkCenterConfig,
    updateWorkCenterConfig,
  };
}

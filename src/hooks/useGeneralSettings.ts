import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { Json } from "@/integrations/supabase/types";

export interface AppSetting {
  id: string;
  organization_id: string | null;
  team_id: string | null;
  setting_key: string;
  setting_value: Record<string, unknown>;
  setting_type: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export function useGeneralSettings() {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  /** Track the org id we last fetched for to avoid stale cross-org reads. */
  const lastFetchedOrgRef = useRef<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      let query = supabase
        .from("app_settings")
        .select("*")
        .order("setting_key");

      // Scope to the current org when available
      if (organization?.id) {
        query = query.eq("organization_id", organization.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching settings:", error);
      } else if (data) {
        setSettings(data as AppSetting[]);
        lastFetchedOrgRef.current = organization?.id ?? null;
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }

    setLoading(false);
  }, [user, organization?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback(
    (key: string): Record<string, unknown> | null => {
      const setting = settings.find((s) => s.setting_key === key);
      return setting?.setting_value ?? null;
    },
    [settings]
  );

  const updateSetting = async (
    key: string,
    value: Record<string, unknown>,
    type = "general"
  ) => {
    if (!user) return { error: "Not authenticated" };
    if (!organization?.id)
      return {
        error: "No organization found. Please join or create an organization first.",
      };

    // Use upsert with the unique constraint (organization_id, team_id, setting_key)
    // to avoid race conditions between find-then-insert/update.
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        {
          organization_id: organization.id,
          team_id: null,
          setting_key: key,
          setting_value: value as Json,
          setting_type: type,
          updated_by: user.id,
        },
        { onConflict: "organization_id,team_id,setting_key" }
      );

    if (error) return { error: error.message };

    await fetchSettings();
    return { error: null };
  };

  return {
    settings,
    loading,
    refresh: fetchSettings,
    getSetting,
    updateSetting,
  };
}

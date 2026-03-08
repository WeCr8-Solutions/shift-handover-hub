import { useState, useEffect, useCallback } from "react";
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

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .order("setting_key");

      if (data) {
        setSettings(data as AppSetting[]);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback(
    (key: string): Record<string, unknown> | null => {
      const setting = settings.find((s) => s.setting_key === key);
      return setting?.setting_value || null;
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

    const existingSetting = settings.find((s) => s.setting_key === key);

    if (existingSetting) {
      const { error } = await supabase
        .from("app_settings")
        .update({
          setting_value: value as Json,
          updated_by: user.id,
        })
        .eq("id", existingSetting.id);

      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("app_settings").insert({
        organization_id: organization.id,
        setting_key: key,
        setting_value: value as Json,
        setting_type: type,
        updated_by: user.id,
      });

      if (error) return { error: error.message };
    }

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

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "./useUserOrganization";
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

export interface ShiftSchedule {
  id: string;
  organization_id: string | null;
  team_id: string | null;
  shift_name: string;
  shift_code: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  is_active: boolean;
  color: string;
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  email_handoff_alerts: boolean;
  email_quality_alerts: boolean;
  email_machine_down: boolean;
  email_shift_reminders: boolean;
  email_weekly_summary: boolean;
  push_enabled: boolean;
  push_urgent_only: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

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

export function useAppSettings() {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  const [workCenterConfigs, setWorkCenterConfigs] = useState<WorkCenterConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      // Fetch app settings
      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("*")
        .order("setting_key");
      
      if (settingsData) {
        setSettings(settingsData as AppSetting[]);
      }

      // Fetch shift schedules
      const { data: shiftsData } = await supabase
        .from("shift_schedules")
        .select("*")
        .order("start_time");
      
      if (shiftsData) {
        setShifts(shiftsData as ShiftSchedule[]);
      }

      // Fetch notification preferences
      const { data: notifData } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (notifData) {
        setNotifications(notifData as NotificationPreferences);
      } else {
        // Create default preferences
        setNotifications({
          user_id: user.id,
          email_handoff_alerts: true,
          email_quality_alerts: true,
          email_machine_down: true,
          email_shift_reminders: false,
          email_weekly_summary: true,
          push_enabled: false,
          push_urgent_only: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
        });
      }

      // Fetch work center configs
      const { data: wcData } = await supabase
        .from("work_center_config")
        .select("*")
        .order("sort_order");
      
      if (wcData) {
        setWorkCenterConfigs(wcData as WorkCenterConfig[]);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: Record<string, unknown>, type = "general") => {
    if (!user) return { error: "Not authenticated" };
    if (!organization?.id) return { error: "No organization found. Please join or create an organization first." };

    const existingSetting = settings.find(s => s.setting_key === key);
    
    if (existingSetting) {
      const { error } = await supabase
        .from("app_settings")
        .update({ 
          setting_value: value as Json,
          updated_by: user.id 
        })
        .eq("id", existingSetting.id);
      
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("app_settings")
        .insert({
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

  const getSetting = (key: string): Record<string, unknown> | null => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || null;
  };

  const createShift = async (shift: Omit<ShiftSchedule, "id">) => {
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("shift_schedules")
      .insert({
        organization_id: organization?.id || null,
        ...shift,
      });

    if (error) return { error: error.message };
    await fetchSettings();
    return { error: null };
  };

  const updateShift = async (id: string, updates: Partial<ShiftSchedule>) => {
    const { error } = await supabase
      .from("shift_schedules")
      .update(updates)
      .eq("id", id);

    if (error) return { error: error.message };
    await fetchSettings();
    return { error: null };
  };

  const deleteShift = async (id: string) => {
    const { error } = await supabase
      .from("shift_schedules")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };
    await fetchSettings();
    return { error: null };
  };

  const updateNotifications = async (prefs: Partial<NotificationPreferences>) => {
    if (!user) return { error: "Not authenticated" };

    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("notification_preferences")
        .update(prefs)
        .eq("user_id", user.id);
      
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("notification_preferences")
        .insert({
          user_id: user.id,
          ...prefs,
        });
      
      if (error) return { error: error.message };
    }

    await fetchSettings();
    return { error: null };
  };

  const createWorkCenterConfig = async (config: Omit<WorkCenterConfig, "id">) => {
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("work_center_config")
      .insert({
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
    await fetchSettings();
    return { error: null };
  };

  const updateWorkCenterConfig = async (id: string, updates: Partial<WorkCenterConfig>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { custom_fields, ...safeUpdates } = updates;
    const { error } = await supabase
      .from("work_center_config")
      .update(safeUpdates)
      .eq("id", id);

    if (error) return { error: error.message };
    await fetchSettings();
    return { error: null };
  };

  return {
    settings,
    shifts,
    notifications,
    workCenterConfigs,
    loading,
    refresh: fetchSettings,
    updateSetting,
    getSetting,
    createShift,
    updateShift,
    deleteShift,
    updateNotifications,
    createWorkCenterConfig,
    updateWorkCenterConfig,
  };
}

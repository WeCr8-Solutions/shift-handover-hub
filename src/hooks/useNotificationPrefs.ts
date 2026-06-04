import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  subscribe_all_stations: boolean;
  subscribed_station_ids: string[];
}

export function useNotificationPrefs() {
  const { user } = useAuth();
  const [notifications, setNotifications] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setNotifications({
          ...(data as any),
          subscribe_all_stations: (data as any).subscribe_all_stations ?? true,
          subscribed_station_ids: (data as any).subscribed_station_ids ?? [],
        } as NotificationPreferences);
      } else {
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
          subscribe_all_stations: true,
          subscribed_station_ids: [],
        });
      }
    } catch (error) {
      console.error("Error fetching notification prefs:", error);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const updateNotifications = async (
    prefs: Partial<NotificationPreferences>
  ) => {
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

    await fetchNotifications();
    return { error: null };
  };

  return {
    notifications,
    loading,
    refresh: fetchNotifications,
    updateNotifications,
  };
}

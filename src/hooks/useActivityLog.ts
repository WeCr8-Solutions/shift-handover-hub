import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database, Json } from "@/integrations/supabase/types";

type ActivityType = Database["public"]["Enums"]["activity_type"];
type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export type { ActivityType, ActivityLogRow };

export function useActivityLog() {
  const { user, profile } = useAuth();

  const logActivity = useCallback(
    async (
      activityType: ActivityType,
      description: string,
      metadata: Record<string, unknown> = {}
    ) => {
      if (!user) return { error: new Error("User not authenticated") };

      const { error } = await supabase.from("activity_logs").insert({
        user_id: user.id,
        user_email: user.email || null,
        user_display_name: profile?.display_name || null,
        activity_type: activityType,
        description,
        metadata: metadata as unknown as Json,
      });

      if (error) {
        console.error("Failed to log activity:", error);
      }

      return { error };
    },
    [user, profile]
  );

  return { logActivity };
}

export function useActivityLogs(limit = 50) {
  const fetchActivityLogs = useCallback(async (filters?: {
    activityType?: ActivityType;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    let query = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filters?.activityType) {
      query = query.eq("activity_type", filters.activityType);
    }
    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query;

    return { data, error };
  }, [limit]);

  return { fetchActivityLogs };
}

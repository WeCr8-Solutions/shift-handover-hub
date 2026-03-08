import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "./useUserOrganization";
import { toast } from "sonner";

export interface OperatorSession {
  id: string;
  user_id: string;
  station_id: string;
  organization_id: string | null;
  checked_in_at: string;
  checked_out_at: string | null;
  shift: string;
  is_active: boolean;
  created_at: string;
  station?: {
    id: string;
    name: string;
    station_id: string;
    work_center: string;
    work_center_type: string;
    is_active: boolean;
  };
}

export function useOperatorSessions() {
  const { user, profile } = useAuth();
  const { organization } = useUserOrganization();
  const [activeSessions, setActiveSessions] = useState<OperatorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedOnce = useRef(false);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setActiveSessions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("operator_station_sessions")
      .select(`
        *,
        station:stations(id, name, station_id, work_center, work_center_type, is_active)
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("checked_in_at", { ascending: true });

    if (!error && data) {
      setActiveSessions(data as unknown as OperatorSession[]);
    }
    hasFetchedOnce.current = true;
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`operator-sessions-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "operator_station_sessions",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchSessions();
      })
      .subscribe((status) => {
        // On channel error, do an immediate refetch
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          fetchSessions();
        }
      });

    // Polling fallback: 5-minute intervals
    let pollTimeout: ReturnType<typeof setTimeout>;
    const poll = () => {
      fetchSessions();
      pollTimeout = setTimeout(poll, 300000);
    };
    pollTimeout = setTimeout(poll, 300000);

    return () => {
      clearTimeout(pollTimeout);
      supabase.removeChannel(channel);
    };
  }, [user, fetchSessions]);

  const checkIn = async (stationIds: string[], shift: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const rows = stationIds.map((station_id) => ({
      user_id: user.id,
      station_id,
      shift,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from("operator_station_sessions")
      .insert(rows)
      .select(`
        *,
        station:stations(id, name, station_id, work_center, work_center_type, is_active)
      `);

    if (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in to stations");
    } else {
      // Sync operator presence to station status for dashboard visibility
      const operatorName = profile?.display_name || user.email || "Operator";
      for (const sid of stationIds) {
        await supabase
          .from("current_station_status")
          .upsert(
            {
              station_id: sid,
              current_operator_name: operatorName,
              current_operator_id: user.id,
            },
            { onConflict: "station_id" }
          );
      }

      toast.success(`Checked in to ${stationIds.length} station(s)`);
      await fetchSessions();
    }

    return { data, error };
  };

  const checkOut = async (sessionId?: string) => {
    if (!user) return;

    // Capture station IDs before updating sessions so we can clear their status
    const sessionsToEnd = sessionId
      ? activeSessions.filter((s) => s.id === sessionId)
      : activeSessions;

    const now = new Date().toISOString();

    let query = supabase
      .from("operator_station_sessions")
      .update({ is_active: false, checked_out_at: now })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (sessionId) {
      query = query.eq("id", sessionId);
    }

    const { error } = await query;

    if (error) {
      console.error("Check-out error:", error);
      toast.error("Failed to check out");
    } else {
      // Clear operator from station status on checkout
      for (const session of sessionsToEnd) {
        await supabase
          .from("current_station_status")
          .upsert(
            {
              station_id: session.station_id,
              current_operator_name: null,
              current_operator_id: null,
            },
            { onConflict: "station_id" }
          );
      }

      toast.success(sessionId ? "Checked out from station" : "Shift ended — checked out from all stations");
      await fetchSessions();
    }
  };

  const isCheckedIn = activeSessions.length > 0;

  return {
    activeSessions,
    loading,
    isCheckedIn,
    checkIn,
    checkOut,
    refresh: fetchSessions,
  };
}

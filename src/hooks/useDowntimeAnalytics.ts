import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";

export interface DowntimeAnalyticsEntry {
  reason_code: string | null;
  duration_minutes: number | null;
  started_at: string;
  ended_at: string | null;
  station_id: string | null;
}

/**
 * Fetch downtime events for the active org over the last N days (default 30).
 */
export function useDowntimeAnalytics(days = 30) {
  const { organization } = useOrgContext();
  const orgId = organization?.id;
  const [events, setEvents] = useState<DowntimeAnalyticsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!orgId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabase
      .from("downtime_events")
      .select("reason_code, duration_minutes, started_at, ended_at, station_id")
      .eq("organization_id", orgId)
      .gte("started_at", since.toISOString())
      .order("started_at", { ascending: false })
      .limit(1000);
    if (error) {
      console.error("downtime fetch error", error);
      setEvents([]);
    } else {
      setEvents((data ?? []) as DowntimeAnalyticsEntry[]);
    }
    setLoading(false);
  }, [orgId, days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, refresh };
}

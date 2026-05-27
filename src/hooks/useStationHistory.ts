import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";

export interface StationHistoryFilters {
  date_from?: string; // ISO date
  date_to?: string;   // ISO date
  station_id?: string;
  team_id?: string;
}

export interface StationHandoffRow {
  id: string;
  date: string;
  shift: string;
  station_id: string | null;
  station_name: string | null;
  work_order: string;
  part_number: string;
  operation_number: string;
  outgoing_operator_name: string;
  incoming_operator_name: string;
  supervisor_name: string | null;
  primary_state: string;
  state_reason: string | null;
  created_at: string;
}

export interface StationDowntimeRow {
  id: string;
  station_id: string | null;
  station_name: string | null;
  downtime_type: string;
  reason_code: string | null;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  reported_by_name: string | null;
  resolved_by_name: string | null;
}

export interface StationSessionRow {
  id: string;
  station_id: string;
  station_name: string | null;
  user_id: string;
  shift: string;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
}

export interface StationHistoryBundle {
  handoffs: StationHandoffRow[];
  downtime: StationDowntimeRow[];
  sessions: StationSessionRow[];
}

export function useStationHistory(filters: StationHistoryFilters) {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const [bundle, setBundle] = useState<StationHistoryBundle>({ handoffs: [], downtime: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user || !organization?.id) {
      setBundle({ handoffs: [], downtime: [], sessions: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Station name lookup map (org-scoped)
      const { data: stationsData } = await supabase
        .from("stations")
        .select("id, name")
        .eq("organization_id", organization.id);
      const stationNames = new Map<string, string>((stationsData || []).map((s: any) => [s.id, s.name]));

      // Handoffs
      let hq = supabase
        .from("handoff_records")
        .select("id, date, shift, station_id, work_order, part_number, operation_number, outgoing_operator_name, incoming_operator_name, supervisor_name, primary_state, state_reason, created_at, team_id")
        .eq("organization_id", organization.id)
        .order("date", { ascending: false })
        .limit(2000);
      if (filters.date_from) hq = hq.gte("date", filters.date_from);
      if (filters.date_to) hq = hq.lte("date", filters.date_to);
      if (filters.station_id) hq = hq.eq("station_id", filters.station_id);
      if (filters.team_id) hq = hq.eq("team_id", filters.team_id);
      const { data: handoffsData, error: hErr } = await hq;
      if (hErr) throw hErr;

      // Downtime
      let dq = supabase
        .from("downtime_events")
        .select("id, station_id, downtime_type, reason_code, description, started_at, ended_at, duration_minutes, reported_by_name, resolved_by_name, team_id")
        .eq("organization_id", organization.id)
        .order("started_at", { ascending: false })
        .limit(2000);
      if (filters.date_from) dq = dq.gte("started_at", filters.date_from);
      if (filters.date_to) dq = dq.lte("started_at", filters.date_to + "T23:59:59");
      if (filters.station_id) dq = dq.eq("station_id", filters.station_id);
      if (filters.team_id) dq = dq.eq("team_id", filters.team_id);
      const { data: downtimeData, error: dErr } = await dq;
      if (dErr) throw dErr;

      // Sessions
      let sq = supabase
        .from("operator_station_sessions")
        .select("id, station_id, user_id, shift, checked_in_at, checked_out_at, is_active")
        .eq("organization_id", organization.id)
        .order("checked_in_at", { ascending: false })
        .limit(2000);
      if (filters.date_from) sq = sq.gte("checked_in_at", filters.date_from);
      if (filters.date_to) sq = sq.lte("checked_in_at", filters.date_to + "T23:59:59");
      if (filters.station_id) sq = sq.eq("station_id", filters.station_id);
      const { data: sessionsData, error: sErr } = await sq;
      if (sErr) throw sErr;

      setBundle({
        handoffs: (handoffsData || []).map((h: any) => ({
          id: h.id,
          date: h.date,
          shift: h.shift,
          station_id: h.station_id,
          station_name: h.station_id ? stationNames.get(h.station_id) || null : null,
          work_order: h.work_order,
          part_number: h.part_number,
          operation_number: h.operation_number,
          outgoing_operator_name: h.outgoing_operator_name,
          incoming_operator_name: h.incoming_operator_name,
          supervisor_name: h.supervisor_name,
          primary_state: h.primary_state,
          state_reason: h.state_reason,
          created_at: h.created_at,
        })),
        downtime: (downtimeData || []).map((d: any) => ({
          id: d.id,
          station_id: d.station_id,
          station_name: d.station_id ? stationNames.get(d.station_id) || null : null,
          downtime_type: d.downtime_type,
          reason_code: d.reason_code,
          description: d.description,
          started_at: d.started_at,
          ended_at: d.ended_at,
          duration_minutes: d.duration_minutes,
          reported_by_name: d.reported_by_name,
          resolved_by_name: d.resolved_by_name,
        })),
        sessions: (sessionsData || []).map((s: any) => ({
          id: s.id,
          station_id: s.station_id,
          station_name: stationNames.get(s.station_id) || null,
          user_id: s.user_id,
          shift: s.shift,
          checked_in_at: s.checked_in_at,
          checked_out_at: s.checked_out_at,
          is_active: s.is_active,
        })),
      });
    } catch (err: any) {
      console.error("Station history error:", err);
      setError(err.message || "Failed to load station history");
    }
    setLoading(false);
  }, [user, organization?.id, filters.date_from, filters.date_to, filters.station_id, filters.team_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { bundle, loading, error, refetch: fetch };
}

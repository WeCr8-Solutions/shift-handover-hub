import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "./useTeams";
import { useActivityLog } from "./useActivityLog";
import { WorkCenterType, JobState, Shift } from "@/types/handoff";
import { uploadOrgScopedFile, getSignedUrls } from "@/lib/storageUtils";

export interface Station {
  id: string;
  team_id: string | null;
  station_id: string;
  name: string;
  work_center: string;
  work_center_type: WorkCenterType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_status?: StationStatus;
  team?: { id: string; name: string } | null;
}

export interface StationStatus {
  id: string;
  station_id: string;
  current_job_work_order: string | null;
  current_job_part_number: string | null;
  current_job_state: JobState | null;
  current_operator_id: string | null;
  current_operator_name: string | null;
  parts_complete: number;
  parts_required: number;
  condition_status: string;
  condition_notes: string | null;
  last_handoff_id: string | null;
  updated_at: string;
}

export interface HandoffRecord {
  id: string;
  team_id: string | null;
  station_id: string | null;
  record_version: number;
  date: string;
  shift: Shift;
  work_order: string;
  work_center: string;
  work_center_type: WorkCenterType;
  machine_id: string;
  part_number: string;
  part_revision: string;
  operation_number: string;
  outgoing_operator_id: string | null;
  incoming_operator_id: string | null;
  outgoing_operator_name: string;
  incoming_operator_name: string;
  supervisor_name: string | null;
  primary_state: JobState;
  state_reason: string | null;
  delay_code: string;
  machine_readiness: Record<string, any> | null;
  equipment_readiness: Record<string, any> | null;
  machine_condition: Record<string, any> | null;
  welding_condition: Record<string, any> | null;
  water_jet_condition: Record<string, any> | null;
  last_good_part_timestamp: string | null;
  parts_completed_this_shift: number;
  scrap_count: number;
  rework_count: number;
  critical_dims_verified: boolean;
  qa_notified: string;
  quality_notes: string | null;
  fixture_installed: string;
  clamps_bolts_torqued: string;
  fixture_orientation_verified: string;
  special_instructions_followed: string;
  process_notes_for_next_shift: string | null;
  raw_material_available: boolean;
  next_material_lot_ready: boolean;
  material_issues_noted: boolean;
  material_notes: string | null;
  handoff_summary: string;
  outgoing_time: string | null;
  incoming_time: string | null;
  supervisor_time: string | null;
  tooling_notes: any[];
  issues_follow_ups: any[];
  created_at: string;
  updated_at: string;
}

// ── Shared fetch functions ──────────────────────────────────────

async function fetchStationsData(userId: string, teamId?: string | null, orgId?: string | null): Promise<Station[]> {
  let query = supabase
    .from("stations")
    .select(`
      *,
      current_status:current_station_status(*),
      team:teams(id, name)
    `)
    .order("name");

  if (orgId) {
    query = query.eq("organization_id", orgId);
  }
  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((station: any) => ({
    ...station,
    work_center_type: station.work_center_type as WorkCenterType,
    current_status: Array.isArray(station.current_status)
      ? station.current_status[0] || null
      : station.current_status || null,
    team: station.team || null,
  }));
}

async function fetchHandoffData(userId: string, teamId?: string | null, orgId?: string | null): Promise<HandoffRecord[]> {
  let query = supabase
    .from("handoff_records")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (orgId) {
    query = query.eq("organization_id", orgId);
  }

  // When a team is selected, include handoffs that either match the team directly
  // OR have null team_id but belong to a station in that team (legacy records)
  if (teamId) {
    query = query.or(`team_id.eq.${teamId},and(team_id.is.null,station_id.in.(select id from stations where team_id='${teamId}'))`);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback: if the complex filter fails, try simpler org-only query
    if (orgId) {
      const fallback = await supabase
        .from("handoff_records")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(100);
      return (fallback.data || []) as HandoffRecord[];
    }
    throw error;
  }

  return (data || []) as HandoffRecord[];
}

// ── Debounce helper ────────────────────────────────────────────

function useDebouncedInvalidate(queryClient: ReturnType<typeof useQueryClient>, queryKey: string[], delayMs = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey });
    }, delayMs);
  }, [queryClient, queryKey, delayMs]);
}

// ── useStations (React Query) ──────────────────────────────────

export function useStations(teamId?: string | null, organizationId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const effectiveOrgId = organizationId;

  const queryKey = useMemo(
    () => ["stations", effectiveOrgId || "none", teamId || "all"],
    [effectiveOrgId, teamId]
  );

  const { data: stations = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchStationsData(user!.id, teamId, effectiveOrgId),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 900_000, // 15min fallback — realtime handles freshness
    refetchIntervalInBackground: false, // pause when tab hidden
  });

  // Debounced realtime invalidation
  const debouncedInvalidate = useDebouncedInvalidate(queryClient, queryKey);

  useEffect(() => {
    if (!user) return;

    const channelName = `station-status-${effectiveOrgId || "global"}-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "current_station_status" }, debouncedInvalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, debouncedInvalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, effectiveOrgId, debouncedInvalidate]);

  const createStation = async (stationData: {
    station_id: string;
    name: string;
    work_center: string;
    work_center_type: WorkCenterType;
    team_id?: string | null;
    organization_id?: string | null;
  }) => {
    const stationWithOrg = {
      ...stationData,
      organization_id: stationData.organization_id || effectiveOrgId || "",
    };

    const { data, error } = await supabase
      .from("stations")
      .insert([stationWithOrg])
      .select()
      .single();

    if (!error) {
      queryClient.invalidateQueries({ queryKey });
    }
    return { data, error };
  };

  const updateStationStatus = async (
    stationId: string,
    status: Partial<Omit<StationStatus, "id" | "station_id" | "updated_at">>
  ) => {
    const { data: existing } = await supabase
      .from("current_station_status")
      .select("id")
      .eq("station_id", stationId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("current_station_status")
        .update(status)
        .eq("station_id", stationId);
      return { error };
    } else {
      const { error } = await supabase
        .from("current_station_status")
        .insert({ station_id: stationId, ...status });
      return { error };
    }
  };

  return {
    stations,
    loading: isLoading,
    createStation,
    updateStationStatus,
    refreshStations: refetch,
  };
}

// ── useHandoffRecords (React Query) ────────────────────────────

export function useHandoffRecords(teamId?: string | null, organizationId?: string | null) {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const queryClient = useQueryClient();
  const effectiveOrgId = organizationId;

  const queryKey = useMemo(
    () => ["handoffs", effectiveOrgId || "none", teamId || "all"],
    [effectiveOrgId, teamId]
  );

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchHandoffData(user!.id, teamId, effectiveOrgId),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 900_000, // 15min fallback — realtime handles freshness
    refetchIntervalInBackground: false,
  });

  // Debounced realtime invalidation
  const debouncedInvalidate = useDebouncedInvalidate(queryClient, queryKey);

  useEffect(() => {
    if (!user) return;

    const channelName = `handoff-records-${effectiveOrgId || "global"}-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "handoff_records" }, debouncedInvalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, effectiveOrgId, debouncedInvalidate]);

  const createHandoffRecord = async (
    record: Omit<HandoffRecord, "id" | "created_at" | "updated_at" | "record_version">
  ) => {
    const recordWithOrg = {
      ...record,
      organization_id: effectiveOrgId,
    };

    const { data, error } = await supabase
      .from("handoff_records")
      .insert(recordWithOrg as any)
      .select()
      .single();

    if (!error && data) {
      await logActivity(
        "handoff_created",
        `Created handoff for ${record.work_center} - ${record.machine_id}`,
        {
          handoff_id: data.id,
          work_order: record.work_order,
          part_number: record.part_number,
          shift: record.shift,
          station_id: record.station_id,
        }
      );
      queryClient.invalidateQueries({ queryKey });
    }

    return { data, error };
  };

  const uploadHandoffImage = useCallback(
    async (file: File, orgId: string) => {
      if (!user) return { path: null, error: new Error("Not authenticated") };
      return uploadOrgScopedFile("handoff-attachments", file, orgId, user.id);
    },
    [user],
  );

  const getSignedHandoffImageUrls = useCallback(
    (filePaths: string[]) => getSignedUrls("handoff-attachments", filePaths),
    [],
  );

  return {
    records,
    loading: isLoading,
    createHandoffRecord,
    uploadHandoffImage,
    getSignedHandoffImageUrls,
    refreshRecords: refetch,
  };
}

// ── useShiftStats (React Query) ────────────────────────────────

export function useShiftStats(teamId?: string | null, organizationId?: string | null) {
  const { user } = useAuth();
  const effectiveOrgId = organizationId;

  const { data: stats = { activeStations: 0, completedHandoffs: 0, pendingIssues: 0, partsProduced: 0 }, isLoading } = useQuery({
    queryKey: ["shift-stats", effectiveOrgId || "none", teamId || "all"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      let stationsQuery = supabase
        .from("stations")
        .select("id", { count: "exact" })
        .eq("is_active", true);
      if (effectiveOrgId) stationsQuery = stationsQuery.eq("organization_id", effectiveOrgId);
      if (teamId) stationsQuery = stationsQuery.eq("team_id", teamId);

      let handoffsQuery = supabase
        .from("handoff_records")
        .select("id, parts_completed_this_shift, issues_follow_ups", { count: "exact" })
        .eq("date", today);
      if (effectiveOrgId) handoffsQuery = handoffsQuery.eq("organization_id", effectiveOrgId);
      if (teamId) handoffsQuery = handoffsQuery.eq("team_id", teamId);

      const [{ count: stationCount }, { data: handoffs, count: handoffCount }] = await Promise.all([
        stationsQuery,
        handoffsQuery,
      ]);

      let totalParts = 0;
      let pendingIssues = 0;
      if (handoffs) {
        handoffs.forEach((h: any) => {
          totalParts += h.parts_completed_this_shift || 0;
          if (h.issues_follow_ups && Array.isArray(h.issues_follow_ups)) {
            pendingIssues += h.issues_follow_ups.length;
          }
        });
      }

      return {
        activeStations: stationCount || 0,
        completedHandoffs: handoffCount || 0,
        pendingIssues,
        partsProduced: totalParts,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return { stats, loading: isLoading };
}

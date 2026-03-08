import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "./useTeams";
import { useActivityLog } from "./useActivityLog";
import { useUserOrganization } from "./useUserOrganization";
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

export function useStations(teamId?: string | null, organizationId?: string | null) {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // Use passed organizationId or fall back to user's org
  const effectiveOrgId = organizationId || organization?.id;

  const hasFetchedOnce = useRef(false);

  const fetchStations = useCallback(async () => {
    if (!user) {
      setStations([]);
      setLoading(false);
      return;
    }

    // Only show full loading spinner on first fetch to prevent flash
    if (!hasFetchedOnce.current) {
      setLoading(true);
    }
    
    let query = supabase
      .from("stations")
      .select(`
        *,
        current_status:current_station_status(*)
      `)
      .order("name");

    // Filter by organization for proper multi-tenant isolation
    if (effectiveOrgId) {
      query = query.eq("organization_id", effectiveOrgId);
    }

    // Additional team filter if specified
    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;

    if (!error && data) {
      const transformed = data.map((station: any) => ({
        ...station,
        work_center_type: station.work_center_type as WorkCenterType,
        // current_station_status has a 1:1 FK (isOneToOne) so PostgREST
        // returns it as a single object, not an array.
        current_status: Array.isArray(station.current_status)
          ? station.current_status[0] || null
          : station.current_status || null,
      }));
      setStations(transformed);
    }
    hasFetchedOnce.current = true;
    setLoading(false);
  }, [user, teamId, effectiveOrgId]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Real-time subscription for station status updates + polling fallback
  useEffect(() => {
    if (!user) return;

    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    // Primary: realtime subscription — use unique channel name per org to avoid cross-tenant leakage
    const channelName = `station-status-${effectiveOrgId || 'global'}-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "current_station_status",
        },
        () => {
          fetchStations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stations",
        },
        () => {
          fetchStations();
        }
      )
      .subscribe();

    // Fallback: polling at 5-minute intervals
    const poll = () => {
      if (!isActive) return;
      fetchStations();
      timeoutId = setTimeout(poll, 300000);
    };
    timeoutId = setTimeout(poll, 300000);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [user, fetchStations, effectiveOrgId]);

  const createStation = async (stationData: {
    station_id: string;
    name: string;
    work_center: string;
    work_center_type: WorkCenterType;
    team_id?: string | null;
    organization_id?: string | null;
  }) => {
    // Ensure organization_id is set, either explicitly or from user's org
    const stationWithOrg = {
      ...stationData,
      organization_id: stationData.organization_id || effectiveOrgId || null,
    };
    
    const { data, error } = await supabase
      .from("stations")
      .insert(stationWithOrg)
      .select()
      .single();

    if (!error) {
      await fetchStations();
    }
    return { data, error };
  };

  const updateStationStatus = async (
    stationId: string,
    status: Partial<Omit<StationStatus, "id" | "station_id" | "updated_at">>
  ) => {
    // Check if status exists
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
    loading,
    createStation,
    updateStationStatus,
    refreshStations: fetchStations,
  };
}

export function useHandoffRecords(teamId?: string | null, organizationId?: string | null) {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { organization } = useUserOrganization();
  const [records, setRecords] = useState<HandoffRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveOrgId = organizationId || organization?.id;

  const hasFetchedOnce = useRef(false);

  const fetchRecords = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    if (!hasFetchedOnce.current) {
      setLoading(true);
    }

    let query = supabase
      .from("handoff_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    // Filter by org for proper multi-tenant isolation
    if (effectiveOrgId) {
      query = query.eq("organization_id", effectiveOrgId);
    }

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setRecords(data as HandoffRecord[]);
    }
    hasFetchedOnce.current = true;
    setLoading(false);
  }, [user, teamId, effectiveOrgId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Real-time subscription + polling fallback for handoff records
  useEffect(() => {
    if (!user) return;

    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const channelName = `handoff-records-${effectiveOrgId || 'global'}-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "handoff_records",
        },
        () => {
          fetchRecords();
        }
      )
      .subscribe();

    const poll = () => {
      if (!isActive) return;
      fetchRecords();
      timeoutId = setTimeout(poll, 300000);
    };
    timeoutId = setTimeout(poll, 300000);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [user, fetchRecords, effectiveOrgId]);

  const createHandoffRecord = async (
    record: Omit<HandoffRecord, "id" | "created_at" | "updated_at" | "record_version">
  ) => {
    // Ensure organization_id is always set (required NOT NULL column)
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
    loading,
    createHandoffRecord,
    uploadHandoffImage,
    getSignedHandoffImageUrls,
    refreshRecords: fetchRecords,
  };
}

export function useShiftStats(teamId?: string | null, organizationId?: string | null) {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const [stats, setStats] = useState({
    activeStations: 0,
    completedHandoffs: 0,
    pendingIssues: 0,
    partsProduced: 0,
  });
  const [loading, setLoading] = useState(true);

  const effectiveOrgId = organizationId || organization?.id;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];

      // Fetch active stations — org-scoped
      let stationsQuery = supabase
        .from("stations")
        .select("id", { count: "exact" })
        .eq("is_active", true);

      if (effectiveOrgId) {
        stationsQuery = stationsQuery.eq("organization_id", effectiveOrgId);
      }
      if (teamId) {
        stationsQuery = stationsQuery.eq("team_id", teamId);
      }

      const { count: stationCount } = await stationsQuery;

      // Fetch today's handoffs — org-scoped
      let handoffsQuery = supabase
        .from("handoff_records")
        .select("id, parts_completed_this_shift, issues_follow_ups", { count: "exact" })
        .eq("date", today);

      if (effectiveOrgId) {
        handoffsQuery = handoffsQuery.eq("organization_id", effectiveOrgId);
      }
      if (teamId) {
        handoffsQuery = handoffsQuery.eq("team_id", teamId);
      }

      const { data: handoffs, count: handoffCount } = await handoffsQuery;

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

      setStats({
        activeStations: stationCount || 0,
        completedHandoffs: handoffCount || 0,
        pendingIssues,
        partsProduced: totalParts,
      });

      setLoading(false);
    };

    fetchStats();
  }, [user, teamId, effectiveOrgId]);

  return { stats, loading };
}

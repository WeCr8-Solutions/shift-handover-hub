import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
import {
  computeLoadBalancerScores,
  LoadBalancerInput,
  LoadBalancerResult,
  PartRequirements,
  MachineProfile,
  StationInfo,
  StationLoad,
  StationAvailability,
} from "@/lib/loadBalancer";

/**
 * Client-side hook for the machine-context-aware load balancer.
 * Fetches live station data and computes scored recommendations for a given part.
 */
export function useLoadBalancer() {
  const { organization } = useOrgContext();
  const { currentTeam } = useCurrentTeam();
  const [result, setResult] = useState<LoadBalancerResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(
    async (partRequirements?: PartRequirements | null, workCenterTypeFilter?: string | null) => {
      if (!organization?.id) return null;

      setLoading(true);

      try {
        // Fetch all needed data in parallel
        const orgId = organization.id;

        let stationsQuery = supabase
          .from("stations")
          .select("id, station_id, name, work_center, work_center_type, is_active")
          .eq("organization_id", orgId)
          .eq("is_active", true);

        if (currentTeam?.id) {
          stationsQuery = stationsQuery.eq("team_id", currentTeam.id);
        }

        const [
          stationsRes,
          queueRes,
          verifiedRes,
          manualRes,
          sessionsRes,
          downtimeRes,
        ] = await Promise.all([
          stationsQuery.limit(100),
          supabase
            .from("queue_items")
            .select("station_id, status, estimated_duration")
            .eq("organization_id", orgId)
            .in("status", ["pending", "queued", "in_progress", "on_hold"])
            .limit(500),
          supabase
            .from("station_machine_assignments" as any)
            .select(
              "station_id, organization_machine_purchases!inner(verified_machine_library!inner(manufacturer, model, machine_type, platform_category, max_x_travel, max_y_travel, max_z_travel, max_part_weight, max_part_envelope_length, max_part_envelope_width, max_part_envelope_height, five_axis_simultaneous, fourth_axis, live_tooling, y_axis_turn, sub_spindle, probing, through_spindle_coolant, pallet_pool, bar_feeder, material_capability, typical_tolerance, hard_constraints))"
            )
            .eq("organization_id", orgId)
            .limit(100),
          supabase
            .from("station_manual_machine_profiles" as any)
            .select(
              "station_id, manufacturer, model, machine_type, platform_category, max_x_travel, max_y_travel, max_z_travel, max_part_weight, max_part_envelope_length, max_part_envelope_width, max_part_envelope_height, five_axis_simultaneous, fourth_axis, live_tooling, y_axis_turn, sub_spindle, probing, through_spindle_coolant, pallet_pool, bar_feeder, material_capability, typical_tolerance, hard_constraints"
            )
            .eq("organization_id", orgId)
            .limit(100),
          supabase
            .from("operator_station_sessions")
            .select("station_id")
            .eq("organization_id", orgId)
            .eq("is_active", true)
            .is("checked_out_at", null)
            .limit(100),
          supabase
            .from("downtime_events")
            .select("station_id, reason_code, description")
            .eq("organization_id", orgId)
            .is("ended_at", null)
            .limit(50),
        ]);

        const stations: StationInfo[] = (stationsRes.data || []).map((s: any) => ({
          id: s.id,
          station_id: s.station_id,
          name: s.name,
          work_center_type: s.work_center_type,
          work_center: s.work_center,
          is_active: s.is_active,
        }));

        // Build machine profiles
        const machineProfiles: MachineProfile[] = [];
        const verifiedStationIds = new Set<string>();

        for (const a of (verifiedRes.data || []) as any[]) {
          const ml = a.organization_machine_purchases?.verified_machine_library;
          if (!ml) continue;
          verifiedStationIds.add(a.station_id);
          machineProfiles.push({ station_id: a.station_id, source: "verified_library", ...ml });
        }

        for (const mp of (manualRes.data || []) as any[]) {
          if (verifiedStationIds.has(mp.station_id)) continue;
          machineProfiles.push({ station_id: mp.station_id, source: "manual_entry", ...mp });
        }

        // Build station loads
        const stationLoads: Record<string, StationLoad> = {};
        for (const q of (queueRes.data || []) as any[]) {
          if (!q.station_id) continue;
          if (!stationLoads[q.station_id]) {
            stationLoads[q.station_id] = { queued_items: 0, est_total_minutes: 0, in_progress_count: 0 };
          }
          stationLoads[q.station_id].queued_items++;
          stationLoads[q.station_id].est_total_minutes += q.estimated_duration || 0;
          if (q.status === "in_progress") stationLoads[q.station_id].in_progress_count++;
        }

        // Build availability
        const operatorCounts: Record<string, number> = {};
        for (const s of (sessionsRes.data || []) as any[]) {
          operatorCounts[s.station_id] = (operatorCounts[s.station_id] || 0) + 1;
        }

        const downtimeSet = new Set<string>();
        const downtimeInfo: Record<string, string> = {};
        for (const d of (downtimeRes.data || []) as any[]) {
          if (d.station_id) {
            downtimeSet.add(d.station_id);
            downtimeInfo[d.station_id] = d.reason_code || d.description || "Unknown";
          }
        }

        const stationAvailability: Record<string, StationAvailability> = {};
        for (const s of stations) {
          stationAvailability[s.id] = {
            has_active_downtime: downtimeSet.has(s.id),
            downtime_reason: downtimeInfo[s.id] || null,
            checked_in_operators: operatorCounts[s.id] || 0,
          };
        }

        const input: LoadBalancerInput = {
          stations,
          machineProfiles,
          stationLoads,
          stationAvailability,
          partRequirements: partRequirements || null,
          workCenterTypeFilter: workCenterTypeFilter || null,
        };

        const balancerResult = computeLoadBalancerScores(input);
        setResult(balancerResult);
        return balancerResult;
      } catch (err) {
        console.error("[useLoadBalancer] Error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [organization?.id, currentTeam?.id],
  );

  const clear = useCallback(() => setResult(null), []);

  return { result, loading, analyze, clear };
}

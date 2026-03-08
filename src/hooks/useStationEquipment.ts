import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppMachineStatus, MachineState, ControlType, RelayConnectionState } from "@/types/machine";

/**
 * Hook: useStationEquipment
 * 
 * Fetches equipment linked to stations within an organization and maps them
 * into AppMachineStatus shapes. This is the Phase 1 (static) data source.
 * 
 * Phase 2 will overlay live relay data on top of this base via a future
 * useJobLineRelay hook that upserts into the same state shape.
 */
export function useStationEquipment(organizationId: string | null) {
  const [machines, setMachines] = useState<AppMachineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [relayState] = useState<RelayConnectionState>("disconnected"); // Phase 2: will connect

  const fetchEquipment = useCallback(async () => {
    if (!organizationId) {
      setMachines([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("equipment")
      .select(`
        id,
        name,
        equipment_type,
        manufacturer,
        model,
        serial_number,
        asset_tag,
        status,
        station_id,
        metadata,
        stations:station_id (
          id,
          name,
          station_id
        )
      `)
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });

    if (error) {
      console.error("[useStationEquipment] fetch error:", error);
      setLoading(false);
      return;
    }

    const mapped: AppMachineStatus[] = (data || []).map((eq: any) => {
      const meta = (eq.metadata || {}) as Record<string, any>;
      const station = eq.stations as any;

      // Map equipment status to MachineState
      let state: MachineState = "unknown";
      if (eq.status === "operational" || eq.status === "active") state = "idle";
      else if (eq.status === "in_use" || eq.status === "running") state = "running";
      else if (eq.status === "maintenance" || eq.status === "repair") state = "offline";
      else if (eq.status === "decommissioned") state = "offline";

      // Try to extract control type from metadata or equipment type
      const controlType: ControlType = (meta.control_type as ControlType) || inferControlType(eq.manufacturer);

      return {
        machineId: eq.id,
        equipmentId: eq.id,
        stationId: eq.station_id || null,
        label: station?.name ? `${eq.name} — ${station.name}` : eq.name,
        controlType,
        state,
        connectionOk: false, // Phase 2: live relay will set this
        spindleRpm: meta.spindle_rpm ?? null,
        spindleOverride: meta.spindle_override ?? null,
        feedOverride: meta.feed_override ?? null,
        activeTool: meta.active_tool ?? null,
        activeProgram: meta.active_program ?? null,
        blockNumber: meta.block_number ?? null,
        position: meta.position || {},
        activeAlarmCodes: meta.active_alarms || [],
        lastUpdated: new Date(),
        manufacturer: eq.manufacturer || undefined,
        model: eq.model || undefined,
        serialNumber: eq.serial_number || undefined,
        assetTag: eq.asset_tag || undefined,
        equipmentType: eq.equipment_type || undefined,
      };
    });

    setMachines(mapped);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  // Sort: alarming first, then running, then alphabetical
  const sortedMachines = useMemo(() => {
    return [...machines].sort((a, b) => {
      const priority: Record<MachineState, number> = {
        alarm: 0, estop: 1, "feed-hold": 2, running: 3, setup: 4,
        idle: 5, offline: 6, unknown: 7,
      };
      const pa = priority[a.state] ?? 7;
      const pb = priority[b.state] ?? 7;
      if (pa !== pb) return pa - pb;
      return a.label.localeCompare(b.label);
    });
  }, [machines]);

  return {
    machines: sortedMachines,
    loading,
    relayState,
    refetch: fetchEquipment,
  };
}

/** Infer CNC control type from manufacturer name */
function inferControlType(manufacturer: string | null): ControlType {
  if (!manufacturer) return "unknown";
  const m = manufacturer.toLowerCase();
  if (m.includes("fanuc")) return "fanuc";
  if (m.includes("haas")) return "haas";
  if (m.includes("siemens")) return "siemens";
  if (m.includes("mazak")) return "mazak";
  if (m.includes("okuma")) return "okuma";
  if (m.includes("mitsubishi")) return "mitsubishi";
  if (m.includes("heidenhain")) return "heidenhain";
  return "unknown";
}

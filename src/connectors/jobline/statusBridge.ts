/**
 * src/connectors/jobline/statusBridge.ts
 *
 * Bridges MachineStatusSnapshot (relay payload) → AppMachineStatus (dashboard shape).
 * Per CONTEXT.docx §4 Step 4.
 *
 * Phase 1: Used by useStationEquipment for static data mapping.
 * Phase 2: Used by useJobLineRelay for live event mapping.
 */

import type {
  AppMachineStatus,
  MachineIdentity,
  MachineStatusSnapshot,
  MachineState,
  ControlType,
} from "./types";

/**
 * bridgeStatus — converts a relay MachineStatusSnapshot into an AppMachineStatus.
 *
 * @param snapshot - Raw status payload from relay event
 * @param identities - Map of machineId → MachineIdentity (from machine.connected events)
 * @returns Dashboard-ready AppMachineStatus
 */
export function bridgeStatus(
  snapshot: MachineStatusSnapshot,
  identities: Record<string, MachineIdentity>,
): AppMachineStatus {
  const identity = identities[snapshot.machineId];

  return {
    machineId: snapshot.machineId,
    equipmentId: null, // Relay machines don't map to equipment table directly
    stationId: null, // Will be resolved by station binding in Phase 2
    label: identity?.label ?? snapshot.machineId,
    controlType: (identity?.controlType as ControlType) ?? "unknown",
    state: normalizeState(snapshot.machineState),
    connectionOk: snapshot.connectionStatus === "connected",
    spindleRpm: snapshot.spindleRpm,
    spindleOverride: snapshot.spindleOverride,
    feedOverride: snapshot.feedOverride,
    activeTool: snapshot.activeTool,
    activeProgram: snapshot.activeProgram,
    blockNumber: snapshot.blockNumber,
    position: snapshot.position ?? {},
    activeAlarmCodes: (snapshot.alarms ?? []).map((a) => a.code),
    lastUpdated: new Date(snapshot.timestamp),
  };
}

/**
 * bridgeOfflineStatus — creates an offline AppMachineStatus for disconnected machines.
 * Used when relay emits machine.disconnected.
 */
export function bridgeOfflineStatus(
  machineId: string,
  identities: Record<string, MachineIdentity>,
): AppMachineStatus {
  const identity = identities[machineId];

  return {
    machineId,
    equipmentId: null,
    stationId: null,
    label: identity?.label ?? machineId,
    controlType: (identity?.controlType as ControlType) ?? "unknown",
    state: "offline",
    connectionOk: false,
    spindleRpm: null,
    spindleOverride: null,
    feedOverride: null,
    activeTool: null,
    activeProgram: null,
    blockNumber: null,
    position: {},
    activeAlarmCodes: [],
    lastUpdated: new Date(),
  };
}

/**
 * Normalize relay machine state string into our typed MachineState union.
 * Handles any casing or unexpected values from the controller adapters.
 */
function normalizeState(state: string | MachineState): MachineState {
  const normalized = (state ?? "unknown").toLowerCase().trim();
  const validStates: MachineState[] = [
    "running", "idle", "alarm", "estop", "feed-hold", "setup", "offline", "unknown",
  ];
  return validStates.includes(normalized as MachineState)
    ? (normalized as MachineState)
    : "unknown";
}

/**
 * src/store/machineStatusStore.ts
 *
 * Zustand store for machine status and alarm state.
 * Per CONTEXT.docx §5 Step 5: Entity adapters for statuses
 * (keyed by machineId) and alarms (keyed by alarm id).
 *
 * Actions match the doc specification exactly:
 *   - setRelayState
 *   - registerIdentity
 *   - upsertStatus
 *   - pushAlarm
 *   - reconcileAlarms
 *   - acknowledgeAlarm
 *   - pushTransfer
 */

import { create } from "zustand";
import type {
  AppMachineStatus,
  AppAlarm,
  MachineIdentity,
  RelayConnectionState,
  TransferRecord,
} from "@/types/machine";
import { reconcileAlarms as doReconcile } from "@/connectors/jobline/alarmBridge";

interface MachineStatusState {
  // === Connection ===
  relayState: RelayConnectionState;

  // === Entities ===
  statuses: Record<string, AppMachineStatus>; // keyed by machineId
  alarms: AppAlarm[]; // ordered newest-first
  identities: Record<string, MachineIdentity>; // keyed by machineId
  transfers: TransferRecord[]; // DNC transfer log

  // === Actions (per CONTEXT.docx §5 Step 5) ===
  setRelayState: (state: RelayConnectionState) => void;
  registerIdentity: (identity: MachineIdentity) => void;
  upsertStatus: (status: AppMachineStatus) => void;
  pushAlarm: (alarm: AppAlarm) => void;
  reconcileAlarms: (machineId: string, activeCodes: string[]) => void;
  acknowledgeAlarm: (alarmId: string) => void;
  pushTransfer: (transfer: TransferRecord) => void;
  updateTransfer: (transferId: string, updates: Partial<TransferRecord>) => void;

  // === Bulk operations (Phase 1: static data merge) ===
  mergeStaticStatuses: (statuses: AppMachineStatus[]) => void;
  clearAll: () => void;
}

export const useMachineStatusStore = create<MachineStatusState>((set, get) => ({
  // Initial state
  relayState: "disconnected",
  statuses: {},
  alarms: [],
  identities: {},
  transfers: [],

  // === Actions ===

  setRelayState: (relayState) => set({ relayState }),

  registerIdentity: (identity) =>
    set((state) => ({
      identities: { ...state.identities, [identity.id]: identity },
    })),

  upsertStatus: (status) =>
    set((state) => ({
      statuses: { ...state.statuses, [status.machineId]: status },
    })),

  pushAlarm: (alarm) =>
    set((state) => {
      // Deduplicate by id — update if exists, push if new
      const existing = state.alarms.findIndex((a) => a.id === alarm.id);
      if (existing >= 0) {
        const updated = [...state.alarms];
        updated[existing] = alarm;
        return { alarms: updated };
      }
      // Insert at front (newest-first)
      return { alarms: [alarm, ...state.alarms] };
    }),

  reconcileAlarms: (machineId, activeCodes) =>
    set((state) => ({
      alarms: doReconcile(state.alarms, activeCodes, machineId),
    })),

  acknowledgeAlarm: (alarmId) =>
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === alarmId ? { ...a, acknowledged: true } : a,
      ),
    })),

  pushTransfer: (transfer) =>
    set((state) => ({
      transfers: [transfer, ...state.transfers],
    })),

  updateTransfer: (transferId, updates) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === transferId ? { ...t, ...updates } : t,
      ),
    })),

  // Phase 1: merge static equipment data into the store
  mergeStaticStatuses: (staticStatuses) =>
    set((state) => {
      const merged = { ...state.statuses };
      for (const s of staticStatuses) {
        // Only overwrite if no live relay data exists for this machine
        if (!merged[s.machineId] || !merged[s.machineId].connectionOk) {
          merged[s.machineId] = s;
        }
      }
      return { statuses: merged };
    }),

  clearAll: () =>
    set({
      relayState: "disconnected",
      statuses: {},
      alarms: [],
      identities: {},
      transfers: [],
    }),
}));

// === Selector hooks (per CONTEXT.docx §8: components read from selector hooks) ===

/** All machine statuses sorted by priority (alarming first) */
export function useAllMachineStatuses(): AppMachineStatus[] {
  return useMachineStatusStore((s) => {
    const all = Object.values(s.statuses);
    const priority: Record<string, number> = {
      alarm: 0, estop: 1, "feed-hold": 2, running: 3, setup: 4,
      idle: 5, offline: 6, unknown: 7,
    };
    return [...all].sort((a, b) => {
      const pa = priority[a.state] ?? 7;
      const pb = priority[b.state] ?? 7;
      if (pa !== pb) return pa - pb;
      return a.label.localeCompare(b.label);
    });
  });
}

/** Alarms within a time window, sorted newest-first */
export function useJobLineAlarms(
  shiftStart?: Date,
  shiftEnd?: Date,
): AppAlarm[] {
  return useMachineStatusStore((s) => {
    let filtered = s.alarms;
    if (shiftStart) {
      filtered = filtered.filter((a) => a.timestamp >= shiftStart);
    }
    if (shiftEnd) {
      filtered = filtered.filter((a) => a.timestamp <= shiftEnd);
    }
    return filtered;
  });
}

/** Current relay connection state */
export function useRelayConnectionState(): RelayConnectionState {
  return useMachineStatusStore((s) => s.relayState);
}

/** Machine statuses filtered by station */
export function useStationMachineStatuses(stationId: string | null): AppMachineStatus[] {
  return useMachineStatusStore((s) => {
    if (!stationId) return [];
    return Object.values(s.statuses).filter((m) => m.stationId === stationId);
  });
}

/** Active (unacknowledged) alarm count for attention badges */
export function useActiveAlarmCount(): number {
  return useMachineStatusStore((s) =>
    s.alarms.filter((a) => a.active && !a.acknowledged).length
  );
}

/** All DNC transfers */
export function useTransfers(): TransferRecord[] {
  return useMachineStatusStore((s) => s.transfers);
}

/**
 * Tests for src/store/machineStatusStore.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useMachineStatusStore } from "@/store/machineStatusStore";
import type { AppMachineStatus, AppAlarm, MachineIdentity } from "@/types/machine";

// Helper to create a mock machine status
function mockStatus(overrides: Partial<AppMachineStatus> = {}): AppMachineStatus {
  return {
    machineId: "machine-1",
    equipmentId: null,
    stationId: null,
    label: "Test Machine",
    controlType: "haas",
    state: "idle",
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
    ...overrides,
  };
}

function mockAlarm(overrides: Partial<AppAlarm> = {}): AppAlarm {
  return {
    id: "alarm-1",
    source: "jobline",
    machineId: "machine-1",
    machineLabel: "Test Machine",
    code: "ALM-401",
    message: "Test alarm",
    severity: "alarm",
    timestamp: new Date(),
    active: true,
    acknowledged: false,
    ...overrides,
  };
}

describe("machineStatusStore", () => {
  beforeEach(() => {
    useMachineStatusStore.getState().clearAll();
  });

  describe("setRelayState", () => {
    it("updates relay connection state", () => {
      useMachineStatusStore.getState().setRelayState("connected");
      expect(useMachineStatusStore.getState().relayState).toBe("connected");
    });
  });

  describe("registerIdentity", () => {
    it("stores machine identity keyed by id", () => {
      const identity: MachineIdentity = { id: "m1", label: "CNC-1", controlType: "fanuc" };
      useMachineStatusStore.getState().registerIdentity(identity);
      expect(useMachineStatusStore.getState().identities["m1"]).toEqual(identity);
    });
  });

  describe("upsertStatus", () => {
    it("inserts new machine status", () => {
      const status = mockStatus({ machineId: "m1" });
      useMachineStatusStore.getState().upsertStatus(status);
      expect(useMachineStatusStore.getState().statuses["m1"]).toEqual(status);
    });

    it("updates existing machine status", () => {
      useMachineStatusStore.getState().upsertStatus(mockStatus({ machineId: "m1", state: "idle" }));
      useMachineStatusStore.getState().upsertStatus(mockStatus({ machineId: "m1", state: "running" }));
      expect(useMachineStatusStore.getState().statuses["m1"].state).toBe("running");
    });
  });

  describe("pushAlarm", () => {
    it("adds alarm to front of list (newest-first)", () => {
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a1" }));
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a2" }));

      const alarms = useMachineStatusStore.getState().alarms;
      expect(alarms[0].id).toBe("a2");
      expect(alarms[1].id).toBe("a1");
    });

    it("deduplicates by id — updates existing alarm", () => {
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a1", message: "old" }));
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a1", message: "updated" }));

      const alarms = useMachineStatusStore.getState().alarms;
      expect(alarms.length).toBe(1);
      expect(alarms[0].message).toBe("updated");
    });
  });

  describe("acknowledgeAlarm", () => {
    it("marks alarm as acknowledged", () => {
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a1" }));
      useMachineStatusStore.getState().acknowledgeAlarm("a1");

      const alarm = useMachineStatusStore.getState().alarms.find((a) => a.id === "a1");
      expect(alarm?.acknowledged).toBe(true);
    });

    it("does not affect other alarms", () => {
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a1" }));
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a2" }));
      useMachineStatusStore.getState().acknowledgeAlarm("a1");

      const a2 = useMachineStatusStore.getState().alarms.find((a) => a.id === "a2");
      expect(a2?.acknowledged).toBe(false);
    });
  });

  describe("reconcileAlarms", () => {
    it("marks machine alarms inactive when code no longer active", () => {
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a1", machineId: "m1", code: "ALM-1" }));
      useMachineStatusStore.getState().pushAlarm(mockAlarm({ id: "a2", machineId: "m1", code: "ALM-2" }));

      useMachineStatusStore.getState().reconcileAlarms("m1", ["ALM-1"]);

      const alarms = useMachineStatusStore.getState().alarms;
      expect(alarms.find((a) => a.id === "a1")?.active).toBe(true);
      expect(alarms.find((a) => a.id === "a2")?.active).toBe(false);
    });
  });

  describe("mergeStaticStatuses", () => {
    it("adds static statuses to empty store", () => {
      const statuses = [mockStatus({ machineId: "m1" }), mockStatus({ machineId: "m2" })];
      useMachineStatusStore.getState().mergeStaticStatuses(statuses);
      expect(Object.keys(useMachineStatusStore.getState().statuses)).toHaveLength(2);
    });

    it("does not overwrite live relay data (connectionOk: true)", () => {
      useMachineStatusStore.getState().upsertStatus(
        mockStatus({ machineId: "m1", state: "running", connectionOk: true }),
      );
      useMachineStatusStore.getState().mergeStaticStatuses([
        mockStatus({ machineId: "m1", state: "idle", connectionOk: false }),
      ]);

      expect(useMachineStatusStore.getState().statuses["m1"].state).toBe("running");
    });
  });

  describe("clearAll", () => {
    it("resets all state to defaults", () => {
      useMachineStatusStore.getState().setRelayState("connected");
      useMachineStatusStore.getState().upsertStatus(mockStatus());
      useMachineStatusStore.getState().pushAlarm(mockAlarm());
      useMachineStatusStore.getState().clearAll();

      const state = useMachineStatusStore.getState();
      expect(state.relayState).toBe("disconnected");
      expect(Object.keys(state.statuses)).toHaveLength(0);
      expect(state.alarms).toHaveLength(0);
    });
  });
});

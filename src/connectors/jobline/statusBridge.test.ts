/**
 * Tests for src/connectors/jobline/statusBridge.ts
 */

import { describe, it, expect } from "vitest";
import { bridgeStatus, bridgeOfflineStatus } from "@/connectors/jobline/statusBridge";
import type { MachineStatusSnapshot, MachineIdentity } from "@/types/machine";

const mockIdentities: Record<string, MachineIdentity> = {
  "machine-1": { id: "machine-1", label: "Haas VF-2", controlType: "haas" },
  "machine-2": { id: "machine-2", label: "Fanuc Alpha", controlType: "fanuc" },
};

const baseSnashot: MachineStatusSnapshot = {
  machineId: "machine-1",
  machineState: "running",
  connectionStatus: "connected",
  spindleRpm: 8500,
  spindleOverride: 100,
  feedOverride: 95,
  activeTool: 5,
  activeProgram: "O1234",
  blockNumber: 42,
  position: { x: 10.5, y: 20.3, z: -5.0 },
  alarms: [],
  timestamp: "2026-03-08T12:00:00Z",
};

describe("bridgeStatus", () => {
  it("maps snapshot fields correctly to AppMachineStatus", () => {
    const result = bridgeStatus(baseSnashot, mockIdentities);

    expect(result.machineId).toBe("machine-1");
    expect(result.label).toBe("Haas VF-2");
    expect(result.controlType).toBe("haas");
    expect(result.state).toBe("running");
    expect(result.connectionOk).toBe(true);
    expect(result.spindleRpm).toBe(8500);
    expect(result.spindleOverride).toBe(100);
    expect(result.feedOverride).toBe(95);
    expect(result.activeTool).toBe(5);
    expect(result.activeProgram).toBe("O1234");
    expect(result.blockNumber).toBe(42);
    expect(result.position).toEqual({ x: 10.5, y: 20.3, z: -5.0 });
    expect(result.activeAlarmCodes).toEqual([]);
    expect(result.lastUpdated).toBeInstanceOf(Date);
  });

  it("extracts alarm codes from snapshot alarms array", () => {
    const snapshot: MachineStatusSnapshot = {
      ...baseSnashot,
      alarms: [
        { code: "ALM-401", message: "Spindle overload", severity: "alarm", timestamp: "2026-03-08T12:00:00Z" },
        { code: "ALM-100", message: "Tool broken", severity: "fault", timestamp: "2026-03-08T12:00:01Z" },
      ],
    };
    const result = bridgeStatus(snapshot, mockIdentities);
    expect(result.activeAlarmCodes).toEqual(["ALM-401", "ALM-100"]);
  });

  it("falls back to machineId as label when identity not found", () => {
    const result = bridgeStatus({ ...baseSnashot, machineId: "unknown-machine" }, mockIdentities);
    expect(result.label).toBe("unknown-machine");
    expect(result.controlType).toBe("unknown");
  });

  it("marks connectionOk false when status is disconnected", () => {
    const result = bridgeStatus({ ...baseSnashot, connectionStatus: "disconnected" }, mockIdentities);
    expect(result.connectionOk).toBe(false);
  });

  it("normalizes unknown machine states to 'unknown'", () => {
    const result = bridgeStatus(
      { ...baseSnashot, machineState: "some_invalid_state" as any },
      mockIdentities,
    );
    expect(result.state).toBe("unknown");
  });

  it("handles null values in optional fields", () => {
    const result = bridgeStatus(
      { ...baseSnashot, spindleRpm: null, activeTool: null, activeProgram: null },
      mockIdentities,
    );
    expect(result.spindleRpm).toBeNull();
    expect(result.activeTool).toBeNull();
    expect(result.activeProgram).toBeNull();
  });
});

describe("bridgeOfflineStatus", () => {
  it("creates an offline status with correct defaults", () => {
    const result = bridgeOfflineStatus("machine-1", mockIdentities);
    expect(result.machineId).toBe("machine-1");
    expect(result.label).toBe("Haas VF-2");
    expect(result.state).toBe("offline");
    expect(result.connectionOk).toBe(false);
    expect(result.spindleRpm).toBeNull();
    expect(result.activeAlarmCodes).toEqual([]);
  });

  it("uses machineId as fallback label for unknown machines", () => {
    const result = bridgeOfflineStatus("unknown-machine", mockIdentities);
    expect(result.label).toBe("unknown-machine");
  });
});

/**
 * Tests for src/connectors/jobline/alarmBridge.ts
 */

import { describe, it, expect } from "vitest";
import { bridgeAlarm, bridgeTransferFailedAlarm, reconcileAlarms } from "@/connectors/jobline/alarmBridge";
import type { AlarmEntry, AppAlarm, MachineIdentity } from "@/types/machine";

const mockIdentities: Record<string, MachineIdentity> = {
  "machine-1": { id: "machine-1", label: "Haas VF-2", controlType: "haas" },
};

describe("bridgeAlarm", () => {
  const baseAlarm: AlarmEntry = {
    code: "ALM-401",
    message: "Spindle overload detected",
    severity: "alarm",
    timestamp: "2026-03-08T12:00:00Z",
  };

  it("bridges alarm entry into AppAlarm with correct fields", () => {
    const result = bridgeAlarm(baseAlarm, "machine-1", mockIdentities);

    expect(result.id).toContain("machine-1");
    expect(result.id).toContain("ALM-401");
    expect(result.source).toBe("jobline");
    expect(result.machineId).toBe("machine-1");
    expect(result.machineLabel).toBe("Haas VF-2");
    expect(result.code).toBe("ALM-401");
    expect(result.message).toBe("Spindle overload detected");
    expect(result.severity).toBe("alarm");
    expect(result.active).toBe(true);
    expect(result.acknowledged).toBe(false);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("normalizes severity: fault, warning, default to alarm", () => {
    expect(bridgeAlarm({ ...baseAlarm, severity: "fault" }, "machine-1", mockIdentities).severity).toBe("fault");
    expect(bridgeAlarm({ ...baseAlarm, severity: "warning" }, "machine-1", mockIdentities).severity).toBe("warning");
    expect(bridgeAlarm({ ...baseAlarm, severity: "invalid" as any }, "machine-1", mockIdentities).severity).toBe("alarm");
  });

  it("uses machineId as label when identity not found", () => {
    const result = bridgeAlarm(baseAlarm, "unknown-machine", mockIdentities);
    expect(result.machineLabel).toBe("unknown-machine");
  });
});

describe("bridgeTransferFailedAlarm", () => {
  it("creates a warning-severity alarm for DNC transfer failure", () => {
    const result = bridgeTransferFailedAlarm("machine-1", "test.nc", "Timeout", mockIdentities);

    expect(result.code).toBe("DNC-FAIL");
    expect(result.severity).toBe("warning");
    expect(result.message).toContain("test.nc");
    expect(result.message).toContain("Timeout");
    expect(result.active).toBe(true);
    expect(result.machineLabel).toBe("Haas VF-2");
  });
});

describe("reconcileAlarms", () => {
  const existingAlarms: AppAlarm[] = [
    {
      id: "alarm-1", source: "jobline", machineId: "machine-1", machineLabel: "Haas VF-2",
      code: "ALM-401", message: "Spindle overload", severity: "alarm",
      timestamp: new Date("2026-03-08T12:00:00Z"), active: true, acknowledged: false,
    },
    {
      id: "alarm-2", source: "jobline", machineId: "machine-1", machineLabel: "Haas VF-2",
      code: "ALM-100", message: "Tool broken", severity: "fault",
      timestamp: new Date("2026-03-08T12:01:00Z"), active: true, acknowledged: false,
    },
    {
      id: "alarm-3", source: "jobline", machineId: "machine-2", machineLabel: "Fanuc Alpha",
      code: "ALM-200", message: "Axis error", severity: "alarm",
      timestamp: new Date("2026-03-08T12:02:00Z"), active: true, acknowledged: false,
    },
  ];

  it("marks alarms inactive when code is no longer in active codes", () => {
    // Only ALM-401 is still active, ALM-100 should be cleared
    const result = reconcileAlarms(existingAlarms, ["ALM-401"], "machine-1");

    const alarm1 = result.find((a) => a.id === "alarm-1");
    const alarm2 = result.find((a) => a.id === "alarm-2");

    expect(alarm1?.active).toBe(true); // still in active codes
    expect(alarm2?.active).toBe(false); // cleared
  });

  it("does not affect alarms from other machines", () => {
    const result = reconcileAlarms(existingAlarms, [], "machine-1");

    const alarm3 = result.find((a) => a.id === "alarm-3");
    expect(alarm3?.active).toBe(true); // different machine, untouched
  });

  it("clears all alarms when activeCodes is empty", () => {
    const result = reconcileAlarms(existingAlarms, [], "machine-1");

    const machine1Alarms = result.filter((a) => a.machineId === "machine-1");
    expect(machine1Alarms.every((a) => !a.active)).toBe(true);
  });

  it("keeps alarms active when all codes still present", () => {
    const result = reconcileAlarms(existingAlarms, ["ALM-401", "ALM-100"], "machine-1");

    const machine1Alarms = result.filter((a) => a.machineId === "machine-1");
    expect(machine1Alarms.every((a) => a.active)).toBe(true);
  });
});

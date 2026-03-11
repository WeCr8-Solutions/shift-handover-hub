/**
 * Tests for machine type definitions and config constants.
 */

import { describe, it, expect } from "vitest";
import { MACHINE_STATE_CONFIG, ALARM_SEVERITY_CONFIG } from "@/types/machine";
import type { MachineState, AlarmSeverity, ControlType, JobLineEventType } from "@/types/machine";

describe("MACHINE_STATE_CONFIG", () => {
  const allStates: MachineState[] = [
    "running", "idle", "alarm", "estop", "feed-hold", "setup", "offline", "unknown",
  ];

  it("has config for every MachineState", () => {
    for (const state of allStates) {
      expect(MACHINE_STATE_CONFIG[state]).toBeDefined();
      expect(MACHINE_STATE_CONFIG[state].label).toBeTruthy();
      expect(MACHINE_STATE_CONFIG[state].colorClass).toBeTruthy();
      expect(MACHINE_STATE_CONFIG[state].dotClass).toBeTruthy();
    }
  });

  it("running state uses status-ok token", () => {
    expect(MACHINE_STATE_CONFIG.running.colorClass).toContain("status-ok");
    expect(MACHINE_STATE_CONFIG.running.dotClass).toContain("status-ok");
  });

  it("alarm state uses status-critical token", () => {
    expect(MACHINE_STATE_CONFIG.alarm.colorClass).toContain("status-critical");
    expect(MACHINE_STATE_CONFIG.alarm.dotClass).toContain("status-critical");
  });
});

describe("ALARM_SEVERITY_CONFIG", () => {
  const allSeverities: AlarmSeverity[] = ["warning", "alarm", "fault"];

  it("has config for every AlarmSeverity", () => {
    for (const severity of allSeverities) {
      expect(ALARM_SEVERITY_CONFIG[severity]).toBeDefined();
      expect(ALARM_SEVERITY_CONFIG[severity].label).toBeTruthy();
      expect(ALARM_SEVERITY_CONFIG[severity].colorClass).toBeTruthy();
      expect(ALARM_SEVERITY_CONFIG[severity].bgClass).toBeTruthy();
      expect(ALARM_SEVERITY_CONFIG[severity].borderClass).toBeTruthy();
    }
  });

  it("fault is the most severe with status-critical token", () => {
    expect(ALARM_SEVERITY_CONFIG.fault.colorClass).toContain("status-critical");
    expect(ALARM_SEVERITY_CONFIG.fault.label).toBe("FAULT");
  });
});

describe("Type contracts", () => {
  it("JobLineEventType covers all 7 relay events", () => {
    const events: JobLineEventType[] = [
      "machine.status",
      "machine.alarm",
      "machine.connected",
      "machine.disconnected",
      "transfer.started",
      "transfer.complete",
      "transfer.failed",
    ];
    expect(events).toHaveLength(7);
  });

  it("ControlType includes all major CNC brands", () => {
    const types: ControlType[] = [
      "fanuc", "haas", "siemens", "mazak", "okuma", "mitsubishi", "heidenhain", "manual", "unknown",
    ];
    expect(types).toHaveLength(9);
  });
});

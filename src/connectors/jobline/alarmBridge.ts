/**
 * src/connectors/jobline/alarmBridge.ts
 *
 * Bridges AlarmEntry (relay payload) → AppAlarm (dashboard shape).
 * Implements reconcileAlarms() for clearing stale alarms.
 * Per CONTEXT.docx §3.2 and §4 Step 4.
 *
 * Key rule from doc: AlarmEntry.code is the reconciliation key.
 * Codes in machine.alarm must exactly match codes in machine.status.alarms[].code
 * or cleared alarms will never be marked active:false.
 */

import type {
  AppAlarm,
  AlarmEntry,
  AlarmSeverity,
  MachineIdentity,
} from "./types";

/**
 * bridgeAlarm — converts a relay AlarmEntry into an AppAlarm.
 *
 * @param alarm - Raw alarm payload from relay machine.alarm event
 * @param machineId - The machine that emitted the alarm
 * @param identities - Map of machineId → MachineIdentity
 * @returns Dashboard-ready AppAlarm
 */
export function bridgeAlarm(
  alarm: AlarmEntry,
  machineId: string,
  identities: Record<string, MachineIdentity>,
): AppAlarm {
  const identity = identities[machineId];

  return {
    id: `${machineId}::${alarm.code}::${alarm.timestamp}`,
    source: "jobline",
    machineId,
    machineLabel: identity?.label ?? machineId,
    code: alarm.code,
    message: alarm.message,
    severity: normalizeSeverity(alarm.severity),
    timestamp: new Date(alarm.timestamp),
    active: true,
    acknowledged: false,
  };
}

/**
 * bridgeTransferFailedAlarm — converts a failed DNC transfer into a warning-severity AppAlarm.
 * Per CONTEXT.docx §3 event table: transfer.failed → push as warning-severity AppAlarm.
 */
export function bridgeTransferFailedAlarm(
  machineId: string,
  fileName: string,
  error: string,
  identities: Record<string, MachineIdentity>,
): AppAlarm {
  const identity = identities[machineId];

  return {
    id: `transfer-fail::${machineId}::${Date.now()}`,
    source: "jobline",
    machineId,
    machineLabel: identity?.label ?? machineId,
    code: "DNC-FAIL",
    message: `DNC transfer failed: ${fileName} — ${error}`,
    severity: "warning",
    timestamp: new Date(),
    active: true,
    acknowledged: false,
  };
}

/**
 * reconcileAlarms — marks alarms as inactive if their code is no longer in the
 * active codes list from the latest machine.status snapshot.
 *
 * Per CONTEXT.docx: the code in machine.alarm must exactly match the code in
 * machine.status.alarms[].code or cleared alarms will never be marked active:false.
 *
 * @param existingAlarms - Current alarms in the store for this machine
 * @param activeCodes - Active alarm codes from the latest MachineStatusSnapshot.alarms
 * @param machineId - The machine to reconcile
 * @returns Updated alarm array with stale alarms marked active:false
 */
export function reconcileAlarms(
  existingAlarms: AppAlarm[],
  activeCodes: string[],
  machineId: string,
): AppAlarm[] {
  const activeSet = new Set(activeCodes);

  return existingAlarms.map((alarm) => {
    if (alarm.machineId !== machineId) return alarm;

    // If alarm code is no longer in active codes, mark inactive
    if (alarm.active && !activeSet.has(alarm.code)) {
      return { ...alarm, active: false };
    }

    return alarm;
  });
}

/**
 * Normalize severity string from relay into our AlarmSeverity union.
 */
function normalizeSeverity(severity: string | AlarmSeverity): AlarmSeverity {
  const normalized = (severity ?? "alarm").toLowerCase().trim();
  if (normalized === "warning") return "warning";
  if (normalized === "fault") return "fault";
  return "alarm";
}

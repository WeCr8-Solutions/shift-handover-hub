/**
 * src/hooks/useAlarmFeed.ts
 *
 * Thin wrapper over the Zustand store selectors for alarm data.
 * Per PRD 11 §1: UI components must not import the store directly.
 */

import {
  useJobLineAlarms,
  useMachineStatusStore,
  useActiveAlarmCount,
} from "@/store/machineStatusStore";
import type { AppAlarm } from "@/types/machine";

interface UseAlarmFeedOptions {
  shiftStart?: Date;
  shiftEnd?: Date;
  maxItems?: number;
}

interface AlarmFeedResult {
  alarms: AppAlarm[];
  activeCount: number;
  acknowledgeAlarm: (alarmId: string) => void;
}

export function useAlarmFeed({
  shiftStart,
  shiftEnd,
  maxItems = 50,
}: UseAlarmFeedOptions = {}): AlarmFeedResult {
  const allAlarms = useJobLineAlarms(shiftStart, shiftEnd);
  const activeCount = useActiveAlarmCount();
  const acknowledgeAlarm = useMachineStatusStore((s) => s.acknowledgeAlarm);

  return {
    alarms: allAlarms.slice(0, maxItems),
    activeCount,
    acknowledgeAlarm,
  };
}

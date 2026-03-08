/**
 * src/hooks/useMachineMonitoring.ts
 *
 * Combines the Zustand store with the Phase 1 static data source (useStationEquipment).
 * Merges equipment table data into the centralized store.
 * Checks entitlements for machine_monitoring feature access.
 *
 * This is the primary hook components should use for machine data.
 */

import { useEffect } from "react";
import { useStationEquipment } from "./useStationEquipment";
import { useEntitlements } from "./useEntitlements";
import {
  useMachineStatusStore,
  useAllMachineStatuses,
  useRelayConnectionState,
  useStationMachineStatuses,
  useActiveAlarmCount,
} from "@/store/machineStatusStore";
import type { AppMachineStatus, RelayConnectionState } from "@/types/machine";

interface UseMachineMonitoringOptions {
  organizationId: string | null;
  stationId?: string | null;
}

interface MachineMonitoringResult {
  /** All machines sorted by priority (alarming first) */
  machines: AppMachineStatus[];
  /** Whether data is still loading */
  loading: boolean;
  /** Current relay connection state */
  relayState: RelayConnectionState;
  /** Whether org has machine monitoring entitlement */
  hasAccess: boolean;
  /** Entitlement loading state */
  entitlementLoading: boolean;
  /** Current plan name */
  plan: string;
  /** Count of active unacknowledged alarms */
  activeAlarmCount: number;
  /** Refetch equipment data */
  refetch: () => void;
}

export function useMachineMonitoring({
  organizationId,
  stationId,
}: UseMachineMonitoringOptions): MachineMonitoringResult {
  const { canAccess, plan, loading: entitlementLoading } = useEntitlements();
  const { machines: staticMachines, loading, relayState, refetch } =
    useStationEquipment(organizationId);

  const mergeStaticStatuses = useMachineStatusStore((s) => s.mergeStaticStatuses);
  const allMachines = useAllMachineStatuses();
  const storeRelayState = useRelayConnectionState();
  const stationMachines = useStationMachineStatuses(stationId ?? null);
  const activeAlarmCount = useActiveAlarmCount();

  const hasAccess = canAccess("machine_monitoring");

  // Merge static equipment data into the store whenever it updates
  useEffect(() => {
    if (staticMachines.length > 0) {
      mergeStaticStatuses(staticMachines);
    }
  }, [staticMachines, mergeStaticStatuses]);

  // Use station-filtered machines if stationId provided, otherwise all
  const displayMachines = stationId ? stationMachines : allMachines;

  // If store has data from relay, use store relay state; otherwise use hook state
  const effectiveRelayState = storeRelayState !== "disconnected" ? storeRelayState : relayState;

  return {
    machines: displayMachines.length > 0 ? displayMachines : staticMachines,
    loading,
    relayState: effectiveRelayState,
    hasAccess,
    entitlementLoading,
    plan,
    activeAlarmCount,
    refetch,
  };
}

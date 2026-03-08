/**
 * src/hooks/useJobLineRelay.ts
 *
 * Central event hook — per CONTEXT.docx §6 Step 6.
 * Mount ONCE in JobLineProvider. No component ever calls getJobLineClient() directly.
 *
 * Handles all 7 event types in a single switch statement.
 * Phase 1: Connects to static data via useStationEquipment.
 * Phase 2: Connects to live relay via SubscriberClient.
 */

import { useEffect, useRef } from "react";
import { getJobLineClient, disconnectJobLine } from "@/connectors/jobline/client";
import { bridgeStatus, bridgeOfflineStatus } from "@/connectors/jobline/statusBridge";
import { bridgeAlarm, bridgeTransferFailedAlarm } from "@/connectors/jobline/alarmBridge";
import { useMachineStatusStore } from "@/store/machineStatusStore";
import type {
  MachineIdentity,
  MachineStatusSnapshot,
  AlarmEntry,
  TransferRecord,
} from "@/types/machine";

/**
 * useJobLineRelay — the single entry point for all relay events.
 *
 * Per CONTEXT.docx §7 Hard Rules:
 *   "useJobLineRelay() is called exactly once — in JobLineProvider.
 *    Do not call it in any other component."
 */
export function useJobLineRelay() {
  const identitiesRef = useRef<Record<string, MachineIdentity>>({});
  const store = useMachineStatusStore;

  useEffect(() => {
    const client = getJobLineClient();

    // Set up callbacks for the subscriber
    client.setCallbacks({
      onStateChange: (state) => {
        const relayState =
          state === "connected" ? "connected" :
          state === "connecting" ? "connecting" :
          "disconnected";
        store.getState().setRelayState(relayState);
      },

      onMachineList: (machines) => {
        // Per CONTEXT.docx §5.3: welcome message contains initial machine list
        for (const m of machines) {
          const identity: MachineIdentity = {
            id: m.id,
            label: m.label,
            controlType: m.controlType as any,
          };
          identitiesRef.current[m.id] = identity;
          store.getState().registerIdentity(identity);
        }
      },

      onEvent: (event) => {
        const { type, machineId, payload } = event;
        const identities = identitiesRef.current;
        const actions = store.getState();

        // Per CONTEXT.docx §6: complete switch statement
        switch (type) {
          case "machine.status": {
            const snapshot = payload as MachineStatusSnapshot;
            actions.upsertStatus(bridgeStatus(snapshot, identities));
            // Reconcile alarms — clear any that are no longer in active codes
            actions.reconcileAlarms(
              machineId,
              (snapshot.alarms ?? []).map((a) => a.code),
            );
            break;
          }

          case "machine.alarm": {
            const alarm = payload as AlarmEntry;
            actions.pushAlarm(bridgeAlarm(alarm, machineId, identities));
            break;
          }

          case "machine.connected": {
            const identity = payload as MachineIdentity;
            identitiesRef.current[identity.id] = identity;
            actions.registerIdentity(identity);
            break;
          }

          case "machine.disconnected": {
            actions.upsertStatus(bridgeOfflineStatus(machineId, identities));
            break;
          }

          case "transfer.started": {
            const transfer = payload as Partial<TransferRecord>;
            actions.pushTransfer({
              id: transfer.id ?? `transfer-${machineId}-${Date.now()}`,
              machineId,
              machineLabel: identities[machineId]?.label ?? machineId,
              fileName: transfer.fileName ?? "unknown",
              protocol: transfer.protocol ?? "websocket",
              direction: transfer.direction ?? "send",
              status: "in_progress",
              startedAt: new Date(),
              ...transfer,
            } as TransferRecord);
            break;
          }

          case "transfer.complete": {
            const transfer = payload as TransferRecord;
            actions.updateTransfer(transfer.id, {
              status: "complete",
              completedAt: new Date(),
            });
            break;
          }

          case "transfer.failed": {
            const transfer = payload as Partial<TransferRecord>;
            if (transfer.id) {
              actions.updateTransfer(transfer.id, {
                status: "failed",
                error: transfer.error,
              });
            }
            // Per CONTEXT.docx §3: Push as warning-severity AppAlarm
            actions.pushAlarm(
              bridgeTransferFailedAlarm(
                machineId,
                transfer.fileName ?? "unknown",
                transfer.error ?? "Unknown error",
                identities,
              ),
            );
            break;
          }

          default:
            console.warn(`[useJobLineRelay] Unknown event type: ${type}`);
        }
      },

      onError: (error) => {
        console.error("[useJobLineRelay] Relay error:", error);
      },
    });

    // Attempt connection (Phase 1: will be a no-op)
    client.connect();

    // Cleanup on unmount
    return () => {
      disconnectJobLine();
    };
  }, []);
}

/**
 * src/connectors/jobline/types.ts
 *
 * Re-exports SDK types and defines connector-specific shapes.
 * Per CONTEXT.docx §4: this directory is the ONLY place that
 * may import from @jobline/relay-sdk (Phase 2).
 *
 * Phase 1: Types are defined locally, mirroring the SDK contract.
 * Phase 2: Replace local defs with SDK re-exports.
 */

// Re-export all shared types from the central type file
export type {
  MachineState,
  MachineConnectionStatus,
  AlarmSeverity,
  ControlType,
  AppAlarm,
  AppMachineStatus,
  RelayConnectionState,
  MachineIdentity,
  JobLineEventType,
  TransferRecord,
  TransferStatus,
  MachineStatusSnapshot,
  AlarmEntry,
  JobLineEvent,
} from "@/types/machine";

// Re-export config constants
export {
  MACHINE_STATE_CONFIG,
  ALARM_SEVERITY_CONFIG,
} from "@/types/machine";

/**
 * SubscriberConfig — connection config for the relay client.
 * Phase 2: will come from @jobline/relay-sdk.
 */
export interface SubscriberConfig {
  relayUrl: string;
  token: string;
}

/**
 * RelayTokenResponse — shape returned by the token exchange endpoint.
 */
export interface RelayTokenResponse {
  token: string;
  relayUrl: string;
  tenantId?: string;
}

/**
 * RelayMessage — wire envelope from relay WebSocket.
 * Per CONTEXT.docx §5.2.
 */
export interface RelayMessage {
  v: 1;
  tenantId: string;
  event: {
    type: string;
    machineId: string;
    payload: unknown;
  };
}

/**
 * WelcomeMessage — first message after WS connect.
 */
export interface WelcomeMessage {
  type: "welcome";
  subscriberId: string;
  tenantId: string;
  machines: Array<{ id: string; label: string; controlType: string }>;
}

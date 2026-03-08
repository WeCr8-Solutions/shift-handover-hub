/**
 * src/connectors/jobline/index.ts
 *
 * Barrel export for the JobLine relay connector layer.
 * Per CONTEXT.docx §7: This directory is the ONLY place
 * that may import from @jobline/relay-sdk.
 *
 * Components MUST NOT import from this directory directly.
 * They read from hooks, which read from the store.
 */

// Client
export { getJobLineClient, disconnectJobLine, isRelayConfigured } from "./client";

// Bridge functions
export { bridgeStatus, bridgeOfflineStatus } from "./statusBridge";
export { bridgeAlarm, bridgeTransferFailedAlarm, reconcileAlarms } from "./alarmBridge";

// Types (re-exported from central types)
export type {
  SubscriberConfig,
  RelayTokenResponse,
  RelayMessage,
  WelcomeMessage,
} from "./types";

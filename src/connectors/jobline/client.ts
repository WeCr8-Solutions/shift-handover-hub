/**
 * src/connectors/jobline/client.ts
 *
 * Singleton relay client. Per CONTEXT.docx §7 Hard Rules:
 *   "NEVER instantiate SubscriberClient more than once"
 *
 * Phase 1 (current): Stub — no live relay connection. Returns null.
 * Phase 2: Will import @jobline/relay-sdk SubscriberClient,
 *   fetch token from edge function, and establish WebSocket.
 *
 * This file is the ONLY place that will import from @jobline/relay-sdk.
 */

import type { SubscriberConfig, RelayTokenResponse } from "./types";

// === Subscriber client state ===
type ClientState = "disconnected" | "connecting" | "connected";

interface SubscriberCallbacks {
  onStateChange?: (state: ClientState) => void;
  onEvent?: (event: { type: string; machineId: string; payload: unknown }) => void;
  onMachineList?: (machines: Array<{ id: string; label: string; controlType: string }>) => void;
  onError?: (error: { code: string; message: string }) => void;
}

let _instance: JobLineSubscriber | null = null;

/**
 * JobLineSubscriber — wraps the relay SDK SubscriberClient.
 * Phase 1: Stub with no-op methods.
 * Phase 2: Full WebSocket implementation.
 */
class JobLineSubscriber {
  private state: ClientState = "disconnected";
  private callbacks: SubscriberCallbacks = {};
  private config: SubscriberConfig | null = null;

  getState(): ClientState {
    return this.state;
  }

  setCallbacks(callbacks: SubscriberCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to the relay.
   * Phase 1: No-op stub — logs that relay is not configured.
   * Phase 2: Will fetch token and open WebSocket.
   */
  async connect(): Promise<boolean> {
    // Phase 2: Uncomment and implement
    // const tokenResponse = await fetchRelayToken();
    // if (!tokenResponse) return false;
    // this.config = { relayUrl: tokenResponse.relayUrl, token: tokenResponse.token };
    // ... open WebSocket to /ws/subscriber

    console.info(
      "[JobLineSubscriber] Phase 1 — relay not connected. " +
      "Machine data sourced from equipment table via useStationEquipment."
    );
    return false;
  }

  /**
   * Subscribe to machine events.
   * Empty arrays = subscribe to all machines and all event types.
   */
  subscribe(machineIds: string[] = [], eventTypes: string[] = []): void {
    // Phase 2: Send subscribe message over WebSocket
    console.debug("[JobLineSubscriber] subscribe() stub — Phase 1");
  }

  /**
   * Disconnect from the relay.
   * Per CONTEXT.docx §5.3: this is the ONLY correct way to close the WS.
   */
  disconnect(): void {
    this.state = "disconnected";
    this.callbacks.onStateChange?.("disconnected");
    console.info("[JobLineSubscriber] disconnected");
  }

  /**
   * Check if relay environment is configured.
   * Phase 2: Will check for JOBLINE_RELAY_URL availability.
   */
  static isConfigured(): boolean {
    // Phase 2: Check if edge function relay-token is available
    return false;
  }
}

/**
 * getJobLineClient — returns the singleton subscriber instance.
 * Per CONTEXT.docx §7: NEVER instantiate more than once.
 */
export function getJobLineClient(): JobLineSubscriber {
  if (!_instance) {
    _instance = new JobLineSubscriber();
  }
  return _instance;
}

/**
 * disconnectJobLine — the ONLY correct way to close the WS.
 * Per CONTEXT.docx §5.3.
 * Call on user logout.
 */
export function disconnectJobLine(): void {
  if (_instance) {
    _instance.disconnect();
    _instance = null;
  }
}

/**
 * isRelayConfigured — quick check if live relay features are available.
 */
export function isRelayConfigured(): boolean {
  return JobLineSubscriber.isConfigured();
}

/**
 * Phase 2: Token exchange function.
 * Calls the edge function to exchange API key for subscriber JWT.
 * The API key NEVER leaves the server side.
 */
// async function fetchRelayToken(): Promise<RelayTokenResponse | null> {
//   try {
//     const response = await supabase.functions.invoke("relay-token");
//     if (response.error) throw response.error;
//     return response.data as RelayTokenResponse;
//   } catch (err) {
//     console.error("[JobLineSubscriber] Token exchange failed:", err);
//     return null;
//   }
// }

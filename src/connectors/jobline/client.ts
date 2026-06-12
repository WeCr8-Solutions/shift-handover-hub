/**
 * src/connectors/jobline/client.ts
 *
 * Singleton relay client. Per CONTEXT.docx §7 Hard Rules:
 *   "NEVER instantiate SubscriberClient more than once"
 *
 * Phase 2: Full WebSocket implementation using the browser's native WebSocket API.
 *   Token exchange is handled server-side via the `relay-token` Supabase edge function.
 *   The relay API key NEVER appears in browser code.
 *
 * This file is the ONLY place that knows about the relay wire protocol.
 */

import { supabase } from "@/integrations/supabase/client";
import type { RelayTokenResponse } from "./types";

// === Subscriber client state ===
type ClientState = "disconnected" | "connecting" | "connected";

interface SubscriberCallbacks {
  onStateChange?: (state: ClientState) => void;
  onEvent?: (event: { type: string; machineId: string; payload: unknown }) => void;
  onMachineList?: (machines: Array<{ id: string; label: string; controlType: string }>) => void;
  onError?: (error: { code: string; message: string }) => void;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

let _instance: JobLineSubscriber | null = null;

/**
 * JobLineSubscriber — wraps the relay WebSocket connection.
 * Phase 2: Full implementation using browser WebSocket + edge function token exchange.
 */
class JobLineSubscriber {
  private state: ClientState = "disconnected";
  private callbacks: SubscriberCallbacks = {};
  private ws: WebSocket | null = null;
  private closed = false;
  private retryIdx = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private relayUrl: string | null = null;
  private token: string | null = null;
  private pendingSubscribe: { machineIds: string[]; eventTypes: string[] } | null = null;

  getState(): ClientState {
    return this.state;
  }

  setCallbacks(callbacks: SubscriberCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to the relay.
   * Fetches a subscriber JWT from the relay-token edge function, then opens the WebSocket.
   */
  async connect(): Promise<boolean> {
    if (!JobLineSubscriber.isConfigured()) {
      console.info(
        "[JobLineSubscriber] VITE_RELAY_ENABLED is not set to 'true'. " +
        "Machine data sourced from equipment table via useStationEquipment."
      );
      return false;
    }

    this.closed = false;
    this.setState("connecting");

    const tokenResp = await fetchRelayToken();
    if (!tokenResp) {
      this.setState("disconnected");
      return false;
    }

    this.relayUrl = tokenResp.relayUrl;
    this.token    = tokenResp.token;
    this.openWebSocket();
    return true;
  }

  /**
   * Subscribe to machine events.
   * Empty arrays = subscribe to all machines and all event types.
   * Per CONTEXT.docx §5.3: can be called before or after connect.
   */
  subscribe(machineIds: string[] = [], eventTypes: string[] = []): void {
    this.pendingSubscribe = { machineIds, eventTypes };
    if (this.state === "connected" && this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe();
    }
  }

  /**
   * Disconnect from the relay.
   * Per CONTEXT.docx §5.3: this is the ONLY correct way to close the WS.
   */
  disconnect(): void {
    this.closed = true;
    this.cancelRetry();
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, "disconnect");
      this.ws = null;
    }
    this.setState("disconnected");
  }

  /**
   * Check if relay environment is configured.
   */
  static isConfigured(): boolean {
    return import.meta.env.VITE_RELAY_ENABLED === "true";
  }

  // ── WebSocket management ───────────────────────────────────────────────────

  private openWebSocket(): void {
    if (!this.relayUrl || !this.token) return;

    // Convert http(s) → ws(s) in case relayUrl came back as http
    const wsBase = this.relayUrl.replace(/^http/, "ws").replace(/\/$/, "");
    const wsUrl  = `${wsBase}/ws/subscriber?token=${encodeURIComponent(this.token)}`;

    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.retryIdx = 0;
      this.cancelRetry();
      this.setState("connected");
      if (this.pendingSubscribe) this.sendSubscribe();
      this.startPing();
    };

    ws.onmessage = (ev) => {
      this.dispatch(typeof ev.data === "string" ? ev.data : "");
    };

    ws.onclose = (ev) => {
      this.stopPing();
      if (this.closed) return;
      console.warn(`[JobLineSubscriber] closed (code=${ev.code}) — reconnecting`);
      this.ws = null;
      this.setState("disconnected");
      this.scheduleReconnect();
    };

    ws.onerror = () => {
      this.callbacks.onError?.({ code: "WS_ERROR", message: "WebSocket connection error" });
    };
  }

  private dispatch(raw: string): void {
    let msg: unknown;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== "object") return;
    const m = msg as Record<string, unknown>;

    // Control-plane messages have a `type` field
    if (typeof m["type"] === "string") {
      switch (m["type"]) {
        case "welcome": {
          const machines = Array.isArray(m["machines"]) ? m["machines"] : [];
          if (machines.length > 0) {
            this.callbacks.onMachineList?.(
              machines as Array<{ id: string; label: string; controlType: string }>
            );
          }
          break;
        }
        case "pong":
          break;
        case "error":
          this.callbacks.onError?.({
            code:    String(m["code"]    ?? "RELAY_ERROR"),
            message: String(m["message"] ?? "Unknown relay error"),
          });
          break;
      }
      return;
    }

    // Data-plane: RelayMessage envelope { v:1, tenantId, event }
    if (m["v"] === 1 && m["event"] && typeof m["event"] === "object") {
      const event = m["event"] as Record<string, unknown>;
      if (typeof event["type"] === "string" && typeof event["machineId"] === "string") {
        this.callbacks.onEvent?.({
          type:      event["type"],
          machineId: event["machineId"],
          payload:   event["payload"],
        });
      }
    }
  }

  private sendSubscribe(): void {
    if (this.ws?.readyState !== WebSocket.OPEN || !this.pendingSubscribe) return;
    this.ws.send(JSON.stringify({
      type:       "subscribe",
      machineIds: this.pendingSubscribe.machineIds,
      eventTypes: this.pendingSubscribe.eventTypes,
    }));
    this.pendingSubscribe = null;
  }

  private setState(s: ClientState): void {
    if (this.state === s) return;
    this.state = s;
    this.callbacks.onStateChange?.(s);
  }

  private scheduleReconnect(): void {
    this.setState("disconnected");
    const delay = RECONNECT_DELAYS[Math.min(this.retryIdx++, RECONNECT_DELAYS.length - 1)];
    console.info(`[JobLineSubscriber] reconnecting in ${delay}ms (attempt ${this.retryIdx})`);
    this.retryTimer = setTimeout(() => {
      if (!this.closed) this.openWebSocket();
    }, delay);
  }

  private cancelRetry(): void {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 15_000);
  }

  private stopPing(): void {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
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
 * Token exchange — calls the relay-token edge function.
 * The relay API key NEVER leaves the server; only the short-lived subscriber JWT
 * and the relay WS URL come back to the browser.
 */
async function fetchRelayToken(): Promise<RelayTokenResponse | null> {
  try {
    // Skip if no authenticated session — edge function requires a valid JWT.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      return null;
    }

    const { data, error } = await supabase.functions.invoke("relay-token");
    if (error) {
      // Quiet log — Phase 1 (no relay configured) is the expected default.
      console.info("[JobLineSubscriber] Relay token unavailable, using static data.");
      return null;
    }
    if (!data || (data as { configured?: boolean }).configured === false) {
      return null;
    }
    return data as RelayTokenResponse;
  } catch {
    return null;
  }
}


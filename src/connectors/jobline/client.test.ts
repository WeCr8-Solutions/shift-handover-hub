/**
 * Tests for src/connectors/jobline/client.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getJobLineClient, disconnectJobLine, isRelayConfigured } from "@/connectors/jobline/client";

describe("JobLineSubscriber client", () => {
  beforeEach(() => {
    // Reset singleton between tests
    disconnectJobLine();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getJobLineClient", () => {
    it("returns a singleton instance", () => {
      const client1 = getJobLineClient();
      const client2 = getJobLineClient();
      expect(client1).toBe(client2);
    });

    it("starts in disconnected state", () => {
      const client = getJobLineClient();
      expect(client.getState()).toBe("disconnected");
    });
  });

  describe("connect", () => {
    it("returns false when the relay is not configured", async () => {
      vi.stubEnv("VITE_RELAY_ENABLED", "false");
      const client = getJobLineClient();
      const result = await client.connect();
      expect(result).toBe(false);
    });
  });

  describe("disconnectJobLine", () => {
    it("disconnects and nullifies the singleton", () => {
      const client1 = getJobLineClient();
      disconnectJobLine();
      const client2 = getJobLineClient();
      expect(client1).not.toBe(client2);
    });
  });

  describe("isRelayConfigured", () => {
    it("returns false when VITE_RELAY_ENABLED is not 'true'", () => {
      vi.stubEnv("VITE_RELAY_ENABLED", "false");
      expect(isRelayConfigured()).toBe(false);
    });

    it("returns true when VITE_RELAY_ENABLED is 'true'", () => {
      vi.stubEnv("VITE_RELAY_ENABLED", "true");
      expect(isRelayConfigured()).toBe(true);
    });
  });

  describe("setCallbacks", () => {
    it("accepts callbacks without error", () => {
      const client = getJobLineClient();
      expect(() =>
        client.setCallbacks({
          onStateChange: () => {},
          onEvent: () => {},
          onMachineList: () => {},
          onError: () => {},
        }),
      ).not.toThrow();
    });
  });

  describe("subscribe (Phase 1 stub)", () => {
    it("does not throw", () => {
      const client = getJobLineClient();
      expect(() => client.subscribe([], [])).not.toThrow();
    });
  });
});

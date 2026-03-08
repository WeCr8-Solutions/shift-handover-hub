/**
 * Tests for src/connectors/jobline/client.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getJobLineClient, disconnectJobLine, isRelayConfigured } from "@/connectors/jobline/client";

describe("JobLineSubscriber client", () => {
  beforeEach(() => {
    // Reset singleton between tests
    disconnectJobLine();
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

  describe("connect (Phase 1 stub)", () => {
    it("returns false since relay is not configured", async () => {
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
    it("returns false in Phase 1", () => {
      expect(isRelayConfigured()).toBe(false);
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

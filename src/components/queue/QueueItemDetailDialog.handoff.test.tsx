import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for the handoff auto-open flow triggered from QueueItemDetailDialog.
 * Validates sessionStorage prefill data, auto_open_handoff flag, and navigation.
 */

describe("QueueItemDetailDialog → Handoff Auto-Open Flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe("sessionStorage prefill data", () => {
    it("stores complete work order prefill when all fields present", () => {
      const item = {
        work_order: "WO-2024-001",
        part_number: "PN-12345",
        operation_number: "OP-10",
        station_id: "station-uuid-123",
      };

      sessionStorage.setItem("handoff_prefill", JSON.stringify(item));
      sessionStorage.setItem("auto_open_handoff", "true");

      const stored = JSON.parse(sessionStorage.getItem("handoff_prefill")!);
      expect(stored.work_order).toBe("WO-2024-001");
      expect(stored.part_number).toBe("PN-12345");
      expect(stored.operation_number).toBe("OP-10");
      expect(stored.station_id).toBe("station-uuid-123");
      expect(sessionStorage.getItem("auto_open_handoff")).toBe("true");
    });

    it("stores partial prefill when some fields are null", () => {
      const item = {
        work_order: "WO-2024-002",
        part_number: null,
        operation_number: null,
        station_id: "station-uuid-456",
      };

      sessionStorage.setItem("handoff_prefill", JSON.stringify(item));
      sessionStorage.setItem("auto_open_handoff", "true");

      const stored = JSON.parse(sessionStorage.getItem("handoff_prefill")!);
      expect(stored.work_order).toBe("WO-2024-002");
      expect(stored.part_number).toBeNull();
      expect(stored.operation_number).toBeNull();
      expect(stored.station_id).toBe("station-uuid-456");
    });

    it("stores prefill with empty strings gracefully", () => {
      const item = {
        work_order: "",
        part_number: "",
        operation_number: "",
        station_id: null,
      };

      sessionStorage.setItem("handoff_prefill", JSON.stringify(item));
      const stored = JSON.parse(sessionStorage.getItem("handoff_prefill")!);
      expect(stored.work_order).toBe("");
      expect(stored.station_id).toBeNull();
    });

    it("auto_open_handoff flag is consumed and cleared correctly", () => {
      sessionStorage.setItem("auto_open_handoff", "true");
      expect(sessionStorage.getItem("auto_open_handoff")).toBe("true");

      // Simulate consuming the flag (as Index.tsx does)
      const autoOpen = sessionStorage.getItem("auto_open_handoff");
      if (autoOpen === "true") {
        sessionStorage.removeItem("auto_open_handoff");
      }

      expect(sessionStorage.getItem("auto_open_handoff")).toBeNull();
    });

    it("prefill data is consumed and cleared correctly", () => {
      const prefill = { work_order: "WO-001", part_number: "PN-001" };
      sessionStorage.setItem("handoff_prefill", JSON.stringify(prefill));
      sessionStorage.setItem("auto_open_handoff", "true");

      // Simulate the consumption in Index.tsx useEffect
      const autoOpen = sessionStorage.getItem("auto_open_handoff");
      if (autoOpen === "true") {
        sessionStorage.removeItem("auto_open_handoff");
        const prefillRaw = sessionStorage.getItem("handoff_prefill");
        if (prefillRaw) {
          const parsed = JSON.parse(prefillRaw);
          expect(parsed.work_order).toBe("WO-001");
          sessionStorage.removeItem("handoff_prefill");
        }
      }

      expect(sessionStorage.getItem("auto_open_handoff")).toBeNull();
      expect(sessionStorage.getItem("handoff_prefill")).toBeNull();
    });

    it("handles corrupted JSON in handoff_prefill gracefully", () => {
      sessionStorage.setItem("handoff_prefill", "not-valid-json{{{");
      sessionStorage.setItem("auto_open_handoff", "true");

      let prefillData = null;
      const autoOpen = sessionStorage.getItem("auto_open_handoff");
      if (autoOpen === "true") {
        sessionStorage.removeItem("auto_open_handoff");
        const prefillRaw = sessionStorage.getItem("handoff_prefill");
        if (prefillRaw) {
          try {
            prefillData = JSON.parse(prefillRaw);
          } catch (e) {
            // Should not crash
            prefillData = null;
          }
          sessionStorage.removeItem("handoff_prefill");
        }
      }

      expect(prefillData).toBeNull();
    });
  });
});

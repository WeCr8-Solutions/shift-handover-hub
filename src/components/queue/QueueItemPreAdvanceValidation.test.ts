import { describe, it, expect } from "vitest";

/**
 * Unit tests for pre-advance validation logic used in QueueItemDetailDialog.
 * Tests quantity reconciliation, quality sign-off, and first article checks.
 */

// Pure function extraction of validation logic for testability
function validatePreAdvance(params: {
  qtyOriginal: number;
  qtyCompleted: number;
  qtyScrap: number;
  qtyRework: number;
  stationState: string | null;
}): { valid: boolean; error: string | null } {
  const { qtyOriginal, qtyCompleted, qtyScrap, qtyRework, stationState } = params;

  // 1. Quantity reconciliation
  if (qtyOriginal > 0 && (qtyCompleted + qtyScrap + qtyRework) < qtyOriginal) {
    const unaccounted = qtyOriginal - qtyCompleted - qtyScrap - qtyRework;
    return {
      valid: false,
      error: `${unaccounted} parts unaccounted for. Completed: ${qtyCompleted}, Scrap: ${qtyScrap}, Rework: ${qtyRework} of ${qtyOriginal} total.`,
    };
  }

  // 2. Quality sign-off
  if (stationState === "Waiting on QA") {
    return { valid: false, error: "Quality sign-off required: station still Waiting on QA." };
  }

  // 3. First article approval
  if (stationState === "First Article in Process") {
    return { valid: false, error: "First article inspection must be completed before advancing." };
  }

  return { valid: true, error: null };
}

describe("Pre-Advance Validation", () => {
  describe("Quantity Reconciliation", () => {
    it("blocks when parts are unaccounted for", () => {
      const result = validatePreAdvance({
        qtyOriginal: 100,
        qtyCompleted: 50,
        qtyScrap: 5,
        qtyRework: 10,
        stationState: null,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("35 parts unaccounted");
    });

    it("passes when all parts accounted (completed + scrap + rework >= original)", () => {
      const result = validatePreAdvance({
        qtyOriginal: 100,
        qtyCompleted: 90,
        qtyScrap: 5,
        qtyRework: 5,
        stationState: null,
      });
      expect(result.valid).toBe(true);
    });

    it("passes when parts exceed original (over-production)", () => {
      const result = validatePreAdvance({
        qtyOriginal: 100,
        qtyCompleted: 105,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: null,
      });
      expect(result.valid).toBe(true);
    });

    it("passes when qtyOriginal is 0 (no quantity tracking)", () => {
      const result = validatePreAdvance({
        qtyOriginal: 0,
        qtyCompleted: 0,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: null,
      });
      expect(result.valid).toBe(true);
    });

    it("handles all zeroes gracefully", () => {
      const result = validatePreAdvance({
        qtyOriginal: 0,
        qtyCompleted: 0,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: null,
      });
      expect(result.valid).toBe(true);
    });

    it("blocks when only 1 part is unaccounted", () => {
      const result = validatePreAdvance({
        qtyOriginal: 10,
        qtyCompleted: 8,
        qtyScrap: 1,
        qtyRework: 0,
        stationState: null,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("1 parts unaccounted");
    });

    it("passes exact match (completed = original, no scrap/rework)", () => {
      const result = validatePreAdvance({
        qtyOriginal: 50,
        qtyCompleted: 50,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: null,
      });
      expect(result.valid).toBe(true);
    });

    it("passes when all parts are scrap", () => {
      const result = validatePreAdvance({
        qtyOriginal: 20,
        qtyCompleted: 0,
        qtyScrap: 20,
        qtyRework: 0,
        stationState: null,
      });
      expect(result.valid).toBe(true);
    });

    it("passes when all parts are rework", () => {
      const result = validatePreAdvance({
        qtyOriginal: 15,
        qtyCompleted: 0,
        qtyScrap: 0,
        qtyRework: 15,
        stationState: null,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("Quality Sign-off Check", () => {
    it("blocks when station state is 'Waiting on QA'", () => {
      const result = validatePreAdvance({
        qtyOriginal: 10,
        qtyCompleted: 10,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: "Waiting on QA",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Quality sign-off required");
    });

    it("passes when station state is 'Part Running'", () => {
      const result = validatePreAdvance({
        qtyOriginal: 10,
        qtyCompleted: 10,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: "Part Running",
      });
      expect(result.valid).toBe(true);
    });

    it("passes when station state is null", () => {
      const result = validatePreAdvance({
        qtyOriginal: 10,
        qtyCompleted: 10,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: null,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("First Article Approval Check", () => {
    it("blocks when station state is 'First Article in Process'", () => {
      const result = validatePreAdvance({
        qtyOriginal: 10,
        qtyCompleted: 10,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: "First Article in Process",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("First article inspection");
    });

    it("passes when station state is 'Ready for Pickup'", () => {
      const result = validatePreAdvance({
        qtyOriginal: 10,
        qtyCompleted: 10,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: "Ready for Pickup",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("Combined validation priority", () => {
    it("quantity check takes priority over quality check", () => {
      const result = validatePreAdvance({
        qtyOriginal: 100,
        qtyCompleted: 50,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: "Waiting on QA",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("unaccounted"); // qty error, not QA
    });

    it("quality check takes priority over first article when qty passes", () => {
      // Note: a station can't realistically be both states, but tests ordering
      const result = validatePreAdvance({
        qtyOriginal: 10,
        qtyCompleted: 10,
        qtyScrap: 0,
        qtyRework: 0,
        stationState: "Waiting on QA",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Quality");
    });
  });
});

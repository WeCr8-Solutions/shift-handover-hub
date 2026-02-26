import { describe, it, expect } from "vitest";
import {
  validateQuantityIntegrity,
  computeQtyOpen,
  validateNcrQuantity,
  computeQualityMetrics,
  formatDisposition,
  formatAuthStatus,
} from "./ncrUtils";

describe("validateQuantityIntegrity", () => {
  it("valid when sum equals original", () => {
    const result = validateQuantityIntegrity({
      original: 100, completed: 80, scrap: 5, rework: 10, open: 5, locked: false,
    });
    expect(result.valid).toBe(true);
  });

  it("invalid when sum does not match", () => {
    const result = validateQuantityIntegrity({
      original: 100, completed: 80, scrap: 5, rework: 10, open: 10, locked: false,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("mismatch");
  });

  it("valid with all zeros", () => {
    const result = validateQuantityIntegrity({
      original: 0, completed: 0, scrap: 0, rework: 0, open: 0, locked: false,
    });
    expect(result.valid).toBe(true);
  });
});

describe("computeQtyOpen", () => {
  it("computes correctly", () => {
    expect(computeQtyOpen(100, 50, 10, 5)).toBe(35);
  });

  it("clamps to zero", () => {
    expect(computeQtyOpen(10, 8, 5, 0)).toBe(0);
  });

  it("handles zero original", () => {
    expect(computeQtyOpen(0, 0, 0, 0)).toBe(0);
  });
});

describe("validateNcrQuantity", () => {
  it("valid quantity", () => {
    expect(validateNcrQuantity(5, 10).valid).toBe(true);
  });

  it("rejects zero", () => {
    expect(validateNcrQuantity(0, 10).valid).toBe(false);
  });

  it("rejects negative", () => {
    expect(validateNcrQuantity(-1, 10).valid).toBe(false);
  });

  it("rejects non-integer", () => {
    expect(validateNcrQuantity(1.5, 10).valid).toBe(false);
  });

  it("rejects exceeding open qty", () => {
    const result = validateNcrQuantity(15, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds");
  });

  it("allows equal to open qty", () => {
    expect(validateNcrQuantity(10, 10).valid).toBe(true);
  });
});

describe("computeQualityMetrics", () => {
  it("computes metrics correctly", () => {
    const items = [
      { qty_original: 100, qty_completed: 90, qty_scrap: 5, qty_rework: 5, is_rework: false },
      { qty_original: 50, qty_completed: 45, qty_scrap: 3, qty_rework: 2, is_rework: false },
    ];
    const metrics = computeQualityMetrics(items);
    expect(metrics.totalOriginal).toBe(150);
    expect(metrics.totalCompleted).toBe(135);
    expect(metrics.totalScrap).toBe(8);
    expect(metrics.totalRework).toBe(7);
    expect(metrics.firstPassYieldPct).toBeCloseTo(85.33, 1);
    expect(metrics.scrapRatePct).toBeCloseTo(5.33, 1);
    expect(metrics.reworkRatePct).toBeCloseTo(4.67, 1);
  });

  it("excludes rework WOs from metrics", () => {
    const items = [
      { qty_original: 100, qty_completed: 90, qty_scrap: 5, qty_rework: 5, is_rework: false },
      { qty_original: 5, qty_completed: 5, qty_scrap: 0, qty_rework: 0, is_rework: true },
    ];
    const metrics = computeQualityMetrics(items);
    expect(metrics.totalOriginal).toBe(100);
  });

  it("handles empty array", () => {
    const metrics = computeQualityMetrics([]);
    expect(metrics.firstPassYieldPct).toBe(0);
    expect(metrics.scrapRatePct).toBe(0);
  });

  it("handles null values", () => {
    const items = [{ qty_original: null, qty_completed: null, qty_scrap: null, qty_rework: null }];
    const metrics = computeQualityMetrics(items);
    expect(metrics.totalOriginal).toBe(0);
  });
});

describe("formatDisposition", () => {
  it("formats scrap", () => {
    expect(formatDisposition("scrap").label).toBe("Scrap");
  });
  it("formats rework", () => {
    expect(formatDisposition("rework").label).toBe("Rework");
  });
  it("formats use_as_is", () => {
    expect(formatDisposition("use_as_is").label).toBe("Use As Is");
  });
  it("formats unknown", () => {
    expect(formatDisposition("other").label).toBe("other");
  });
});

describe("formatAuthStatus", () => {
  it("formats pending", () => {
    expect(formatAuthStatus("pending").variant).toBe("secondary");
  });
  it("formats approved", () => {
    expect(formatAuthStatus("approved").variant).toBe("default");
  });
  it("formats rejected", () => {
    expect(formatAuthStatus("rejected").variant).toBe("destructive");
  });
});

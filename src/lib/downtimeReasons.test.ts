import { describe, it, expect } from "vitest";
import { DEFAULT_DOWNTIME_REASONS, findReasonLabel } from "./downtimeReasons";

describe("downtimeReasons", () => {
  it("has a stable default taxonomy with unique codes", () => {
    const codes = DEFAULT_DOWNTIME_REASONS.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain("tool_break");
    expect(codes).toContain("material_shortage");
    expect(codes).toContain("other");
  });

  it("findReasonLabel resolves known codes", () => {
    expect(findReasonLabel("tool_break", DEFAULT_DOWNTIME_REASONS)).toBe("Tool Break / Wear");
  });

  it("findReasonLabel falls back to the raw code for unknown values", () => {
    expect(findReasonLabel("zzz_unknown", DEFAULT_DOWNTIME_REASONS)).toBe("zzz_unknown");
  });

  it("findReasonLabel returns Uncategorized for nullish", () => {
    expect(findReasonLabel(null, DEFAULT_DOWNTIME_REASONS)).toBe("Uncategorized");
    expect(findReasonLabel(undefined, DEFAULT_DOWNTIME_REASONS)).toBe("Uncategorized");
  });
});

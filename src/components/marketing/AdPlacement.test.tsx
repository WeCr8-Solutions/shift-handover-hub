import { describe, expect, it } from "vitest";

import { isAdEligibleContentRoute, isAuthedAppRoute } from "./AdPlacement";

describe("AdPlacement route gating", () => {
  it("keeps authenticated app routes ad-free", () => {
    expect(isAuthedAppRoute("/dashboard")).toBe(true);
    expect(isAuthedAppRoute("/queue/active")).toBe(true);
    expect(isAuthedAppRoute("/resources/gcode-reference")).toBe(false);
  });

  it("allows ads only on content-heavy public routes", () => {
    expect(isAdEligibleContentRoute("/blog")).toBe(true);
    expect(isAdEligibleContentRoute("/blog/job-shop-erp-guide")).toBe(true);
    expect(isAdEligibleContentRoute("/resources/gcode-reference")).toBe(true);
    expect(isAdEligibleContentRoute("/features/digital-expeditor")).toBe(true);
  });

  it("blocks ads on thin, utility, and conversion-first routes", () => {
    expect(isAdEligibleContentRoute("/")).toBe(false);
    expect(isAdEligibleContentRoute("/pricing")).toBe(false);
    expect(isAdEligibleContentRoute("/demo")).toBe(false);
    expect(isAdEligibleContentRoute("/tools")).toBe(false);
    expect(isAdEligibleContentRoute("/verify/abc123")).toBe(false);
    expect(isAdEligibleContentRoute("/certificates")).toBe(false);
    expect(isAdEligibleContentRoute("/help")).toBe(false);
    expect(isAdEligibleContentRoute("/handbook")).toBe(false);
    expect(isAdEligibleContentRoute("/resources")).toBe(false);
    expect(isAdEligibleContentRoute("/gca")).toBe(false);
    expect(isAdEligibleContentRoute("/oap")).toBe(false);
  });
});
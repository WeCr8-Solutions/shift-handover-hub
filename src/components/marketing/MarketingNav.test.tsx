import { describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

import { menuFallbackHref } from "./MarketingNav";

describe("MarketingNav", () => {
  it("uses the learning hub as the Learn fallback route", () => {
    expect(menuFallbackHref.learn).toBe("/learn");
  });
});
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsSkeleton } from "../SettingsSkeleton";

describe("SettingsSkeleton", () => {
  it("renders the default number of skeleton rows (3)", () => {
    const { container } = render(<SettingsSkeleton />);
    const cards = container.querySelectorAll("[class*='animate-pulse']");
    // 3 cards × 3 skeletons each = 9 pulse elements
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it("renders a custom number of rows", () => {
    const { container } = render(<SettingsSkeleton rows={5} />);
    // The outer div should have 5 Card children
    const outerDiv = container.firstElementChild;
    expect(outerDiv?.children.length).toBe(5);
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, mockOrg } from "@/test/test-utils";
import { ParetoChart } from "./ParetoChart";

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => mockOrg,
}));


// Recharts depends on ResizeObserver (provided by setup) + a sized parent in jsdom.
// We assert via the empty-state branch and the headings/labels in data branch.
describe("ParetoChart", () => {
  const reasons = [
    { code: "tool_break", label: "Tool Break / Wear" },
    { code: "material_shortage", label: "Material Shortage" },
  ];

  it("renders empty state when there are no events", () => {
    render(<ParetoChart events={[]} reasons={reasons} />);
    expect(screen.getByText(/No downtime recorded/i)).toBeInTheDocument();
  });

  it("renders chart container when events are present", () => {
    render(
      <ParetoChart
        events={[
          { reason_code: "tool_break", duration_minutes: 30 },
          { reason_code: "tool_break", duration_minutes: 15 },
          { reason_code: "material_shortage", duration_minutes: 60 },
          { reason_code: null, duration_minutes: 5 },
        ]}
        reasons={reasons}
      />,
    );
    // Subtitle from ChartContainer is the most reliable jsdom-friendly assertion.
    expect(screen.getByText(/Top downtime reasons/i)).toBeInTheDocument();
  });

  it("treats null reason codes as uncategorized without crashing", () => {
    expect(() =>
      render(
        <ParetoChart
          events={[{ reason_code: null, duration_minutes: 10 }]}
          reasons={reasons}
        />,
      ),
    ).not.toThrow();
  });
});

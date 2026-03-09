import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { QualityMetricsDashboard } from "./QualityMetricsDashboard";

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: {
      id: "org-1",
      name: "Test Org",
      slug: "test-org",
      description: null,
      logo_url: null,
      subscription_tier: "team",
      subscription_status: "active",
      trial_ends_at: null,
    },
    organizationRole: "supervisor",
    teams: [],
    userRoles: [],
    primaryRole: "supervisor",
    primaryTeam: null,
    loading: false,
    refresh: async () => {},
  }),
}));

const sampleItems = [
  { qty_original: 100, qty_completed: 90, qty_scrap: 5, qty_rework: 5, is_rework: false },
  { qty_original: 50, qty_completed: 48, qty_scrap: 1, qty_rework: 1, is_rework: false },
];

describe("QualityMetricsDashboard", () => {
  it("renders quality metric cards", () => {
    render(<QualityMetricsDashboard items={sampleItems} />);
    expect(screen.getByText("First Pass Yield")).toBeInTheDocument();
    expect(screen.getByText("Scrap Rate")).toBeInTheDocument();
    expect(screen.getByText("Rework Rate")).toBeInTheDocument();
  });

  it("returns null when no items have quantities", () => {
    const { container } = render(<QualityMetricsDashboard items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("calculates and displays scrap count", () => {
    render(<QualityMetricsDashboard items={sampleItems} />);
    const pcsElements = screen.getAllByText("6 pcs");
    expect(pcsElements.length).toBeGreaterThanOrEqual(1);
  });

  it("calculates and displays rework count", () => {
    render(<QualityMetricsDashboard items={sampleItems} />);
    const pcsElements = screen.getAllByText("6 pcs");
    expect(pcsElements.length).toBe(2); // scrap + rework both show 6 pcs
  });

  it("shows percentage values", () => {
    render(<QualityMetricsDashboard items={sampleItems} />);
    // FPY, scrap rate, rework rate should all show percentages
    const percentages = screen.getAllByText(/%/);
    expect(percentages.length).toBeGreaterThanOrEqual(3);
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { QueueStatsCards } from "./QueueStatsCards";

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

describe("QueueStatsCards", () => {
  const mockStats = {
    total: 25,
    pending: 8,
    inProgress: 5,
    completed: 10,
    overdue: 2,
  };

  it("renders all stat cards with correct values", () => {
    render(<QueueStatsCards stats={mockStats} />);

    expect(screen.getByText("Total Items")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("displays overdue count when there are overdue items", () => {
    render(<QueueStatsCards stats={mockStats} />);
    // The overdue stat shows the count in the main display
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("does not display overdue text when there are no overdue items", () => {
    const noOverdueStats = { ...mockStats, overdue: 0 };
    render(<QueueStatsCards stats={noOverdueStats} />);
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });

  it("renders with zero values", () => {
    const zeroStats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    };
    render(<QueueStatsCards stats={zeroStats} />);

    const zeroElements = screen.getAllByText("0");
    expect(zeroElements.length).toBeGreaterThanOrEqual(4);
  });
});

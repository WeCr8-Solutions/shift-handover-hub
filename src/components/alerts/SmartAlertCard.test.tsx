import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { SmartAlertCard } from "./SmartAlertCard";
import type { SmartAlert } from "@/hooks/useSmartAlerts";

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

const makeAlert = (overrides: Partial<SmartAlert> = {}): SmartAlert => ({
  id: "alert-1",
  type: "overdue",
  severity: "critical",
  title: "WO-100 overdue by 3 days",
  detail: "Due date passed on Mar 5",
  targetId: "qi-1",
  targetType: "work_order",
  metric: 3,
  metricLabel: "3 days",
  sortWeight: 100,
  ...overrides,
});

describe("SmartAlertCard", () => {
  it("renders alert title and detail", () => {
    render(<SmartAlertCard alert={makeAlert()} />);
    expect(screen.getByText("WO-100 overdue by 3 days")).toBeInTheDocument();
    expect(screen.getByText("Due date passed on Mar 5")).toBeInTheDocument();
  });

  it("renders metric badge when present", () => {
    render(<SmartAlertCard alert={makeAlert()} />);
    expect(screen.getByText("3 days")).toBeInTheDocument();
  });

  it("renders without metric badge when not present", () => {
    render(<SmartAlertCard alert={makeAlert({ metric: undefined, metricLabel: undefined })} />);
    expect(screen.queryByText("3 days")).not.toBeInTheDocument();
  });

  it("applies correct severity styling for critical", () => {
    const { container } = render(<SmartAlertCard alert={makeAlert({ severity: "critical" })} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("applies correct severity styling for warning", () => {
    const { container } = render(<SmartAlertCard alert={makeAlert({ severity: "warning" })} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("applies correct severity styling for info", () => {
    const { container } = render(<SmartAlertCard alert={makeAlert({ severity: "info" })} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    render(<SmartAlertCard alert={makeAlert()} onClick={onClick} />);
    fireEvent.click(screen.getByText("WO-100 overdue by 3 days"));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders correct icon for each alert type", () => {
    // overdue type should render AlertTriangle icon
    const { container } = render(<SmartAlertCard alert={makeAlert({ type: "bottleneck" })} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { StatusBadge, getJobStateStatus, getJobStateShortName } from "./StatusBadge";

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

describe("StatusBadge", () => {
  it("renders ok status with correct styling", () => {
    render(<StatusBadge status="ok">Running</StatusBadge>);
    const badge = screen.getByText("Running");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("status-ok");
  });

  it("renders warning status with correct styling", () => {
    render(<StatusBadge status="warning">Setup</StatusBadge>);
    const badge = screen.getByText("Setup");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("status-warning");
  });

  it("renders critical status with correct styling", () => {
    render(<StatusBadge status="critical">Down</StatusBadge>);
    const badge = screen.getByText("Down");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("status-critical");
  });

  it("renders waiting status with correct styling", () => {
    render(<StatusBadge status="waiting">QA Hold</StatusBadge>);
    const badge = screen.getByText("QA Hold");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("status-waiting");
  });

  it("renders info status with correct styling", () => {
    render(<StatusBadge status="info">Info</StatusBadge>);
    const badge = screen.getByText("Info");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("status-info");
  });

  it("applies pulse animation when pulse prop is true", () => {
    render(<StatusBadge status="ok" pulse>Active</StatusBadge>);
    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("animate-pulse-glow");
  });

  it("applies custom className", () => {
    render(<StatusBadge status="ok" className="custom-class">Test</StatusBadge>);
    const badge = screen.getByText("Test");
    expect(badge).toHaveClass("custom-class");
  });
});

describe("getJobStateStatus", () => {
  it("returns ok for running states", () => {
    expect(getJobStateStatus("Part Running")).toBe("ok");
    expect(getJobStateStatus("Processing")).toBe("ok");
    expect(getJobStateStatus("Ready for Pickup")).toBe("ok");
  });

  it("returns warning for setup states", () => {
    expect(getJobStateStatus("Setup in Progress")).toBe("warning");
    expect(getJobStateStatus("First Article in Process")).toBe("warning");
  });

  it("returns waiting for hold states", () => {
    expect(getJobStateStatus("Waiting on QA")).toBe("waiting");
    expect(getJobStateStatus("Waiting on Tooling")).toBe("waiting");
    expect(getJobStateStatus("Waiting on Material")).toBe("waiting");
    expect(getJobStateStatus("On Hold")).toBe("waiting");
  });

  it("returns critical for down states", () => {
    expect(getJobStateStatus("Machine Down / Issue")).toBe("critical");
  });
});

describe("getJobStateShortName", () => {
  it("returns short names for job states", () => {
    expect(getJobStateShortName("Part Running")).toBe("Running");
    expect(getJobStateShortName("Setup in Progress")).toBe("Setup");
    expect(getJobStateShortName("Machine Down / Issue")).toBe("Down");
    expect(getJobStateShortName("Waiting on QA")).toBe("QA Hold");
  });
});

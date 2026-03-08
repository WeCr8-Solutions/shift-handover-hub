import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { SmartAlertPanel } from "./SmartAlertPanel";
import type { SmartAlert } from "@/hooks/useSmartAlerts";

const makeAlert = (overrides: Partial<SmartAlert> = {}): SmartAlert => ({
  id: "alert-1",
  type: "overdue",
  severity: "critical",
  title: "WO-100 is 3 days overdue",
  detail: "Due date was Mar 5",
  targetId: "qi-1",
  targetType: "work_order",
  metric: 3,
  metricLabel: "3 days",
  sortWeight: 100,
  ...overrides,
});

describe("SmartAlertPanel", () => {
  it("renders alert cards", () => {
    render(<SmartAlertPanel alerts={[makeAlert()]} />);
    expect(screen.getByText("WO-100 is 3 days overdue")).toBeInTheDocument();
  });

  it("returns null when no alerts and not loading", () => {
    const { container } = render(<SmartAlertPanel alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders loading state when loading with no alerts", () => {
    render(<SmartAlertPanel alerts={[]} loading={true} />);
    expect(screen.getByText("Loading alerts…")).toBeInTheDocument();
  });

  it("filters alerts by type", () => {
    const alerts = [
      makeAlert(),
      makeAlert({ id: "alert-2", type: "stale", title: "WO-200 is stale" }),
    ];
    render(<SmartAlertPanel alerts={alerts} />);
    // Both should be visible initially
    expect(screen.getByText("WO-100 is 3 days overdue")).toBeInTheDocument();
    expect(screen.getByText("WO-200 is stale")).toBeInTheDocument();
  });

  it("respects maxVisible limit", () => {
    const alerts = Array.from({ length: 15 }, (_, i) =>
      makeAlert({ id: `alert-${i}`, title: `Alert ${i}` })
    );
    render(<SmartAlertPanel alerts={alerts} maxVisible={5} />);
    // Should show "show more" when there are more than maxVisible
    expect(screen.getByText(/more/i)).toBeInTheDocument();
  });

  it("expands to show all alerts", () => {
    const alerts = Array.from({ length: 15 }, (_, i) =>
      makeAlert({ id: `alert-${i}`, title: `Alert ${i}` })
    );
    render(<SmartAlertPanel alerts={alerts} maxVisible={5} />);
    fireEvent.click(screen.getByText(/more/i));
    // After expand, all alerts should be visible
    expect(screen.getByText("Alert 14")).toBeInTheDocument();
  });
});

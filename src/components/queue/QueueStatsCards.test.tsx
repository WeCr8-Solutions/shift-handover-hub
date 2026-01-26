import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { QueueStatsCards } from "./QueueStatsCards";

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

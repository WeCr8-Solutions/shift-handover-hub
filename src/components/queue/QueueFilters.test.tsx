import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { QueueFilters } from "./QueueFilters";

describe("QueueFilters", () => {
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filter dropdown triggers", () => {
    render(<QueueFilters filters={{}} onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByText("Add status...")).toBeInTheDocument();
    expect(screen.getByText("Add type...")).toBeInTheDocument();
  });

  it("shows clear all button when filters are applied", () => {
    render(
      <QueueFilters
        filters={{ status: ["pending"] }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("hides clear all button when no filters are applied", () => {
    render(<QueueFilters filters={{}} onFiltersChange={mockOnFiltersChange} />);

    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("calls onFiltersChange when clear all button is clicked", () => {
    render(
      <QueueFilters
        filters={{ status: ["pending"] }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText("Clear all"));
    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it("displays active filter badges", () => {
    render(
      <QueueFilters
        filters={{ status: ["pending", "queued"] }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("queued")).toBeInTheDocument();
  });
});

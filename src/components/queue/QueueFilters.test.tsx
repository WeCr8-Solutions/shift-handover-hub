import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";

// Mock useAuth (used transitively by useQuoteSystem -> useAppSettings)
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user" }, loading: false }),
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: { id: "test-org-id", name: "Test Org" },
    loading: false,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

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

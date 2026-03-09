import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";

// --- Mocks ---
vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: { id: "org-1", name: "Test Org", slug: "test-org", description: null, logo_url: null, subscription_tier: "team", subscription_status: "active", trial_ends_at: null },
    organizationRole: "supervisor",
    teams: [],
    userRoles: [],
    primaryRole: "supervisor",
    primaryTeam: null,
    loading: false,
    refresh: async () => {},
  }),
}));

vi.mock("@/lib/mockData", () => ({
  getCurrentShift: () => "Day",
}));

vi.mock("@/lib/workCenterIcons", () => ({
  workCenterIcons: {},
  workCenterColors: {},
  getCategoryForType: (type: string) => type || "Other",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockStations = [
  {
    id: "stn-1",
    station_id: "CNC-01",
    name: "CNC Lathe 01",
    work_center_type: "CNC Lathe",
    is_active: true,
  },
  {
    id: "stn-2",
    station_id: "CNC-02",
    name: "CNC Mill 02",
    work_center_type: "CNC Mill",
    is_active: true,
  },
  {
    id: "stn-3",
    station_id: "CNC-03",
    name: "CNC Inactive",
    work_center_type: "CNC Lathe",
    is_active: false,
  },
];

let mockLoading = false;

vi.mock("@/hooks/useStations", () => ({
  useStations: () => ({
    stations: mockStations,
    loading: mockLoading,
  }),
}));

import { StationCheckIn } from "./StationCheckIn";
import { toast } from "sonner";

function renderCheckIn(onCheckIn = vi.fn().mockResolvedValue(undefined)) {
  return {
    user: userEvent.setup(),
    onCheckIn,
    ...render(<StationCheckIn onCheckIn={onCheckIn} />),
  };
}

describe("StationCheckIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading = false;
  });

  it("renders loading state when stations are loading", () => {
    mockLoading = true;
    render(<StationCheckIn onCheckIn={vi.fn()} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders header and shift selector", () => {
    renderCheckIn();
    expect(screen.getByText("Start Your Shift")).toBeInTheDocument();
    expect(screen.getByText("Shift:")).toBeInTheDocument();
  });

  it("only shows active stations", () => {
    renderCheckIn();
    expect(screen.getByText("CNC Lathe 01")).toBeInTheDocument();
    expect(screen.getByText("CNC Mill 02")).toBeInTheDocument();
    expect(screen.queryByText("CNC Inactive")).not.toBeInTheDocument();
  });

  it("allows selecting and deselecting stations", async () => {
    const { user } = renderCheckIn();

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']");
    expect(station1).toHaveAttribute("aria-checked", "false");

    await user.click(station1!);
    expect(station1).toHaveAttribute("aria-checked", "true");

    await user.click(station1!);
    expect(station1).toHaveAttribute("aria-checked", "false");
  });

  it("disables start button when no stations selected", () => {
    renderCheckIn();
    const startButton = screen.getByRole("button", { name: /start shift/i });
    expect(startButton).toBeDisabled();
  });

  it("enables start button when stations are selected", async () => {
    const { user } = renderCheckIn();

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']");
    await user.click(station1!);

    const startButton = screen.getByRole("button", { name: /start shift/i });
    expect(startButton).not.toBeDisabled();
  });

  it("calls onCheckIn with selected stations and shift", async () => {
    const onCheckIn = vi.fn().mockResolvedValue(undefined);
    const { user } = renderCheckIn(onCheckIn);

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']");
    const station2 = screen.getByText("CNC Mill 02").closest("[role='checkbox']");

    await user.click(station1!);
    await user.click(station2!);

    const startButton = screen.getByRole("button", { name: /start shift/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(onCheckIn).toHaveBeenCalledWith(expect.arrayContaining(["stn-1", "stn-2"]), "Day");
    });
  });

  it("shows success toast on successful check-in", async () => {
    const onCheckIn = vi.fn().mockResolvedValue(undefined);
    const { user } = renderCheckIn(onCheckIn);

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']");
    await user.click(station1!);

    const startButton = screen.getByRole("button", { name: /start shift/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Checked in to 1 station");
    });
  });

  it("shows error toast and message on failed check-in", async () => {
    const onCheckIn = vi.fn().mockRejectedValue(new Error("Network error"));
    const { user } = renderCheckIn(onCheckIn);

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']");
    await user.click(station1!);

    const startButton = screen.getByRole("button", { name: /start shift/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
  });

  it("supports keyboard navigation on station cards", async () => {
    const { user } = renderCheckIn();

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']") as HTMLElement;
    station1.focus();

    await user.keyboard("{Enter}");
    expect(station1).toHaveAttribute("aria-checked", "true");

    await user.keyboard(" ");
    expect(station1).toHaveAttribute("aria-checked", "false");
  });

  it("filters stations by search query", async () => {
    const { user } = renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search stations...");
    await user.type(searchInput, "Mill");

    expect(screen.queryByText("CNC Lathe 01")).not.toBeInTheDocument();
    expect(screen.getByText("CNC Mill 02")).toBeInTheDocument();
  });

  it("shows no results message when search has no matches", async () => {
    const { user } = renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search stations...");
    await user.type(searchInput, "nonexistent");

    expect(screen.getByText(/no matching stations/i)).toBeInTheDocument();
  });

  it("select all button selects all filtered stations", async () => {
    const { user } = renderCheckIn();

    const selectAllButton = screen.getByRole("button", { name: /select all/i });
    await user.click(selectAllButton);

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']");
    const station2 = screen.getByText("CNC Mill 02").closest("[role='checkbox']");

    expect(station1).toHaveAttribute("aria-checked", "true");
    expect(station2).toHaveAttribute("aria-checked", "true");
  });

  it("clear all button deselects all stations", async () => {
    const { user } = renderCheckIn();

    // Select all first
    const selectAllButton = screen.getByRole("button", { name: /select all/i });
    await user.click(selectAllButton);

    // Now it should show "Clear All"
    const clearAllButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearAllButton);

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']");
    const station2 = screen.getByText("CNC Mill 02").closest("[role='checkbox']");

    expect(station1).toHaveAttribute("aria-checked", "false");
    expect(station2).toHaveAttribute("aria-checked", "false");
  });

  it("updates button text with selection count", async () => {
    const { user } = renderCheckIn();

    expect(screen.getByText(/Start Shift \(0 stations\)/i)).toBeInTheDocument();

    const station1 = screen.getByText("CNC Lathe 01").closest("[role='checkbox']");
    await user.click(station1!);

    expect(screen.getByText(/Start Shift \(1 station\)/i)).toBeInTheDocument();
  });
});

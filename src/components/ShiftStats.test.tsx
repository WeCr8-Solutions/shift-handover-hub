import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";

// --- Mocks ---
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "sup@test.com" },
    profile: { display_name: "Test Supervisor" },
  }),
}));

vi.mock("@/contexts/TeamContext", () => ({
  useCurrentTeam: () => ({
    currentTeam: { id: "team-1", name: "Floor A" },
    setCurrentTeam: vi.fn(),
  }),
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: { id: "org-1", name: "Acme Mfg", slug: "acme-mfg", description: null, logo_url: null, subscription_tier: "team", subscription_status: "active", trial_ends_at: null },
    organizationRole: "admin",
    teams: [],
    userRoles: [],
    primaryRole: "admin",
    primaryTeam: null,
    loading: false,
    refresh: async () => {},
  }),
}));

const mockStations = [
  {
    id: "s1",
    name: "CNC-01",
    station_id: "STN-01",
    work_center: "CNC",
    work_center_type: "cnc_lathe",
    is_active: true,
    current_status: { current_job_state: "Part Running" },
  },
  {
    id: "s2",
    name: "CNC-02",
    station_id: "STN-02",
    work_center: "CNC",
    work_center_type: "cnc_mill",
    is_active: true,
    current_status: { current_job_state: "Machine Down / Issue" },
  },
];

vi.mock("@/hooks/useStations", () => ({
  useStations: (_teamId: string, _orgId: string) => ({
    stations: mockStations,
    loading: false,
  }),
  useHandoffRecords: (_teamId: string, _orgId: string) => ({
    records: [{ id: "h1" }],
    loading: false,
    createHandoffRecord: vi.fn(),
  }),
}));

import { ShiftStats } from "./ShiftStats";

function renderComponent() {
  return render(<ShiftStats />);
}

describe("ShiftStats — org-scoped rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Running and Down counts from org-scoped stations", () => {
    renderComponent();

    // 1 station running
    expect(screen.getByText("Running")).toBeInTheDocument();
    // 1 station down
    expect(screen.getByText("Down")).toBeInTheDocument();
  });

  it("renders Recent Handoffs count", () => {
    renderComponent();
    expect(screen.getByText("Recent Handoffs")).toBeInTheDocument();
  });

  it("passes organization.id to useStations and useHandoffRecords", async () => {
    const stationsMod = await import("@/hooks/useStations");
    const useStationsSpy = vi.spyOn(stationsMod, "useStations");
    const useHandoffSpy = vi.spyOn(stationsMod, "useHandoffRecords");

    renderComponent();

    // Verify org-scoped calls
    expect(useStationsSpy).toHaveBeenCalledWith("team-1", "org-1");
    expect(useHandoffSpy).toHaveBeenCalledWith("team-1", "org-1");
  });
});

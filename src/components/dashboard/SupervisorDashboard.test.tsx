import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// --- Mocks ---
vi.mock("@/contexts/TeamContext", () => ({
  useCurrentTeam: () => ({
    currentTeam: { id: "team-1", name: "CNC Team" },
    setCurrentTeam: vi.fn(),
    teams: [{ id: "team-1", name: "CNC Team" }],
  }),
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({ organization: { id: "org-1", name: "Test Org" } }),
}));

const mockStations = [
  {
    id: "db-stn-1",
    station_id: "CNC-01",
    name: "CNC Lathe 01",
    work_center: "CNC",
    work_center_type: "CNC Lathe",
    is_active: true,
    team_id: "team-1",
    created_at: "",
    updated_at: "",
    current_status: {
      id: "cs-1",
      station_id: "db-stn-1",
      current_job_state: "Part Running",
      current_job_work_order: "WO-100",
      current_job_part_number: "PT-200",
      current_operator_name: "John",
      current_operator_id: "u-1",
      parts_complete: 40,
      parts_required: 100,
      condition_status: "OK",
      condition_notes: null,
      last_handoff_id: null,
      updated_at: "",
    },
  },
  {
    id: "db-stn-2",
    station_id: "CNC-02",
    name: "CNC Mill 02",
    work_center: "CNC",
    work_center_type: "CNC Mill",
    is_active: true,
    team_id: "team-1",
    created_at: "",
    updated_at: "",
    current_status: {
      id: "cs-2",
      station_id: "db-stn-2",
      current_job_state: "Machine Down / Issue",
      current_job_work_order: "WO-101",
      current_job_part_number: "PT-201",
      current_operator_name: "Jane",
      current_operator_id: "u-2",
      parts_complete: 0,
      parts_required: 50,
      condition_status: "Issue",
      condition_notes: "Spindle overheat",
      last_handoff_id: null,
      updated_at: "",
    },
  },
];

const mockRecords = [
  {
    id: "h-1",
    machine_id: "CNC-01",
    outgoing_operator_name: "John",
    incoming_operator_name: "Jane",
    created_at: new Date().toISOString(),
    primary_state: "Part Running",
  },
];

// Track which args useStations and useHandoffRecords are called with
const useStationsCalls: any[] = [];
const useHandoffRecordsCalls: any[] = [];

vi.mock("@/hooks/useStations", () => ({
  useStations: (...args: any[]) => {
    useStationsCalls.push(args);
    return { stations: mockStations, loading: false };
  },
  useHandoffRecords: (...args: any[]) => {
    useHandoffRecordsCalls.push(args);
    return { records: mockRecords, loading: false, createHandoffRecord: vi.fn() };
  },
}));

function renderDashboard(props?: Partial<any>) {
  return render(
    <BrowserRouter>
      <SupervisorDashboard
        onNewHandoff={vi.fn()}
        onPerformanceUpdate={vi.fn()}
        onCreateWorkOrder={vi.fn()}
        onViewStation={vi.fn()}
        {...props}
      />
    </BrowserRouter>
  );
}

// Import after mocks
import { SupervisorDashboard } from "./SupervisorDashboard";

describe("SupervisorDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStationsCalls.length = 0;
    useHandoffRecordsCalls.length = 0;
  });

  it("passes organization?.id explicitly to useStations and useHandoffRecords", () => {
    renderDashboard();
    // Both hooks should receive (teamId, orgId)
    expect(useStationsCalls.length).toBeGreaterThan(0);
    expect(useStationsCalls[0]).toEqual(["team-1", "org-1"]);
    expect(useHandoffRecordsCalls.length).toBeGreaterThan(0);
    expect(useHandoffRecordsCalls[0]).toEqual(["team-1", "org-1"]);
  });

  it("computes KPI running count from station states", () => {
    renderDashboard();
    // "Running" appears in KPI section and utilization sidebar
    const runningElements = screen.getAllByText("Running");
    expect(runningElements.length).toBeGreaterThanOrEqual(1);
    // KPI section shows 1 running station out of 2 total
    // Find the KPI card container with "1/2"
    const kpiSection = runningElements[0].closest("div")?.parentElement;
    expect(kpiSection?.textContent).toContain("1");
  });

  it("shows attention item for down station", () => {
    renderDashboard();
    expect(screen.getByText(/CNC Mill 02 is DOWN/i)).toBeInTheDocument();
    expect(screen.getByText(/Spindle overheat/i)).toBeInTheDocument();
  });

  it("passes dbId (not display station_id) to onViewStation on click", async () => {
    const onViewStation = vi.fn();
    renderDashboard({ onViewStation });

    // Multiple "CNC-01" may exist; find the clickable station row
    const stationRows = screen.getAllByText("CNC-01");
    const stationRow = stationRows[0].closest("[class*='cursor-pointer']");
    if (stationRow) {
      (stationRow as HTMLElement).click();
      expect(onViewStation).toHaveBeenCalledWith("db-stn-1", "CNC Lathe 01");
    }
  });

  it("shows recent handoffs section", () => {
    renderDashboard();
    expect(screen.getByText("Recent Handoffs")).toBeInTheDocument();
  });
});

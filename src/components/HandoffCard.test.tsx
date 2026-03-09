import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { HandoffCard } from "./HandoffCard";
import { ShiftHandoffRecord } from "@/types/handoff";

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

const mockRecord: ShiftHandoffRecord = {
  recordId: "hoff-001",
  recordVersion: 1,
  date: "2026-03-08",
  shift: "Day",
  workOrder: "WO-1234",
  workCenter: "CNC",
  workCenterType: "CNC Mill",
  machineId: "MILL-01",
  part: { partNumber: "PN-100", revision: "A", operationNumber: "OP10" },
  personnel: { outgoingOperator: "Alice", incomingOperator: "Bob" },
  jobState: { primaryState: "Part Running" },
  qualityStatus: {
    lastGoodPartTimestamp: new Date().toISOString(),
    partsCompletedThisShift: 25,
    scrapCount: 0,
    reworkCount: 1,
    criticalDimsVerified: true,
    qaNotified: "No",
  },
  setupProcess: {
    fixtureInstalled: "Yes",
    clampsBoltsTorqued: "Yes",
    fixtureOrientationVerified: "Yes",
    specialInstructionsFollowed: "Yes",
  },
  materialsStatus: {
    rawMaterialAvailable: true,
    nextMaterialLotReady: true,
    materialIssuesNoted: false,
  },
  handoffSummary: "All good, smooth shift",
  signOff: {
    outgoingOperatorName: "Alice",
    incomingOperatorName: "Bob",
    outgoingTime: new Date().toISOString(),
    incomingTime: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("HandoffCard", () => {
  it("renders machine ID and work order", () => {
    render(<HandoffCard record={mockRecord} />);
    expect(screen.getByText("MILL-01")).toBeInTheDocument();
    expect(screen.getByText("WO-1234")).toBeInTheDocument();
  });

  it("renders work center type badge", () => {
    render(<HandoffCard record={mockRecord} />);
    expect(screen.getByText("CNC Mill")).toBeInTheDocument();
  });

  it("renders shift label", () => {
    render(<HandoffCard record={mockRecord} />);
    expect(screen.getByText("Day Shift")).toBeInTheDocument();
  });

  it("renders personnel names", () => {
    render(<HandoffCard record={mockRecord} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    render(<HandoffCard record={mockRecord} onClick={onClick} />);
    fireEvent.click(screen.getByText("MILL-01").closest("div")!.closest("div")!.closest("div")!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders job state status badge", () => {
    render(<HandoffCard record={mockRecord} />);
    // The StatusBadge renders the job state
    expect(screen.getByText(/Running/i)).toBeInTheDocument();
  });
});

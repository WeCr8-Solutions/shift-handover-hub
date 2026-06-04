import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FloorMapView } from "./FloorMapView";

vi.mock("@/contexts/OrgContext", () => ({
  useOrgContext: () => ({ organization: { id: "org-1", name: "Org" } }),
}));
vi.mock("@/contexts/TeamContext", () => ({
  useCurrentTeam: () => ({ currentTeam: null }),
}));
vi.mock("@/hooks/useStations", () => ({
  useStations: () => ({
    stations: [
      {
        id: "s1",
        name: "Mill 1",
        is_active: true,
        work_center: "WC-1",
        work_center_type: "Milling",
        current_status: { current_job_state: "Part Running", current_operator_name: "Alex", current_job_work_order: "WO-100" },
      },
      {
        id: "s2",
        name: "Lathe 1",
        is_active: true,
        work_center: "WC-2",
        work_center_type: "Turning",
        current_status: { current_job_state: "Machine Down" },
      },
    ],
    loading: false,
  }),
}));

describe("FloorMapView", () => {
  it("groups stations by work-center type and renders tiles", () => {
    render(<FloorMapView />);
    expect(screen.getByTestId("floor-map-view")).toBeInTheDocument();
    expect(screen.getByText("Mill 1")).toBeInTheDocument();
    expect(screen.getByText("Lathe 1")).toBeInTheDocument();
    expect(screen.getByText("Milling")).toBeInTheDocument();
    expect(screen.getByText("Turning")).toBeInTheDocument();
    expect(screen.getByText("WO-100")).toBeInTheDocument();
  });
});

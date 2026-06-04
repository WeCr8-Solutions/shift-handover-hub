import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CertificateOfConformance } from "./CertificateOfConformance";
import type { TravelerData } from "@/hooks/useWorkOrderTraveler";

const data: TravelerData = {
  workOrder: {
    id: "wo-1",
    work_order: "WO-1001",
    part_number: "PN-42",
    title: "Bracket",
    description: null,
    quantity: 10,
    priority: "medium",
    status: "completed",
    due_date: null,
    scheduled_start: null,
    created_at: "2026-01-01T00:00:00Z",
    organization_id: "org-1",
    metadata: { customer: "Acme", po_number: "PO-9", revision: "B" },
    tags: null,
    operation_number: null,
  },
  routing: [
    { id: "r1", step_number: 1, operation_name: "Mill", operation_type: "internal", station_name: "Mill-3", estimated_duration: null, outside_vendor: null, po_number: null, expected_return_date: null },
    { id: "r2", step_number: 2, operation_name: "Anodize", operation_type: "outside", station_name: null, estimated_duration: null, outside_vendor: "Anodics", po_number: "PO-77", expected_return_date: null },
  ],
  serials: [],
};

describe("CertificateOfConformance", () => {
  it("renders heading, statement, and routing rows", () => {
    render(
      <CertificateOfConformance
        data={data}
        orgName="Acme Mfg"
        logoUrl={null}
        itarFlag={false}
        ncrs={[]}
      />,
    );
    expect(screen.getByText(/CERTIFICATE OF CONFORMANCE/i)).toBeInTheDocument();
    expect(screen.getByText(/Statement of Conformance/i)).toBeInTheDocument();
    expect(screen.getByText(/Mill-3/)).toBeInTheDocument();
    expect(screen.getByText(/Anodics/)).toBeInTheDocument();
  });

  it("shows ITAR banner when flagged", () => {
    render(
      <CertificateOfConformance
        data={data}
        orgName="Acme Mfg"
        logoUrl={null}
        itarFlag
        ncrs={[]}
      />,
    );
    expect(screen.getByText(/ITAR \/ EAR CONTROLLED/i)).toBeInTheDocument();
  });

  it("renders NCR table when nonconformances present", () => {
    render(
      <CertificateOfConformance
        data={data}
        orgName="Acme Mfg"
        logoUrl={null}
        itarFlag={false}
        ncrs={[{ ncr_number: "NCR-1", defect_description: "Burr", status: "approved", disposition: "rework", quantity_affected: 2 }]}
      />,
    );
    expect(screen.getByText(/Nonconformances & Disposition/i)).toBeInTheDocument();
    expect(screen.getByText("NCR-1")).toBeInTheDocument();
    expect(screen.getByText("Burr")).toBeInTheDocument();
  });
});

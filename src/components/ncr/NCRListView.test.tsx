import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { NCRListView } from "./NCRListView";
import { NCRReport } from "@/hooks/useNCR";

const makeNCR = (overrides: Partial<NCRReport> = {}): NCRReport => ({
  id: "ncr-1",
  organization_id: "org-1",
  queue_item_id: "qi-1",
  ncr_number: "NCR-20260308-0001",
  work_order_number: "WO-100",
  part_number: "PN-50",
  serial_or_lot: "LOT-A",
  operation_number: "OP10",
  defect_type: "dimensional",
  disposition: "rework",
  description: "Out of tolerance on bore diameter",
  authorized_by: null,
  authorized_by_name: null,
  authorized_at: null,
  authorization_status: "pending",
  quantity_affected: 5,
  rework_wo_id: null,
  quality_signoff: null,
  customer_approval: null,
  rejection_reason: null,
  metadata: {},
  image_urls: [],
  created_by: "u1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe("NCRListView", () => {
  it("renders NCR number and work order columns", () => {
    render(<NCRListView ncrs={[makeNCR()]} />);
    expect(screen.getByText("NCR-20260308-0001")).toBeInTheDocument();
    expect(screen.getByText("WO-100")).toBeInTheDocument();
  });

  it("renders empty state when no NCRs", () => {
    render(<NCRListView ncrs={[]} />);
    expect(screen.getByText("No NCR reports found")).toBeInTheDocument();
  });

  it("renders defect type and disposition", () => {
    render(<NCRListView ncrs={[makeNCR()]} />);
    expect(screen.getByText("dimensional")).toBeInTheDocument();
    expect(screen.getByText("Rework")).toBeInTheDocument();
  });

  it("renders quantity affected", () => {
    render(<NCRListView ncrs={[makeNCR()]} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls onSelect when row is clicked", () => {
    const onSelect = vi.fn();
    render(<NCRListView ncrs={[makeNCR()]} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("NCR-20260308-0001"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "ncr-1" }));
  });

  it("renders multiple NCRs", () => {
    const ncrs = [
      makeNCR(),
      makeNCR({ id: "ncr-2", ncr_number: "NCR-20260308-0002", work_order_number: "WO-200" }),
    ];
    render(<NCRListView ncrs={ncrs} />);
    expect(screen.getByText("NCR-20260308-0001")).toBeInTheDocument();
    expect(screen.getByText("NCR-20260308-0002")).toBeInTheDocument();
  });

  it("renders authorization status badge", () => {
    render(<NCRListView ncrs={[makeNCR()]} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});

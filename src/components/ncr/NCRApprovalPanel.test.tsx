import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import { NCRApprovalPanel } from "./NCRApprovalPanel";
import { NCRReport } from "@/hooks/useNCR";

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

vi.mock("@/lib/storageUtils", () => ({
  getSignedUrls: vi.fn().mockResolvedValue([]),
}));

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
  disposition: "scrap",
  description: "Bore OOT",
  authorized_by: null,
  authorized_by_name: null,
  authorized_at: null,
  authorization_status: "pending",
  quantity_affected: 3,
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

describe("NCRApprovalPanel", () => {
  it("renders pending NCRs for approval", () => {
    render(
      <NCRApprovalPanel ncrs={[makeNCR()]} onApprove={vi.fn()} onReject={vi.fn()} />
    );
    expect(screen.getByText("NCR-20260308-0001")).toBeInTheDocument();
  });

  it("shows empty state when no pending NCRs", () => {
    const approved = makeNCR({ authorization_status: "approved" });
    render(
      <NCRApprovalPanel ncrs={[approved]} onApprove={vi.fn()} onReject={vi.fn()} />
    );
    expect(screen.getByText(/no pending/i)).toBeInTheDocument();
  });

  it("renders approve and reject buttons", () => {
    render(
      <NCRApprovalPanel ncrs={[makeNCR()]} onApprove={vi.fn()} onReject={vi.fn()} />
    );
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("calls onApprove when approve button clicked", async () => {
    const onApprove = vi.fn().mockResolvedValue({ error: null });
    render(
      <NCRApprovalPanel ncrs={[makeNCR()]} onApprove={onApprove} onReject={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Approve"));
    await waitFor(() => expect(onApprove).toHaveBeenCalledWith("ncr-1"));
  });

  it("renders disposition and quantity info", () => {
    render(
      <NCRApprovalPanel ncrs={[makeNCR()]} onApprove={vi.fn()} onReject={vi.fn()} />
    );
    const scrapElements = screen.getAllByText(/Scrap/i);
    expect(scrapElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

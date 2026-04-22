import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { render, screen } from "@/test/test-utils";
import { QueueItemRoutingTab } from "./QueueItemRoutingTab";
import type { QueueItem } from "@/hooks/useQueue";

const loadAll = vi.fn();
const fetchRequests = vi.fn();
const fetchSheets = vi.fn();

vi.mock("@/contexts/OrgContext", () => ({
  OrgProvider: ({ children }: { children: ReactNode }) => children,
  useOrgContext: () => ({
    organization: { id: "org-1", name: "Test Org" },
  }),
}));

vi.mock("@/hooks/useAdminData", () => ({
  useAdminAccess: () => ({
    hasAdminAccess: false,
    hasOrgSupervisorAccess: true,
    hasDimensionAccess: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDimensions", () => ({
  useDimensions: () => ({
    loading: false,
    requirements: [],
    readings: [],
    loadAll,
    recordReading: vi.fn(),
    fetchRequirements: vi.fn(),
    addRequirement: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDimensionRequests", () => ({
  useDimensionRequests: () => ({
    requests: [],
    fetchRequests,
    submitRequest: vi.fn(),
    reviewRequest: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

vi.mock("@/hooks/useSetupSheets", () => ({
  useSetupSheets: () => ({
    sheets: [
      {
        id: "sheet-1",
        routing_step_id: "step-1",
        queue_item_id: "queue-1",
        organization_id: "org-1",
        title: "Primary Setup",
        sheet_type: "setup_sheet",
        file_url: null,
        file_name: null,
        external_link: null,
        description: null,
        revision: "A",
        uploaded_by: null,
        uploaded_by_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    loading: false,
    fetchSheets,
    addSheet: vi.fn(),
    deleteSheet: vi.fn(),
    uploadFile: vi.fn(),
    getSignedUrl: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/components/queue/RoutingSection", () => ({
  RoutingSection: () => <div>Routing section</div>,
}));

vi.mock("@/components/dimensions/DimensionCheckForm", () => ({
  DimensionCheckForm: () => <div>Dimension check form</div>,
}));

vi.mock("@/components/dimensions/AddDimensionForm", () => ({
  AddDimensionForm: () => <div>Add dimension form</div>,
}));

vi.mock("@/components/dimensions/RequestDimensionCheckButton", () => ({
  RequestDimensionCheckButton: () => <div>Request dimension check</div>,
}));

vi.mock("@/components/dimensions/DimensionRequestsPanel", () => ({
  DimensionRequestsPanel: () => <div>Dimension requests panel</div>,
}));

vi.mock("@/components/queue/SetupSheetsPanel", () => ({
  SetupSheetsPanel: () => <div>Setup sheets panel</div>,
}));

const makeItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: "queue-1",
  team_id: "team-1",
  station_id: null,
  organization_id: "org-1",
  item_type: "work_order",
  title: "Inspection Work Order",
  description: null,
  work_order: "WO-100",
  part_number: "PART-100",
  operation_number: "20",
  quantity: 10,
  status: "in_progress",
  priority: "normal",
  position: 1,
  assigned_to: null,
  assigned_by: null,
  due_date: null,
  scheduled_start: null,
  scheduled_end: null,
  estimated_duration: 45,
  setup_time_minutes: null,
  first_article_minutes: null,
  cycle_time_minutes: null,
  parts_completed: 0,
  current_phase: null,
  started_at: null,
  completed_at: null,
  tags: [],
  metadata: {},
  created_by: "user-1",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  qty_original: null,
  qty_completed: null,
  qty_scrap: null,
  qty_rework: null,
  qty_open: null,
  quantity_locked: null,
  parent_work_order_id: null,
  is_rework: null,
  ...overrides,
});

describe("QueueItemRoutingTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("surfaces legacy package readiness when a routing step is expanded", async () => {
    const user = userEvent.setup();

    render(
      <QueueItemRoutingTab
        item={makeItem()}
        routingSteps={[
          {
            id: "step-1",
            step_number: 20,
            operation_name: "Final Inspection",
            operation_type: "inspection",
            status: "in_progress",
            station_id: null,
            estimated_duration: 30,
            started_at: null,
            completed_at: null,
            completed_by: null,
            notes: null,
            outside_vendor: null,
            po_number: null,
            expected_return_date: null,
            station_name: null,
            station_code: null,
          },
        ]}
        routingLoading={false}
        stations={[]}
        onReloadRouting={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Dimensions & Setup Sheets/i }));

    expect(loadAll).toHaveBeenCalledWith("step-1", "queue-1");
    expect(fetchRequests).toHaveBeenCalledWith("step-1");
    expect(fetchSheets).toHaveBeenCalledWith("step-1");
    expect(screen.getByText("Missing required documents")).toBeInTheDocument();
    expect(screen.getByText(/Missing: Inspection Plan, Drawing/i)).toBeInTheDocument();
    expect(screen.getByText(/3 required types/i)).toBeInTheDocument();
  });
});
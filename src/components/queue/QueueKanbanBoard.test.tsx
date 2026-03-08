import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { QueueKanbanBoard } from "./QueueKanbanBoard";
import { QueueItem, QueueStatus } from "@/hooks/useQueue";

const makeItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: "qi-1",
  team_id: "t1",
  station_id: "s1",
  organization_id: "org-1",
  item_type: "work_order",
  title: "Test WO",
  description: null,
  work_order: "WO-100",
  part_number: "PN-50",
  operation_number: "OP10",
  quantity: 10,
  status: "pending",
  priority: "normal",
  position: 1,
  assigned_to: null,
  assigned_by: null,
  due_date: null,
  scheduled_start: null,
  scheduled_end: null,
  estimated_duration: null,
  setup_time_minutes: null,
  first_article_minutes: null,
  cycle_time_minutes: null,
  parts_completed: 0,
  current_phase: "pending",
  started_at: null,
  completed_at: null,
  tags: [],
  metadata: {},
  created_by: "u1",
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

const emptyByStatus: Record<QueueStatus, QueueItem[]> = {
  pending: [],
  queued: [],
  in_progress: [],
  on_hold: [],
  completed: [],
  cancelled: [],
};

describe("QueueKanbanBoard", () => {
  it("renders all six status columns", () => {
    render(
      <QueueKanbanBoard
        itemsByStatus={emptyByStatus}
        onItemClick={vi.fn()}
        onStatusChange={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("On Hold")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("renders items in the correct column", () => {
    const items = { ...emptyByStatus, pending: [makeItem()] };
    render(
      <QueueKanbanBoard
        itemsByStatus={items}
        onItemClick={vi.fn()}
        onStatusChange={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    expect(screen.getByText("WO-100")).toBeInTheDocument();
  });

  it("shows item count in column headers", () => {
    const items = {
      ...emptyByStatus,
      pending: [makeItem(), makeItem({ id: "qi-2", work_order: "WO-200" })],
    };
    render(
      <QueueKanbanBoard
        itemsByStatus={items}
        onItemClick={vi.fn()}
        onStatusChange={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onItemClick when a card is clicked", async () => {
    const onItemClick = vi.fn();
    const items = { ...emptyByStatus, pending: [makeItem()] };
    render(
      <QueueKanbanBoard
        itemsByStatus={items}
        onItemClick={onItemClick}
        onStatusChange={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    const card = screen.getByText("WO-100");
    card.click();
    expect(onItemClick).toHaveBeenCalledWith("qi-1");
  });

  it("renders priority badge on items", () => {
    const items = { ...emptyByStatus, queued: [makeItem({ status: "queued", priority: "critical" })] };
    render(
      <QueueKanbanBoard
        itemsByStatus={items}
        onItemClick={vi.fn()}
        onStatusChange={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });
});

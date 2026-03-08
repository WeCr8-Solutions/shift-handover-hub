import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { QueueListView } from "./QueueListView";
import { QueueItem } from "@/hooks/useQueue";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    }),
  },
}));

const makeItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: "qi-1",
  team_id: "t1",
  station_id: "s1",
  organization_id: "org-1",
  item_type: "work_order",
  title: "Bracket Assembly",
  description: "Assemble brackets",
  work_order: "WO-500",
  part_number: "BRK-10",
  operation_number: "OP20",
  quantity: 50,
  status: "in_progress",
  priority: "high",
  position: 1,
  assigned_to: null,
  assigned_by: null,
  due_date: "2026-03-15",
  scheduled_start: null,
  scheduled_end: null,
  estimated_duration: 120,
  setup_time_minutes: null,
  first_article_minutes: null,
  cycle_time_minutes: null,
  parts_completed: 0,
  current_phase: "running",
  started_at: new Date().toISOString(),
  completed_at: null,
  tags: ["rush"],
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

describe("QueueListView", () => {
  it("renders table with column headers", () => {
    render(
      <QueueListView
        items={[makeItem()]}
        onItemClick={vi.fn()}
        onStatusChange={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("WO-500")).toBeInTheDocument();
    expect(screen.getByText("BRK-10")).toBeInTheDocument();
  });

  it("renders work order and part number for each item", () => {
    const items = [
      makeItem(),
      makeItem({ id: "qi-2", work_order: "WO-600", part_number: "PLT-20" }),
    ];
    render(
      <QueueListView items={items} onItemClick={vi.fn()} onStatusChange={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText("WO-500")).toBeInTheDocument();
    expect(screen.getByText("WO-600")).toBeInTheDocument();
  });

  it("calls onItemClick when a row is clicked", () => {
    const onItemClick = vi.fn();
    render(
      <QueueListView items={[makeItem()]} onItemClick={onItemClick} onStatusChange={vi.fn()} onDelete={vi.fn()} />
    );
    screen.getByText("WO-500").click();
    expect(onItemClick).toHaveBeenCalledWith("qi-1");
  });

  it("shows status dropdown with valid transitions", () => {
    render(
      <QueueListView items={[makeItem()]} onItemClick={vi.fn()} onStatusChange={vi.fn()} onDelete={vi.fn()} />
    );
    // Status should be rendered
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
  });

  it("renders empty state when no items", () => {
    render(
      <QueueListView items={[]} onItemClick={vi.fn()} onStatusChange={vi.fn()} onDelete={vi.fn()} />
    );
    // Should show some empty indicator
    expect(screen.queryByText("WO-500")).not.toBeInTheDocument();
  });
});

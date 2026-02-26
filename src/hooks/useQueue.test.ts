import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueueItem, QueueStatus, QueuePriority } from "./useQueue";

// Mock queue item factory
function createMockQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "test-item-id",
    organization_id: "test-org-id",
    team_id: "test-team-id",
    station_id: null,
    item_type: "team_task",
    title: "Test Queue Item",
    description: "Test description",
    work_order: null,
    part_number: null,
    operation_number: null,
    quantity: null,
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
    current_phase: 'setup',
    started_at: null,
    completed_at: null,
    tags: [],
    metadata: {},
    created_by: "test-user-id",
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
  };
}

describe("Queue Item Types", () => {
  it("creates a valid work order queue item", () => {
    const workOrder = createMockQueueItem({
      item_type: "work_order",
      work_order: "WO-001",
      part_number: "PN-123",
      quantity: 100,
    });

    expect(workOrder.item_type).toBe("work_order");
    expect(workOrder.work_order).toBe("WO-001");
    expect(workOrder.part_number).toBe("PN-123");
    expect(workOrder.quantity).toBe(100);
  });

  it("creates a valid station task queue item", () => {
    const stationTask = createMockQueueItem({
      item_type: "station_task",
      station_id: "test-station-id",
    });

    expect(stationTask.item_type).toBe("station_task");
    expect(stationTask.station_id).toBe("test-station-id");
  });

  it("creates a valid support ticket queue item", () => {
    const ticket = createMockQueueItem({
      item_type: "support_ticket",
      priority: "urgent",
    });

    expect(ticket.item_type).toBe("support_ticket");
    expect(ticket.priority).toBe("urgent");
  });
});

describe("Queue Priority", () => {
  const priorities: QueuePriority[] = ["low", "normal", "high", "urgent", "critical"];

  it("supports all priority levels", () => {
    priorities.forEach((priority) => {
      const item = createMockQueueItem({ priority });
      expect(item.priority).toBe(priority);
    });
  });
});

describe("Queue Status", () => {
  const statuses: QueueStatus[] = ["pending", "queued", "in_progress", "on_hold", "completed", "cancelled"];

  it("supports all status values", () => {
    statuses.forEach((status) => {
      const item = createMockQueueItem({ status });
      expect(item.status).toBe(status);
    });
  });
});

describe("Queue Item Grouping", () => {
  it("groups items by status correctly", () => {
    const items: QueueItem[] = [
      createMockQueueItem({ id: "1", status: "pending" }),
      createMockQueueItem({ id: "2", status: "pending" }),
      createMockQueueItem({ id: "3", status: "in_progress" }),
      createMockQueueItem({ id: "4", status: "completed" }),
    ];

    const itemsByStatus = items.reduce(
      (acc, item) => {
        if (!acc[item.status]) acc[item.status] = [];
        acc[item.status].push(item);
        return acc;
      },
      {} as Record<QueueStatus, QueueItem[]>
    );

    expect(itemsByStatus["pending"].length).toBe(2);
    expect(itemsByStatus["in_progress"].length).toBe(1);
    expect(itemsByStatus["completed"].length).toBe(1);
  });

  it("groups items by station correctly", () => {
    const items: QueueItem[] = [
      createMockQueueItem({ id: "1", station_id: "station-1" }),
      createMockQueueItem({ id: "2", station_id: "station-1" }),
      createMockQueueItem({ id: "3", station_id: "station-2" }),
      createMockQueueItem({ id: "4", station_id: null }),
    ];

    const itemsByStation = items.reduce(
      (acc, item) => {
        const key = item.station_id || "unassigned";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, QueueItem[]>
    );

    expect(itemsByStation["station-1"].length).toBe(2);
    expect(itemsByStation["station-2"].length).toBe(1);
    expect(itemsByStation["unassigned"].length).toBe(1);
  });
});

describe("Queue Item Sorting", () => {
  it("sorts items by position ascending", () => {
    const items: QueueItem[] = [
      createMockQueueItem({ id: "1", position: 3 }),
      createMockQueueItem({ id: "2", position: 1 }),
      createMockQueueItem({ id: "3", position: 2 }),
    ];

    const sorted = [...items].sort((a, b) => a.position - b.position);

    expect(sorted[0].id).toBe("2");
    expect(sorted[1].id).toBe("3");
    expect(sorted[2].id).toBe("1");
  });

  it("identifies overdue items correctly", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const items: QueueItem[] = [
      createMockQueueItem({ id: "1", due_date: yesterday.toISOString(), status: "pending" }),
      createMockQueueItem({ id: "2", due_date: tomorrow.toISOString(), status: "pending" }),
      createMockQueueItem({ id: "3", due_date: yesterday.toISOString(), status: "completed" }),
    ];

    const overdueItems = items.filter(
      (item) => item.due_date && new Date(item.due_date) < now && item.status !== "completed"
    );

    expect(overdueItems.length).toBe(1);
    expect(overdueItems[0].id).toBe("1");
  });
});

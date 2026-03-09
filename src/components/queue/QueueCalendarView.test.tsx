import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { QueueCalendarView } from "./QueueCalendarView";
import { QueueItem } from "@/hooks/useQueue";
import { format } from "date-fns";

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

describe("QueueCalendarView", () => {
  const mockOnItemClick = vi.fn();
  const today = new Date();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders calendar controls", () => {
    render(<QueueCalendarView items={[]} onItemClick={mockOnItemClick} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText("Month")).toBeInTheDocument();
  });

  it("displays unscheduled items section heading", () => {
    const items = [
      createMockQueueItem({ id: "1", title: "My Task", due_date: null }),
    ];

    render(<QueueCalendarView items={items} onItemClick={mockOnItemClick} />);

    // Check for the unscheduled section (shows count)
    const unscheduledHeadings = screen.getAllByText(/Unscheduled/);
    expect(unscheduledHeadings.length).toBeGreaterThan(0);
  });

  it("switches between week and month view", () => {
    render(<QueueCalendarView items={[]} onItemClick={mockOnItemClick} />);

    const monthButton = screen.getByText("Month");
    fireEvent.click(monthButton);

    // After clicking month, week button should still be visible
    const weekButton = screen.getByText("Week");
    expect(weekButton).toBeInTheDocument();
  });

  it("displays items scheduled for today in the calendar", () => {
    const items = [
      createMockQueueItem({
        id: "1",
        title: "Scheduled For Today",
        due_date: today.toISOString(),
      }),
    ];

    render(<QueueCalendarView items={items} onItemClick={mockOnItemClick} />);

    // Items appear in both the calendar day and the selected day sidebar
    const taskElements = screen.getAllByText("Scheduled For Today");
    expect(taskElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows all items scheduled text when no unscheduled items", () => {
    const items = [
      createMockQueueItem({
        id: "1",
        title: "Scheduled Task",
        due_date: today.toISOString(),
      }),
    ];

    render(<QueueCalendarView items={items} onItemClick={mockOnItemClick} />);

    expect(screen.getByText("All items scheduled")).toBeInTheDocument();
  });

  it("navigates to today when Today button is clicked", () => {
    render(<QueueCalendarView items={[]} onItemClick={mockOnItemClick} />);

    const todayButton = screen.getByText("Today");
    fireEvent.click(todayButton);

    // Should show current date in selected day panel
    expect(screen.getByText(format(today, "EEEE, MMM d"))).toBeInTheDocument();
  });

  it("calls onItemClick when a queue item is clicked", () => {
    const items = [
      createMockQueueItem({
        id: "item-123",
        title: "Clickable Task",
        due_date: today.toISOString(),
      }),
    ];

    render(<QueueCalendarView items={items} onItemClick={mockOnItemClick} />);

    const taskElements = screen.getAllByText("Clickable Task");
    fireEvent.click(taskElements[0]);

    expect(mockOnItemClick).toHaveBeenCalledWith("item-123");
  });
});

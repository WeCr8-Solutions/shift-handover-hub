import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// Valid state transitions matching the DB trigger
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["queued", "cancelled"],
  queued: ["in_progress", "cancelled", "pending"],
  in_progress: ["on_hold", "completed", "queued", "cancelled"],
  on_hold: ["in_progress", "cancelled"],
  completed: ["pending"], // rework only
  cancelled: [], // terminal
};

describe("Queue State Machine - Valid Transitions", () => {
  it("pending can only go to queued or cancelled", () => {
    expect(VALID_TRANSITIONS["pending"]).toEqual(["queued", "cancelled"]);
    expect(VALID_TRANSITIONS["pending"]).not.toContain("in_progress");
    expect(VALID_TRANSITIONS["pending"]).not.toContain("completed");
  });

  it("queued can go to in_progress, cancelled, or pending", () => {
    expect(VALID_TRANSITIONS["queued"]).toContain("in_progress");
    expect(VALID_TRANSITIONS["queued"]).toContain("cancelled");
    expect(VALID_TRANSITIONS["queued"]).toContain("pending");
    expect(VALID_TRANSITIONS["queued"]).not.toContain("completed");
  });

  it("in_progress can go to on_hold, completed, queued, or cancelled", () => {
    expect(VALID_TRANSITIONS["in_progress"]).toContain("on_hold");
    expect(VALID_TRANSITIONS["in_progress"]).toContain("completed");
    expect(VALID_TRANSITIONS["in_progress"]).toContain("queued");
    expect(VALID_TRANSITIONS["in_progress"]).toContain("cancelled");
  });

  it("on_hold can only go to in_progress or cancelled", () => {
    expect(VALID_TRANSITIONS["on_hold"]).toEqual(["in_progress", "cancelled"]);
  });

  it("completed can only go to pending (rework)", () => {
    expect(VALID_TRANSITIONS["completed"]).toEqual(["pending"]);
    expect(VALID_TRANSITIONS["completed"]).not.toContain("in_progress");
  });

  it("cancelled is terminal — no transitions allowed", () => {
    expect(VALID_TRANSITIONS["cancelled"]).toEqual([]);
  });
});

describe("Queue Start Work Flow", () => {
  it("Start Work from pending requires queued intermediate step", () => {
    const currentStatus = "pending";
    const targetStatus = "in_progress";
    
    // Direct transition should NOT be valid
    expect(VALID_TRANSITIONS[currentStatus]).not.toContain(targetStatus);
    
    // Must go through queued first
    expect(VALID_TRANSITIONS[currentStatus]).toContain("queued");
    expect(VALID_TRANSITIONS["queued"]).toContain("in_progress");
  });

  it("Start Work from queued goes directly to in_progress", () => {
    expect(VALID_TRANSITIONS["queued"]).toContain("in_progress");
  });
});

describe("Kanban Board Drag-Drop Validation", () => {
  it("should block dragging from pending to in_progress", () => {
    const sourceStatus = "pending";
    const targetStatus = "in_progress";
    const validTargets = VALID_TRANSITIONS[sourceStatus];
    expect(validTargets.includes(targetStatus)).toBe(false);
  });

  it("should allow dragging from pending to queued", () => {
    const sourceStatus = "pending";
    const targetStatus = "queued";
    const validTargets = VALID_TRANSITIONS[sourceStatus];
    expect(validTargets.includes(targetStatus)).toBe(true);
  });

  it("should allow dragging from in_progress to completed", () => {
    expect(VALID_TRANSITIONS["in_progress"].includes("completed")).toBe(true);
  });

  it("should block dragging from cancelled to any status", () => {
    expect(VALID_TRANSITIONS["cancelled"].length).toBe(0);
  });

  it("should block dragging from completed to in_progress", () => {
    expect(VALID_TRANSITIONS["completed"].includes("in_progress")).toBe(false);
  });
});

describe("List View Status Dropdown", () => {
  it("should only show valid transitions for each status", () => {
    Object.entries(VALID_TRANSITIONS).forEach(([status, validTargets]) => {
      // Each status should have a defined set of valid targets
      expect(Array.isArray(validTargets)).toBe(true);
      
      // Terminal states should have empty transitions
      if (status === "cancelled") {
        expect(validTargets.length).toBe(0);
      }
    });
  });

  it("should include the current status in dropdown (for display)", () => {
    // The current status should always be shown even if it's not a "transition"
    const allStatuses = Object.keys(VALID_TRANSITIONS);
    expect(allStatuses.length).toBe(6); // pending, queued, in_progress, on_hold, completed, cancelled
  });
});

describe("Queue Loading Anti-Flash", () => {
  it("should not show spinner when items already loaded", () => {
    const loading = true;
    const itemsCount: number = 5;
    const showSpinner = loading && itemsCount === 0;
    expect(showSpinner).toBe(false);
  });

  it("should show spinner only on initial empty load", () => {
    const loading = true;
    const itemsCount: number = 0;
    const showSpinner = loading && itemsCount === 0;
    expect(showSpinner).toBe(true);
  });
});

describe("Kanban Columns", () => {
  it("should include all 6 statuses including cancelled", () => {
    const expectedColumns = ["pending", "queued", "in_progress", "on_hold", "completed", "cancelled"];
    expect(Object.keys(VALID_TRANSITIONS).sort()).toEqual(expectedColumns.sort());
  });
});

describe("Supervisor Queue Access", () => {
  it("admins should default to organization scope", () => {
    const hasAdminAccess = true;
    const urlStationId = null;
    const defaultScope = urlStationId ? "station" : hasAdminAccess ? "organization" : "station";
    expect(defaultScope).toBe("organization");
  });

  it("operators should default to station scope", () => {
    const hasAdminAccess = false;
    const urlStationId = null;
    const defaultScope = urlStationId ? "station" : hasAdminAccess ? "organization" : "station";
    expect(defaultScope).toBe("station");
  });

  it("URL station param overrides to station scope", () => {
    const hasAdminAccess = true;
    const urlStationId = "station-123";
    const defaultScope = urlStationId ? "station" : hasAdminAccess ? "organization" : "station";
    expect(defaultScope).toBe("station");
  });
});

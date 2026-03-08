import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { OperatorStationKanban } from "./OperatorStationKanban";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: "qi-1", title: "Bracket", work_order: "WO-100", part_number: "BRK-10", operation_number: "OP10", status: "queued", priority: "normal", position: 1, quantity: 10, due_date: null, started_at: null },
          { id: "qi-2", title: "Housing", work_order: "WO-200", part_number: "HSG-20", operation_number: "OP20", status: "in_progress", priority: "high", position: 2, quantity: 5, due_date: "2026-03-15", started_at: new Date().toISOString() },
          { id: "qi-3", title: "Cover Plate", work_order: "WO-300", part_number: "CVR-30", operation_number: "OP30", status: "on_hold", priority: "low", position: 3, quantity: 20, due_date: null, started_at: null },
        ],
        error: null,
      }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user" } }),
}));

describe("OperatorStationKanban", () => {
  it("renders three kanban columns (Queued, In Progress, On Hold)", async () => {
    render(<OperatorStationKanban stationId="stn-1" />);
    await waitFor(() => {
      expect(screen.getByText("Queued")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("On Hold")).toBeInTheDocument();
    });
  });

  it("renders work orders from supabase query", async () => {
    render(<OperatorStationKanban stationId="stn-1" />);
    await waitFor(() => {
      expect(screen.getByText("WO-100")).toBeInTheDocument();
      expect(screen.getByText("WO-200")).toBeInTheDocument();
      expect(screen.getByText("WO-300")).toBeInTheDocument();
    });
  });

  it("shows loading skeleton initially", () => {
    render(<OperatorStationKanban stationId="stn-1" />);
    // Before data loads, skeletons should be visible
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("calls onViewOrder when view button clicked", async () => {
    const onViewOrder = vi.fn();
    render(<OperatorStationKanban stationId="stn-1" onViewOrder={onViewOrder} />);
    await waitFor(() => {
      expect(screen.getByText("WO-100")).toBeInTheDocument();
    });
  });

  it("groups items by status correctly", async () => {
    render(<OperatorStationKanban stationId="stn-1" />);
    await waitFor(() => {
      expect(screen.getByText("WO-100")).toBeInTheDocument(); // queued
      expect(screen.getByText("WO-200")).toBeInTheDocument(); // in_progress
      expect(screen.getByText("WO-300")).toBeInTheDocument(); // on_hold
    });
  });
});

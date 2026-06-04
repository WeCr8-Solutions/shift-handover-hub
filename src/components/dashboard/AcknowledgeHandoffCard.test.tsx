import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AcknowledgeHandoffCard } from "./AcknowledgeHandoffCard";

const mockHook = vi.fn();

vi.mock("@/hooks/useHandoffAck", () => ({
  useHandoffAck: (...args: unknown[]) => mockHook(...args),
}));

describe("AcknowledgeHandoffCard", () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it("renders nothing when there are no pending handoffs", () => {
    mockHook.mockReturnValue({ pending: [], loading: false, acknowledge: vi.fn() });
    const { container } = render(<AcknowledgeHandoffCard stationIds={["s1"]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing while loading", () => {
    mockHook.mockReturnValue({ pending: [], loading: true, acknowledge: vi.fn() });
    const { container } = render(<AcknowledgeHandoffCard stationIds={["s1"]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders pending handoffs with an acknowledge button", () => {
    mockHook.mockReturnValue({
      pending: [
        {
          id: "h1",
          work_order: "WO-100",
          part_number: "PN-50",
          outgoing_operator_name: "Alex",
          shift: "Day",
          station_id: "s1",
          machine_id: "CNC-001",
          process_notes_for_next_shift: "Watch the tool wear on op 20",
          handoff_summary: "Good shift",
          created_at: new Date().toISOString(),
        },
      ],
      loading: false,
      acknowledge: vi.fn(),
    });

    render(<AcknowledgeHandoffCard stationIds={["s1"]} />);
    expect(screen.getByText(/Handoff from prior shift/i)).toBeInTheDocument();
    expect(screen.getByText(/WO-100/)).toBeInTheDocument();
    expect(screen.getByText(/Alex/)).toBeInTheDocument();
    expect(screen.getByTestId("ack-button-h1")).toBeInTheDocument();
  });
});

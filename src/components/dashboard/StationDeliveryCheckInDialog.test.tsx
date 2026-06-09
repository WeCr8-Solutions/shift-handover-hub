import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { StationDeliveryCheckInDialog } from "./StationDeliveryCheckInDialog";
import type { DeliveryRequest } from "@/hooks/useDeliveryRequests";

const acceptDelivery = vi.fn();
const baseDelivery = {
  id: "d-1",
  organization_id: "org-1",
  queue_item_id: "qi-1",
  routing_step_id: null,
  from_station_id: "stn-a",
  to_station_id: "stn-b",
  status: "awaiting_acceptance" as const,
  priority: "normal",
  quantity: 4,
  notes: null,
  requested_by: null,
  requested_by_name: null,
  picked_up_by: "u1",
  picked_up_by_name: "Pat",
  picked_up_at: new Date().toISOString(),
  delivered_by: "u1",
  delivered_by_name: "Pat",
  delivered_at: new Date().toISOString(),
  accepted_by: null,
  accepted_by_name: null,
  accepted_at: null,
  accepted_via: null,
  estimated_delivery_time: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  from_station_name: "Lathe 1",
  to_station_name: "Mill 2",
  work_order: "WO-100",
  part_number: "P-100",
};

let mockDeliveries = [baseDelivery];

vi.mock("@/hooks/useDeliveryRequests", () => ({
  useDeliveryRequests: () => ({
    deliveries: mockDeliveries,
    loading: false,
    error: null,
    refetch: vi.fn(),
    markPickedUp: vi.fn(),
    markDelivered: vi.fn(),
    acceptDelivery,
    forceAccept: vi.fn(),
    cancel: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("StationDeliveryCheckInDialog", () => {
  beforeEach(() => {
    acceptDelivery.mockReset();
    acceptDelivery.mockResolvedValue({ error: null });
    mockDeliveries = [baseDelivery];
  });

  it("auto-opens when pending deliveries exist for the active station", async () => {
    render(<StationDeliveryCheckInDialog stationIds={["stn-b"]} />);
    await waitFor(() =>
      expect(screen.getByText(/Confirm received deliveries/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/WO-100/)).toBeInTheDocument();
    expect(screen.getByText(/Mill 2/)).toBeInTheDocument();
  });

  it("does not render when station has no pending deliveries", () => {
    const { container } = render(
      <StationDeliveryCheckInDialog stationIds={["stn-other"]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("accepts all pending deliveries when Accept all is clicked", async () => {
    const user = userEvent.setup();
    render(<StationDeliveryCheckInDialog stationIds={["stn-b"]} />);
    await waitFor(() => screen.getByRole("button", { name: /Accept all/i }));
    await user.click(screen.getByRole("button", { name: /Accept all/i }));
    await waitFor(() => expect(acceptDelivery).toHaveBeenCalledWith("d-1"));
  });

  it("includes deliveries still in legacy 'delivered' status", async () => {
    mockDeliveries = [{ ...baseDelivery, status: "delivered" as const }];
    render(<StationDeliveryCheckInDialog stationIds={["stn-b"]} />);
    await waitFor(() =>
      expect(screen.getByText(/Confirm received deliveries/i)).toBeInTheDocument(),
    );
  });
});

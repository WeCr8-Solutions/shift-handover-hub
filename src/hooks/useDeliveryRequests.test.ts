import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDeliveryRequests } from "./useDeliveryRequests";

const rpc = vi.fn();
const fromBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
  update: vi.fn().mockReturnThis(),
};
const channel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => fromBuilder),
    rpc: (...args: unknown[]) => rpc(...args),
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/contexts/OrgContext", () => ({
  useOrgContext: () => ({ organization: { id: "org-1" } }),
}));

describe("useDeliveryRequests", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
  });

  it("acceptDelivery calls accept_delivery RPC", async () => {
    const { result } = renderHook(() => useDeliveryRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.acceptDelivery("d-1");
    });
    expect(rpc).toHaveBeenCalledWith("accept_delivery", { _delivery_id: "d-1" });
  });

  it("forceAccept calls force_accept_delivery RPC", async () => {
    const { result } = renderHook(() => useDeliveryRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.forceAccept("d-2");
    });
    expect(rpc).toHaveBeenCalledWith("force_accept_delivery", { _delivery_id: "d-2" });
  });

  it("returns RPC error message on failure", async () => {
    rpc.mockResolvedValueOnce({ error: { message: "nope" } });
    const { result } = renderHook(() => useDeliveryRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let res: { error: string | null } = { error: null };
    await act(async () => {
      res = await result.current.acceptDelivery("d-3");
    });
    expect(res.error).toBe("nope");
  });
});

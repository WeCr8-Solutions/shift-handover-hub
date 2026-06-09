import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCustomers } from "./useCustomers";

function makeBuilder() {
  const b: any = {};
  b.select = vi.fn(() => b);
  b.eq = vi.fn(() => b);
  b.insert = vi.fn(() => b);
  b.update = vi.fn(() => b);
  b.single = vi.fn().mockResolvedValue({ data: { id: "c2", name: "Beta", is_active: true }, error: null });
  b.order = vi.fn().mockResolvedValue({ data: [{ id: "c1", name: "Acme", is_active: true }], error: null });
  b.then = undefined;
  return b;
}

let builder = makeBuilder();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(() => builder) },
}));
vi.mock("@/contexts/OrgContext", () => ({
  useOrgContext: () => ({ organization: { id: "org-1" } }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

describe("useCustomers", () => {
  beforeEach(() => {
    builder = makeBuilder();
  });

  it("fetches active customers on mount", async () => {
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.customers.length).toBe(1));
    expect(result.current.customers[0].name).toBe("Acme");
  });

  it("createCustomer rejects empty name", async () => {
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let res: any;
    await act(async () => {
      res = await result.current.createCustomer({ name: "  " });
    });
    expect(res.error).toBe("Name required");
  });

  it("deactivateCustomer marks is_active=false", async () => {
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Make the final eq() awaitable for the deactivate call
    builder.eq = vi.fn().mockResolvedValueOnce({ error: null });
    await act(async () => {
      await result.current.deactivateCustomer("c1");
    });
    expect(builder.update).toHaveBeenCalledWith({ is_active: false });
  });
});

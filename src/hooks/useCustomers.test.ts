import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCustomers } from "./useCustomers";

let nextResult: any = { data: [{ id: "c1", name: "Acme", is_active: true }], error: null };

function makeBuilder() {
  const b: any = {};
  const chain = () => b;
  b.select = vi.fn(chain);
  b.eq = vi.fn(chain);
  b.insert = vi.fn(chain);
  b.update = vi.fn(chain);
  b.order = vi.fn(chain);
  b.single = vi.fn().mockResolvedValue({ data: { id: "c2", name: "Beta", is_active: true }, error: null });
  // Thenable so `await query` resolves
  b.then = (onF: any, onR: any) => Promise.resolve(nextResult).then(onF, onR);
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
    nextResult = { data: [{ id: "c1", name: "Acme", is_active: true }], error: null };
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
    nextResult = { error: null };
    await act(async () => {
      await result.current.deactivateCustomer("c1");
    });
    expect(builder.update).toHaveBeenCalledWith({ is_active: false });
  });
});

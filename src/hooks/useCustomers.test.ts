import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCustomers } from "./useCustomers";

const builder: any = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [{ id: "c1", name: "Acme", is_active: true }], error: null }),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: "c2", name: "Beta", is_active: true }, error: null }),
};

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
    builder.select.mockClear();
    builder.insert.mockClear();
    builder.update.mockClear();
  });

  it("fetches active customers on mount", async () => {
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.customers.length).toBe(1));
    expect(result.current.customers[0].name).toBe("Acme");
  });

  it("createCustomer trims input and rejects empty name", async () => {
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let res: any;
    await act(async () => {
      res = await result.current.createCustomer({ name: "  " });
    });
    expect(res.error).toBe("Name required");
  });

  it("deactivateCustomer marks is_active=false", async () => {
    builder.eq.mockResolvedValueOnce({ error: null });
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deactivateCustomer("c1");
    });
    expect(builder.update).toHaveBeenCalledWith({ is_active: false });
  });
});

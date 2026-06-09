import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOrganizationMembers } from "./useOrganizationMembers";

const rpc = vi.fn();
let nextResult: any = { data: [], error: null };

function makeBuilder() {
  const b: any = {};
  const chain = () => b;
  b.select = vi.fn(chain);
  b.eq = vi.fn(chain);
  b.in = vi.fn(chain);
  b.update = vi.fn(chain);
  b.order = vi.fn(chain);
  b.maybeSingle = vi.fn().mockResolvedValue({ data: { role: "owner" }, error: null });
  b.then = (onF: any, onR: any) => Promise.resolve(nextResult).then(onF, onR);
  return b;
}

let builder = makeBuilder();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => builder),
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

describe("useOrganizationMembers ownership", () => {
  beforeEach(() => {
    builder = makeBuilder();
    rpc.mockReset();
    nextResult = { data: [], error: null };
  });

  it("transferOwnership calls transfer_org_ownership RPC", async () => {
    rpc.mockResolvedValueOnce({ error: null });
    const { result } = renderHook(() => useOrganizationMembers("org-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.transferOwnership("org-1", "u2");
    });
    expect(rpc).toHaveBeenCalledWith("transfer_org_ownership", {
      _organization_id: "org-1",
      _to_user_id: "u2",
    });
  });

  it("claimOwnership calls claim_org_ownership RPC", async () => {
    rpc.mockResolvedValueOnce({ error: null });
    const { result } = renderHook(() => useOrganizationMembers("org-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.claimOwnership("org-1");
    });
    expect(rpc).toHaveBeenCalledWith("claim_org_ownership", {
      _organization_id: "org-1",
    });
  });

  it("updateMemberOrgRole('admin') uses the table update path", async () => {
    const { result } = renderHook(() => useOrganizationMembers("org-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    nextResult = { error: null };
    await act(async () => {
      await result.current.updateMemberOrgRole("member-id", "admin");
    });
    expect(builder.update).toHaveBeenCalledWith({ role: "admin" });
    expect(rpc).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AllProviders } from "@/test/test-utils";

vi.mock("@/integrations/supabase/client", () => {
  const fn = vi.fn;
  const chainObj: any = {};
  chainObj.select = fn().mockImplementation(() => chainObj);
  chainObj.eq = fn().mockImplementation(() => chainObj);
  chainObj.order = fn().mockResolvedValue({ data: [], error: null });
  chainObj.insert = fn().mockReturnValue({
    select: fn().mockResolvedValue({ data: [{ id: "s1", station_id: "stn-1" }], error: null }),
  });
  chainObj.update = fn().mockImplementation(() => chainObj);
  chainObj.upsert = fn().mockResolvedValue({ data: null, error: null });

  return {
    supabase: {
      from: fn().mockImplementation(() => ({ ...chainObj })),
      channel: fn().mockReturnValue({
        on: fn().mockReturnThis(),
        subscribe: fn().mockReturnThis(),
      }),
      removeChannel: fn(),
    },
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "op@test.com" },
    profile: { display_name: "Test Operator" },
  }),
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({
    organization: { id: "org-1", name: "Test Org", slug: "test-org", description: null, logo_url: null, subscription_tier: "team", subscription_status: "active", trial_ends_at: null },
    organizationRole: "supervisor",
    teams: [],
    userRoles: [],
    primaryRole: "supervisor",
    primaryTeam: null,
    loading: false,
    refresh: async () => {},
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useOperatorSessions } from "./useOperatorSessions";
import { supabase } from "@/integrations/supabase/client";

describe("useOperatorSessions — station status sync", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exposes isCheckedIn as false when no active sessions", async () => {
    const { result } = renderHook(() => useOperatorSessions(), { wrapper: AllProviders });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isCheckedIn).toBe(false);
    expect(result.current.activeSessions).toEqual([]);
  });

  it("queries operator_station_sessions on mount", async () => {
    renderHook(() => useOperatorSessions(), { wrapper: AllProviders });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("operator_station_sessions");
    });
  });

  it("sets up realtime subscription for user sessions", async () => {
    renderHook(() => useOperatorSessions(), { wrapper: AllProviders });

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith("operator-sessions-user-1");
    });
  });

  it("checkIn is a callable function", async () => {
    const { result } = renderHook(() => useOperatorSessions(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.checkIn).toBe("function");
  });

  it("checkOut is a callable function", async () => {
    const { result } = renderHook(() => useOperatorSessions(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.checkOut).toBe("function");
  });
});

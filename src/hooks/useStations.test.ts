import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// --- Supabase mock — track .eq() calls ---
const eqCalls: [string, any][] = [];

vi.mock("@/integrations/supabase/client", () => {
  const fn = vi.fn;
  const chainable = () => {
    const obj: any = {
      select: fn().mockImplementation(() => obj),
      eq: fn().mockImplementation((field: string, val: any) => {
        eqCalls.push([field, val]);
        return obj;
      }),
      order: fn().mockImplementation(() => obj),
      limit: fn().mockImplementation(() => obj),
      then: fn((cb: any) =>
        cb({ count: 3, data: [{ parts_completed_this_shift: 10, issues_follow_ups: [] }] })
      ),
    };
    return obj;
  };
  return {
    supabase: {
      from: fn().mockImplementation(() => chainable()),
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
    profile: { display_name: "Test Op" },
  }),
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({ organization: { id: "org-1" } }),
}));

vi.mock("@/hooks/useTeams", () => ({
  useTeams: () => ({
    teams: [],
    loading: false,
    createTeam: vi.fn(),
    deleteTeam: vi.fn(),
  }),
}));

vi.mock("@/hooks/useActivityLog", () => ({
  useActivityLog: () => ({ logActivity: vi.fn() }),
}));

import { useShiftStats } from "./useStations";
import { supabase } from "@/integrations/supabase/client";

describe("useShiftStats — org-scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqCalls.length = 0;
  });

  it("calls supabase.from for stations and handoff_records", async () => {
    renderHook(() => useShiftStats("team-1", "org-explicit"));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("stations");
      expect(supabase.from).toHaveBeenCalledWith("handoff_records");
    });
  });

  it("passes organization_id to .eq() filter", async () => {
    renderHook(() => useShiftStats("team-1", "org-explicit"));

    await waitFor(() => {
      const orgEqs = eqCalls.filter(([field]) => field === "organization_id");
      expect(orgEqs.length).toBeGreaterThanOrEqual(2); // stations + handoffs
      expect(orgEqs[0]).toEqual(["organization_id", "org-explicit"]);
    });
  });

  it("uses fallback org from useUserOrganization when no explicit orgId", async () => {
    renderHook(() => useShiftStats("team-1"));

    await waitFor(() => {
      const orgEqs = eqCalls.filter(([field]) => field === "organization_id");
      // Should use "org-1" from useUserOrganization mock
      expect(orgEqs.some(([, val]) => val === "org-1")).toBe(true);
    });
  });

  it("queries both tables when org is provided via hook fallback", async () => {
    renderHook(() => useShiftStats("team-1"));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("stations");
      expect(supabase.from).toHaveBeenCalledWith("handoff_records");
    });
  });
});

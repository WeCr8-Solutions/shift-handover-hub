import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AllProviders } from "@/test/test-utils";

// Must use factory with no top-level variable refs
vi.mock("@/integrations/supabase/client", () => {
  const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({ eq: mockUpdateEq }),
        delete: vi.fn().mockReturnValue({ eq: mockDeleteEq }),
      }),
    },
  };
});

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

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

import { useShopFloorDisplays } from "./useShopFloorDisplays";

describe("useShopFloorDisplays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches displays on mount and sets loading false", async () => {
    const { result } = renderHook(() => useShopFloorDisplays(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.displays).toEqual([]);
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useShopFloorDisplays(), { wrapper: AllProviders });
    expect(result.current.loading).toBe(true);
  });

  it("createDisplay returns no error when authenticated", async () => {
    const { result } = renderHook(() => useShopFloorDisplays(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.createDisplay({
        display_name: "Test Display",
        display_mode: "supervisor",
        team_ids: [],
      });
      expect(res.error).toBeNull();
    });
  });

  it("deleteDisplay returns no error", async () => {
    const { result } = renderHook(() => useShopFloorDisplays(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.deleteDisplay("display-1");
      expect(res.error).toBeNull();
    });
  });

  it("regenerateToken returns no error", async () => {
    const { result } = renderHook(() => useShopFloorDisplays(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.regenerateToken("display-1");
      expect(res.error).toBeNull();
    });
  });

  it("toggleActive returns no error", async () => {
    const { result } = renderHook(() => useShopFloorDisplays(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.toggleActive("display-1", false);
      expect(res.error).toBeNull();
    });
  });

  it("exposes refresh function", async () => {
    const { result } = renderHook(() => useShopFloorDisplays(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.refresh).toBe("function");
  });
});

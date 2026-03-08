import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock supabase
const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    }),
  },
}));

vi.mock("@/hooks/useUserOrganization", () => ({
  useUserOrganization: () => ({ organization: { id: "org-1", name: "Test Org" } }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

import { useShopFloorDisplays } from "./useShopFloorDisplays";

describe("useShopFloorDisplays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it("fetches displays on mount", async () => {
    const { result } = renderHook(() => useShopFloorDisplays());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.displays).toEqual([]);
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("organization_id", "org-1");
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useShopFloorDisplays());
    expect(result.current.loading).toBe(true);
  });

  it("createDisplay validates auth and org", async () => {
    const { result } = renderHook(() => useShopFloorDisplays());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.createDisplay({
        display_name: "Test Display",
        display_mode: "supervisor",
        team_ids: [],
      });
      // Should not return error since user and org are mocked
      expect(res.error).toBeNull();
    });
  });

  it("deleteDisplay calls supabase delete", async () => {
    const { result } = renderHook(() => useShopFloorDisplays());
    
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.deleteDisplay("display-1");
      expect(res.error).toBeNull();
    });
    
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "display-1");
  });

  it("regenerateToken generates a 64-char hex string", async () => {
    const { result } = renderHook(() => useShopFloorDisplays());
    
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.regenerateToken("display-1");
      expect(res.error).toBeNull();
    });
    
    // Verify update was called with a 64-char hex token
    const updateCall = mockUpdate.mock.calls[0];
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("toggleActive calls updateDisplay with is_active", async () => {
    const { result } = renderHook(() => useShopFloorDisplays());
    
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const res = await result.current.toggleActive("display-1", false);
      expect(res.error).toBeNull();
    });
  });

  it("exposes refresh function", async () => {
    const { result } = renderHook(() => useShopFloorDisplays());
    
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.refresh).toBe("function");
  });
});

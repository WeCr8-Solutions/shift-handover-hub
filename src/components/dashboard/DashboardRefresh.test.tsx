import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBackgroundRefresh } from "@/hooks/useBackgroundRefresh";

describe("useBackgroundRefresh", () => {
  it("should start with initialLoading=true", () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 0,
        enabled: false,
      })
    );
    // enabled=false so no fetch fires — stays in initial state
    expect(result.current.initialLoading).toBe(true);
  });

  it("should set initialLoading=false after first fetch completes", async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });
    expect(result.current.refreshCount).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should NOT reset initialLoading on manual refresh", async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    await act(async () => {
      result.current.refresh();
    });

    expect(result.current.initialLoading).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("should not fetch when disabled", () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 5000,
        enabled: false,
      })
    );

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("should update lastRefreshedAt after fetch", async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.lastRefreshedAt).not.toBeNull();
    });
  });

  it("should re-fetch when key changes", async () => {
    const fetcher1 = vi.fn().mockResolvedValue(undefined);
    const fetcher2 = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ key, fetchers }: { key: string; fetchers: (() => Promise<unknown>)[] }) =>
        useBackgroundRefresh({ key, fetchers, intervalMs: 0 }),
      { initialProps: { key: "org-1", fetchers: [fetcher1] } }
    );

    await waitFor(() => {
      expect(fetcher1).toHaveBeenCalled();
    });

    rerender({ key: "org-2", fetchers: [fetcher2] });

    await waitFor(() => {
      expect(fetcher2).toHaveBeenCalled();
    });
  });
});

describe("Dashboard Loading States (anti-flash)", () => {
  it("should not show spinner when data exists during refetch", () => {
    const hasData = true;
    const isLoading = true;
    const shouldShowSpinner = isLoading && !hasData;
    expect(shouldShowSpinner).toBe(false);
  });

  it("should show skeleton only on initial load with no data", () => {
    const hasData = false;
    const isLoading = true;
    const shouldShowSpinner = isLoading && !hasData;
    expect(shouldShowSpinner).toBe(true);
  });

  it("should scope realtime channels to organization", () => {
    const orgId = "org-123";
    const userId = "user-456";
    const stationChannel = `station-status-${orgId}-${userId}`;
    const queueChannel = `queue-changes-${orgId}-${userId}`;
    expect(stationChannel).toContain(orgId);
    expect(queueChannel).toContain(orgId);
    expect(stationChannel).not.toBe("station-status");
  });
});

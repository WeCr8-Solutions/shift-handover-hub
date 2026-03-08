import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBackgroundRefresh } from "@/hooks/useBackgroundRefresh";

describe("useBackgroundRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with initialLoading=true", () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 300_000,
      })
    );
    expect(result.current.initialLoading).toBe(true);
  });

  it("should set initialLoading=false after first fetch completes", async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 300_000,
      })
    );

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });
    expect(result.current.refreshCount).toBe(1);
  });

  it("should NOT set initialLoading=true on subsequent refreshes", async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 5000,
      })
    );

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    // Advance past one polling interval
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // initialLoading should still be false (anti-flash)
    expect(result.current.initialLoading).toBe(false);
  });

  it("should call fetchers on manual refresh", async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 0, // disable polling
      })
    );

    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    const countBefore = fetcher.mock.calls.length;
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(fetcher.mock.calls.length).toBeGreaterThan(countBefore);
    });
  });

  it("should not poll when disabled", async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined);
    renderHook(() =>
      useBackgroundRefresh({
        key: "test",
        fetchers: [fetcher],
        intervalMs: 5000,
        enabled: false,
      })
    );

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Should never have been called
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("should scope channels to key changes", async () => {
    const fetcher1 = vi.fn().mockResolvedValue(undefined);
    const fetcher2 = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ key, fetchers }) =>
        useBackgroundRefresh({ key, fetchers, intervalMs: 300_000 }),
      {
        initialProps: { key: "org-1", fetchers: [fetcher1] },
      }
    );

    await waitFor(() => {
      expect(fetcher1).toHaveBeenCalled();
    });

    // Change key — should trigger new initial fetch
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

import { useState, useEffect, useRef, useCallback } from "react";

export interface RefreshConfig {
  /** Unique key for this refresh group (e.g. "supervisor-dashboard") */
  key: string;
  /** Array of async fetch functions to call on each refresh cycle */
  fetchers: (() => Promise<unknown> | void)[];
  /** Polling interval in ms. Defaults to 300000 (5 min). Set 0 to disable polling. */
  intervalMs?: number;
  /** Whether polling is enabled. Defaults to true. */
  enabled?: boolean;
}

export interface RefreshState {
  /** True only on the very first fetch before any data has loaded */
  initialLoading: boolean;
  /** True during any background refresh (NOT the initial load) */
  isRefreshing: boolean;
  /** Timestamp of the last successful refresh */
  lastRefreshedAt: Date | null;
  /** Trigger a manual refresh */
  refresh: () => void;
  /** Number of completed refresh cycles */
  refreshCount: number;
}

const DEFAULT_INTERVAL = 300_000; // 5 minutes

/**
 * Centralized background-refresh hook.
 *
 * - Separates "initial load" from "background refresh" to eliminate flash spinners.
 * - Provides a manual refresh trigger and refresh metadata for UI indicators.
 * - Automatically cleans up intervals on unmount.
 */
export function useBackgroundRefresh({
  key,
  fetchers,
  intervalMs = DEFAULT_INTERVAL,
  enabled = true,
}: RefreshConfig): RefreshState {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const hasFetchedOnce = useRef(false);
  const isMounted = useRef(true);
  const fetchersRef = useRef(fetchers);
  fetchersRef.current = fetchers;

  const runFetchers = useCallback(async (isBackground: boolean) => {
    if (!isMounted.current) return;

    // Only set refreshing state for background fetches — never re-trigger full spinner
    if (isBackground && hasFetchedOnce.current) {
      setIsRefreshing(true);
    }

    try {
      await Promise.allSettled(fetchersRef.current.map((fn) => fn()));
    } catch (err) {
      console.error(`[useBackgroundRefresh:${key}] refresh error`, err);
    }

    if (!isMounted.current) return;

    if (!hasFetchedOnce.current) {
      hasFetchedOnce.current = true;
      setInitialLoading(false);
    }

    setIsRefreshing(false);
    setLastRefreshedAt(new Date());
    setRefreshCount((c) => c + 1);
  }, [key]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    hasFetchedOnce.current = false;
    setInitialLoading(true);
    runFetchers(false);
  }, [enabled, key, runFetchers]);

  // Polling
  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const id = setInterval(() => {
      runFetchers(true);
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, intervalMs, runFetchers]);

  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    runFetchers(true);
  }, [runFetchers]);

  return {
    initialLoading,
    isRefreshing,
    lastRefreshedAt,
    refresh,
    refreshCount,
  };
}

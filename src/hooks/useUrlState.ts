import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * useUrlState — typed wrapper around URL search params so filter / tab /
 * pagination / sort state survives Back-button navigation, deep links,
 * refresh, and sharing.
 *
 * Usage:
 *   const [page, setPage] = useUrlState("page", "1");
 *   const [tab, setTab] = useUrlState("tab", "drafts");
 *   const [q, setQ] = useUrlState("q", "");
 *
 * Empty / default values are stripped from the URL automatically.
 */
export function useUrlState<T extends string = string>(
  key: string,
  defaultValue: T,
  opts: { replace?: boolean } = {},
): [T, (next: T | ((prev: T) => T)) => void] {
  const [params, setParams] = useSearchParams();
  const value = (params.get(key) ?? defaultValue) as T;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setParams(
        (prev) => {
          const merged = new URLSearchParams(prev);
          const resolved =
            typeof next === "function"
              ? (next as (p: T) => T)((merged.get(key) ?? defaultValue) as T)
              : next;
          if (resolved === defaultValue || resolved === "" || resolved == null) {
            merged.delete(key);
          } else {
            merged.set(key, String(resolved));
          }
          return merged;
        },
        { replace: opts.replace ?? false },
      );
    },
    [defaultValue, key, opts.replace, setParams],
  );

  return [value, setValue];
}

/**
 * useUrlStateNumber — convenience for numeric URL params (pagination etc.).
 */
export function useUrlStateNumber(
  key: string,
  defaultValue: number,
  opts: { replace?: boolean } = {},
): [number, (next: number | ((prev: number) => number)) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const parsed = raw == null ? defaultValue : Number(raw);
  const value = Number.isFinite(parsed) ? parsed : defaultValue;

  const setValue = useCallback(
    (next: number | ((prev: number) => number)) => {
      setParams(
        (prev) => {
          const merged = new URLSearchParams(prev);
          const current = Number(merged.get(key) ?? defaultValue);
          const resolved =
            typeof next === "function" ? next(Number.isFinite(current) ? current : defaultValue) : next;
          if (resolved === defaultValue) merged.delete(key);
          else merged.set(key, String(resolved));
          return merged;
        },
        { replace: opts.replace ?? false },
      );
    },
    [defaultValue, key, opts.replace, setParams],
  );

  return useMemo(() => [value, setValue], [value, setValue]);
}

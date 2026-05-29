import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useDraftPersistence — sessionStorage-backed form draft so users don't lose
 * unsaved work when they hit Back, refresh, or navigate away mid-edit.
 *
 * - Keyed by a stable string (e.g. `blog:article:${id}`).
 * - Debounced writes (default 400ms) keep keystrokes cheap.
 * - `clear()` after a successful save discards the draft.
 *
 * Usage:
 *   const [draft, setDraft, { clear, hasDraft }] = useDraftPersistence(
 *     `blog:article:${id}`,
 *     initialValue,
 *   );
 */
export function useDraftPersistence<T>(
  key: string,
  initial: T,
  opts: { debounceMs?: number } = {},
): [
  T,
  (next: T | ((prev: T) => T)) => void,
  { clear: () => void; hasDraft: boolean },
] {
  const debounceMs = opts.debounceMs ?? 400;
  const storageKey = `jobline:draft:${key}`;

  const [value, setValue] = useState<T>(() => {
    if (typeof sessionStorage === "undefined") return initial;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(storageKey) != null;
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
        setHasDraft(true);
      } catch {
        /* quota / serialization — drop */
      }
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, storageKey, debounceMs]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof next === "function" ? (next as (p: T) => T)(prev) : next,
    );
  }, []);

  const clear = useCallback(() => {
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* noop */
      }
    }
    setHasDraft(false);
  }, [storageKey]);

  return [value, update, { clear, hasDraft }];
}

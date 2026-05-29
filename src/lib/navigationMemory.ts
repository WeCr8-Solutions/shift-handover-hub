/**
 * Navigation memory — saves and restores scroll position per history entry
 * so the browser Back button returns the user to *where they were*, even
 * when route content is async-loaded and the natural browser restore fails.
 *
 * Keyed by history.state.key (assigned by React Router) when available,
 * with a path-based fallback. Storage is sessionStorage so it dies with
 * the tab and never leaks across sessions.
 */

const STORAGE_KEY = "jobline:navMemory:v1";
const MAX_ENTRIES = 80;

type Entry = { y: number; x: number; t: number };
type Store = Record<string, Entry>;

function read(): Store {
  if (typeof sessionStorage === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store) {
  if (typeof sessionStorage === "undefined") return;
  try {
    // Trim oldest if over cap
    const keys = Object.keys(store);
    if (keys.length > MAX_ENTRIES) {
      const sorted = keys
        .map((k) => [k, store[k].t] as const)
        .sort((a, b) => a[1] - b[1]);
      for (let i = 0; i < sorted.length - MAX_ENTRIES; i++) {
        delete store[sorted[i][0]];
      }
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota or serialization failure — drop silently.
  }
}

function currentKey(pathname: string, search: string): string {
  const histKey =
    typeof window !== "undefined" &&
    (window.history?.state as { key?: string } | null)?.key;
  return histKey ? `k:${histKey}` : `p:${pathname}${search}`;
}

export const navigationMemory = {
  save(pathname: string, search: string) {
    if (typeof window === "undefined") return;
    const store = read();
    store[currentKey(pathname, search)] = {
      x: window.scrollX,
      y: window.scrollY,
      t: Date.now(),
    };
    write(store);
  },

  restore(pathname: string, search: string): boolean {
    if (typeof window === "undefined") return false;
    const store = read();
    const entry = store[currentKey(pathname, search)];
    if (!entry) return false;
    // Defer to next frame so the new route has at least begun painting.
    // Retry a couple of times for async data that grows the page.
    let attempts = 0;
    const apply = () => {
      window.scrollTo({ top: entry.y, left: entry.x, behavior: "instant" });
      attempts += 1;
      if (attempts < 4 && Math.abs(window.scrollY - entry.y) > 4) {
        setTimeout(apply, 120);
      }
    };
    requestAnimationFrame(apply);
    return true;
  },

  clear(pathname: string, search: string) {
    if (typeof window === "undefined") return;
    const store = read();
    delete store[currentKey(pathname, search)];
    write(store);
  },
};

// Opt out of the browser's built-in scroll restoration so ours is authoritative.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  try {
    window.history.scrollRestoration = "manual";
  } catch {
    /* noop */
  }
}

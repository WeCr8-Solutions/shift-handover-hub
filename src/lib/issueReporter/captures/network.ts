/**
 * Network capture plugin. Wraps window.fetch once to record HTTP failures
 * (status >= 400) and network errors as breadcrumbs. Idempotent.
 */
import { breadcrumbs } from "../breadcrumbs";

let installed = false;

export function installNetworkCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();
    const start = performance.now();
    try {
      const res = await originalFetch(...args);
      const duration = Math.round(performance.now() - start);
      if (!res.ok) {
        breadcrumbs.add({
          category: "network",
          message: `${method} ${truncateUrl(url)} → ${res.status}`,
          data: { status: res.status, duration_ms: duration, method },
        });
      }
      return res;
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      breadcrumbs.add({
        category: "network",
        message: `${method} ${truncateUrl(url)} → network error`,
        data: {
          duration_ms: duration,
          method,
          error: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
  };
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return `${u.pathname}${u.search ? "?…" : ""}`;
  } catch {
    return url.slice(0, 80);
  }
}

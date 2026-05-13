/**
 * Subdomain → default route mapping.
 *
 * All `*.jobline.ai` hosts serve the same SPA bundle. This module rewrites the
 * URL on first paint so each subdomain lands on its intended section instead
 * of the marketing homepage.
 *
 * - jobline.ai / www.jobline.ai → / (marketing home, no rewrite)
 * - app.jobline.ai              → /auth  (canonical app entry — sign in / sign up)
 * - dev.jobline.ai              → /dev   (Developer Portal)
 * - docs.jobline.ai             → /help  (Help Center / Docs)
 * - status.jobline.ai           → external UptimeRobot status page; if it ever lands here, send to /updates
 *
 * The rewrite only runs at the root path ("/" or "") so deep links like
 * `dev.jobline.ai/dev/sap/overview` are preserved.
 */
export type SubdomainTarget = {
  /** Path to redirect to when the user hits the root of this host. */
  defaultPath: string;
  /** If set, redirect to a fully-qualified external URL instead of an in-app path. */
  externalUrl?: string;
};

const HOST_MAP: Record<string, SubdomainTarget> = {
  "dev.jobline.ai": { defaultPath: "/dev" },
  "docs.jobline.ai": { defaultPath: "/help" },
  "status.jobline.ai": {
    defaultPath: "/updates",
    externalUrl: "https://stats.uptimerobot.com/Ac1v7E00v2",
  },
  "app.jobline.ai": { defaultPath: "/auth" },
};

export function applySubdomainRouting(): void {
  if (typeof window === "undefined") return;
  try {
    const host = window.location.hostname.toLowerCase();
    const target = HOST_MAP[host];
    if (!target) return;

    const path = window.location.pathname;
    // Only rewrite when the user hit the bare root of the subdomain.
    if (path !== "/" && path !== "") return;

    if (target.externalUrl) {
      window.location.replace(target.externalUrl);
      return;
    }

    if (target.defaultPath && target.defaultPath !== "/") {
      window.history.replaceState(
        null,
        "",
        target.defaultPath + window.location.search + window.location.hash,
      );
    }
  } catch {
    /* noop — never block app boot on a routing helper */
  }
}

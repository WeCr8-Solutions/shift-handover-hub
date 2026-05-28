/**
 * Outbound link auto-tracker — passive document-level click listener that
 * fires `outbound_click` to GA4 whenever a user clicks an <a> pointing to
 * a different host than the current page.
 *
 * Why: surfaces which exit destinations our visitors care about
 * (LinkedIn, Stripe Pricing, GitHub, third-party docs) without
 * instrumenting every link by hand. Idempotent — safe to call multiple
 * times.
 */
import { trackEvent } from "@/lib/analytics";

let installed = false;

const KNOWN_INTERNAL_HOSTS = new Set([
  "jobline.ai",
  "www.jobline.ai",
  "dev.jobline.ai",
  "app.jobline.ai",
  "docs.jobline.ai",
  "joblineai.lovable.app",
]);

function isInternal(url: URL): boolean {
  if (typeof window === "undefined") return true;
  if (url.hostname === window.location.hostname) return true;
  return KNOWN_INTERNAL_HOSTS.has(url.hostname);
}

export function installOutboundLinkTracker() {
  if (installed || typeof document === "undefined") return;
  installed = true;

  document.addEventListener(
    "click",
    (e) => {
      // Walk up to find <a>
      const target = e.target as Element | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;

      // Skip non-http(s): mailto, tel, javascript, blob, data
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      if (isInternal(url)) return;

      // Fire-and-forget — never block navigation.
      trackEvent("outbound_click", {
        href: url.toString().slice(0, 500),
        host: url.hostname,
        link_text: (anchor.innerText || anchor.textContent || "").trim().slice(0, 100),
        page_path: window.location.pathname,
      });
    },
    { capture: true, passive: true },
  );
}

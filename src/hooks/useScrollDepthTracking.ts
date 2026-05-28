import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

const FIRED = new Set<string>();
const THRESHOLDS = [50, 90] as const;

/**
 * Fires `scroll_depth` to GA4 when the user scrolls past 50% and 90% of the
 * document height. One event per threshold per page-load, deduped via a
 * module-level set keyed by `pageKey`. Listener is rAF-throttled and cleans
 * up on unmount.
 *
 * Use on marketing pages to measure real engagement vs. bounce — pairs well
 * with the `landing_next_step_click` event.
 */
export function useScrollDepthTracking(pageKey: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        const pct = Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100);
        for (const t of THRESHOLDS) {
          const key = `${pageKey}:${t}`;
          if (pct >= t && !FIRED.has(key)) {
            FIRED.add(key);
            trackEvent("scroll_depth", { page_key: pageKey, percent: t });
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Fire immediately in case the page is short / already past threshold.
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pageKey]);
}

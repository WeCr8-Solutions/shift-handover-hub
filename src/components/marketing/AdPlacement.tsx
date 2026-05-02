/**
 * AdPlacement component for PUBLIC marketing pages only.
 * Renders a styled container for Google AdSense.
 *
 * ⚠️  NEVER use this inside authenticated app pages (dashboard, queue, teams,
 *     settings, admin, profile, setup, handoff, etc.). Ads are restricted to:
 *     - Landing, Pricing, Blog, Demo, Start, Tools (public)
 *     - /features/*, /compare/*, /industries/*, /resources/* pages
 *     - /handbook, /handbook/:slug
 *     - /help, /help/:slug
 *     - /verify/:certId, /certificates (public lookup)
 *
 * Defense-in-depth:
 *  1. ITAR / self-hosted builds disable ads via VITE_DISABLE_ANALYTICS.
 *  2. Runtime guard: if the current pathname matches an authenticated app
 *     prefix the component renders null even if accidentally imported.
 *  3. Build-time eslint rule (see eslint.config.js) forbids importing this
 *     module from authenticated app source paths.
 */

import { useEffect, useRef } from "react";

interface AdPlacementProps {
  slot?: string;
  format?: "horizontal" | "rectangle" | "fluid";
  className?: string;
  label?: string;
}

// Suppress ads when analytics are disabled (ITAR / self-hosted)
const ADS_ENABLED = import.meta.env.VITE_DISABLE_ANALYTICS !== "true";

// Authenticated app surfaces — never serve ads here. Match by prefix.
const AUTHED_APP_PREFIXES = [
  "/dashboard",
  "/queue",
  "/teams",
  "/settings",
  "/admin",
  "/profile",
  "/setup",
  "/testing",
  "/updates",
  "/history",
  "/quote-history",
  "/handoff",
  "/field",
  "/display",
  "/dev",
  "/oap/hub",
  "/oap/walkthrough",
  "/oap/transcript",
  "/oap/employer",
  "/oap/proficiency",
  "/oap/course",
  "/gca/employer",
  "/gca/test",
  "/cert-success",
  "/donation-success",
  "/manuals/upload",
  "/work-orders",
];

function isAuthedAppRoute(pathname: string): boolean {
  return AUTHED_APP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function AdPlacement({
  slot,
  format = "horizontal",
  className = "",
  label = "Sponsored",
}: AdPlacementProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const blockedByRoute =
    typeof window !== "undefined" && isAuthedAppRoute(window.location.pathname);

  useEffect(() => {
    if (!ADS_ENABLED || blockedByRoute || pushed.current) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      // Ad blocker or script not loaded — fail silently
      console.debug("AdSense push failed:", e);
    }
  }, [blockedByRoute]);

  if (!ADS_ENABLED || blockedByRoute) return null;

  const formatClasses = {
    horizontal: "min-h-[90px] max-h-[120px]",
    rectangle: "min-h-[250px] max-h-[300px]",
    fluid: "min-h-[100px]",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1 text-center">
          {label}
        </div>
        <div
          className={`w-full rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center overflow-hidden ${formatClasses[format]}`}
        >
          <ins
            ref={adRef}
            className="adsbygoogle block w-full h-full"
            style={{ display: "block" }}
            data-ad-client="ca-pub-3639153716376265"
            data-ad-slot={slot || "auto"}
            data-ad-format={
              format === "horizontal"
                ? "horizontal"
                : format === "rectangle"
                  ? "rectangle"
                  : "fluid"
            }
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
}

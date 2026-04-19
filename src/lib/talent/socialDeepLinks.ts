/**
 * Open social profile URLs in the native app when installed,
 * falling back to the web automatically.
 *
 * Why we need more than https Universal Links:
 *  - On Android, https links only auto-open the app if the user
 *    has explicitly enabled "Open supported links" for that app.
 *    Most users haven't, so we use Intent URLs (`intent://...#Intent;...end`)
 *    which Chrome/Brave/Edge translate into a native app launch with
 *    an automatic browser fallback.
 *  - On iOS, custom schemes (`linkedin://`, `instagram://`, `fb://`)
 *    open the app reliably when installed. We pair them with a
 *    timeout fallback to https.
 *  - Desktop: just open the canonical https URL in a new tab.
 */

export type SocialPlatform =
  | "linkedin"
  | "twitter"
  | "instagram"
  | "facebook"
  | "youtube"
  | "github"
  | "tiktok"
  | "generic";

export function detectPlatform(rawUrl: string): SocialPlatform {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("linkedin.com")) return "linkedin";
    if (host === "x.com" || host.includes("twitter.com")) return "twitter";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("facebook.com") || host === "fb.com") return "facebook";
    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("github.com")) return "github";
    if (host.includes("tiktok.com")) return "tiktok";
    return "generic";
  } catch {
    return "generic";
  }
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMobileUserAgent(): boolean {
  return isAndroid() || isIOS();
}

/** Normalize URL to canonical https form. */
export function normalizeSocialUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const platform = detectPlatform(rawUrl);
    url.protocol = "https:";
    switch (platform) {
      case "linkedin":  url.hostname = "www.linkedin.com"; break;
      case "twitter":   url.hostname = "x.com"; break;
      case "instagram": url.hostname = "www.instagram.com"; break;
      case "facebook":  url.hostname = "www.facebook.com"; break;
      case "youtube":
        if (url.hostname !== "youtu.be") url.hostname = "www.youtube.com";
        break;
      case "github":    url.hostname = "github.com"; break;
      case "tiktok":    url.hostname = "www.tiktok.com"; break;
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

interface PlatformAppConfig {
  /** Android package name for Intent URLs */
  androidPackage?: string;
  /** iOS custom scheme URL builder from canonical https URL */
  iosScheme?: (httpsUrl: URL) => string | null;
}

const APP_CONFIG: Record<SocialPlatform, PlatformAppConfig> = {
  linkedin: {
    androidPackage: "com.linkedin.android",
    // LinkedIn iOS scheme: linkedin://profile/<id-or-vanity>
    iosScheme: (u) => {
      // /in/username/ → profile vanity
      const m = u.pathname.match(/^\/in\/([^/]+)/i);
      if (m) return `linkedin://in/${m[1]}`;
      // /company/slug/
      const c = u.pathname.match(/^\/company\/([^/]+)/i);
      if (c) return `linkedin://company/${c[1]}`;
      return null; // fall back to https
    },
  },
  twitter: {
    androidPackage: "com.twitter.android",
    iosScheme: (u) => {
      const m = u.pathname.match(/^\/([^/]+)\/?$/);
      return m ? `twitter://user?screen_name=${m[1]}` : null;
    },
  },
  instagram: {
    androidPackage: "com.instagram.android",
    iosScheme: (u) => {
      const m = u.pathname.match(/^\/([^/]+)\/?$/);
      return m ? `instagram://user?username=${m[1]}` : null;
    },
  },
  facebook: {
    androidPackage: "com.facebook.katana",
    iosScheme: (u) => {
      const m = u.pathname.match(/^\/([^/]+)\/?$/);
      return m ? `fb://profile/${m[1]}` : null;
    },
  },
  youtube: {
    androidPackage: "com.google.android.youtube",
    iosScheme: (u) => `youtube://${u.host}${u.pathname}${u.search}`,
  },
  github: {
    // GitHub's mobile app handles https Universal Links well; no Intent needed.
  },
  tiktok: {
    androidPackage: "com.zhiliaoapp.musically",
    iosScheme: (u) => `snssdk1233://${u.host}${u.pathname}`,
  },
  generic: {},
};

/**
 * Build an Android Intent URL that launches the native app if installed,
 * with automatic fallback to the https URL in the browser.
 *
 * Format: intent://<host><path>#Intent;scheme=https;package=<pkg>;
 *         S.browser_fallback_url=<encoded https url>;end
 */
function buildAndroidIntentUrl(httpsUrl: string, pkg: string): string {
  const u = new URL(httpsUrl);
  const fallback = encodeURIComponent(httpsUrl);
  return `intent://${u.host}${u.pathname}${u.search}${u.hash}` +
    `#Intent;scheme=https;package=${pkg};S.browser_fallback_url=${fallback};end`;
}

/**
 * Open a social URL — prefers the native app, falls back to the browser.
 * Call this from a click handler (must be a real user gesture).
 */
export function openSocialLink(rawUrl: string): void {
  const httpsUrl = normalizeSocialUrl(rawUrl);
  const platform = detectPlatform(httpsUrl);
  const cfg = APP_CONFIG[platform];

  // Android: Intent URL with browser fallback (best UX, fully reliable)
  if (isAndroid() && cfg.androidPackage) {
    window.location.href = buildAndroidIntentUrl(httpsUrl, cfg.androidPackage);
    return;
  }

  // iOS: try custom scheme, fall back to https after a short delay if app
  // isn't installed (the page won't have backgrounded).
  if (isIOS() && cfg.iosScheme) {
    try {
      const scheme = cfg.iosScheme(new URL(httpsUrl));
      if (scheme) {
        const start = Date.now();
        const fallbackTimer = window.setTimeout(() => {
          // If we're still here after 1.2s, app didn't open → go to web.
          if (Date.now() - start < 2000 && !document.hidden) {
            window.location.href = httpsUrl;
          }
        }, 1200);
        // Clear fallback if page is hidden (app opened)
        const onHide = () => {
          if (document.hidden) window.clearTimeout(fallbackTimer);
        };
        document.addEventListener("visibilitychange", onHide, { once: true });
        window.location.href = scheme;
        return;
      }
    } catch {
      /* fall through */
    }
  }

  // Desktop or unsupported platform → open canonical https in new tab.
  window.open(httpsUrl, "_blank", "noopener,noreferrer");
}

/** Canonical https href — used as the visible/accessible link target. */
export function getSocialHref(rawUrl: string): string {
  return normalizeSocialUrl(rawUrl);
}

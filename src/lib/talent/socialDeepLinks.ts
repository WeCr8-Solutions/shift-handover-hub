/**
 * Build a native-app deep link for a social URL when possible.
 *
 * Strategy:
 * - On mobile (iOS/Android), most social apps register a custom scheme
 *   (e.g. `linkedin://`, `instagram://`, `fb://`) AND/OR claim https
 *   Universal/App Links. We prefer https URLs because:
 *     1. Universal Links / App Links open the app automatically when
 *        installed, and gracefully fall back to the browser when not.
 *     2. Custom schemes show an ugly "open in app?" prompt and break
 *        completely when the app isn't installed.
 *
 * - For LinkedIn specifically, the canonical https URL handles app
 *   handoff on both iOS and Android out of the box. The same is true
 *   for Instagram, X/Twitter, Facebook, YouTube, and GitHub.
 *
 * - We additionally normalize URLs (strip leading `@`, ensure https,
 *   convert mobile/share variants to canonical form) so that the OS
 *   recognizes them as Universal Links.
 *
 * Returns the URL to use for the `<a href>`. The caller decides how
 * to open it (target=_blank for desktop, default nav for mobile so
 * Universal Links fire correctly).
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

export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Normalize a social URL to its canonical https form so that
 * iOS Universal Links / Android App Links handoff works reliably.
 */
export function normalizeSocialUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const platform = detectPlatform(rawUrl);

    // Force https
    url.protocol = "https:";

    switch (platform) {
      case "linkedin":
        // mobile.linkedin.com / m.linkedin.com -> www.linkedin.com
        url.hostname = "www.linkedin.com";
        break;
      case "twitter":
        // Prefer x.com (current canonical) — both open the X app
        url.hostname = "x.com";
        break;
      case "instagram":
        url.hostname = "www.instagram.com";
        break;
      case "facebook":
        // m.facebook.com -> www.facebook.com (Universal Link)
        url.hostname = "www.facebook.com";
        break;
      case "youtube":
        if (url.hostname !== "youtu.be") url.hostname = "www.youtube.com";
        break;
      case "github":
        url.hostname = "github.com";
        break;
      case "tiktok":
        url.hostname = "www.tiktok.com";
        break;
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Returns the best href for an `<a>` tag for opening a social profile.
 * Universal/App Links work natively when href is the canonical https URL
 * AND the link is opened via a real user gesture (not window.open from JS).
 * So we just normalize and return — DO NOT use target="_blank" on mobile,
 * because some browsers (notably iOS Safari) don't trigger Universal Links
 * for cross-origin _blank navigations from in-app browsers.
 */
export function getSocialHref(rawUrl: string): string {
  return normalizeSocialUrl(rawUrl);
}

/**
 * Decide link target. On mobile, prefer same-tab navigation so the OS
 * can intercept and route to the installed app via Universal Links.
 * On desktop, open in a new tab (standard external link behavior).
 */
export function getSocialLinkTarget(): "_self" | "_blank" {
  return isMobileUserAgent() ? "_self" : "_blank";
}

/**
 * withAppUtm — attach default UTM params to outbound links that leave the
 * app's own domain (share buttons, copy-link, email/SMS deeplinks, etc.).
 *
 * Goal: kill the 96% "(Direct)" attribution in GA4 by tagging *every* link the
 * app generates so the receiving end can identify the source channel.
 *
 *   import { withAppUtm } from "@/lib/withAppUtm";
 *   const shareUrl = withAppUtm("https://jobline.ai/talent/zach", {
 *     source: "app",
 *     medium: "share",
 *     campaign: "talent_profile",
 *   });
 *
 * If the URL already carries any utm_* params, the existing ones win
 * (campaign-set links from elsewhere are never overwritten).
 */

export interface AppUtm {
  source: string;       // e.g. "app", "email", "qr"
  medium: string;       // e.g. "share", "transactional", "print"
  campaign?: string;    // free-form campaign label
  content?: string;     // creative / placement id
  term?: string;
}

/**
 * Returns the URL with `utm_*` params merged in. Existing utm_* params
 * already on the URL are preserved.
 */
export function withAppUtm(rawUrl: string, utm: AppUtm): string {
  try {
    const url = new URL(rawUrl, typeof window !== "undefined" ? window.location.origin : "https://jobline.ai");
    const set = (k: string, v: string | undefined) => {
      if (!v) return;
      if (!url.searchParams.has(k)) url.searchParams.set(k, v);
    };
    set("utm_source", utm.source);
    set("utm_medium", utm.medium);
    set("utm_campaign", utm.campaign);
    set("utm_content", utm.content);
    set("utm_term", utm.term);
    return url.toString();
  } catch {
    // Not a parseable URL (e.g. mailto:, tel:) — return as-is.
    return rawUrl;
  }
}

/** Common preset: a link a user copies/shares from inside the app. */
export const shareUtm = (campaign: string, content?: string): AppUtm => ({
  source: "app",
  medium: "share",
  campaign,
  content,
});

/** Common preset: a link embedded in a transactional email we send. */
export const emailUtm = (campaign: string, content?: string): AppUtm => ({
  source: "email",
  medium: "transactional",
  campaign,
  content,
});

/** Common preset: a link rendered on a printable artifact (PDF / cert / QR). */
export const printUtm = (campaign: string, content?: string): AppUtm => ({
  source: "print",
  medium: "qr",
  campaign,
  content,
});

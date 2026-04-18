/**
 * Append JobLine UTM params to outbound social/profile links
 * (e.g. LinkedIn) so referral traffic from JobLine is properly
 * attributed back to us — mirroring LinkedIn's own pattern of
 * `?utm_source=share_via&utm_medium=member_android&utm_content=profile`.
 *
 * Usage:
 *   <a href={withJoblineUtm(profile.linkedin_url, "talent_profile")}>
 */

export type OutboundSurface =
  | "talent_profile"   // public /talent/:username profile page
  | "talent_search"    // /talent search results
  | "talent_directory";

const DEFAULTS = {
  utm_source: "jobline.ai",
  utm_medium: "talent_network",
  utm_campaign: "talent_referral",
} as const;

export function withJoblineUtm(
  rawUrl: string | null | undefined,
  surface: OutboundSurface,
  extra?: Record<string, string>,
): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    const params = url.searchParams;
    // Only set if not already provided by the user
    if (!params.has("utm_source")) params.set("utm_source", DEFAULTS.utm_source);
    if (!params.has("utm_medium")) params.set("utm_medium", DEFAULTS.utm_medium);
    if (!params.has("utm_campaign")) params.set("utm_campaign", DEFAULTS.utm_campaign);
    if (!params.has("utm_content")) params.set("utm_content", surface);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (!params.has(k)) params.set(k, v);
      }
    }
    url.search = params.toString();
    return url.toString();
  } catch {
    return rawUrl;
  }
}

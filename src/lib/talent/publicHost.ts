/**
 * Canonical public host for sharing talent profiles.
 *
 * Sandbox/preview origins (e.g. *.lovableproject.com, *.lovable.app preview tokens)
 * require auth and show a "no internet" / 401 page when shared with the public.
 * Always share the production URL so QR codes and shared links resolve for everyone.
 */
const PUBLIC_HOSTS = new Set([
  "jobline.ai",
  "www.jobline.ai",
  "joblineai.lovable.app",
]);

export const PUBLIC_ORIGIN = "https://jobline.ai";

export function getPublicShareOrigin(): string {
  if (typeof window === "undefined") return PUBLIC_ORIGIN;
  try {
    const host = window.location.hostname;
    return PUBLIC_HOSTS.has(host) ? window.location.origin : PUBLIC_ORIGIN;
  } catch {
    return PUBLIC_ORIGIN;
  }
}

export function getPublicTalentUrl(username: string): string {
  return `${getPublicShareOrigin()}/talent/${username}`;
}

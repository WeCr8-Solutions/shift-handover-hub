/**
 * Google Consent Mode v2 helpers
 * Default-deny posture; signals updated via gtag('consent', 'update', ...).
 * https://developers.google.com/tag-platform/security/guides/consent
 */

export type ConsentCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "marketing";

export interface ConsentChoices {
  necessary: true; // always
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp when the user made the choice */
  timestamp: string;
  /** policy version this consent corresponds to */
  version: number;
}

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "jobline_consent";
const OPEN_PREFS_EVENT = "jobline:open-cookie-preferences";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
}

/** Honor browser Global Privacy Control (Sec-GPC: 1) */
export function isGpcEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/** Set the default consent state — must run BEFORE any Google tag fires. */
export function initConsentDefaults() {
  if (typeof window === "undefined") return;
  ensureGtag();
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });
  // Apply persisted choices if any
  const existing = readConsent();
  if (existing) updateGoogleConsent(existing);
}

export function readConsent(): ConsentChoices | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentChoices;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(choices: Omit<ConsentChoices, "necessary" | "timestamp" | "version">) {
  const payload: ConsentChoices = {
    necessary: true,
    functional: choices.functional,
    analytics: choices.analytics,
    marketing: choices.marketing,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  }
  updateGoogleConsent(payload);
  return payload;
}

export function updateGoogleConsent(c: ConsentChoices) {
  ensureGtag();
  if (typeof window === "undefined") return;
  window.gtag("consent", "update", {
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
    analytics_storage: c.analytics ? "granted" : "denied",
    functionality_storage: c.functional ? "granted" : "denied",
    personalization_storage: c.functional ? "granted" : "denied",
    security_storage: "granted",
  });
}

/** Open the preferences modal from anywhere (footer link, cookies page). */
export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_PREFS_EVENT));
}

export const COOKIE_PREFS_EVENT = OPEN_PREFS_EVENT;

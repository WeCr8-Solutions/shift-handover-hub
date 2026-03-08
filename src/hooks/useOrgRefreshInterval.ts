import { useMemo } from "react";
import { useAppSettings } from "./useAppSettings";

const DEFAULT_REFRESH_SECONDS = 300; // 5 minutes
const MIN_REFRESH_SECONDS = 10;
const MAX_REFRESH_SECONDS = 600;

/**
 * Reads the org-level auto-refresh interval from app_settings.
 * Returns the interval in milliseconds, clamped to safe bounds.
 */
export function useOrgRefreshInterval(): number {
  const { getSetting } = useAppSettings();

  return useMemo(() => {
    const prefs = getSetting("general_preferences");
    const raw = prefs?.autoRefreshInterval;

    if (typeof raw === "number" && Number.isFinite(raw)) {
      const clamped = Math.min(MAX_REFRESH_SECONDS, Math.max(MIN_REFRESH_SECONDS, raw));
      return clamped * 1000;
    }

    return DEFAULT_REFRESH_SECONDS * 1000;
  }, [getSetting]);
}

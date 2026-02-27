import { useMemo } from "react";
import { useAppSettings } from "./useAppSettings";

/**
 * Hook to check if the quote-to-work-order system is enabled for the org.
 * Reads from manufacturing_preferences.enableQuoteSystem (default: false).
 */
export function useQuoteSystem() {
  const { getSetting, loading } = useAppSettings();

  const isQuoteSystemEnabled = useMemo(() => {
    const mfgSettings = getSetting("manufacturing_preferences");
    if (!mfgSettings) return false;
    return (mfgSettings as Record<string, unknown>).enableQuoteSystem === true;
  }, [getSetting]);

  return { isQuoteSystemEnabled, loading };
}

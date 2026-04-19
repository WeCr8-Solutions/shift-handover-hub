import { useCallback, useEffect, useState } from "react";

/**
 * Foreground browser device notifications.
 *
 * Zero-cost, no service worker, no VAPID. Built so the same `notify()` API
 * and category model can later be backed by Web Push without changing callers.
 *
 * Categories:
 *  - org_dm:        New direct message from a connected teammate
 *  - recruiter:     New employer outreach via the Talent platform
 *  - smart_alert:   Critical production alerts
 *  - system_update: Platform-wide announcements / awards
 */
export type DeviceNotificationCategory =
  | "org_dm"
  | "recruiter"
  | "smart_alert"
  | "system_update";

export interface DeviceNotificationPrefs {
  master: boolean;
  org_dm: boolean;
  recruiter: boolean;
  smart_alert: boolean;
  system_update: boolean;
}

const PREFS_KEY = "device_notification_prefs_v1";
const PROMPT_DISMISSED_KEY = "device_notification_prompt_dismissed_v1";

const DEFAULT_PREFS: DeviceNotificationPrefs = {
  master: true,
  org_dm: true,
  recruiter: true,
  smart_alert: true,
  system_update: false,
};

function readPrefs(): DeviceNotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<DeviceNotificationPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: DeviceNotificationPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function useDeviceNotifications() {
  const supported = isNotificationSupported();
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : "denied"
  );
  const [prefs, setPrefsState] = useState<DeviceNotificationPrefs>(() => readPrefs());
  const [promptDismissed, setPromptDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PROMPT_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Keep permission state in sync if the user changes it in the browser UI.
  useEffect(() => {
    if (!supported) return;
    const interval = window.setInterval(() => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [supported, permission]);

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as NotificationPermission;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return "denied" as NotificationPermission;
    }
  }, [supported]);

  const setPrefs = useCallback((next: Partial<DeviceNotificationPrefs>) => {
    setPrefsState((prev) => {
      const merged = { ...prev, ...next };
      writePrefs(merged);
      return merged;
    });
  }, []);

  const dismissPrompt = useCallback(() => {
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    } catch {
      /* storage unavailable */
    }
    setPromptDismissed(true);
  }, []);

  /**
   * Fire a notification if supported, granted, the master switch is on,
   * and the category is enabled. Silently no-ops otherwise so callers can
   * always invoke this without guard logic.
   */
  const notify = useCallback(
    (
      category: DeviceNotificationCategory,
      payload: { title: string; body?: string; tag?: string; onClickPath?: string }
    ) => {
      if (!supported || permission !== "granted") return;
      if (!prefs.master || !prefs[category]) return;
      // Don't notify while the tab is focused — user is already looking.
      if (document.visibilityState === "visible" && document.hasFocus()) return;

      try {
        const n = new Notification(payload.title, {
          body: payload.body,
          tag: payload.tag,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
        n.onclick = () => {
          window.focus();
          if (payload.onClickPath) {
            window.location.href = payload.onClickPath;
          }
          n.close();
        };
      } catch {
        /* ignore */
      }
    },
    [supported, permission, prefs]
  );

  const canPrompt =
    supported && permission === "default" && !promptDismissed;

  return {
    supported,
    permission,
    prefs,
    setPrefs,
    requestPermission,
    notify,
    canPrompt,
    dismissPrompt,
  };
}

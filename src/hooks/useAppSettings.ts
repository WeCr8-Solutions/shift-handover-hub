/**
 * @deprecated — Prefer importing domain-specific hooks directly:
 *   useGeneralSettings, useShiftSchedules, useNotificationPrefs, useWorkCenterConfigs
 *
 * This barrel hook is kept for backward compatibility.
 */
export { useGeneralSettings } from "./useGeneralSettings";
export type { AppSetting } from "./useGeneralSettings";

export { useShiftSchedules } from "./useShiftSchedules";
export type { ShiftSchedule } from "./useShiftSchedules";

export { useNotificationPrefs } from "./useNotificationPrefs";
export type { NotificationPreferences } from "./useNotificationPrefs";

export { useWorkCenterConfigs } from "./useWorkCenterConfigs";
export type { WorkCenterConfig } from "./useWorkCenterConfigs";

// Legacy combined hook — only used by Settings.tsx loading gate now
import { useGeneralSettings } from "./useGeneralSettings";
import { useShiftSchedules } from "./useShiftSchedules";
import { useNotificationPrefs } from "./useNotificationPrefs";
import { useWorkCenterConfigs } from "./useWorkCenterConfigs";

export function useAppSettings() {
  const general = useGeneralSettings();
  const shifts = useShiftSchedules();
  const notifs = useNotificationPrefs();
  const wc = useWorkCenterConfigs();

  return {
    settings: general.settings,
    shifts: shifts.shifts,
    notifications: notifs.notifications,
    workCenterConfigs: wc.workCenterConfigs,
    loading: general.loading || shifts.loading || notifs.loading || wc.loading,
    refresh: async () => {
      await Promise.all([general.refresh(), shifts.refresh(), notifs.refresh(), wc.refresh()]);
    },
    updateSetting: general.updateSetting,
    getSetting: general.getSetting,
    createShift: shifts.createShift,
    updateShift: shifts.updateShift,
    deleteShift: shifts.deleteShift,
    updateNotifications: notifs.updateNotifications,
    createWorkCenterConfig: wc.createWorkCenterConfig,
    updateWorkCenterConfig: wc.updateWorkCenterConfig,
  };
}

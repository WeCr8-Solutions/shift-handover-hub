/**
 * Centralized user/operator status configuration
 * Used across dashboards and team views for consistent operator presence tracking
 */

export const OPERATOR_STATES = {
  CHECKED_IN: "Checked In",
  ON_BREAK: "On Break",
  OFF_SHIFT: "Off Shift",
  AWAY: "Away",
} as const;

export type OperatorState = (typeof OPERATOR_STATES)[keyof typeof OPERATOR_STATES];

export type UserStatusLabel = "active" | "break" | "away" | "offline";

export interface UserStatusConfig {
  label: UserStatusLabel;
  displayName: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const USER_STATUS_CONFIG: Record<UserStatusLabel, UserStatusConfig> = {
  active: {
    label: "active",
    displayName: "Active",
    color: "hsl(var(--status-ok))",
    bgClass: "bg-status-ok",
    textClass: "text-status-ok",
    borderClass: "border-status-ok/50",
    dotClass: "bg-status-ok animate-pulse",
  },
  break: {
    label: "break",
    displayName: "On Break",
    color: "hsl(var(--warning))",
    bgClass: "bg-warning",
    textClass: "text-warning",
    borderClass: "border-warning/50",
    dotClass: "bg-warning",
  },
  away: {
    label: "away",
    displayName: "Away",
    color: "hsl(var(--status-waiting))",
    bgClass: "bg-status-waiting",
    textClass: "text-status-waiting",
    borderClass: "border-status-waiting/50",
    dotClass: "bg-status-waiting",
  },
  offline: {
    label: "offline",
    displayName: "Offline",
    color: "hsl(var(--muted-foreground))",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-muted-foreground/30",
    dotClass: "bg-muted-foreground/50",
  },
};

/**
 * Determines user status from operator session data
 */
export function getUserStatusFromSession(session: {
  is_active?: boolean;
  checked_out_at?: string | null;
} | null | undefined): UserStatusLabel {
  if (!session) return "offline";
  if (session.checked_out_at) return "offline";
  if (session.is_active) return "active";
  return "away";
}

/**
 * Gets the full status configuration for a user status
 */
export function getUserStatusConfig(status: UserStatusLabel): UserStatusConfig {
  return USER_STATUS_CONFIG[status];
}

/**
 * Gets a display-friendly status from a user's active sessions
 */
export function getUserPresenceLabel(
  activeSessions: Array<{ station_id: string; station?: { name: string } }>,
): string {
  if (activeSessions.length === 0) return "Not checked in";
  if (activeSessions.length === 1) {
    return `At ${activeSessions[0].station?.name || "station"}`;
  }
  return `At ${activeSessions.length} stations`;
}

/**
 * Chart-friendly color map
 */
export const USER_STATUS_COLORS = {
  active: USER_STATUS_CONFIG.active.color,
  break: USER_STATUS_CONFIG.break.color,
  away: USER_STATUS_CONFIG.away.color,
  offline: USER_STATUS_CONFIG.offline.color,
} as const;

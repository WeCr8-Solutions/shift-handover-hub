/**
 * Centralized color token mappings.
 * Single source of truth for priority, status, severity, machine state,
 * role, and operation-type colors — all using semantic design tokens.
 */

/* ── Priority ── */

export type PriorityLevel = "critical" | "urgent" | "high" | "normal" | "low";

export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case "critical": return "bg-priority-critical text-primary-foreground";
    case "urgent":   return "bg-priority-urgent text-primary-foreground";
    case "high":     return "bg-priority-high text-primary-foreground";
    case "normal":   return "bg-status-waiting text-primary-foreground";
    case "low":      return "bg-muted text-muted-foreground";
    default:         return "bg-muted text-muted-foreground";
  }
}

export function getPriorityDotColor(priority: string): string {
  switch (priority) {
    case "critical": return "bg-priority-critical";
    case "urgent":   return "bg-priority-urgent";
    case "high":     return "bg-priority-high";
    case "normal":   return "bg-status-waiting";
    case "low":      return "bg-muted-foreground/40";
    default:         return "bg-muted-foreground/40";
  }
}

export function getPriorityConfig(priority: string): { bg: string; text: string; border: string } {
  switch (priority) {
    case "critical": return { bg: "bg-priority-critical",  text: "text-status-critical",   border: "border-status-critical/50" };
    case "urgent":   return { bg: "bg-priority-urgent",    text: "text-priority-urgent",    border: "border-priority-urgent/50" };
    case "high":     return { bg: "bg-priority-high",      text: "text-warning",            border: "border-warning/50" };
    case "normal":   return { bg: "bg-status-waiting",     text: "text-status-waiting",     border: "border-status-waiting/50" };
    case "low":      return { bg: "bg-muted",              text: "text-muted-foreground",   border: "border-border" };
    default:         return { bg: "bg-muted",              text: "text-muted-foreground",   border: "border-border" };
  }
}

/* Light-badge variant: colored bg/10 + colored text */
export function getPriorityLightColor(priority: string): string {
  switch (priority) {
    case "critical": return "bg-status-critical/10 text-status-critical";
    case "urgent":   return "bg-priority-urgent/10 text-priority-urgent";
    case "high":     return "bg-priority-high/10 text-warning";
    case "normal":   return "bg-status-waiting/10 text-status-waiting";
    case "low":      return "bg-muted text-muted-foreground";
    default:         return "bg-muted text-muted-foreground";
  }
}

/* ── Queue / Work-order status ── */

export function getQueueStatusBadgeColor(status: string): string {
  switch (status) {
    case "pending":     return "bg-muted text-muted-foreground";
    case "queued":      return "bg-role-org-owner/10 text-role-org-owner border-role-org-owner/30";
    case "in_progress": return "bg-status-ok/10 text-status-ok border-status-ok/30";
    case "on_hold":     return "bg-warning/10 text-warning border-warning/30";
    case "completed":   return "bg-status-ok/10 text-status-ok border-status-ok/30";
    case "cancelled":   return "bg-status-critical/10 text-status-critical border-status-critical/30";
    default:            return "bg-muted text-muted-foreground";
  }
}

export function getQueueStatusBorderColor(status: string): string {
  switch (status) {
    case "pending":     return "border-l-muted-foreground";
    case "queued":      return "border-l-warning";
    case "in_progress": return "border-l-status-waiting";
    case "on_hold":     return "border-l-priority-urgent";
    case "completed":   return "border-l-status-ok";
    default:            return "border-l-muted-foreground";
  }
}

export function getQueueStatusColumnColor(status: string): string {
  switch (status) {
    case "pending":     return "bg-muted/50";
    case "queued":      return "bg-warning/5";
    case "in_progress": return "bg-status-waiting/5";
    case "on_hold":     return "bg-priority-urgent/5";
    case "completed":   return "bg-status-ok/5";
    case "cancelled":   return "bg-status-critical/5";
    default:            return "bg-muted/30";
  }
}

/* ── Severity (issues, NCRs) ── */

export function getSeverityBadgeColor(severity: string): string {
  switch (severity) {
    case "critical": return "bg-destructive text-destructive-foreground";
    case "high":     return "bg-priority-urgent text-primary-foreground";
    case "medium":   return "bg-warning text-primary-foreground";
    case "low":      return "bg-status-ok text-primary-foreground";
    default:         return "bg-muted text-muted-foreground";
  }
}

export function getSeverityLightColor(severity: string): string {
  switch (severity) {
    case "critical": return "bg-status-critical/10 text-status-critical border-status-critical/20";
    case "high":     return "bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20";
    case "medium":   return "bg-warning/10 text-warning border-warning/20";
    case "low":      return "bg-status-ok/10 text-status-ok border-status-ok/20";
    default:         return "bg-muted text-muted-foreground border-border";
  }
}

/* ── Machine / system status ── */

export function getSystemStatusColor(status: string): { dotClass: string; badgeClass: string } {
  switch (status) {
    case "operational": return { dotClass: "bg-status-ok",        badgeClass: "border-status-ok/30 text-status-ok" };
    case "degraded":    return { dotClass: "bg-status-warning animate-pulse", badgeClass: "border-status-warning/30 text-status-warning" };
    case "outage":      return { dotClass: "bg-status-critical animate-pulse", badgeClass: "border-status-critical/30 text-status-critical" };
    default:            return { dotClass: "bg-muted",             badgeClass: "border-border text-muted-foreground" };
  }
}

/* ── Notification queue status ── */

export function getNotificationStatusColor(status: string): string {
  switch (status) {
    case "pending":    return "bg-status-warning";
    case "processing": return "bg-status-waiting";
    case "sent":       return "bg-status-ok";
    case "failed":     return "bg-destructive";
    default:           return "bg-muted";
  }
}

/* ── Dev issue queue ── */

export function getDevPriorityColor(priority: number): string {
  switch (priority) {
    case 5: return "bg-status-critical";
    case 4: return "bg-priority-urgent";
    case 3: return "bg-status-warning";
    case 2: return "bg-status-waiting";
    case 1: return "bg-muted";
    default: return "bg-muted";
  }
}

export function getDevStatusColor(status: string): string {
  switch (status) {
    case "queued":      return "bg-muted";
    case "in_progress": return "bg-status-waiting";
    case "blocked":     return "bg-status-critical";
    case "completed":   return "bg-status-ok";
    case "deferred":    return "bg-status-warning";
    default:            return "bg-muted";
  }
}

/* ── Issue management status ── */

export function getIssueStatusColor(status: string): string {
  switch (status) {
    case "open":          return "bg-status-waiting/10 text-status-waiting border-status-waiting/20";
    case "investigating": return "bg-role-org-owner/10 text-role-org-owner border-role-org-owner/20";
    case "in_progress":   return "bg-warning/10 text-warning border-warning/20";
    case "resolved":      return "bg-status-ok/10 text-status-ok border-status-ok/20";
    case "closed":        return "bg-muted text-muted-foreground border-border";
    case "wont_fix":      return "bg-muted text-muted-foreground border-border";
    default:              return "bg-muted text-muted-foreground border-border";
  }
}

/* ── Performance update review status ── */

export function getReviewStatusColor(status: string): string {
  switch (status) {
    case "pending":     return "bg-warning/10 text-warning border-warning/30";
    case "reviewed":    return "bg-status-waiting/10 text-status-waiting border-status-waiting/30";
    case "approved":    return "bg-status-ok/10 text-status-ok border-status-ok/30";
    case "implemented": return "bg-role-org-owner/10 text-role-org-owner border-role-org-owner/30";
    case "rejected":    return "bg-status-critical/10 text-status-critical border-status-critical/30";
    default:            return "bg-muted text-muted-foreground border-border";
  }
}

/* ── Update card categories ── */

export const UPDATE_CATEGORY_COLORS: Record<string, string> = {
  feature:       "bg-status-waiting/10 text-status-waiting border-status-waiting/30",
  improvement:   "bg-warning/10 text-warning border-warning/30",
  bug_fix:       "bg-status-critical/10 text-status-critical border-status-critical/30",
  system_notice: "bg-priority-urgent/10 text-priority-urgent border-priority-urgent/30",
  security:      "bg-role-org-owner/10 text-role-org-owner border-role-org-owner/30",
  maintenance:   "bg-muted text-muted-foreground border-border",
};

export const UPDATE_IMPACT_COLORS: Record<string, string> = {
  low:      "bg-status-ok",
  medium:   "bg-status-warning",
  high:     "bg-priority-urgent",
  critical: "bg-status-critical",
};

export const UPDATE_STATUS_COLORS: Record<string, string> = {
  live:          "bg-status-ok/10 text-status-ok border-status-ok/30",
  scheduled:     "bg-status-waiting/10 text-status-waiting border-status-waiting/30",
  investigating: "bg-priority-urgent/10 text-priority-urgent border-priority-urgent/30",
  resolved:      "bg-muted text-muted-foreground border-border",
  deprecated:    "bg-muted text-muted-foreground border-border",
};

/* ── Activity log colors ── */

export function getActivityColor(activityType: string): string {
  switch (activityType) {
    case "login":             return "bg-status-ok/10 text-status-ok";
    case "logout":            return "bg-muted text-muted-foreground";
    case "signup":            return "bg-status-waiting/10 text-status-waiting";
    case "handoff_created":   return "bg-primary/10 text-primary";
    case "role_changed":      return "bg-warning/10 text-warning";
    case "settings_updated":  return "bg-primary/10 text-primary";
    default:                  return "bg-muted text-muted-foreground";
  }
}

/* ── Operation type colors (routing) ── */

export const OPERATION_TYPE_COLORS: Record<string, { color: string; ring: string }> = {
  quote:               { color: "bg-muted",            ring: "" },
  engineering:         { color: "bg-role-org-admin",    ring: "" },
  purchasing:          { color: "bg-info",              ring: "" },
  receiving:           { color: "bg-info",              ring: "" },
  internal:            { color: "bg-status-waiting",    ring: "" },
  inspection:          { color: "bg-role-org-owner",    ring: "" },
  outside_processing:  { color: "bg-warning",           ring: "ring-2 ring-warning ring-offset-2 ring-offset-background" },
  shipping:            { color: "bg-status-ok",         ring: "" },
};

/* ── Role colors ── */

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "admin":       return "bg-role-admin/10 text-role-admin border-role-admin/30";
    case "developer":   return "bg-role-developer/10 text-role-developer border-role-developer/30";
    case "supervisor":  return "bg-role-supervisor/10 text-role-supervisor border-role-supervisor/30";
    case "operator":    return "bg-role-operator/10 text-role-operator border-role-operator/30";
    case "viewer":      return "bg-muted text-muted-foreground border-border";
    case "org_owner":   return "bg-role-org-owner/10 text-role-org-owner border-role-org-owner/30";
    case "org_admin":   return "bg-role-org-admin/10 text-role-org-admin border-role-org-admin/30";
    default:            return "bg-muted text-muted-foreground border-border";
  }
}

export function getRoleTextColor(role: string): string {
  switch (role) {
    case "admin":      return "text-role-admin";
    case "developer":  return "text-role-developer";
    case "supervisor": return "text-role-supervisor";
    case "operator":   return "text-role-operator";
    case "viewer":     return "text-muted-foreground";
    case "orgOwner":   return "text-role-org-owner";
    case "orgAdmin":   return "text-role-org-admin";
    default:           return "text-muted-foreground";
  }
}

/* ── Work center colors (for workCenterIcons.tsx) ── */

export const WORK_CENTER_COLORS: Record<string, string> = {
  "CNC Mill":               "text-info",
  "CNC Lathe":              "text-info",
  "Water Jet":              "text-status-waiting",
  "Band Saw":               "text-status-waiting",
  "Press Brake":            "text-priority-urgent",
  "TIG Welding":            "text-status-critical",
  "MIG Welding":            "text-status-critical",
  "Electron Beam Welding":  "text-role-org-owner",
  "Punch Press":            "text-warning",
  "Hardware Installation":  "text-status-ok",
  "Deburr Station":         "text-status-ok",
  "Shipping":               "text-role-org-admin",
  "Incoming Inspection":    "text-info",
  "Outgoing Inspection":    "text-info",
  "Final Inspection":       "text-info",
  "Tool Crib":              "text-warning",
  "Quoting":                "text-muted-foreground",
  "Engineering Review":     "text-role-org-owner",
  "CAM Programming":        "text-role-org-owner",
  "Purchasing":             "text-chart-4",
  "Receiving":              "text-chart-2",
  "Grinding":               "text-info",
};

/* ── Changelog change types ── */

export const CHANGELOG_TYPE_COLORS: Record<string, string> = {
  feature:     "bg-status-waiting/10 text-status-waiting border-status-waiting/30",
  fix:         "bg-status-critical/10 text-status-critical border-status-critical/30",
  improvement: "bg-warning/10 text-warning border-warning/30",
  breaking:    "bg-destructive/10 text-destructive border-destructive/30",
};

/* ── Console log levels ── */

export const LOG_LEVEL_STYLES: Record<string, string> = {
  error: "text-status-critical bg-status-critical/10",
  warn:  "text-warning bg-warning/10",
  info:  "text-info bg-info/10",
  log:   "text-muted-foreground bg-muted/50",
  debug: "text-muted-foreground/60 bg-muted/30",
};

export const LOG_LEVEL_BADGE_STYLES: Record<string, string> = {
  error: "bg-status-critical/20 text-status-critical hover:bg-status-critical/30",
  warn:  "bg-warning/20 text-warning hover:bg-warning/30",
  info:  "bg-info/20 text-info hover:bg-info/30",
  log:   "bg-muted text-muted-foreground hover:bg-muted/80",
  debug: "bg-muted/50 text-muted-foreground/60 hover:bg-muted/60",
};

/* ── Connection status ── */

export function getConnectionStatusColor(status: string): string {
  switch (status) {
    case "connected": return "bg-status-ok/10 text-status-ok border-status-ok/30";
    case "error":     return "bg-destructive text-destructive-foreground";
    default:          return "bg-muted text-muted-foreground";
  }
}

/* ── Sync status (inline text) ── */

export function getSyncStatusTextColor(status: string): string {
  switch (status) {
    case "success": return "text-status-ok";
    case "failed":  return "text-status-critical";
    default:        return "text-warning";
  }
}

/* ── Test result backgrounds ── */

export function getTestResultBg(status: string): string {
  switch (status) {
    case "pass":    return "bg-status-ok/5 dark:bg-status-ok/10";
    case "fail":    return "bg-status-critical/5 dark:bg-status-critical/10";
    case "warning": return "bg-warning/5 dark:bg-warning/10";
    case "running": return "bg-info/5 dark:bg-info/10";
    default:        return "";
  }
}

export function getTestResultRowStyle(failed: boolean): string {
  return failed
    ? "bg-status-critical/5 border-status-critical/20 dark:bg-status-critical/10 dark:border-status-critical/30"
    : "bg-status-ok/5 border-status-ok/20 dark:bg-status-ok/10 dark:border-status-ok/30";
}

/* ── Smart Alert severity styles ── */

export type AlertSeverity = "critical" | "warning" | "info";

/** Maps a severity level to bg / border / text token classes */
export function getAlertSeverityStyles(severity: AlertSeverity, token: string): {
  bg: string; border: string; text: string; badgeText: string; badgeBorder: string;
} {
  const intensities = {
    critical: { bgOp: "/10", borderOp: "/30", badgeBorderOp: "/50" },
    warning:  { bgOp: "/10", borderOp: "/30", badgeBorderOp: "/50" },
    info:     { bgOp: "/5",  borderOp: "/20", badgeBorderOp: "/30" },
  };
  const i = intensities[severity];
  return {
    bg: `bg-${token}${i.bgOp}`,
    border: `border-${token}${i.borderOp}`,
    text: `text-${token}`,
    badgeText: `text-${token}`,
    badgeBorder: `border-${token}${i.badgeBorderOp}`,
  };
}

/** Maps smart alert type → base token and icon name */
export const ALERT_TYPE_TOKENS: Record<string, { token: string; tokenCritical?: string }> = {
  overdue:               { token: "status-critical" },
  on_hold:               { token: "warning" },
  stale:                 { token: "priority-urgent", tokenCritical: "status-critical" },
  over_time:             { token: "warning", tokenCritical: "status-critical" },
  high_priority_waiting: { token: "status-critical" },
  no_operator:           { token: "role-org-owner" },
  bottleneck:            { token: "priority-urgent" },
  unassigned:            { token: "muted-foreground" },
  no_routing:            { token: "muted-foreground" },
};

/** Get full style set for an alert type + severity combo */
export function getSmartAlertStyles(type: string, severity: AlertSeverity) {
  const cfg = ALERT_TYPE_TOKENS[type] || { token: "muted-foreground" };
  const token = severity === "critical" && cfg.tokenCritical ? cfg.tokenCritical : cfg.token;
  // For neutral types (unassigned, no_routing), use muted styles
  if (token === "muted-foreground") {
    const isC = severity === "critical";
    return {
      bg: isC ? "bg-muted/80" : severity === "warning" ? "bg-muted/50" : "bg-muted/30",
      border: "border-border",
      text: isC ? "text-foreground" : "text-muted-foreground",
      badgeText: "text-muted-foreground",
      badgeBorder: "border-border",
    };
  }
  return getAlertSeverityStyles(severity, token);
}

/** Severity-aware container: bg + border for cards/sections */
export function getSeverityContainerStyles(severity: "critical" | "warning" | "info"): string {
  switch (severity) {
    case "critical": return "bg-destructive/10 border-destructive/30";
    case "warning":  return "bg-warning/10 border-warning/30";
    case "info":     return "bg-muted/50 border-border";
  }
}

/** Severity dot color */
export function getSeverityDotColor(severity: "critical" | "warning" | "info"): string {
  switch (severity) {
    case "critical": return "bg-destructive";
    case "warning":  return "bg-warning";
    case "info":     return "bg-muted-foreground/50";
  }
}

/** Priority-aware container: border + bg based on highest priority in a list */
export function getPriorityContainerStyles(priorities: string[], fallbackToken = "info"): string {
  if (priorities.includes("critical")) return "border-priority-critical bg-priority-critical/10";
  if (priorities.includes("urgent"))   return "border-priority-urgent bg-priority-urgent/10";
  if (priorities.includes("high"))     return "border-priority-high bg-priority-high/10";
  return `border-${fallbackToken} bg-${fallbackToken}/10`;
}

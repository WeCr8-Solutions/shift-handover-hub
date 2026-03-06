/**
 * Centralized station status configuration
 * Used across SupervisorDashboard, ProductionAnalytics, and OperatorStationPanel
 */

export const JOB_STATES = {
  PART_RUNNING: "Part Running",
  PROCESSING: "Processing",
  SETUP_IN_PROGRESS: "Setup in Progress",
  FIRST_ARTICLE: "First Article in Process",
  MACHINE_DOWN: "Machine Down / Issue",
  ON_HOLD: "On Hold",
  WAITING_MATERIAL: "Waiting for Material",
  WAITING_OPERATOR: "Waiting for Operator",
  WAITING_INSPECTION: "Waiting for Inspection",
} as const;

export type JobState = (typeof JOB_STATES)[keyof typeof JOB_STATES];

export type StatusLabel = "running" | "setup" | "down" | "waiting" | "idle";

export interface StatusConfig {
  label: StatusLabel;
  displayName: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

export const STATUS_CONFIG: Record<StatusLabel, StatusConfig> = {
  running: {
    label: "running",
    displayName: "Running",
    color: "hsl(142, 71%, 45%)",
    bgClass: "bg-green-500",
    textClass: "text-green-400",
    borderClass: "border-green-500/50",
    badgeVariant: "default",
  },
  setup: {
    label: "setup",
    displayName: "Setup",
    color: "hsl(38, 92%, 50%)",
    bgClass: "bg-amber-500",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/50",
    badgeVariant: "secondary",
  },
  waiting: {
    label: "waiting",
    displayName: "Waiting",
    color: "hsl(217, 91%, 60%)",
    bgClass: "bg-blue-500",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/50",
    badgeVariant: "secondary",
  },
  down: {
    label: "down",
    displayName: "Down",
    color: "hsl(0, 84%, 60%)",
    bgClass: "bg-red-500",
    textClass: "text-red-400",
    borderClass: "border-red-500/50",
    badgeVariant: "destructive",
  },
  idle: {
    label: "idle",
    displayName: "Idle",
    color: "hsl(215, 14%, 34%)",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-muted-foreground/30",
    badgeVariant: "outline",
  },
};

/**
 * Maps a job state string to a status label
 */
export function getStatusFromJobState(jobState: string | null | undefined): StatusLabel {
  if (!jobState) return "idle";
  
  const state = jobState.trim();
  
  if (state === JOB_STATES.PART_RUNNING || state === JOB_STATES.PROCESSING) {
    return "running";
  }
  if (state === JOB_STATES.SETUP_IN_PROGRESS || state === JOB_STATES.FIRST_ARTICLE) {
    return "setup";
  }
  if (state === JOB_STATES.MACHINE_DOWN) {
    return "down";
  }
  if (state.includes("Waiting") || state === JOB_STATES.ON_HOLD) {
    return "waiting";
  }
  
  return "idle";
}

/**
 * Gets the full status configuration for a job state
 */
export function getStatusConfig(jobState: string | null | undefined): StatusConfig {
  const status = getStatusFromJobState(jobState);
  return STATUS_CONFIG[status];
}

/**
 * Gets the background color class for a status
 */
export function getStatusBgClass(status: StatusLabel): string {
  return STATUS_CONFIG[status].bgClass;
}

/**
 * Gets the HSL color string for charts
 */
export function getStatusColor(status: StatusLabel): string {
  return STATUS_CONFIG[status].color;
}

/**
 * Chart-friendly color map for Recharts
 */
export const STATUS_COLORS = {
  running: STATUS_CONFIG.running.color,
  setup: STATUS_CONFIG.setup.color,
  waiting: STATUS_CONFIG.waiting.color,
  down: STATUS_CONFIG.down.color,
  idle: STATUS_CONFIG.idle.color,
} as const;

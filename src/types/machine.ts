/**
 * Machine data types — foundation for live relay integration.
 * 
 * These types mirror the contract defined in CONTEXT.docx:
 *   jobline-machine → jobline-relay → dashboard
 * 
 * Phase 1 (current): Populated from equipment + station tables (static/polling).
 * Phase 2 (future):  Populated from live relay events via SubscriberClient.
 */

// === Machine States — matches relay MachineState union ===
export type MachineState =
  | "running"
  | "idle"
  | "alarm"
  | "estop"
  | "feed-hold"
  | "setup"
  | "offline"
  | "unknown";

// === Connection Status — matches relay ConnectionStatus ===
export type MachineConnectionStatus = "connected" | "disconnected" | "reconnecting";

// === Alarm severity — matches relay AlarmEntry.severity ===
export type AlarmSeverity = "warning" | "alarm" | "fault";

// === Control type for CNC machines ===
export type ControlType =
  | "fanuc"
  | "haas"
  | "siemens"
  | "mazak"
  | "okuma"
  | "mitsubishi"
  | "heidenhain"
  | "manual"
  | "unknown";

// === AppAlarm — shaped for dashboard alarm feed ===
export interface AppAlarm {
  id: string;
  source: "jobline" | "manual";
  machineId: string;
  machineLabel: string;
  code: string;
  message: string;
  severity: AlarmSeverity;
  timestamp: Date;
  active: boolean;
  acknowledged: boolean;
  workOrderNumber?: string;
  partNumber?: string;
}

// === AppMachineStatus — live machine status shape for dashboard ===
export interface AppMachineStatus {
  machineId: string;
  equipmentId: string | null; // FK to equipment table
  stationId: string | null;   // FK to stations table
  label: string;
  controlType: ControlType;
  state: MachineState;
  connectionOk: boolean;
  // CNC metrics — null when not connected or not applicable
  spindleRpm: number | null;
  spindleOverride: number | null;
  feedOverride: number | null;
  activeTool: number | null;
  activeProgram: string | null;
  blockNumber: number | null;
  position: { x?: number; y?: number; z?: number };
  activeAlarmCodes: string[];
  lastUpdated: Date;
  // Equipment metadata from our DB
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  assetTag?: string;
  equipmentType?: string;
}

// === Relay connection state for UI banner ===
export type RelayConnectionState = "disconnected" | "connecting" | "connected";

// === Machine identity — sent on machine.connected ===
export interface MachineIdentity {
  id: string;
  label: string;
  controlType: ControlType;
}

// === Event types — the full contract between extension and dashboard ===
export type JobLineEventType =
  | "machine.status"
  | "machine.alarm"
  | "machine.connected"
  | "machine.disconnected"
  | "transfer.started"
  | "transfer.complete"
  | "transfer.failed";

// === Transfer status for DNC operations ===
export type TransferStatus = "in_progress" | "complete" | "failed";

// === TransferRecord — DNC file transfer tracking ===
export interface TransferRecord {
  id: string;
  machineId: string;
  machineLabel: string;
  fileName: string;
  fileSize?: number;
  protocol: "ftp" | "sftp" | "serial" | "ethernet" | "websocket" | "usb";
  direction: "send" | "receive";
  status: TransferStatus;
  progress?: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  workOrderNumber?: string;
  stationId?: string;
}

// === MachineStatusSnapshot — raw payload from relay (extension shape) ===
export interface MachineStatusSnapshot {
  machineId: string;
  machineState: MachineState;
  connectionStatus: MachineConnectionStatus;
  spindleRpm: number | null;
  spindleOverride: number | null;
  feedOverride: number | null;
  activeTool: number | null;
  activeProgram: string | null;
  blockNumber: number | null;
  position: { x?: number; y?: number; z?: number };
  alarms: AlarmEntry[];
  timestamp: string; // ISO
}

// === AlarmEntry — raw alarm from relay ===
export interface AlarmEntry {
  code: string;
  message: string;
  severity: AlarmSeverity;
  timestamp: string; // ISO
}

// === JobLineEvent — envelope from relay ===
export interface JobLineEvent {
  type: JobLineEventType;
  machineId: string;
  payload: any; // typed per event type in bridge functions
}

// === State color mapping for UI ===
export const MACHINE_STATE_CONFIG: Record<
  MachineState,
  { label: string; colorClass: string; dotClass: string }
> = {
  running:     { label: "Running",     colorClass: "text-status-ok",           dotClass: "bg-status-ok" },
  idle:        { label: "Idle",        colorClass: "text-status-waiting",      dotClass: "bg-status-waiting" },
  alarm:       { label: "Alarm",       colorClass: "text-status-critical",     dotClass: "bg-status-critical" },
  estop:       { label: "E-Stop",      colorClass: "text-role-org-owner",      dotClass: "bg-role-org-owner" },
  "feed-hold": { label: "Feed Hold",   colorClass: "text-warning",             dotClass: "bg-warning" },
  setup:       { label: "Setup",       colorClass: "text-info",                dotClass: "bg-info" },
  offline:     { label: "Offline",     colorClass: "text-muted-foreground",    dotClass: "bg-muted-foreground" },
  unknown:     { label: "Unknown",     colorClass: "text-muted-foreground",    dotClass: "bg-muted-foreground" },
};

export const ALARM_SEVERITY_CONFIG: Record<
  AlarmSeverity,
  { label: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  fault:   { label: "FAULT",   colorClass: "text-status-critical",  bgClass: "bg-status-critical/10",  borderClass: "border-status-critical/30" },
  alarm:   { label: "ALARM",   colorClass: "text-priority-urgent",  bgClass: "bg-priority-urgent/10",  borderClass: "border-priority-urgent/30" },
  warning: { label: "WARNING", colorClass: "text-warning",          bgClass: "bg-warning/10",          borderClass: "border-warning/30" },
};

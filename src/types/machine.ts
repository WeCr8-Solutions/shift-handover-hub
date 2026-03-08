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

// === State color mapping for UI ===
export const MACHINE_STATE_CONFIG: Record<
  MachineState,
  { label: string; colorClass: string; dotClass: string }
> = {
  running:     { label: "Running",     colorClass: "text-green-600",  dotClass: "bg-green-500" },
  idle:        { label: "Idle",        colorClass: "text-blue-600",   dotClass: "bg-blue-500" },
  alarm:       { label: "Alarm",       colorClass: "text-red-600",    dotClass: "bg-red-500" },
  estop:       { label: "E-Stop",      colorClass: "text-purple-600", dotClass: "bg-purple-500" },
  "feed-hold": { label: "Feed Hold",   colorClass: "text-amber-600",  dotClass: "bg-amber-500" },
  setup:       { label: "Setup",       colorClass: "text-cyan-600",   dotClass: "bg-cyan-500" },
  offline:     { label: "Offline",     colorClass: "text-muted-foreground", dotClass: "bg-muted-foreground" },
  unknown:     { label: "Unknown",     colorClass: "text-muted-foreground", dotClass: "bg-muted-foreground" },
};

export const ALARM_SEVERITY_CONFIG: Record<
  AlarmSeverity,
  { label: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  fault:   { label: "FAULT",   colorClass: "text-red-600",    bgClass: "bg-red-500/10",    borderClass: "border-red-500/30" },
  alarm:   { label: "ALARM",   colorClass: "text-orange-600", bgClass: "bg-orange-500/10", borderClass: "border-orange-500/30" },
  warning: { label: "WARNING", colorClass: "text-yellow-600", bgClass: "bg-yellow-500/10", borderClass: "border-yellow-500/30" },
};

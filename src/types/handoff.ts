export type Shift = "Day" | "Swing" | "Night";

export type TriState = "Yes" | "No" | "N/A";

export type WorkCenterType =
  | "CNC Mill"
  | "CNC Lathe"
  | "Water Jet"
  | "Press Brake"
  | "TIG Welding"
  | "MIG Welding"
  | "Electron Beam Welding"
  | "Punch Press"
  | "Hardware Installation"
  | "Deburr Station"
  | "Shipping"
  | "Incoming Inspection"
  | "Outgoing Inspection"
  | "Tool Crib";

export type JobState =
  | "Part Running"
  | "Setup in Progress"
  | "First Article in Process"
  | "Waiting on QA"
  | "Waiting on Tooling"
  | "Waiting on Material"
  | "Machine Down / Issue"
  | "Processing"
  | "Ready for Pickup"
  | "On Hold";

export type DelayCode =
  | "None"
  | "Material"
  | "Tooling"
  | "QA"
  | "Programming"
  | "Maintenance"
  | "Setup"
  | "Operator"
  | "Inspection"
  | "Shipping"
  | "Unknown";

export type ConditionStatus = "OK" | "Low" | "Check" | "Clear" | "Needs Cleaning" | "Issue";

export type ToolStatus = "OK" | "Replaced" | "Broken" | "Monitor";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export interface Part {
  partNumber: string;
  revision: string;
  operationNumber: string;
}

export interface Personnel {
  outgoingOperator: string;
  incomingOperator: string;
  supervisor?: string;
}

export interface JobStateInfo {
  primaryState: JobState;
  reason?: string;
  delayCode?: DelayCode;
}

export interface MachineReadiness {
  programLoaded: TriState;
  programVerifiedAgainstSetup: TriState;
  toolsInstalled: TriState;
  toolsSetMeasured: TriState;
  toolListMatchesProgram: TriState;
  workOffsetsSet: TriState;
  probingCompleted: TriState;
  proveOutCompleted: TriState;
  notes?: string;
}

// Generic equipment readiness for non-CNC stations
export interface EquipmentReadiness {
  equipmentReady: TriState;
  safetyChecksComplete: TriState;
  toolsAvailable: TriState;
  materialsStaged: TriState;
  workInstructionsAvailable: TriState;
  ppeVerified: TriState;
  notes?: string;
}

export interface MachineCondition {
  coolantLevel: "OK" | "Low" | "N/A";
  airPressure: "OK" | "Low" | "N/A";
  chipCondition: "Clear" | "Needs Cleaning" | "N/A";
  wayLube: "OK" | "Check" | "N/A";
  guardsDoors: "OK" | "Issue";
  activeAlarms: boolean;
  alarmNotes?: string;
}

// Station-specific conditions
export interface WeldingCondition {
  gasLevel: "OK" | "Low";
  wireLevel: "OK" | "Low";
  tipCondition: "OK" | "Replace";
  groundConnection: "OK" | "Issue";
  ventilationOK: boolean;
  notes?: string;
}

export interface WaterJetCondition {
  waterPressure: "OK" | "Low";
  abrasiveLevel: "OK" | "Low";
  nozzleCondition: "OK" | "Worn" | "Replace";
  tankLevel: "OK" | "Low";
  notes?: string;
}

export interface QualityStatus {
  lastGoodPartTimestamp: string;
  partsCompletedThisShift: number;
  scrapCount: number;
  reworkCount: number;
  criticalDimsVerified: boolean;
  qaNotified: "Yes" | "No" | "N/A";
  qualityNotes?: string;
}

export interface SetupProcess {
  fixtureInstalled: "Yes" | "Partial" | "Removed" | "N/A";
  clampsBoltsTorqued: TriState;
  fixtureOrientationVerified: TriState;
  specialInstructionsFollowed: TriState;
  processNotesForNextShift?: string;
}

export interface MaterialsStatus {
  rawMaterialAvailable: boolean;
  nextMaterialLotReady: boolean;
  materialIssuesNoted: boolean;
  materialNotes?: string;
}

export interface SignOff {
  outgoingOperatorName: string;
  incomingOperatorName: string;
  supervisorName?: string;
  outgoingTime: string;
  incomingTime: string;
  supervisorTime?: string;
}

export interface ToolingNote {
  toolNumber: string;
  toolDescription: string;
  status: ToolStatus;
  comment?: string;
}

export interface IssueItem {
  issue: string;
  actionRequired: string;
  owner: string;
  priority?: Priority;
  dueBy?: string;
}

export interface ShiftHandoffRecord {
  recordId: string;
  recordVersion: number;
  date: string;
  shift: Shift;
  workOrder: string;
  workCenter: string;
  workCenterType: WorkCenterType;
  machineId: string;
  part: Part;
  personnel: Personnel;
  jobState: JobStateInfo;
  machineReadiness?: MachineReadiness;
  equipmentReadiness?: EquipmentReadiness;
  machineCondition?: MachineCondition;
  weldingCondition?: WeldingCondition;
  waterJetCondition?: WaterJetCondition;
  qualityStatus: QualityStatus;
  setupProcess: SetupProcess;
  materialsStatus: MaterialsStatus;
  handoffSummary: string;
  signOff: SignOff;
  toolingNotes?: ToolingNote[];
  issuesFollowUps?: IssueItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StationInfo {
  stationId: string;
  name: string;
  workCenter: string;
  workCenterType: WorkCenterType;
  currentJob?: {
    workOrder: string;
    partNumber: string;
    state: JobState;
    operator: string;
    partsComplete: number;
    partsRequired: number;
  };
  condition: MachineCondition | WeldingCondition | WaterJetCondition | { status: "OK" | "Issue"; notes?: string };
  isActive: boolean;
}

// Work center type categories for filtering/grouping
export const WORK_CENTER_CATEGORIES = {
  "CNC Machining": ["CNC Mill", "CNC Lathe"],
  "Cutting": ["Water Jet", "Punch Press"],
  "Forming": ["Press Brake"],
  "Welding": ["TIG Welding", "MIG Welding", "Electron Beam Welding"],
  "Finishing": ["Hardware Installation", "Deburr Station"],
  "Logistics": ["Shipping", "Incoming Inspection", "Outgoing Inspection", "Tool Crib"],
} as const;

export const ALL_WORK_CENTER_TYPES: WorkCenterType[] = [
  "CNC Mill",
  "CNC Lathe",
  "Water Jet",
  "Press Brake",
  "TIG Welding",
  "MIG Welding",
  "Electron Beam Welding",
  "Punch Press",
  "Hardware Installation",
  "Deburr Station",
  "Shipping",
  "Incoming Inspection",
  "Outgoing Inspection",
  "Tool Crib",
];

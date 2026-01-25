export type Shift = "Day" | "Swing" | "Night";

export type TriState = "Yes" | "No" | "N/A";

export type JobState =
  | "Part Running"
  | "Setup in Progress"
  | "First Article in Process"
  | "Waiting on QA"
  | "Waiting on Tooling"
  | "Waiting on Material"
  | "Machine Down / Issue";

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

export interface MachineCondition {
  coolantLevel: "OK" | "Low";
  airPressure: "OK" | "Low";
  chipCondition: "Clear" | "Needs Cleaning";
  wayLube: "OK" | "Check";
  guardsDoors: "OK" | "Issue";
  activeAlarms: boolean;
  alarmNotes?: string;
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
  fixtureInstalled: "Yes" | "Partial" | "Removed";
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
  machineId: string;
  part: Part;
  personnel: Personnel;
  jobState: JobStateInfo;
  machineReadiness: MachineReadiness;
  machineCondition: MachineCondition;
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

export interface MachineInfo {
  machineId: string;
  name: string;
  workCenter: string;
  currentJob?: {
    workOrder: string;
    partNumber: string;
    state: JobState;
    operator: string;
    partsComplete: number;
    partsRequired: number;
  };
  condition: MachineCondition;
}

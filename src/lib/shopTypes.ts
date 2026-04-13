import {
  ClipboardList,
  ArrowRightLeft,
  Eye,
  Wrench,
  Factory,
  Car,
  Flame,
  LayoutGrid,
  FileText,
  RefreshCw,
} from "lucide-react";

export type ShopType = "cnc" | "auto" | "body" | "weld" | "general";

export const VALID_SHOP_TYPES: ShopType[] = ["cnc", "auto", "body", "weld", "general"];

export function parseShopType(raw: string | null | undefined): ShopType {
  if (raw && VALID_SHOP_TYPES.includes(raw as ShopType)) {
    return raw as ShopType;
  }
  return "cnc";
}

export interface ShopFeature {
  icon: React.ElementType;
  title: string;
  description: string;
}

export interface ShopHandoffEntry {
  station: string;
  from: string;
  to: string;
  time: string;
  state: string;
  meta: string;
}

export interface ShopJobEntry {
  label: string;
  status: string;
  color: string;
}

export type DemoColorVariant = "green" | "amber" | "blue" | "red";
export type DemoStatusIconKey = "check" | "wrench" | "package" | "alert";
export type DemoFeedbackIconKey = "gauge" | "shield" | "timer" | "wrench";

export interface ShopDemoStatusOption {
  statusLabel: string;
  partsCount: number;
  detailLabel: string;
  colorVariant: DemoColorVariant;
  iconKey: DemoStatusIconKey;
}

export interface ShopDemoFeedbackOption {
  type: string;
  label: string;
  impacts: string[];
  note: string;
  iconKey: DemoFeedbackIconKey;
}

export interface ShopDemoConfig {
  stationLabel: string;
  workOrder: string;
  itemLabel: string;
  itemValue: string;
  operationLabel: string;
  stationShortName: string;
  operatorName: string;
  unitLabel: string;
  shiftHandoffLabel: string;
  operationHandoffLabel: string;
  statusOptions: ShopDemoStatusOption[];
  feedbackOptions: ShopDemoFeedbackOption[];
}

export interface ShopTypeConfig {
  headline: string;
  subheadline: string;
  cta: string;
  demoLabel: string;
  features: ShopFeature[];
  handoffs: ShopHandoffEntry[];
  jobs: ShopJobEntry[];
  demoConfig: ShopDemoConfig;
}

export const SHOP_TYPE_SELECTOR: { type: ShopType; icon: React.ElementType; label: string }[] = [
  { type: "cnc", icon: Factory, label: "CNC & Mfg" },
  { type: "auto", icon: Wrench, label: "Auto Repair" },
  { type: "body", icon: Car, label: "Body Shops" },
  { type: "weld", icon: Flame, label: "Welding / Fab" },
  { type: "general", icon: LayoutGrid, label: "General" },
];

export const SHOP_TYPE_CONTENT: Record<ShopType, ShopTypeConfig> = {
  cnc: {
    headline: "Still walking the shop floor to know what's running?",
    subheadline: "See every job, machine, and handoff instantly.",
    cta: "See CNC Shop Demo",
    demoLabel: "Live job board — CNC shop",
    features: [
      { icon: ClipboardList, title: "Track Every Job", description: "See status, priority, and what is next in real time." },
      { icon: ArrowRightLeft, title: "Better Shift Handoffs", description: "Keep operators, leads, and supervisors aligned." },
      { icon: Eye, title: "See What's Running Now", description: "Know machine and work order status without guessing." },
    ],
    jobs: [
      { label: "Lathe #1 — Part #4412", status: "In Progress", color: "text-yellow-400" },
      { label: "Mill #2 — Rush Order", status: "Waiting on Material", color: "text-red-400" },
      { label: "QC Station", status: "Ready for Pickup", color: "text-green-400" },
    ],
    handoffs: [
      { station: "CNC-01", from: "Mike R.", to: "Sarah C.", time: "2:03 PM", state: "Running", meta: "127/150 parts" },
      { station: "LATHE-02", from: "James W.", to: "Tom B.", time: "2:00 PM", state: "Setup", meta: "0/75 parts" },
      { station: "MILL-03", from: "Lisa M.", to: "Dave K.", time: "1:58 PM", state: "Running", meta: "45/200 parts" },
    ],
    demoConfig: {
      stationLabel: "CNC-01 Station",
      workOrder: "WO-2024-1847",
      itemLabel: "Part Number",
      itemValue: "PN-4521-REV-C",
      operationLabel: "Op 20 - CNC Milling",
      stationShortName: "CNC-01",
      operatorName: "Mike R.",
      unitLabel: "parts",
      shiftHandoffLabel: "End of Shift",
      operationHandoffLabel: "Operation Complete",
      statusOptions: [
        { statusLabel: "Running", partsCount: 24, detailLabel: "24 parts completed", colorVariant: "green", iconKey: "check" },
        { statusLabel: "Running", partsCount: 36, detailLabel: "36 parts completed", colorVariant: "green", iconKey: "check" },
        { statusLabel: "Setup Mode", partsCount: 12, detailLabel: "12 parts completed", colorVariant: "amber", iconKey: "wrench" },
        { statusLabel: "Complete", partsCount: 48, detailLabel: "48 parts completed", colorVariant: "blue", iconKey: "package" },
      ],
      feedbackOptions: [
        { type: "tool_adjustment", label: "Tool offset tweak for better finish", impacts: ["cycle_time", "quality"], note: "Offset adjustment improved surface finish", iconKey: "gauge" },
        { type: "setup_change", label: "Fixture clamp position change", impacts: ["safety"], note: "Fixture clamp position more secure", iconKey: "shield" },
        { type: "cycle_improvement", label: "Cycle time optimization found", impacts: ["cycle_time"], note: "Reduced rapid moves saved 8 seconds", iconKey: "timer" },
      ],
    },
  },
  auto: {
    headline: "Know every vehicle status without asking your team",
    subheadline: "See every bay, repair, and handoff in one place.",
    cta: "See Auto Shop Demo",
    demoLabel: "Live job board — auto repair shop",
    features: [
      { icon: ClipboardList, title: "Track Every Vehicle", description: "See what is checked in, in progress, blocked, or ready." },
      { icon: RefreshCw, title: "Service Updates", description: "Keep advisors and techs aligned without repeated questions." },
      { icon: Eye, title: "Clear Job Status", description: "Reduce confusion on what is waiting, active, or complete." },
    ],
    jobs: [
      { label: "Bay 3 — 2019 Ford F-150", status: "In Progress", color: "text-yellow-400" },
      { label: "Bay 1 — Honda Civic Brakes", status: "Waiting on Parts", color: "text-red-400" },
      { label: "Bay 5 — Toyota Camry", status: "Ready for Pickup", color: "text-green-400" },
    ],
    handoffs: [
      { station: "Bay 1", from: "Tony M.", to: "Chris R.", time: "2:05 PM", state: "In Progress", meta: "Brakes / waiting parts" },
      { station: "Bay 3", from: "Derek S.", to: "Kyle W.", time: "2:01 PM", state: "Running", meta: "Oil change + tire rotation" },
      { station: "Bay 5", from: "James P.", to: "—", time: "1:55 PM", state: "Complete", meta: "Ready for pickup" },
    ],
    demoConfig: {
      stationLabel: "Bay 3 — Service Bay",
      workOrder: "RO-2024-0392",
      itemLabel: "Vehicle",
      itemValue: "2019 Ford F-150",
      operationLabel: "Brake Service",
      stationShortName: "Bay 3",
      operatorName: "Tony M.",
      unitLabel: "vehicles",
      shiftHandoffLabel: "End of Shift",
      operationHandoffLabel: "Vehicle Complete",
      statusOptions: [
        { statusLabel: "Diagnosis Complete", partsCount: 1, detailLabel: "Inspected & documented", colorVariant: "green", iconKey: "check" },
        { statusLabel: "In Progress", partsCount: 1, detailLabel: "Service underway", colorVariant: "amber", iconKey: "wrench" },
        { statusLabel: "Waiting on Parts", partsCount: 1, detailLabel: "Parts on order", colorVariant: "red", iconKey: "alert" },
        { statusLabel: "Ready for Pickup", partsCount: 1, detailLabel: "Service complete", colorVariant: "blue", iconKey: "package" },
      ],
      feedbackOptions: [
        { type: "additional_service", label: "Recommended additional service", impacts: ["quality"], note: "Brake flush recommended — customer notified", iconKey: "gauge" },
        { type: "parts_concern", label: "Parts availability concern noted", impacts: ["productivity"], note: "Rotors needed special order — logged for future", iconKey: "shield" },
        { type: "tech_note", label: "Tech note added for service advisor", impacts: ["quality"], note: "Alignment pulls left — customer informed", iconKey: "timer" },
      ],
    },
  },
  body: {
    headline: "Stop losing track of repairs and handoffs",
    subheadline: "See every stage from intake to delivery — no guessing.",
    cta: "See Body Shop Demo",
    demoLabel: "Live job board — body shop",
    features: [
      { icon: ClipboardList, title: "Track Repairs by Stage", description: "Follow progress from teardown to paint to delivery." },
      { icon: FileText, title: "No Missed Notes", description: "Keep repair notes visible across the team." },
      { icon: ArrowRightLeft, title: "Better Team Handoffs", description: "Reduce delays between departments and touchpoints." },
    ],
    jobs: [
      { label: "BMW M3 — Color Match", status: "In Teardown", color: "text-yellow-400" },
      { label: "Mustang — Panel Repair", status: "In Paint", color: "text-blue-400" },
      { label: "Toyota Camry", status: "Ready for Delivery", color: "text-green-400" },
    ],
    handoffs: [
      { station: "Teardown", from: "Rick A.", to: "Paint Team", time: "2:10 PM", state: "Pending", meta: "BMW M3 — door panels" },
      { station: "Paint Booth", from: "Sam T.", to: "Detail", time: "1:50 PM", state: "In Paint", meta: "Mustang — base coat" },
      { station: "Detail", from: "Lee C.", to: "—", time: "1:40 PM", state: "Complete", meta: "Camry — delivery ready" },
    ],
    demoConfig: {
      stationLabel: "Paint Booth — Stage 2",
      workOrder: "CO-2024-7713",
      itemLabel: "Repair Order",
      itemValue: "2021 BMW M3 — Door Panels",
      operationLabel: "Color Match & Paint",
      stationShortName: "Paint Booth",
      operatorName: "Sam T.",
      unitLabel: "repairs",
      shiftHandoffLabel: "End of Shift",
      operationHandoffLabel: "Stage Complete",
      statusOptions: [
        { statusLabel: "In Teardown", partsCount: 1, detailLabel: "Disassembly in progress", colorVariant: "amber", iconKey: "wrench" },
        { statusLabel: "In Paint", partsCount: 1, detailLabel: "Color coat applied", colorVariant: "blue", iconKey: "package" },
        { statusLabel: "Detail Complete", partsCount: 1, detailLabel: "Ready for delivery", colorVariant: "green", iconKey: "check" },
        { statusLabel: "On Hold", partsCount: 1, detailLabel: "Supplement needed", colorVariant: "red", iconKey: "alert" },
      ],
      feedbackOptions: [
        { type: "color_match", label: "Color match needed adjustment", impacts: ["quality"], note: "Added pearl coat for better match", iconKey: "gauge" },
        { type: "supplement", label: "Additional damage found", impacts: ["quality", "productivity"], note: "Supplement submitted for inner door panel", iconKey: "shield" },
        { type: "customer_note", label: "Customer preference noted", impacts: ["quality"], note: "Customer requested early delivery — flagged", iconKey: "timer" },
      ],
    },
  },
  weld: {
    headline: "Missed notes causing rework?",
    subheadline: "See every job, station, and handoff before it slips through.",
    cta: "See Fabrication Demo",
    demoLabel: "Live job board — welding & fabrication",
    features: [
      { icon: ClipboardList, title: "Track Jobs Clearly", description: "Know where every job stands without chasing updates." },
      { icon: RefreshCw, title: "Reduce Rework", description: "Keep notes visible so details do not get lost." },
      { icon: ArrowRightLeft, title: "Improve Handoffs", description: "Make transitions between stations easier to manage." },
    ],
    jobs: [
      { label: "Frame Jig A — Custom Rack", status: "In Progress", color: "text-yellow-400" },
      { label: "Pipe Spool #7", status: "Waiting on Drawing", color: "text-red-400" },
      { label: "Finishing Station", status: "Complete", color: "text-green-400" },
    ],
    handoffs: [
      { station: "Fit-Up", from: "Brad H.", to: "Weld Cell 2", time: "2:08 PM", state: "Running", meta: "Custom rack — tack welds done" },
      { station: "Weld Cell 1", from: "Aaron D.", to: "Grind", time: "2:00 PM", state: "Complete", meta: "Pipe spool — waiting drawing" },
      { station: "Finishing", from: "Steve R.", to: "—", time: "1:45 PM", state: "Complete", meta: "Trailer hitch — out the door" },
    ],
    demoConfig: {
      stationLabel: "Weld Cell 1 — Fit-Up",
      workOrder: "WO-FAB-2244",
      itemLabel: "Job",
      itemValue: "Custom Rack Assembly",
      operationLabel: "Fit-Up & Tack Weld",
      stationShortName: "Weld Cell 1",
      operatorName: "Brad H.",
      unitLabel: "assemblies",
      shiftHandoffLabel: "End of Shift",
      operationHandoffLabel: "Operation Complete",
      statusOptions: [
        { statusLabel: "In Progress", partsCount: 4, detailLabel: "4 assemblies complete", colorVariant: "green", iconKey: "check" },
        { statusLabel: "Setup", partsCount: 0, detailLabel: "Fixture staged", colorVariant: "amber", iconKey: "wrench" },
        { statusLabel: "Complete", partsCount: 8, detailLabel: "8 assemblies done", colorVariant: "blue", iconKey: "package" },
        { statusLabel: "Waiting on Drawing", partsCount: 2, detailLabel: "Drawing discrepancy found", colorVariant: "red", iconKey: "alert" },
      ],
      feedbackOptions: [
        { type: "drawing_issue", label: "Drawing discrepancy found", impacts: ["quality"], note: "Hole pattern off — flagged for engineer", iconKey: "gauge" },
        { type: "fit_up_note", label: "Fit-up improvement noted", impacts: ["cycle_time", "quality"], note: "Tab placement improved weld access", iconKey: "timer" },
        { type: "safety_note", label: "PPE/safety note added", impacts: ["safety"], note: "Grinding shield needed at this station", iconKey: "shield" },
      ],
    },
  },
  general: {
    headline: "Keep your shop moving with clear job visibility",
    subheadline: "See every job, status, and handoff — all in one place.",
    cta: "See Your Shop Live",
    demoLabel: "Live job board — small shop",
    features: [
      { icon: ClipboardList, title: "Track Every Job", description: "See work status in one place." },
      { icon: ArrowRightLeft, title: "Better Handoffs", description: "Keep your team aligned." },
      { icon: Eye, title: "Less Guessing", description: "Know what is running and what is next." },
    ],
    jobs: [
      { label: "Job #18 — Cabinet Set", status: "In Progress", color: "text-yellow-400" },
      { label: "Job #21 — Countertop", status: "On Hold", color: "text-red-400" },
      { label: "Pickup Counter", status: "Ready", color: "text-green-400" },
    ],
    handoffs: [
      { station: "Station A", from: "Dan R.", to: "Mark L.", time: "2:00 PM", state: "Running", meta: "Cabinet set — assembly" },
      { station: "Station B", from: "Phil C.", to: "Dan R.", time: "1:50 PM", state: "On Hold", meta: "Countertop — material delay" },
      { station: "Finishing", from: "Mark L.", to: "—", time: "1:30 PM", state: "Complete", meta: "Shelving unit — ready" },
    ],
    demoConfig: {
      stationLabel: "Station A — Assembly",
      workOrder: "JOB-2024-0118",
      itemLabel: "Job",
      itemValue: "Cabinet Set — Job #18",
      operationLabel: "Assembly",
      stationShortName: "Station A",
      operatorName: "Dan R.",
      unitLabel: "units",
      shiftHandoffLabel: "End of Shift",
      operationHandoffLabel: "Job Complete",
      statusOptions: [
        { statusLabel: "In Progress", partsCount: 6, detailLabel: "6 units complete", colorVariant: "green", iconKey: "check" },
        { statusLabel: "On Hold", partsCount: 3, detailLabel: "Material delay", colorVariant: "amber", iconKey: "wrench" },
        { statusLabel: "Complete", partsCount: 12, detailLabel: "12 units done", colorVariant: "blue", iconKey: "package" },
        { statusLabel: "Waiting on Material", partsCount: 0, detailLabel: "Supplier delayed", colorVariant: "red", iconKey: "alert" },
      ],
      feedbackOptions: [
        { type: "process_note", label: "Process improvement found", impacts: ["cycle_time"], note: "New assembly sequence saved time", iconKey: "timer" },
        { type: "material_note", label: "Material quality concern", impacts: ["quality"], note: "Supplier boards uneven — noted for QC", iconKey: "gauge" },
        { type: "workflow_note", label: "Workflow note added", impacts: ["productivity"], note: "Staging area reorganized for better flow", iconKey: "shield" },
      ],
    },
  },
};

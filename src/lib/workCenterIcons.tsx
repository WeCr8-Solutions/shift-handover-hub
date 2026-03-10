import {
  Cog,
  Disc3,
  Droplets,
  Gauge,
  Flame,
  Zap,
  CircleDot,
  Hammer,
  Wrench,
  Truck,
  PackageSearch,
  PackageCheck,
  Archive,
  Scissors,
  FileText,
  Code2,
  ShoppingCart,
  PackageOpen,
  Search,
  Circle,
  ClipboardList,
  Users,
  Boxes,
  ClipboardCheck,
  ClipboardSignature,
  ListChecks,
  ScanBarcode,
  Settings2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Repeat,
  Target,
  Building2,
  Route,
  RefreshCcw,
  GraduationCap,
  FolderCheck,
} from "lucide-react";
import { WorkCenterType } from "@/types/handoff";

export const workCenterIcons: Record<
  WorkCenterType,
  React.ComponentType<{ className?: string }>
> = {
  // Core machining / fabrication
  "CNC Mill": Cog,
  "CNC Lathe": Disc3,
  "Grinding": Circle,
  "Water Jet": Droplets,
  "Band Saw": Scissors,
  "Press Brake": Gauge,
  "Punch Press": CircleDot,
  "TIG Welding": Flame,
  "MIG Welding": Flame,
  "Electron Beam Welding": Zap,
  "Hardware Installation": Hammer,
  "Deburr Station": Wrench,

  // Quality
  "Incoming Inspection": PackageSearch,
  "Outgoing Inspection": PackageCheck,
  "Final Inspection": Search,
  "In-Process Inspection": CheckCircle2,
  "First Article Inspection": Target,
  "Calibration Lab": Gauge,
  "Document Control": FolderCheck,

  // Engineering / office / technical support
  "Quoting": FileText,
  "Engineering Review": FileText,
  "CAM Programming": Code2,
  "Tooling Engineering": Settings2,

  // Logistics / warehouse / material flow
  "Purchasing": ShoppingCart,
  "Receiving": PackageOpen,
  "Shipping": Truck,
  "Tool Crib": Archive,
  "Material Handling": Boxes,
  "Material Staging": Boxes,
  "Warehouse": Boxes,
  "Inventory": Archive,
  "Picking": ScanBarcode,
  "Cycle Count": ScanBarcode,
  "Returns": RefreshCcw,
  "Cross-Dock": Route,
  "Supermarket": Boxes,
  "Line Feeding": Route,
  "Kanban Replenishment": Repeat,

  // Assembly / packaging / downstream
  "Assembly": ClipboardList,
  "Cell Assembly": ClipboardList,
  "Final Assembly": ClipboardCheck,
  "Sub-Assembly": ListChecks,
  "Teardown": Wrench,
  "Kitting": Boxes,
  "Line-Side Kitting": Boxes,
  "Rework": Wrench,
  "Packaging": PackageOpen,
  "Labeling": ClipboardSignature,

  // Production support
  "Production Support": Users,
  "Production Planning": ClipboardCheck,
  "Production Control": ClipboardCheck,
  "Line Leadership": Users,
  "Training": GraduationCap,
  "MRB": FileText,
  "5S / Kaizen": Repeat,
  "Safety Walk": Shield,

  // Maintenance / facilities / compliance
  "Maintenance Shop": Settings2,
  "Preventive Maintenance": Wrench,
  "Facilities": Building2,
  "EHS": AlertTriangle,
};

export const workCenterColors: Record<WorkCenterType, string> = {
  // Core machining / fabrication
  "CNC Mill": "text-info",
  "CNC Lathe": "text-info",
  "Grinding": "text-info",
  "Water Jet": "text-status-waiting",
  "Band Saw": "text-status-waiting",
  "Press Brake": "text-priority-urgent",
  "Punch Press": "text-warning",
  "TIG Welding": "text-status-critical",
  "MIG Welding": "text-status-critical",
  "Electron Beam Welding": "text-role-org-owner",
  "Hardware Installation": "text-status-ok",
  "Deburr Station": "text-status-ok",

  // Quality
  "Incoming Inspection": "text-info",
  "Outgoing Inspection": "text-info",
  "Final Inspection": "text-info",
  "In-Process Inspection": "text-info",
  "First Article Inspection": "text-role-org-owner",
  "Calibration Lab": "text-warning",
  "Document Control": "text-muted-foreground",

  // Engineering / office / technical support
  "Quoting": "text-muted-foreground",
  "Engineering Review": "text-role-org-owner",
  "CAM Programming": "text-role-org-owner",
  "Tooling Engineering": "text-role-org-owner",

  // Logistics / warehouse / material flow
  "Purchasing": "text-chart-4",
  "Receiving": "text-chart-2",
  "Shipping": "text-role-org-admin",
  "Tool Crib": "text-warning",
  "Material Handling": "text-chart-2",
  "Material Staging": "text-chart-2",
  "Warehouse": "text-chart-2",
  "Inventory": "text-warning",
  "Picking": "text-status-waiting",
  "Cycle Count": "text-warning",
  "Returns": "text-warning",
  "Cross-Dock": "text-chart-2",
  "Supermarket": "text-chart-2",
  "Line Feeding": "text-status-waiting",
  "Kanban Replenishment": "text-chart-4",

  // Assembly / packaging / downstream
  "Assembly": "text-status-ok",
  "Cell Assembly": "text-status-ok",
  "Final Assembly": "text-status-ok",
  "Sub-Assembly": "text-status-ok",
  "Teardown": "text-warning",
  "Kitting": "text-status-waiting",
  "Line-Side Kitting": "text-status-waiting",
  "Rework": "text-warning",
  "Packaging": "text-status-waiting",
  "Labeling": "text-muted-foreground",

  // Production support
  "Production Support": "text-chart-4",
  "Production Planning": "text-role-org-owner",
  "Production Control": "text-role-org-owner",
  "Line Leadership": "text-role-org-admin",
  "Training": "text-chart-4",
  "MRB": "text-priority-urgent",
  "5S / Kaizen": "text-status-ok",
  "Safety Walk": "text-priority-urgent",

  // Maintenance / facilities / compliance
  "Maintenance Shop": "text-warning",
  "Preventive Maintenance": "text-warning",
  "Facilities": "text-muted-foreground",
  "EHS": "text-status-critical",
};

export const getCategoryForType = (type: WorkCenterType): string => {
  if (["CNC Mill", "CNC Lathe", "Grinding"].includes(type)) {
    return "CNC Machining";
  }

  if (["Water Jet", "Band Saw", "Punch Press"].includes(type)) {
    return "Cutting";
  }

  if (["Press Brake"].includes(type)) {
    return "Forming";
  }

  if (["TIG Welding", "MIG Welding", "Electron Beam Welding"].includes(type)) {
    return "Welding";
  }

  if (["Hardware Installation", "Deburr Station"].includes(type)) {
    return "Finishing";
  }

  if (
    [
      "Incoming Inspection",
      "Outgoing Inspection",
      "Final Inspection",
      "In-Process Inspection",
      "First Article Inspection",
      "Document Control",
    ].includes(type)
  ) {
    return "Quality";
  }

  if (["Calibration Lab"].includes(type)) {
    return "Calibration";
  }

  if (
    [
      "Quoting",
      "Engineering Review",
      "CAM Programming",
      "Tooling Engineering",
    ].includes(type)
  ) {
    return "Engineering";
  }

  if (
    [
      "Purchasing",
      "Receiving",
      "Shipping",
      "Tool Crib",
      "Material Handling",
      "Material Staging",
      "Warehouse",
      "Inventory",
      "Picking",
      "Cycle Count",
      "Returns",
      "Cross-Dock",
      "Supermarket",
      "Line Feeding",
      "Kanban Replenishment",
    ].includes(type)
  ) {
    return "Logistics";
  }

  if (
    [
      "Assembly",
      "Cell Assembly",
      "Final Assembly",
      "Sub-Assembly",
      "Teardown",
      "Kitting",
      "Line-Side Kitting",
      "Rework",
      "Packaging",
      "Labeling",
    ].includes(type)
  ) {
    return "Assembly & Kitting";
  }

  if (
    [
      "Production Support",
      "Production Planning",
      "Production Control",
      "Line Leadership",
      "Training",
      "MRB",
      "5S / Kaizen",
      "Safety Walk",
    ].includes(type)
  ) {
    return "Production Support";
  }

  if (
    [
      "Maintenance Shop",
      "Preventive Maintenance",
      "Facilities",
      "EHS",
    ].includes(type)
  ) {
    return "Maintenance & Facilities";
  }

  return "Other";
};
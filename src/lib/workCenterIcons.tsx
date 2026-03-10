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
} from "lucide-react";
import { WorkCenterType } from "@/types/handoff";

export const workCenterIcons: Record<WorkCenterType, React.ComponentType<{ className?: string }>> = {
  "CNC Mill": Cog,
  "CNC Lathe": Disc3,
  "Water Jet": Droplets,
  "Band Saw": Scissors,
  "Press Brake": Gauge,
  "TIG Welding": Flame,
  "MIG Welding": Flame,
  "Electron Beam Welding": Zap,
  "Punch Press": CircleDot,
  "Hardware Installation": Hammer,
  "Deburr Station": Wrench,
  "Shipping": Truck,
  "Incoming Inspection": PackageSearch,
  "Outgoing Inspection": PackageCheck,
  "Final Inspection": Search,
  "Tool Crib": Archive,
  "Quoting": FileText,
  "Engineering Review": FileText,
  "CAM Programming": Code2,
  "Purchasing": ShoppingCart,
  "Receiving": PackageOpen,
  "Grinding": Circle,
};

export const workCenterColors: Record<WorkCenterType, string> = {
  "CNC Mill": "text-info",
  "CNC Lathe": "text-info",
  "Water Jet": "text-status-waiting",
  "Band Saw": "text-status-waiting",
  "Press Brake": "text-priority-urgent",
  "TIG Welding": "text-status-critical",
  "MIG Welding": "text-status-critical",
  "Electron Beam Welding": "text-role-org-owner",
  "Punch Press": "text-warning",
  "Hardware Installation": "text-status-ok",
  "Deburr Station": "text-status-ok",
  "Shipping": "text-role-org-admin",
  "Incoming Inspection": "text-info",
  "Outgoing Inspection": "text-info",
  "Final Inspection": "text-info",
  "Tool Crib": "text-warning",
  "Quoting": "text-muted-foreground",
  "Engineering Review": "text-role-org-owner",
  "CAM Programming": "text-role-org-owner",
  "Purchasing": "text-chart-4",
  "Receiving": "text-chart-2",
  "Grinding": "text-info",
};

export const getCategoryForType = (type: WorkCenterType): string => {
  if (["CNC Mill", "CNC Lathe", "Grinding"].includes(type)) return "CNC Machining";
  if (["Water Jet", "Band Saw", "Punch Press"].includes(type)) return "Cutting";
  if (["Press Brake"].includes(type)) return "Forming";
  if (["TIG Welding", "MIG Welding", "Electron Beam Welding"].includes(type)) return "Welding";
  if (["Hardware Installation", "Deburr Station"].includes(type)) return "Finishing";
  if (["Incoming Inspection", "Outgoing Inspection", "Final Inspection"].includes(type)) return "Quality";
  if (["Quoting", "Engineering Review", "CAM Programming"].includes(type)) return "Engineering";
  if (["Purchasing", "Receiving", "Shipping", "Tool Crib"].includes(type)) return "Logistics";
  return "Other";
};

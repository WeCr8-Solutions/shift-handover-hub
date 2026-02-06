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
  "CNC Mill": "text-cyan-400",
  "CNC Lathe": "text-cyan-400",
  "Water Jet": "text-blue-400",
  "Band Saw": "text-blue-400",
  "Press Brake": "text-orange-400",
  "TIG Welding": "text-red-400",
  "MIG Welding": "text-red-400",
  "Electron Beam Welding": "text-purple-400",
  "Punch Press": "text-yellow-400",
  "Hardware Installation": "text-emerald-400",
  "Deburr Station": "text-emerald-400",
  "Shipping": "text-indigo-400",
  "Incoming Inspection": "text-teal-400",
  "Outgoing Inspection": "text-teal-400",
  "Final Inspection": "text-teal-400",
  "Tool Crib": "text-amber-400",
  "Quoting": "text-slate-400",
  "Engineering Review": "text-violet-400",
  "CAM Programming": "text-violet-400",
  "Purchasing": "text-pink-400",
  "Receiving": "text-lime-400",
  "Grinding": "text-cyan-400",
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

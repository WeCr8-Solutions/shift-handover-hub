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
} from "lucide-react";
import { WorkCenterType } from "@/types/handoff";

export const workCenterIcons: Record<WorkCenterType, React.ComponentType<{ className?: string }>> = {
  "CNC Mill": Cog,
  "CNC Lathe": Disc3,
  "Water Jet": Droplets,
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
  "Tool Crib": Archive,
};

export const workCenterColors: Record<WorkCenterType, string> = {
  "CNC Mill": "text-cyan-400",
  "CNC Lathe": "text-cyan-400",
  "Water Jet": "text-blue-400",
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
  "Tool Crib": "text-amber-400",
};

export const getCategoryForType = (type: WorkCenterType): string => {
  if (["CNC Mill", "CNC Lathe"].includes(type)) return "CNC Machining";
  if (["Water Jet", "Punch Press"].includes(type)) return "Cutting";
  if (["Press Brake"].includes(type)) return "Forming";
  if (["TIG Welding", "MIG Welding", "Electron Beam Welding"].includes(type)) return "Welding";
  if (["Hardware Installation", "Deburr Station"].includes(type)) return "Finishing";
  return "Logistics";
};

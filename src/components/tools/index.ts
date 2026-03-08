import { ReactNode } from "react";
import {
  Calculator, Ruler, ArrowRightLeft, BookOpen,
  Gauge, Timer, Scaling, Triangle, Thermometer, CircleDot,
} from "lucide-react";

// ─── Tool Registry ────────────────────────────────────────
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  category: "machining" | "measurement" | "conversion" | "reference";
  tags: string[];
  public?: boolean; // available without auth
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: "sfm-calculator",
    name: "Speed & Feed Calculator",
    description: "RPM, feed rate, and chip load from SFM and cutter geometry.",
    icon: <Gauge className="w-5 h-5" />,
    category: "machining",
    tags: ["rpm", "sfm", "feed", "speed", "cnc", "milling"],
  },
  {
    id: "tap-drill-chart",
    name: "Tap Drill Chart",
    description: "Recommended tap drill sizes for UNC, UNF, and metric threads.",
    icon: <BookOpen className="w-5 h-5" />,
    category: "reference",
    tags: ["tap", "drill", "thread", "unc", "unf", "metric"],
  },
  {
    id: "tolerance-calculator",
    name: "Tolerance Calculator",
    description: "Min/max dimensions, bilateral tolerance stackup, and pass/fail.",
    icon: <Ruler className="w-5 h-5" />,
    category: "measurement",
    tags: ["tolerance", "dimension", "inspection", "stackup"],
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    description: "Length, weight, pressure, temperature, torque, and speed.",
    icon: <ArrowRightLeft className="w-5 h-5" />,
    category: "conversion",
    tags: ["convert", "inch", "mm", "metric", "imperial"],
    public: true,
  },
  {
    id: "surface-finish",
    name: "Surface Finish Calculator",
    description: "Theoretical Ra from feed rate and tool nose radius.",
    icon: <Scaling className="w-5 h-5" />,
    category: "measurement",
    tags: ["surface", "finish", "ra", "rz", "roughness"],
  },
  {
    id: "trig-calculator",
    name: "Right Triangle Solver",
    description: "Solve any right triangle from two known values.",
    icon: <Triangle className="w-5 h-5" />,
    category: "measurement",
    tags: ["trig", "triangle", "angle", "sine", "cosine", "hypotenuse"],
    public: true,
  },
  {
    id: "mrr-calculator",
    name: "Material Removal Rate",
    description: "Volumetric MRR for milling and turning operations.",
    icon: <Calculator className="w-5 h-5" />,
    category: "machining",
    tags: ["mrr", "material", "removal", "volume", "milling", "turning"],
  },
  {
    id: "cycle-time",
    name: "Cycle Time Estimator",
    description: "Estimate total cycle time from cutting parameters.",
    icon: <Timer className="w-5 h-5" />,
    category: "machining",
    tags: ["cycle", "time", "estimate", "parts", "hour"],
  },
  {
    id: "hardness-converter",
    name: "Hardness Converter",
    description: "Convert between HRC, HRB, Brinell, Vickers scales.",
    icon: <Thermometer className="w-5 h-5" />,
    category: "conversion",
    tags: ["hardness", "hrc", "brinell", "vickers", "rockwell"],
  },
  {
    id: "thread-calculator",
    name: "Thread Pitch Calculator",
    description: "TPI ↔ pitch conversion and standard thread specs.",
    icon: <CircleDot className="w-5 h-5" />,
    category: "reference",
    tags: ["thread", "pitch", "tpi", "diameter", "class"],
  },
];

export const TOOL_CATEGORIES = [
  { value: "all", label: "All Tools" },
  { value: "machining", label: "Machining" },
  { value: "measurement", label: "Measurement" },
  { value: "conversion", label: "Conversion" },
  { value: "reference", label: "Reference" },
] as const;

// Re-export components
export { SfmCalculator } from "./SfmCalculator";
export { ToleranceCalculator } from "./ToleranceCalculator";
export { UnitConverter } from "./UnitConverter";
export { TrigCalculator } from "./TrigCalculator";

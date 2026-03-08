import { ReactNode, lazy, ComponentType } from "react";
import {
  Calculator, Ruler, ArrowRightLeft, BookOpen,
  Gauge, Timer, Scaling, Triangle, Thermometer, CircleDot,
} from "lucide-react";

// ─── Lazy-loaded tool components ──────────────────────────
const SfmCalculator = lazy(() => import("./SfmCalculator").then(m => ({ default: m.SfmCalculator })));
const ToleranceCalculator = lazy(() => import("./ToleranceCalculator").then(m => ({ default: m.ToleranceCalculator })));
const UnitConverter = lazy(() => import("./UnitConverter").then(m => ({ default: m.UnitConverter })));
const TrigCalculator = lazy(() => import("./TrigCalculator").then(m => ({ default: m.TrigCalculator })));
const MathCalculator = lazy(() => import("./MathCalculator").then(m => ({ default: m.MathCalculator })));
const SurfaceFinishCalculator = lazy(() => import("./SurfaceFinishCalculator").then(m => ({ default: m.SurfaceFinishCalculator })));
const MrrCalculator = lazy(() => import("./MrrCalculator").then(m => ({ default: m.MrrCalculator })));
const CycleTimeEstimator = lazy(() => import("./CycleTimeEstimator").then(m => ({ default: m.CycleTimeEstimator })));
const HardnessConverter = lazy(() => import("./HardnessConverter").then(m => ({ default: m.HardnessConverter })));
const TapDrillChart = lazy(() => import("./TapDrillChart").then(m => ({ default: m.TapDrillChart })));
const ThreadPitchCalculator = lazy(() => import("./ThreadPitchCalculator").then(m => ({ default: m.ThreadPitchCalculator })));

// ─── Tool Registry ────────────────────────────────────────
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  category: "machining" | "measurement" | "conversion" | "reference";
  tags: string[];
  public?: boolean;
  /** Lazy-loaded component. null = "Coming Soon". */
  component: ComponentType | null;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: "math-calculator",
    name: "Math Calculator",
    description: "General-purpose calculator with order of operations, functions, and history.",
    icon: <Calculator className="w-5 h-5" />,
    category: "measurement",
    tags: ["math", "calculator", "arithmetic", "algebra", "sqrt", "trig"],
    public: true,
    component: MathCalculator,
  },
  {
    id: "sfm-calculator",
    name: "Speed & Feed Calculator",
    description: "RPM, feed rate, and chip load from SFM and cutter geometry.",
    icon: <Gauge className="w-5 h-5" />,
    category: "machining",
    tags: ["rpm", "sfm", "feed", "speed", "cnc", "milling"],
    component: SfmCalculator,
  },
  {
    id: "tap-drill-chart",
    name: "Tap Drill Chart",
    description: "Recommended tap drill sizes for UNC, UNF, and metric threads.",
    icon: <BookOpen className="w-5 h-5" />,
    category: "reference",
    tags: ["tap", "drill", "thread", "unc", "unf", "metric"],
    component: TapDrillChart,
  },
  {
    id: "tolerance-calculator",
    name: "Tolerance Calculator",
    description: "Min/max dimensions, bilateral tolerance stackup, and pass/fail.",
    icon: <Ruler className="w-5 h-5" />,
    category: "measurement",
    tags: ["tolerance", "dimension", "inspection", "stackup"],
    component: ToleranceCalculator,
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    description: "Length, weight, pressure, temperature, torque, and speed.",
    icon: <ArrowRightLeft className="w-5 h-5" />,
    category: "conversion",
    tags: ["convert", "inch", "mm", "metric", "imperial"],
    public: true,
    component: UnitConverter,
  },
  {
    id: "surface-finish",
    name: "Surface Finish Calculator",
    description: "Theoretical Ra from feed rate and tool nose radius.",
    icon: <Scaling className="w-5 h-5" />,
    category: "measurement",
    tags: ["surface", "finish", "ra", "rz", "roughness"],
    component: SurfaceFinishCalculator,
  },
  {
    id: "trig-calculator",
    name: "Right Triangle Solver",
    description: "Solve any right triangle from two known values.",
    icon: <Triangle className="w-5 h-5" />,
    category: "measurement",
    tags: ["trig", "triangle", "angle", "sine", "cosine", "hypotenuse"],
    public: true,
    component: TrigCalculator,
  },
  {
    id: "mrr-calculator",
    name: "Material Removal Rate",
    description: "Volumetric MRR for milling and turning operations.",
    icon: <Calculator className="w-5 h-5" />,
    category: "machining",
    tags: ["mrr", "material", "removal", "volume", "milling", "turning"],
    component: MrrCalculator,
  },
  {
    id: "cycle-time",
    name: "Cycle Time Estimator",
    description: "Estimate total cycle time from cutting parameters.",
    icon: <Timer className="w-5 h-5" />,
    category: "machining",
    tags: ["cycle", "time", "estimate", "parts", "hour"],
    component: CycleTimeEstimator,
  },
  {
    id: "hardness-converter",
    name: "Hardness Converter",
    description: "Convert between HRC, HRB, Brinell, Vickers scales.",
    icon: <Thermometer className="w-5 h-5" />,
    category: "conversion",
    tags: ["hardness", "hrc", "brinell", "vickers", "rockwell"],
    component: HardnessConverter,
  },
  {
    id: "thread-calculator",
    name: "Thread Pitch Calculator",
    description: "TPI ↔ pitch conversion and standard thread specs.",
    icon: <CircleDot className="w-5 h-5" />,
    category: "reference",
    tags: ["thread", "pitch", "tpi", "diameter", "class"],
    component: ThreadPitchCalculator,
  },
];

export const TOOL_CATEGORIES = [
  { value: "all", label: "All Tools" },
  { value: "machining", label: "Machining" },
  { value: "measurement", label: "Measurement" },
  { value: "conversion", label: "Conversion" },
  { value: "reference", label: "Reference" },
] as const;

// Re-export components for direct imports
export { SfmCalculator } from "./SfmCalculator";
export { ToleranceCalculator } from "./ToleranceCalculator";
export { UnitConverter } from "./UnitConverter";
export { TrigCalculator } from "./TrigCalculator";
export { MathCalculator } from "./MathCalculator";
export { SurfaceFinishCalculator } from "./SurfaceFinishCalculator";
export { MrrCalculator } from "./MrrCalculator";
export { CycleTimeEstimator } from "./CycleTimeEstimator";
export { HardnessConverter } from "./HardnessConverter";
export { TapDrillChart } from "./TapDrillChart";
export { ThreadPitchCalculator } from "./ThreadPitchCalculator";

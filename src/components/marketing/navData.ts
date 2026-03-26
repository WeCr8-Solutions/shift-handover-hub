import {
  Cog,
  ClipboardCheck,
  BarChart3,
  Wrench,
  Cpu,
  Clock,
  Shield,
  Gauge,
  BookOpen,
  Code,
  BookA,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  TrendingUp,
  LayoutGrid,
  Kanban,
  Users,
  GitCompare,
  FileText,
  Cable,
  type LucideIcon,
} from "lucide-react";

export interface NavFeatureItem {
  label: string;
  href: string;
  icon: LucideIcon;
  desc: string;
}

export interface NavLinkItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface IndustryCategory {
  heading: string;
  items: string[];
}

export const platformFeatures: NavFeatureItem[] = [
  { label: "Digital Expeditor", href: "/features/digital-expeditor", icon: Gauge, desc: "Real-time work order routing & visibility" },
  { label: "Shift Handoff", href: "/features/shift-handoff-software", icon: Clock, desc: "Structured shift-to-shift knowledge transfer" },
  { label: "Work Order Tracking", href: "/features/work-order-tracking", icon: ClipboardCheck, desc: "Full lifecycle job tracking" },
  { label: "Production Scheduling", href: "/features/production-scheduling", icon: BarChart3, desc: "Capacity planning & scheduling" },
  { label: "Quality Management", href: "/features/quality-management", icon: Shield, desc: "NCRs, inspections & traceability" },
  { label: "AI Planning Assistant", href: "/features/ai-planning-assistant", icon: Cpu, desc: "AI-powered production insights" },
  { label: "Machine Shop Software", href: "/features/machine-shop-software", icon: Cog, desc: "Purpose-built for job shops" },
  { label: "Downtime Tracking", href: "/features/downtime-tracking", icon: Wrench, desc: "Capture & reduce downtime" },
];

export const extensionItems: NavFeatureItem[] = [
  { label: "JobLine G-Code", href: "/features/cnc-operator-tools", icon: Code, desc: "Multi-dialect G-code intelligence for VS Code" },
  { label: "JobLine Machine Connect", href: "/features/cnc-operator-tools", icon: Cable, desc: "DNC connectivity — FTP, serial & network" },
];

export const industryCategories: IndustryCategory[] = [
  {
    heading: "Manufacturing",
    items: [
      "Job Shops",
      "Machine Shops",
      "Aerospace & Defense",
      "Medical Device Manufacturers",
      "Industrial Manufacturing",
      "Automotive Parts",
    ],
  },
  {
    heading: "Process & Specialty",
    items: [
      "Electronics Assembly",
      "Plastics & Rubber",
      "Metal Fabrication",
      "Food & Beverage",
      "Pharma & Life Sciences",
      "Chemical Processing",
    ],
  },
  {
    heading: "Emerging Sectors",
    items: [
      "Renewable Energy",
      "Additive Manufacturing",
      "Semiconductor",
      "EV & Battery",
    ],
  },
];

export const learnItems: NavLinkItem[] = [
  { label: "Manufacturing Guides", href: "/resources/guides", icon: BookOpen },
  { label: "G-Code Reference", href: "/resources/gcode", icon: Code },
  { label: "Industry Glossary", href: "/resources/glossary", icon: BookA },
  { label: "Beginner's Guide", href: "/resources/beginners", icon: GraduationCap },
  { label: "Careers", href: "/resources/careers", icon: Briefcase },
  { label: "Safety & Compliance", href: "/resources/safety", icon: ShieldAlert },
  { label: "Quality & Inspection", href: "/resources/quality", icon: ClipboardCheck },
  { label: "Lean Manufacturing", href: "/resources/lean", icon: TrendingUp },
  { label: "5S Methodology", href: "/resources/5s", icon: LayoutGrid },
  { label: "Kanban & Sorting", href: "/resources/kanban", icon: Kanban },
  { label: "Pioneers", href: "/resources/pioneers", icon: Users },
  { label: "Tool Comparisons", href: "/resources/comparisons", icon: GitCompare },
  { label: "ERP Selection Guide", href: "/resources/erp-guide", icon: FileText },
];

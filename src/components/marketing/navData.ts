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
  HelpCircle,
  Building2,
  Newspaper,
  School,
  type LucideIcon,
} from "lucide-react";

/* ── Shared interfaces ── */

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
  desc?: string;
}

export interface IndustryCategory {
  heading: string;
  items: string[];
}

export interface LearnCategory {
  heading: string;
  items: NavLinkItem[];
}

/* ── Products ── */

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
  { label: "JobLine G-Code", href: "/features/vscode-gcode", icon: Code, desc: "Multi-dialect G-code intelligence for VS Code" },
  { label: "JobLine Machine Connect", href: "/features/machine-connect", icon: Cable, desc: "DNC connectivity — FTP, serial & network" },
];

/* ── Industries ── */

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

/* ── Learn (grouped with descriptions) ── */

export const learnCategories: LearnCategory[] = [
  {
    heading: "Resources",
    items: [
      { label: "Manufacturing Guides", href: "/resources/guides", icon: BookOpen, desc: "Expert insights & documentation" },
      { label: "G-Code Reference", href: "/resources/gcode", icon: Code, desc: "Syntax, cycles & dialect differences" },
      { label: "Industry Glossary", href: "/resources/glossary", icon: BookA, desc: "Key terms & definitions" },
      { label: "ERP Selection Guide", href: "/resources/erp-guide", icon: FileText, desc: "Choose the right ERP for your shop" },
      { label: "Tool Comparisons", href: "/resources/comparisons", icon: GitCompare, desc: "Side-by-side software reviews" },
    ],
  },
  {
    heading: "Training",
    items: [
      { label: "G-Code Academy", href: "/resources/gcode-academy", icon: School, desc: "Interactive CNC training, tests & GD&T" },
      { label: "Operator Acceptance Program (OAP)", href: "/resources/oap", icon: ClipboardCheck, desc: "Employer onboarding & operator certification" },
      { label: "Beginner's Guide", href: "/resources/beginners", icon: GraduationCap, desc: "Get started with manufacturing basics" },
      { label: "Safety & Compliance", href: "/resources/safety", icon: ShieldAlert, desc: "OSHA, lockout/tagout & PPE" },
      { label: "Lean Manufacturing", href: "/resources/lean", icon: TrendingUp, desc: "Eliminate waste & improve flow" },
      { label: "5S Methodology", href: "/resources/5s", icon: LayoutGrid, desc: "Sort, set, shine, standardize, sustain" },
      { label: "Kanban & Sorting", href: "/resources/kanban", icon: Kanban, desc: "Pull systems & visual management" },
      { label: "Quality & Inspection", href: "/resources/quality", icon: ClipboardCheck, desc: "QC processes & measurement techniques" },
    ],
  },
  {
    heading: "Blog",
    items: [
      { label: "Blog", href: "/blog", icon: Newspaper, desc: "Tips, best practices & industry news" },
    ],
  },
];

/* ── Talent ── */

export const talentItems: NavLinkItem[] = [
  { label: "Talent Network", href: "/talent", icon: Users, desc: "Browse certified CNC operators & machinists" },
  { label: "Find Talent", href: "/talent/search", icon: Briefcase, desc: "Search verified operators by skill & cert" },
];

/* ── Flat learnItems for backward compat ── */
export const learnItems: NavLinkItem[] = learnCategories.flatMap((c) => c.items);

/* ── Company ── */

export const companyItems: NavLinkItem[] = [
  { label: "About JobLine", href: "/", icon: Building2, desc: "Our mission & story" },
  { label: "Use Cases", href: "/use-cases", icon: Wrench, desc: "See how shops like yours use JobLine" },
  { label: "Careers", href: "/resources/careers", icon: Briefcase, desc: "Join the team building the future of manufacturing" },
  { label: "Pioneers", href: "/resources/pioneers", icon: Users, desc: "Innovators who shaped modern manufacturing" },
  { label: "Help & Support", href: "/help", icon: HelpCircle, desc: "Documentation, FAQs & contact us" },
];

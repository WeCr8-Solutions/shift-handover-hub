/**
 * Maps OAP role-program verticals to:
 *  - the OAP course slugs most relevant to the trade (so users land on a
 *    populated study plan instead of a generic 12-section list)
 *  - the GCA question-bank topics that pair well with the role
 *  - a friendly hero blurb shown above each vertical's preset cards
 *
 * Verticals come from `oap_role_programs.vertical` (machining, cabinetry,
 * automotive, welding, construction, electrical, plumbing, hvac).
 *
 * Pure data — no Supabase calls. Lookups are O(1) and SSR-safe.
 */

import {
  Wrench,
  Hammer,
  Car,
  Flame,
  HardHat,
  Zap,
  Droplets,
  Wind,
  type LucideIcon,
} from "lucide-react";

export interface ProfessionPreset {
  vertical: string;
  label: string;
  tagline: string;
  icon: LucideIcon;
  /** OAP course slugs (matches `oap_courses.slug`) most relevant first. */
  oapCourseSlugs: string[];
  /** GCA bank topics (matches `gca_question_banks.topic`) to surface. */
  gcaBankTopics: string[];
  /** Optional explicit GCA bank slugs to feature first. */
  featuredGcaBankSlugs?: string[];
  /** Inspection-tool slugs for the inline video card on quick-start. */
  toolSlugs: string[];
  /** Short list of "what you'll learn" bullets (UI fallback content). */
  highlights: string[];
}

/**
 * Universal OAP sections every operator runs regardless of trade.
 * These appear in every preset so the user never sees an empty plan.
 */
const UNIVERSAL_OAP = [
  "orientation",
  "safety-ehs",
  "measurement-inspection",
  "hand-power-tools",
  "loto-energy-control",
];

/**
 * Universal measuring/inspection toolset — every trade needs to read a
 * caliper and a tape. Surfaces inline videos on every preset card.
 */
const UNIVERSAL_TOOLS = [
  "outside-micrometer",
  "vernier-caliper",
  "dial-caliper",
  "digital-caliper",
];

export const PROFESSION_PRESETS: ProfessionPreset[] = [
  {
    vertical: "machining",
    label: "CNC Machining",
    tagline: "Mill, lathe, mill-turn, Swiss, EDM — the full precision-machining stack.",
    icon: Wrench,
    oapCourseSlugs: [
      ...UNIVERSAL_OAP,
      "tooling-preset",
      "machine-qualification",
      "cutting-tools-inserts",
      "workholding-fixturing",
      "print-reading-gdt",
      "floor-certification",
    ],
    gcaBankTopics: [
      "Mill",
      "Lathe",
      "Controls",
      "Machining",
      "Measurement Tools",
      "GD&T",
      "Setup",
      "Tooling",
      "Quality",
      "Safety",
    ],
    toolSlugs: [
      ...UNIVERSAL_TOOLS,
      "depth-micrometer",
      "dial-indicator",
      "test-indicator",
      "dial-bore-gauge",
      "telescoping-gauge",
      "height-gauge-digital",
    ],
    highlights: [
      "Fanuc, Haas, Mazak, Okuma, Siemens controller-specific G-code",
      "Speeds & feeds, surface footage, and coolant strategy",
      "Mentor-graded inspection-tool proficiency tests",
      "GD&T datums, tolerance stacks, and print interpretation",
    ],
  },
  {
    vertical: "cabinetry",
    label: "Cabinetry & Millwork",
    tagline: "From apprentice to master cabinetmaker — CNC routers, edgebanders, finishing.",
    icon: Hammer,
    oapCourseSlugs: [
      ...UNIVERSAL_OAP,
      "tooling-preset",
      "workholding-fixturing",
      "machine-qualification",
      "print-reading-gdt",
    ],
    gcaBankTopics: ["Measurement Tools", "Safety", "Quality", "Setup"],
    featuredGcaBankSlugs: [
      "tool-test-vernier-caliper",
      "tool-test-micrometer",
      "fod-5s-workplace",
      "loto-energy-control",
    ],
    toolSlugs: [
      ...UNIVERSAL_TOOLS,
      "dial-indicator",
      "height-gauge-vernier",
    ],
    highlights: [
      "Sheet-goods nesting, edgeband prep, and cabinet assembly",
      "Reading shop drawings and elevation prints",
      "Power-tool safety — table saw, edgebander, CNC router",
      "Stain, lacquer, and conversion-varnish finishing prep",
    ],
  },
  {
    vertical: "automotive",
    label: "Automotive & Diesel",
    tagline: "Lube tech to ASE master — diagnostics, alignment, EV/hybrid, collision.",
    icon: Car,
    oapCourseSlugs: [
      ...UNIVERSAL_OAP,
      "tooling-preset",
      "machine-qualification",
    ],
    gcaBankTopics: ["Measurement Tools", "Safety", "Quality"],
    featuredGcaBankSlugs: [
      "tool-test-micrometer",
      "tool-test-dial-indicator",
      "tool-test-bore-gage",
      "loto-energy-control",
      "fod-5s-workplace",
    ],
    toolSlugs: [
      ...UNIVERSAL_TOOLS,
      "dial-bore-gauge",
      "depth-micrometer",
      "dial-indicator",
    ],
    highlights: [
      "Brake-rotor and cylinder-bore measurement to spec",
      "Lift, jack, and high-voltage EV lockout/tagout",
      "Multi-point inspection forms and write-ups",
      "Tire wear, alignment-rack geometry, and torque procedures",
    ],
  },
  {
    vertical: "welding",
    label: "Welding & Fabrication",
    tagline: "Tack welder to AWS-certified pipe welder — MIG, TIG, Stick, 6G.",
    icon: Flame,
    oapCourseSlugs: [
      ...UNIVERSAL_OAP,
      "workholding-fixturing",
      "print-reading-gdt",
      "machine-qualification",
    ],
    gcaBankTopics: ["Measurement Tools", "Safety", "Quality"],
    featuredGcaBankSlugs: [
      "tool-test-vernier-caliper",
      "tool-test-height-gage",
      "loto-energy-control",
      "fod-5s-workplace",
      "print-reading-drawing",
    ],
    toolSlugs: [
      ...UNIVERSAL_TOOLS,
      "height-gauge-vernier",
      "height-gauge-digital",
    ],
    highlights: [
      "Weld symbols, joint prep, and AWS D1.1 / D1.5 procedure reading",
      "Hot-work permits, fume control, and PPE selection",
      "Distortion control and post-weld inspection",
      "Fit-up tack welding under journeyman supervision",
    ],
  },
  {
    vertical: "construction",
    label: "Construction Trades",
    tagline: "Carpenters, framers, finishers — site safety, layout, and tool mastery.",
    icon: HardHat,
    oapCourseSlugs: [
      ...UNIVERSAL_OAP,
      "tooling-preset",
      "workholding-fixturing",
    ],
    gcaBankTopics: ["Measurement Tools", "Safety"],
    featuredGcaBankSlugs: [
      "tool-test-vernier-caliper",
      "loto-energy-control",
      "fod-5s-workplace",
    ],
    toolSlugs: UNIVERSAL_TOOLS,
    highlights: [
      "Tape, square, level, and laser-line layout to print",
      "Fall protection, ladder, and scaffold safety",
      "Power-tool inspection and lockout procedures",
      "Material handling and rigging fundamentals",
    ],
  },
  {
    vertical: "electrical",
    label: "Electrical Trades",
    tagline: "Apprentice to master electrician — code, conduit, panels, and PPE.",
    icon: Zap,
    oapCourseSlugs: [
      ...UNIVERSAL_OAP,
      "machine-qualification",
    ],
    gcaBankTopics: ["Measurement Tools", "Safety"],
    featuredGcaBankSlugs: [
      "loto-energy-control",
      "fod-5s-workplace",
      "tool-test-vernier-caliper",
    ],
    toolSlugs: UNIVERSAL_TOOLS,
    highlights: [
      "Lockout-tagout, arc-flash PPE, and energized-work permits",
      "Conduit bending math and panel-schedule reading",
      "Meter and clamp-on amp probe usage",
      "Wire gauge, ampacity, and de-rating fundamentals",
    ],
  },
  {
    vertical: "plumbing",
    label: "Plumbing Trades",
    tagline: "Apprentice to master plumber — pipe, fixtures, gas, and code compliance.",
    icon: Droplets,
    oapCourseSlugs: [
      ...UNIVERSAL_OAP,
      "tooling-preset",
    ],
    gcaBankTopics: ["Measurement Tools", "Safety"],
    featuredGcaBankSlugs: [
      "loto-energy-control",
      "fod-5s-workplace",
      "tool-test-vernier-caliper",
    ],
    toolSlugs: UNIVERSAL_TOOLS,
    highlights: [
      "Pipe sizing, slope, and venting per code",
      "Soldering, brazing, and PEX crimp inspection",
      "Backflow prevention and pressure testing",
      "Confined-space and trench-shoring safety",
    ],
  },
  {
    vertical: "hvac",
    label: "HVAC / Refrigeration",
    tagline: "Apprentice to NATE-certified HVAC tech — refrigerants, controls, ductwork.",
    icon: Wind,
    oapCourseSlugs: [
      ...UNIVERSAL_OAP,
      "machine-qualification",
      "tooling-preset",
    ],
    gcaBankTopics: ["Measurement Tools", "Safety"],
    featuredGcaBankSlugs: [
      "loto-energy-control",
      "fod-5s-workplace",
      "tool-test-micrometer",
    ],
    toolSlugs: UNIVERSAL_TOOLS,
    highlights: [
      "EPA 608 refrigerant handling and recovery",
      "Manometer, manifold gauge, and superheat/subcool readings",
      "Ductwork sizing and static-pressure measurement",
      "Electrical safety on 208/240/480 V systems",
    ],
  },
];

export function getPresetByVertical(vertical: string): ProfessionPreset | undefined {
  return PROFESSION_PRESETS.find((p) => p.vertical === vertical);
}

export const KNOWN_VERTICALS = PROFESSION_PRESETS.map((p) => p.vertical);

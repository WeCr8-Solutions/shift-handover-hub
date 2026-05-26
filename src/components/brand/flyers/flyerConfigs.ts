/**
 * Flyer content configs — extracted from
 *   src/brand-system/_source/src/components/flyer/Flyer*.tsx.txt
 *
 * Keeps content data-driven so a single <BrandFlyer /> renderer covers
 * all 5 variants. Add new flyers by extending FLYER_CONFIGS.
 */

export type FlyerVariant =
  | "oap"
  | "talent-profile"
  | "learn-ai"
  | "gcode-academy"
  | "shop-moving";

export interface FlyerConfig {
  variant: FlyerVariant;
  label: string;
  title: string;
  /** Optional second-line accent tagline */
  tagline?: string;
  bullets: string[];
  italic?: string;
  ctaPrimary: string;
  url: string;
  /** Footer microcopy in caps */
  footer: string;
}

export const FLYER_CONFIGS: Record<FlyerVariant, FlyerConfig> = {
  oap: {
    variant: "oap",
    label: "OAP — Operator Acceptance Program",
    title: "OPERATOR ACCEPTANCE\nPROGRAM (OAP)",
    tagline: "Your skills. Verified.\nYour career. Elevated.",
    bullets: [
      "Earn & track certifications",
      "Mentor guidance",
      "Enterprise qualification paths",
      "Skills verification",
      "Workforce visibility",
    ],
    italic: "Portable. Trusted. Yours.",
    ctaPrimary: "JOIN THE OAP TODAY",
    url: "https://jobline.ai/oap",
    footer: "REAL SKILLS. REAL VERIFICATION. REAL OPPORTUNITIES.",
  },
  "talent-profile": {
    variant: "talent-profile",
    label: "Talent Profile",
    title: "OWN YOUR\nTALENT PROFILE",
    tagline: "Get found. Get hired.\nGet recognized.",
    bullets: [
      "Public profile at jobline.ai/talent/yourname",
      "Verified work history & certs",
      "Direct messaging from employers",
      "Showcase shop floor skills",
      "Free for operators",
    ],
    italic: "Your career, on your terms.",
    ctaPrimary: "CLAIM YOUR PROFILE",
    url: "https://jobline.ai/talent",
    footer: "BUILT BY OPERATORS, FOR OPERATORS.",
  },
  "learn-ai": {
    variant: "learn-ai",
    label: "Learn AI",
    title: "LEARN AI FOR\nMANUFACTURING",
    tagline: "Practical AI skills\nfor real shops.",
    bullets: [
      "AI for routing & quoting",
      "G-code copilots, demystified",
      "Real shop case studies",
      "Free intro courses",
      "Earn shareable badges",
    ],
    italic: "No fluff. Shop-floor proven.",
    ctaPrimary: "START LEARNING FREE",
    url: "https://jobline.ai/learn",
    footer: "AI THAT EARNS ITS KEEP ON THE FLOOR.",
  },
  "gcode-academy": {
    variant: "gcode-academy",
    label: "G-Code Academy",
    title: "G-CODE\nACADEMY",
    tagline: "Master CNC programming\non your own time.",
    bullets: [
      "10 question banks · 500+ items",
      "Fanuc & Haas dialects",
      "Self-paced practice tests",
      "Free, mobile-friendly",
      "Track your weak spots",
    ],
    italic: "Practice. Test. Repeat. Get sharp.",
    ctaPrimary: "TRY A FREE TEST",
    url: "https://jobline.ai/gca",
    footer: "BECAUSE GOOD OPERATORS NEVER STOP LEARNING.",
  },
  "shop-moving": {
    variant: "shop-moving",
    label: "Shop Moving (General)",
    title: "GET THE SHOP\nMOVING",
    tagline: "Digital expeditor &\nsmart shift handoff.",
    bullets: [
      "Replace clipboards with kanban",
      "Frictionless shift handoffs",
      "Live machine + work order status",
      "Free to start, no card required",
      "AS9100 / ISO 9001 ready",
    ],
    italic: "Built for CNC shops, by CNC people.",
    ctaPrimary: "TRY IT FREE",
    url: "https://jobline.ai/start",
    footer: "STOP CHASING. START SHIPPING.",
  },
};

export const FLYER_VARIANTS = Object.keys(FLYER_CONFIGS) as FlyerVariant[];

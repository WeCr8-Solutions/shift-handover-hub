import type { HandbookCategory, HandbookReference, HandbookEntityType } from "@/hooks/useHandbook";

const FALLBACK_CATEGORIES: HandbookCategory[] = [
  {
    id: "hb-cat-materials",
    slug: "materials",
    name: "Materials & Alloys",
    description: "Steel, aluminum, stainless, titanium, plastics — properties and machinability",
    sort_order: 1,
    is_canonical: true,
    organization_id: null,
  },
  {
    id: "hb-cat-feeds-speeds",
    slug: "feeds-speeds",
    name: "Feeds & Speeds",
    description: "Cutting parameters by tool, material, and operation",
    sort_order: 2,
    is_canonical: true,
    organization_id: null,
  },
  {
    id: "hb-cat-threads",
    slug: "threads",
    name: "Threads & Fasteners",
    description: "Unified, metric, pipe, tap drill sizes, and thread classes",
    sort_order: 3,
    is_canonical: true,
    organization_id: null,
  },
  {
    id: "hb-cat-fits-tolerances",
    slug: "fits-tolerances",
    name: "Fits & Tolerances",
    description: "ISO and ANSI fits, hole and shaft tolerances, and surface finish",
    sort_order: 4,
    is_canonical: true,
    organization_id: null,
  },
  {
    id: "hb-cat-gdt",
    slug: "gdt",
    name: "GD&T",
    description: "Geometric dimensioning and tolerancing symbols, datums, and modifiers",
    sort_order: 5,
    is_canonical: true,
    organization_id: null,
  },
  {
    id: "hb-cat-formulas",
    slug: "formulas",
    name: "Formulas & Calculations",
    description: "SFM to RPM, chip load, MRR, taper, and trig for machining",
    sort_order: 6,
    is_canonical: true,
    organization_id: null,
  },
  {
    id: "hb-cat-inspection-measurement",
    slug: "inspection-measurement",
    name: "Inspection & Measurement",
    description: "Reading verniers, micrometers, indicators, and metrology basics",
    sort_order: 7,
    is_canonical: true,
    organization_id: null,
  },
  {
    id: "hb-cat-safety-standards",
    slug: "safety-standards",
    name: "Safety & Standards",
    description: "OSHA, ANSI, AS9100, and ISO 9001 essentials for the floor",
    sort_order: 8,
    is_canonical: true,
    organization_id: null,
  },
];

function ref(params: {
  id: string;
  categorySlug: HandbookCategory["slug"];
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  formula?: string | null;
  units?: string | null;
  source_citation?: string | null;
  source_url?: string | null;
  tags: string[];
  difficulty: string;
}): HandbookReference {
  const category = FALLBACK_CATEGORIES.find((item) => item.slug === params.categorySlug);

  return {
    id: params.id,
    category_id: category?.id ?? "",
    created_at: "2026-04-23T00:00:00.000Z",
    slug: params.slug,
    title: params.title,
    summary: params.summary,
    body_md: params.body_md,
    formula: params.formula ?? null,
    units: params.units ?? null,
    source_citation: params.source_citation ?? null,
    source_url: params.source_url ?? null,
    tags: params.tags,
    difficulty: params.difficulty,
    is_canonical: true,
    organization_id: null,
    updated_at: "2026-04-23T00:00:00.000Z",
    category,
  };
}

const FALLBACK_REFERENCES: HandbookReference[] = [
  ref({
    id: "hb-ref-sfm-to-rpm",
    categorySlug: "feeds-speeds",
    slug: "sfm-to-rpm",
    title: "SFM to RPM Conversion",
    summary: "Convert surface feet per minute to spindle RPM for a given cutter diameter.",
    body_md:
      "## SFM to RPM\n\nSurface speed is the linear speed at the cutting edge. Spindle speed depends on tool or workpiece diameter.\n\n### Core formula\n`RPM = (3.82 × SFM) / D_inches`\n\n### Practical use\n- Pick SFM from the material chart.\n- Plug in the cutter diameter.\n- Round to the nearest safe spindle speed.\n\n### Example\n4140 steel, 0.500 in end mill, 100 SFM:\n`RPM = (3.82 × 100) / 0.500 = 764 RPM`",
    formula: "RPM = (3.82 × SFM) / D_inches",
    units: "inch",
    source_citation: "Machinery's Handbook, 31st ed., Speeds and Feeds",
    tags: ["milling", "turning", "feeds-speeds", "formula"],
    difficulty: "beginner",
  }),
  ref({
    id: "hb-ref-feed-per-tooth",
    categorySlug: "feeds-speeds",
    slug: "feed-per-tooth",
    title: "Feed per Tooth (Chip Load)",
    summary: "Calculate feedrate from RPM, flute count, and chip load.",
    body_md:
      "## Feed per Tooth\n\nChip load is the amount of material each flute removes per revolution. Too little feed causes rubbing and heat. Too much feed risks tool breakage.\n\n### Formula\n`IPM = RPM × Z × IPT`\n\n### Typical 1/2 in carbide end mill chip loads\n- Aluminum: 0.005 to 0.012 in/tooth\n- Mild steel: 0.003 to 0.006 in/tooth\n- Stainless: 0.004 to 0.007 in/tooth\n- Titanium: 0.002 to 0.004 in/tooth",
    formula: "IPM = RPM × Z × IPT",
    units: "in/min",
    source_citation: "Machinery's Handbook, 31st ed., Milling Feed Rates",
    tags: ["formula", "chipload", "feedrate"],
    difficulty: "beginner",
  }),
  ref({
    id: "hb-ref-mrr-formula",
    categorySlug: "formulas",
    slug: "mrr-formula",
    title: "Material Removal Rate (MRR)",
    summary: "Volumetric material removal rate for milling operations.",
    body_md:
      "## Material Removal Rate\n\nMRR estimates how much material is being removed per minute. It is useful for cycle-time planning and horsepower estimation.\n\n### Formula\n`MRR = WOC × DOC × IPM`\n\nWhere:\n- WOC = width of cut\n- DOC = depth of cut\n- IPM = feedrate\n\n### Why it matters\nHigher MRR can improve throughput, but only if spindle power, rigidity, and tool life stay in range.",
    formula: "MRR = WOC × DOC × IPM",
    units: "in³/min",
    source_citation: "Machinery's Handbook, 31st ed., Power Constants",
    tags: ["formula", "mrr", "horsepower", "planning"],
    difficulty: "intermediate",
  }),
  ref({
    id: "hb-ref-turning-sfm",
    categorySlug: "feeds-speeds",
    slug: "turning-sfm",
    title: "Turning Surface Speed",
    summary: "Baseline SFM ranges for common turning materials.",
    body_md:
      "## Turning Surface Speed\n\nUse the workpiece diameter rather than tool diameter when converting turning SFM to RPM.\n\n### Formula\n`RPM = (SFM × 12) / (π × D_workpiece)`\n\n### Typical carbide ranges\n- 1018 steel: 400 roughing, 600 finishing\n- 4140 annealed: 300 roughing, 500 finishing\n- 304 stainless: 250 roughing, 400 finishing\n- 6061 aluminum: 800 roughing, 1500 finishing",
    formula: "RPM = (SFM × 12) / (π × D_workpiece)",
    units: "inch",
    source_citation: "Machinery's Handbook, 31st ed., Turning",
    tags: ["turning", "sfm", "lathe"],
    difficulty: "intermediate",
  }),
  ref({
    id: "hb-ref-aluminum-6061-t6",
    categorySlug: "materials",
    slug: "aluminum-6061-t6",
    title: "Aluminum 6061-T6",
    summary: "General-purpose structural aluminum with excellent machinability.",
    body_md:
      "## 6061-T6 Overview\n\n6061-T6 is a common general-purpose aluminum alloy with strong machinability and wide shop availability.\n\n### Typical guidance\n- HSS: 250 to 400 SFM\n- Carbide: 600 to 1200 SFM\n- Use sharp tools and good chip evacuation\n- Flood or mist coolant helps prevent chip welding",
    units: "SFM",
    source_citation: "Machinery's Handbook, 31st ed., Materials",
    tags: ["aluminum", "6061", "machinability"],
    difficulty: "beginner",
  }),
  ref({
    id: "hb-ref-steel-4140",
    categorySlug: "materials",
    slug: "steel-4140",
    title: "Alloy Steel 4140",
    summary: "Chromoly steel commonly machined annealed or pre-hard.",
    body_md:
      "## 4140 Overview\n\n4140 is common in shafts, fixtures, and high-strength machine components. Pre-hard stock requires lower cutting speeds than annealed stock.\n\n### Typical carbide guidance\n- Annealed: 300 to 500 SFM\n- Pre-hard around 30 HRC: 200 to 350 SFM\n\nReduce speed further when rigidity or tool overhang is poor.",
    units: "SFM",
    source_citation: "Machinery's Handbook, 31st ed., Materials",
    tags: ["steel", "4140", "alloy"],
    difficulty: "intermediate",
  }),
  ref({
    id: "hb-ref-stainless-304",
    categorySlug: "materials",
    slug: "stainless-304",
    title: "Stainless Steel 304",
    summary: "Austenitic stainless that work-hardens and demands positive feed.",
    body_md:
      "## 304 Stainless Overview\n\n304 work-hardens quickly. Keep the cut engaged and avoid dwelling.\n\n### Typical carbide guidance\n- 200 to 350 SFM\n\n### Shop-floor notes\n- Use sharp positive-rake tools\n- Maintain chip load\n- Apply flood coolant\n- Do not let the tool rub in one spot",
    units: "SFM",
    source_citation: "Machinery's Handbook, 31st ed., Materials",
    tags: ["stainless", "304", "work-hardening"],
    difficulty: "intermediate",
  }),
  ref({
    id: "hb-ref-tap-drill-un",
    categorySlug: "threads",
    slug: "tap-drill-un",
    title: "UN Tap Drill Chart",
    summary: "Tap drill sizes for common Unified inch threads at about 75 percent thread.",
    body_md:
      "## Unified Tap Drill Reference\n\n### Common UNC sizes\n- #6-32 → #36 (.106 in)\n- #8-32 → #29 (.136 in)\n- #10-24 → #25 (.1495 in)\n- 1/4-20 → #7 (.201 in)\n- 5/16-18 → F (.257 in)\n- 3/8-16 → 5/16 in\n- 1/2-13 → 27/64 in\n\n### Rule of thumb\n`Tap Drill ≈ Major Diameter − (1.0825 / TPI)`",
    formula: "Tap Drill = Major Dia − (1.0825 / TPI)",
    units: "inch",
    source_citation: "Machinery's Handbook, 31st ed., Threads",
    tags: ["tap", "drill", "UNC", "UNF"],
    difficulty: "beginner",
  }),
  ref({
    id: "hb-ref-tap-drill-metric",
    categorySlug: "threads",
    slug: "tap-drill-metric",
    title: "Metric Tap Drill Chart",
    summary: "Tap drill sizes for standard ISO metric coarse threads.",
    body_md:
      "## Metric Tap Drill Reference\n\n### Common coarse sizes\n- M3 × 0.5 → 2.5 mm\n- M4 × 0.7 → 3.3 mm\n- M5 × 0.8 → 4.2 mm\n- M6 × 1.0 → 5.0 mm\n- M8 × 1.25 → 6.8 mm\n- M10 × 1.5 → 8.5 mm\n- M12 × 1.75 → 10.2 mm\n\n### Rule of thumb\n`Tap Drill (mm) = Major Diameter − Pitch`",
    formula: "Tap Drill (mm) = Major Diameter − Pitch",
    units: "mm",
    source_citation: "Machinery's Handbook, 31st ed., Threads",
    tags: ["tap", "drill", "metric", "ISO"],
    difficulty: "beginner",
  }),
  ref({
    id: "hb-ref-npt-pipe-thread",
    categorySlug: "threads",
    slug: "npt-pipe-thread",
    title: "NPT Pipe Threads",
    summary: "National Pipe Taper basics, taper geometry, and common tap drills.",
    body_md:
      "## NPT Pipe Threads\n\nNPT threads are tapered and seal by deformation. Always verify the correct drill and use a sealant appropriate to the service.\n\n### Common sizes\n- 1/8-27 → R drill (.339 in)\n- 1/4-18 → 7/16 in\n- 3/8-18 → 37/64 in\n- 1/2-14 → 23/32 in",
    units: "inch",
    source_citation: "Machinery's Handbook, 31st ed., Pipe Threads",
    tags: ["NPT", "pipe", "tapered"],
    difficulty: "intermediate",
  }),
  ref({
    id: "hb-ref-thread-pitch-basics",
    categorySlug: "threads",
    slug: "thread-pitch-basics",
    title: "Thread Pitch Basics",
    summary: "Understand TPI, pitch, and common Unified thread classes.",
    body_md:
      "## Thread Pitch Basics\n\nThread pitch is the distance from one thread crest to the next. In Unified inch threads, the usual shop-floor value is TPI, or threads per inch.\n\n### Quick conversions\n- `Pitch = 1 / TPI` for inch threads\n- Fine threads give more threads engaged per inch\n- Coarse threads are usually better for fast assembly and softer materials\n\n### Common classes\n- 2A and 2B: standard general-purpose fit\n- 3A and 3B: tighter precision fit",
    formula: "Pitch = 1 / TPI",
    units: "inch",
    source_citation: "Machinery's Handbook, 31st ed., Threads",
    tags: ["thread", "pitch", "TPI", "class-of-fit"],
    difficulty: "beginner",
  }),
  ref({
    id: "hb-ref-iso-fits-h7-g6",
    categorySlug: "fits-tolerances",
    slug: "iso-fits-h7-g6",
    title: "ISO Fit H7/g6",
    summary: "A common precision sliding clearance fit for shafts and holes.",
    body_md:
      "## H7/g6 Sliding Fit\n\nH7/g6 is widely used when parts need controlled clearance and smooth motion. It is appropriate for shaft and bore combinations that must slide or rotate freely without excessive looseness.\n\n### Use cases\n- Bushed guides\n- Slip-fit locating features\n- Precision sliding assemblies",
    units: "metric",
    source_citation: "ISO 286-1; Machinery's Handbook, 31st ed.",
    tags: ["ISO", "fits", "H7", "g6", "sliding"],
    difficulty: "intermediate",
  }),
  ref({
    id: "hb-ref-gdt-position",
    categorySlug: "gdt",
    slug: "gdt-position",
    title: "Position Tolerance",
    summary: "The most common GD&T control for locating a feature relative to datums.",
    body_md:
      "## Position Tolerance\n\nPosition controls the allowed variation in the location of a feature of size relative to datum references. When MMC is used, bonus tolerance is available as the feature departs from MMC.\n\n### Remember\n- Position is usually applied to holes and pin features\n- The tolerance zone is often cylindrical\n- Datum order matters",
    source_citation: "ASME Y14.5-2018",
    tags: ["gdt", "position", "MMC"],
    difficulty: "intermediate",
  }),
  ref({
    id: "hb-ref-micrometer-use",
    categorySlug: "inspection-measurement",
    slug: "micrometer-use",
    title: "Micrometer Technique",
    summary: "Use an outside micrometer consistently and read the sleeve and thimble correctly.",
    body_md:
      "## Micrometer Technique\n\n### Best practice sequence\n1. Check zero before use\n2. Clean the spindle, anvil, and part\n3. Use the ratchet or friction thimble for consistent force\n4. Keep the spindle square to the work\n5. Read the sleeve, then the thimble, then the vernier if present\n\n### Notes\n- Standard resolution is 0.001 in\n- Vernier micrometers can resolve to 0.0001 in",
    units: "inch or mm",
    source_citation: "Machinery's Handbook, 31st ed., Measuring Instruments",
    tags: ["micrometer", "inspection", "measurement"],
    difficulty: "beginner",
  }),
  ref({
    id: "hb-ref-caliper-use",
    categorySlug: "inspection-measurement",
    slug: "caliper-use",
    title: "Caliper Technique",
    summary: "Use vernier, dial, and digital calipers with the right expectations for accuracy.",
    body_md:
      "## Caliper Technique\n\nCalipers are versatile layout and inspection tools, but they are not a replacement for a micrometer when tighter accuracy is required.\n\n### Best practices\n- Zero the tool before measuring\n- Use light contact pressure\n- Keep jaws clean and burr free\n- Verify against a known standard\n\n### Shop rule\nUse a micrometer when the job truly needs higher-confidence external measurement.",
    units: "inch or mm",
    source_citation: "Machinery's Handbook, 31st ed., Measuring Instruments",
    tags: ["caliper", "inspection", "measurement"],
    difficulty: "beginner",
  }),
  ref({
    id: "hb-ref-lockout-tagout",
    categorySlug: "safety-standards",
    slug: "lockout-tagout",
    title: "Lockout / Tagout (LOTO)",
    summary: "Energy-isolation basics for servicing and maintaining shop equipment.",
    body_md:
      "## Lockout / Tagout\n\n### Standard sequence\n1. Prepare for shutdown\n2. Shut the equipment down\n3. Isolate all energy sources\n4. Apply locks and tags\n5. Verify zero-energy state\n6. Perform the work\n\nZero-energy verification is the step that operators skip at their own risk. Always try to start after isolation to confirm the machine cannot energize.",
    source_citation: "OSHA 29 CFR 1910.147",
    tags: ["safety", "LOTO", "OSHA"],
    difficulty: "beginner",
  }),
];

const FALLBACK_REFERENCE_BY_SLUG = new Map(FALLBACK_REFERENCES.map((item) => [item.slug, item]));
const FALLBACK_REFERENCE_BY_ID = new Map(FALLBACK_REFERENCES.map((item) => [item.id, item]));

const FALLBACK_LINKS: Array<{
  entityType: HandbookEntityType;
  entityKey: string;
  referenceSlug: string;
  sortOrder: number;
}> = [
  { entityType: "operator_tool", entityKey: "sfm-calculator", referenceSlug: "sfm-to-rpm", sortOrder: 1 },
  { entityType: "operator_tool", entityKey: "sfm-calculator", referenceSlug: "feed-per-tooth", sortOrder: 2 },
  { entityType: "operator_tool", entityKey: "sfm-calculator", referenceSlug: "turning-sfm", sortOrder: 3 },
  { entityType: "operator_tool", entityKey: "sfm-calculator", referenceSlug: "aluminum-6061-t6", sortOrder: 4 },
  { entityType: "operator_tool", entityKey: "sfm-calculator", referenceSlug: "steel-4140", sortOrder: 5 },
  { entityType: "operator_tool", entityKey: "sfm-calculator", referenceSlug: "stainless-304", sortOrder: 6 },
  { entityType: "operator_tool", entityKey: "mrr-calculator", referenceSlug: "mrr-formula", sortOrder: 1 },
  { entityType: "operator_tool", entityKey: "mrr-calculator", referenceSlug: "feed-per-tooth", sortOrder: 2 },
  { entityType: "operator_tool", entityKey: "mrr-calculator", referenceSlug: "sfm-to-rpm", sortOrder: 3 },
  { entityType: "operator_tool", entityKey: "tap-drill-chart", referenceSlug: "tap-drill-un", sortOrder: 1 },
  { entityType: "operator_tool", entityKey: "tap-drill-chart", referenceSlug: "tap-drill-metric", sortOrder: 2 },
  { entityType: "operator_tool", entityKey: "tap-drill-chart", referenceSlug: "npt-pipe-thread", sortOrder: 3 },
  { entityType: "operator_tool", entityKey: "thread-calculator", referenceSlug: "thread-pitch-basics", sortOrder: 1 },
  { entityType: "operator_tool", entityKey: "thread-calculator", referenceSlug: "tap-drill-un", sortOrder: 2 },
  { entityType: "operator_tool", entityKey: "thread-calculator", referenceSlug: "tap-drill-metric", sortOrder: 3 },
  { entityType: "operator_tool", entityKey: "tolerance-calculator", referenceSlug: "iso-fits-h7-g6", sortOrder: 1 },
  { entityType: "operator_tool", entityKey: "math-calculator", referenceSlug: "gdt-position", sortOrder: 1 },
  { entityType: "operator_tool", entityKey: "speed_feed_calculator", referenceSlug: "sfm-to-rpm", sortOrder: 1 },
  { entityType: "operator_tool", entityKey: "speed_feed_calculator", referenceSlug: "feed-per-tooth", sortOrder: 2 },
  { entityType: "operator_tool", entityKey: "speed_feed_calculator", referenceSlug: "mrr-formula", sortOrder: 3 },
  { entityType: "operator_tool", entityKey: "speed_feed_calculator", referenceSlug: "turning-sfm", sortOrder: 4 },
  { entityType: "operator_tool", entityKey: "thread_selection", referenceSlug: "tap-drill-un", sortOrder: 1 },
  { entityType: "operator_tool", entityKey: "thread_selection", referenceSlug: "tap-drill-metric", sortOrder: 2 },
  { entityType: "operator_tool", entityKey: "thread_selection", referenceSlug: "npt-pipe-thread", sortOrder: 3 },
];

export const OPERATOR_TOOL_KEY_ALIASES: Record<string, string[]> = {
  "sfm-calculator": ["speed_feed_calculator"],
  "mrr-calculator": ["speed_feed_calculator"],
  "tap-drill-chart": ["thread_selection"],
  "thread-calculator": ["thread_selection"],
};

export function getFallbackHandbookCategories() {
  return FALLBACK_CATEGORIES;
}

export function getFallbackHandbookReferences(filters?: {
  categorySlug?: string;
  tag?: string;
  search?: string;
}) {
  const needle = filters?.search?.trim().toLowerCase();

  return FALLBACK_REFERENCES.filter((item) => {
    if (filters?.categorySlug && item.category?.slug !== filters.categorySlug) return false;
    if (filters?.tag && !item.tags.includes(filters.tag)) return false;
    if (needle) {
      const haystack = [item.title, item.summary ?? "", item.formula ?? "", item.tags.join(" ")]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }).sort((left, right) => left.title.localeCompare(right.title));
}

export function getFallbackHandbookReference(slugOrId: string | undefined) {
  if (!slugOrId) return null;
  return FALLBACK_REFERENCE_BY_ID.get(slugOrId) ?? FALLBACK_REFERENCE_BY_SLUG.get(slugOrId) ?? null;
}

export function getFallbackHandbookLinks(entityType: HandbookEntityType, entityIdOrKey: string | undefined) {
  if (!entityIdOrKey) return [];
  const keys = [entityIdOrKey, ...(entityType === "operator_tool" ? OPERATOR_TOOL_KEY_ALIASES[entityIdOrKey] ?? [] : [])];

  return FALLBACK_LINKS
    .filter((item) => item.entityType === entityType && keys.includes(item.entityKey))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => FALLBACK_REFERENCE_BY_SLUG.get(item.referenceSlug))
    .filter((item): item is HandbookReference => Boolean(item));
}
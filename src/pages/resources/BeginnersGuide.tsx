import { useState, useMemo, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Wrench,
  Shield,
  Gauge,
  Factory,
  ClipboardCheck,
  HardHat,
  Ruler,
  Layers,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "beginners-guide-progress";

const categories = ["All", "Fundamentals", "Environment", "Processes", "Skills", "Quality", "Materials", "Safety", "Workflow", "Lean", "CNC", "Tooling", "Standards", "Metrics"] as const;

const sections = [
  {
    id: "what-is-manufacturing",
    title: "What Is Manufacturing?",
    icon: Factory,
    category: "Fundamentals",
    body: "Manufacturing is the process of converting raw materials into finished products through machining, forming, assembly, or additive processes. Modern manufacturing spans CNC machining, injection molding, sheet metal fabrication, welding, 3D printing, and electronics assembly. Understanding the basics — material flow, process steps, and quality requirements — is essential before stepping onto any shop floor.",
  },
  {
    id: "understanding-shop-floor",
    title: "Understanding the Shop Floor",
    icon: HardHat,
    category: "Environment",
    body: "The shop floor is where production happens. It's organized into work centers or stations — each with specific machines, tooling, and operators. Common areas include raw material storage, machining cells, inspection stations, assembly lines, and shipping docks. Familiarize yourself with floor layouts, safety zones, emergency exits, and material flow paths before your first shift.",
  },
  {
    id: "common-processes",
    title: "Common Manufacturing Processes",
    icon: Wrench,
    category: "Processes",
    body: "CNC Milling removes material using rotating cutters controlled by G-code programs. CNC Turning shapes cylindrical parts on a lathe. Grinding achieves tight tolerances and surface finishes. Welding joins metals using MIG, TIG, or stick methods. Sheet metal fabrication includes laser cutting, bending, and punching. Each process has unique safety requirements, tooling, and quality considerations.",
  },
  {
    id: "reading-drawings",
    title: "Reading Engineering Drawings",
    icon: Ruler,
    category: "Skills",
    body: "Engineering drawings (blueprints) communicate exact specifications: dimensions, tolerances, material callouts, surface finishes, and GD&T (Geometric Dimensioning and Tolerancing) symbols. Learn to read title blocks, interpret dimension lines, understand tolerance stacks, and recognize common GD&T symbols like position (⌖), flatness (⏥), and concentricity. This skill is foundational for every manufacturing role.",
  },
  {
    id: "quality-basics",
    title: "Quality Basics: Inspection & Measurement",
    icon: ClipboardCheck,
    category: "Quality",
    body: "Quality assurance ensures parts meet specifications. Common measurement tools include calipers (±0.001\"), micrometers (±0.0001\"), height gauges, bore gauges, and CMMs (Coordinate Measuring Machines). Learn the difference between precision and accuracy, understand gage R&R studies, and know when to use go/no-go gauges vs. variable measurement. First Article Inspection (FAI) validates the first part in a production run.",
  },
  {
    id: "material-basics",
    title: "Material Basics",
    icon: Layers,
    category: "Materials",
    body: "Common materials include aluminum alloys (6061, 7075), steels (4140, 304 stainless, 17-4PH), titanium (Ti-6Al-4V), plastics (Delrin, PEEK, nylon), and composites. Each has different machinability, strength, corrosion resistance, and cost. Material certifications (mill certs) trace material origin and properties. ITAR-controlled materials require special handling and documentation.",
  },
  {
    id: "safety-essentials",
    title: "Shop Floor Safety Essentials",
    icon: AlertTriangle,
    category: "Safety",
    body: "Manufacturing environments involve rotating machinery, sharp edges, hot surfaces, coolants, and chips. Always wear required PPE: safety glasses, steel-toed boots, hearing protection, and gloves as appropriate. Never reach into running machines. Know lockout/tagout (LOTO) procedures. Understand SDS (Safety Data Sheets) for chemicals. Report near-misses — they prevent real accidents.",
  },
  {
    id: "work-orders",
    title: "Understanding Work Orders",
    icon: ClipboardCheck,
    category: "Workflow",
    body: "A work order is the instruction set for producing parts. It specifies part number, revision, quantity, material, routing (sequence of operations), due date, and customer requirements. Routing steps define which work center performs each operation. Traveler documents accompany parts through production, collecting operator sign-offs, inspection data, and timestamps at each step.",
  },
  {
    id: "lean-5s",
    title: "Lean Manufacturing & 5S",
    icon: BarChart3,
    category: "Lean",
    body: "Lean manufacturing eliminates waste (muda) in seven categories: overproduction, waiting, transport, overprocessing, inventory, motion, and defects. 5S is the foundation: Sort (remove unnecessary items), Set in Order (organize), Shine (clean), Standardize (create procedures), Sustain (maintain discipline). Start with 5S at your workstation — it's the most visible improvement you can make as a beginner.",
  },
  {
    id: "cnc-basics",
    title: "CNC Basics: G-Code & M-Code",
    icon: Settings,
    category: "CNC",
    body: "CNC machines run programs written in G-code (geometry/motion commands) and M-code (machine functions). Key G-codes: G00 (rapid move), G01 (linear feed), G02/G03 (arcs), G28 (home), G41/G42 (cutter comp). Key M-codes: M03/M04 (spindle on), M05 (spindle stop), M06 (tool change), M08/M09 (coolant on/off). Understanding these codes helps you troubleshoot programs and communicate with programmers.",
  },
  {
    id: "tooling-fundamentals",
    title: "Tooling Fundamentals",
    icon: Wrench,
    category: "Tooling",
    body: "Cutting tools include end mills, drills, reamers, taps, inserts, and boring bars. Tool materials range from HSS (High Speed Steel) to carbide, ceramic, and CBN. Key concepts: feeds and speeds (SFM, IPR, chipload), tool wear indicators, tool life management, and tool offset adjustments. Proper tooling selection directly impacts part quality, cycle time, and cost.",
  },
  {
    id: "quality-standards",
    title: "Quality Standards: ISO 9001 & AS9100",
    icon: Shield,
    category: "Standards",
    body: "ISO 9001 is the baseline quality management system (QMS) standard. AS9100 adds aerospace-specific requirements including traceability, configuration management, risk assessment, and first article inspection per AS9102. ITAR compliance governs defense-related manufacturing. Understanding these standards helps you work in regulated environments and know why documentation and traceability matter.",
  },
  {
    id: "key-metrics",
    title: "Key Metrics: OEE, Cycle Time & Takt Time",
    icon: Gauge,
    category: "Metrics",
    body: "OEE (Overall Equipment Effectiveness) = Availability × Performance × Quality. It measures how effectively equipment is used. Cycle time is how long one part takes. Takt time = available production time ÷ customer demand — it sets the pace. Scrap rate, first-pass yield, and on-time delivery are other critical KPIs. Learning to track and improve these metrics is how you advance in manufacturing.",
  },
];

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}
function saveProgress(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export default function BeginnersGuide() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [completed, setCompleted] = useState<Set<string>>(() => loadProgress());

  const toggleComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setCompleted(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sections.filter((s) => {
      const matchesCategory = activeCategory === "All" || s.category === activeCategory;
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.body.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const progressPercent = Math.round((completed.size / sections.length) * 100);
  const usedCategories = useMemo(() => {
    const cats = new Set(sections.map((s) => s.category));
    return ["All", ...Array.from(cats)] as string[];
  }, []);

  return (
    <>
      <SEOHead
        title="Beginner's Guide to Manufacturing — Learn Shop Floor Basics | JobLine.ai"
        description="Free beginner's guide to manufacturing: CNC basics, blueprint reading, quality inspection, shop floor safety, lean manufacturing, work orders, tooling, and essential metrics for new machinists and operators."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">For New Operators & Students</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Beginner's Guide to Manufacturing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know before your first day on the shop floor. Check off topics as you learn them.
            </p>
          </div>

          {/* Progress bar */}
          <Card className="mb-6">
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{completed.size} of {sections.length} topics completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
                  {completed.size > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={resetProgress}>
                      <RotateCcw className="w-3 h-3" /> Reset
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {usedCategories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <AdPlacement format="horizontal" className="mb-6" />

          {/* Accordion content */}
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No topics match your search.</p>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {filtered.map((section) => {
                const Icon = section.icon;
                const isDone = completed.has(section.id);
                return (
                  <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-4 gap-3">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{section.title}</span>
                            <Badge variant="outline" className="text-[10px]">{section.category}</Badge>
                            {isDone && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-muted-foreground leading-relaxed text-sm mb-4">{section.body}</p>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Checkbox
                          id={`check-${section.id}`}
                          checked={isDone}
                          onCheckedChange={() => toggleComplete(section.id)}
                        />
                        <label htmlFor={`check-${section.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                          Mark as completed
                        </label>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          <AdPlacement format="rectangle" className="mt-12" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}

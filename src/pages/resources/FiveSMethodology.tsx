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
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollAwareAccordion } from "@/components/ScrollAwareAccordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Trash2,
  LayoutGrid,
  Sparkles,
  ClipboardCheck,
  RefreshCcw,
  Eye,
  Ruler,
  Camera,
  Star,
  Target,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "five-s-progress";

const categories = ["All", "Sort", "Set in Order", "Shine", "Standardize", "Sustain", "Auditing", "Visual Management", "Implementation", "Advanced"] as const;

const sections = [
  {
    id: "sort-seiri",
    title: "Sort (Seiri) — Remove the Unnecessary",
    icon: Trash2,
    category: "Sort",
    body: "Sort is the first S — separate needed items from unneeded items and remove everything that doesn't belong. Use the Red Tag system: attach red tags to questionable items with date, description, reason, and disposition (move, dispose, recycle). Create a Red Tag holding area where tagged items wait 30 days for owners to claim them. Decision criteria: Has it been used in the last 30 days? Is it needed for current production? Is there a duplicate? After sorting, workstations should contain ONLY the tools, materials, gauges, and documents needed for current operations. Typical first-time sort removes 30-50% of items from a workstation.",
  },
  {
    id: "set-in-order-seiton",
    title: "Set in Order (Seiton) — A Place for Everything",
    icon: LayoutGrid,
    category: "Set in Order",
    body: "Set in Order organizes remaining items so anyone can find and return them instantly. Principles: (1) Frequency of use determines location — daily items within arm's reach, weekly items in the area, monthly items in storage. (2) Shadow boards outline each tool's shape so missing items are visible at a glance. (3) Label everything — shelves, drawers, bins, cables, and pipes. (4) Address system — aisle numbers, rack positions, and shelf locations (e.g., A3-R2-S4). (5) FIFO racks for consumables — load from the back, use from the front. (6) Angled tool holders, magnetic strips, and foam cutouts keep items secure. The test: can a new operator find any item within 30 seconds without asking?",
  },
  {
    id: "shine-seiso",
    title: "Shine (Seiso) — Clean and Inspect",
    icon: Sparkles,
    category: "Shine",
    body: "Shine goes beyond cleaning — it's inspection disguised as cleaning. When you clean a machine, you discover leaks, cracks, loose bolts, worn belts, and abnormal vibrations. Daily shine routine: (1) Sweep floors and remove chips/debris. (2) Wipe down machine surfaces, control panels, and safety glass. (3) Check fluid levels (coolant, hydraulic, lubricant). (4) Inspect guards, covers, and safety devices. (5) Empty chip bins and coolant trays. (6) Clean measurement instruments and return to proper storage. Assign shine zones — every square foot of the shop floor has an owner. Create 5-minute daily cleaning checklists specific to each workstation. 'Cleaning IS inspection' is the core Shine philosophy.",
  },
  {
    id: "standardize-seiketsu",
    title: "Standardize (Seiketsu) — Make It Repeatable",
    icon: ClipboardCheck,
    category: "Standardize",
    body: "Standardize creates visual standards and procedures that make the first 3S sustainable. Tools: (1) 5S Station Standards — laminated photos showing the ideal state of each workstation, posted at eye level. (2) Color-coding systems — floor markings (yellow for walkways, white for workstations, red for defect/scrap areas, green for finished goods, blue for raw material). (3) Standard cleaning schedules with responsible persons, frequencies, and methods. (4) Visual min/max indicators on supply bins. (5) One-point lessons (OPLs) — single-page illustrated instructions for specific tasks. (6) Standardized toolbox layouts across similar workstations. Without standardization, the workplace will regress to its pre-5S state within weeks.",
  },
  {
    id: "sustain-shitsuke",
    title: "Sustain (Shitsuke) — Build the Habit",
    icon: RefreshCcw,
    category: "Sustain",
    body: "Sustain is the hardest S — it requires discipline, leadership commitment, and cultural change. Sustain practices: (1) Weekly 5S audits with scoring (see Auditing section). (2) Management gemba walks specifically reviewing 5S. (3) Before/after photos displayed on team boards. (4) 5S competitions between departments or shifts. (5) Recognition programs — '5S Area of the Month.' (6) New employee orientation includes 5S training. (7) 5S is part of performance reviews. (8) Daily 5-minute 5S time built into shift schedules. The key insight: 5S is not a project — it's a daily practice. Leadership must model the behavior. If managers walk past a dirty machine without commenting, operators learn that 5S doesn't matter.",
  },
  {
    id: "audit-scoring",
    title: "5S Audit Checklists & Scoring",
    icon: BarChart3,
    category: "Auditing",
    body: "5S audits objectively measure workplace organization. Scoring: rate each S from 0-5 (0=not implemented, 1=very poor, 2=poor, 3=average, 4=good, 5=excellent) for a maximum of 25 points. Audit frequency: weekly for new implementations, monthly for mature areas. Audit questions per S — Sort: Are unnecessary items present? Set: Can items be found in 30 seconds? Shine: Is the area clean? Are abnormalities visible? Standardize: Are visual standards posted and current? Sustain: Are audits happening on schedule? Are scores trending up? Post scores publicly on team boards. Track trends over time — declining scores signal a sustain problem. Cross-functional auditors (not auditing their own area) provide objectivity.",
  },
  {
    id: "red-tag-system",
    title: "Red Tag System — Detailed Process",
    icon: Target,
    category: "Sort",
    body: "The Red Tag system is the primary tool for Sort. Red tag information: item description, category (tools, equipment, materials, documents, personal items), quantity, reason tagged (unnecessary, unknown owner, broken, excess), date tagged, tagged by, and disposition (move, store, dispose, recycle, return). Process: (1) Set a Red Tag event date — dedicate 2-4 hours. (2) Walk through the target area systematically. (3) Tag everything questionable — when in doubt, tag it. (4) Move tagged items to the Red Tag holding area. (5) Notify item owners via posted list. (6) After 30 days: unclaimed items are disposed/recycled. (7) Document value recovered (scrapped tools, freed floor space). Typical results: 10-20% floor space recovered, $5K-$50K in recovered or scrapped inventory.",
  },
  {
    id: "floor-marking",
    title: "Floor Marking Standards",
    icon: Ruler,
    category: "Visual Management",
    body: "Floor markings create visual boundaries and traffic flow. Industry-standard colors: Yellow — walkways, aisles, traffic lanes (2-4\" wide). White — workstation boundaries, equipment locations. Red — defect/scrap/reject areas, fire equipment locations. Green — finished goods, shipping areas. Blue — raw material storage, incoming inspection. Orange — inspection/measurement stations, hold areas. Black/white hatching — areas to keep clear (electrical panels, fire exits, eye wash stations). Tape vs. paint: tape is faster to apply but wears; epoxy paint lasts longer in high-traffic areas. Standard aisle width: 4 feet pedestrian, 8-12 feet forklift. Mark equipment 'home positions' so movement is immediately visible.",
  },
  {
    id: "visual-controls",
    title: "Visual Management & Andon Systems",
    icon: Eye,
    category: "Visual Management",
    body: "Visual management makes normal vs. abnormal instantly visible to anyone. Levels of visual management: (1) Share information — production boards, schedules, KPIs. (2) Share standards — photos of correct states, color-coded zones. (3) Build standards into the workplace — shadow boards, min/max lines, FIFO lanes. (4) Alert to abnormalities — andon lights (green=running, yellow=attention needed, red=stopped), alarm sounds. (5) Prevent abnormalities — poka-yoke devices, interlocks. Andon systems empower operators to signal problems immediately. Toyota's principle: 'Make problems visible.' If you can't see the problem, you can't fix it. Every workstation should have a visual way to signal normal/abnormal status.",
  },
  {
    id: "before-after-documentation",
    title: "Before/After Documentation",
    icon: Camera,
    category: "Implementation",
    body: "Before/after photos are the most powerful tool for building 5S momentum. Documentation process: (1) Before the 5S event, photograph every angle of the target area — wide shots and close-ups. (2) Include timestamps and area identifiers. (3) After implementing changes, photograph from the EXACT same angles. (4) Create side-by-side comparison displays. (5) Post on team boards, include in management presentations, and share in company newsletters. Photo tips: same lighting, same camera position (mark floor positions), include people for scale. Before/after displays serve three purposes: celebrate team achievement, set expectations for other areas, and provide sustain motivation when standards slip.",
  },
  {
    id: "5s-implementation-roadmap",
    title: "5S Implementation Roadmap",
    icon: Lightbulb,
    category: "Implementation",
    body: "Phase 1 (Week 1-2): Leadership commitment — train management, select pilot area, assign champion. Phase 2 (Week 3-4): Training — educate all employees on 5S concepts, visit benchmark facilities. Phase 3 (Week 5-6): Sort event — conduct Red Tag event in pilot area. Phase 4 (Week 7-8): Set in Order — organize, label, create shadow boards. Phase 5 (Week 9-10): Shine — deep clean, create daily cleaning routines. Phase 6 (Week 11-12): Standardize — photograph ideal states, create standards, install visual controls. Phase 7 (Ongoing): Sustain — begin weekly audits, recognition program, expand to next area. Timeline: pilot area in 12 weeks, full facility in 6-12 months depending on size. Budget: $500-$2,000 per workstation (labels, shadow boards, floor marking, storage).",
  },
  {
    id: "5s-safety-connection",
    title: "5S and Safety Integration",
    icon: Star,
    category: "Advanced",
    body: "Some organizations practice 6S — adding Safety as the sixth S. Safety integration: Sort removes tripping hazards and unstable stacking. Set in Order ensures emergency equipment is accessible and marked. Shine identifies safety hazards (oil leaks = slip hazards, frayed cords = electrical hazards). Standardize includes safety markings (fire exits, electrical panels, eyewash stations). Sustain ensures safety standards are maintained daily. Specific safety-5S connections: proper storage of chemicals (SDS accessibility), clear emergency egress paths, machine guard inspection during Shine, PPE storage locations during Set in Order. Track safety incidents alongside 5S scores — organizations typically see 40-60% reduction in recordable incidents within the first year of 5S implementation.",
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

export default function FiveSMethodology() {
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
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
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
        title="5S Methodology Guide — Sort, Set, Shine, Standardize, Sustain | JobLine.ai"
        description="Free interactive 5S methodology guide: Sort (Seiri), Set in Order (Seiton), Shine (Seiso), Standardize (Seiketsu), Sustain (Shitsuke), red tag systems, floor marking, visual management, and audit checklists."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />
        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Workplace Organization</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">5S Methodology Guide</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Master the 5S system — Sort, Set in Order, Shine, Standardize, Sustain. Includes red tag processes, floor marking standards, visual management, and audit scoring.
            </p>
          </div>

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

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search 5S topics…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {usedCategories.map((cat) => (
              <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setActiveCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>

          <AdPlacement format="horizontal" className="mb-6" />

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No topics match your search.</p>
          ) : (
            <ScrollAwareAccordion className="space-y-3">
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
                        <Checkbox id={`check-${section.id}`} checked={isDone} onCheckedChange={() => toggleComplete(section.id)} />
                        <label htmlFor={`check-${section.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">Mark as completed</label>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </ScrollAwareAccordion>
          )}

          <AdPlacement format="rectangle" className="mt-12" />
        </main>
        <MarketingFooter />
      </div>
    </>
  );
}

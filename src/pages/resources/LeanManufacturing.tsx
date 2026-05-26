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
  Layers,
  TrendingUp,
  BarChart3,
  Target,
  Workflow,
  Timer,
  RefreshCcw,
  ClipboardCheck,
  Users,
  Lightbulb,
  Kanban,
  Gauge,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "lean-manufacturing-progress";

const categories = ["All", "Foundation", "Waste Elimination", "Flow", "Problem Solving", "Metrics", "Culture", "Tools", "Six Sigma", "TPM"] as const;

const sections = [
  {
    id: "lean-principles",
    title: "The 5 Lean Principles",
    icon: Layers,
    category: "Foundation",
    body: "Lean manufacturing, derived from the Toyota Production System (TPS), is built on five core principles: (1) Define Value — from the customer's perspective, not the producer's. (2) Map the Value Stream — identify every step and eliminate non-value-adding activities. (3) Create Flow — ensure value-creating steps occur in tight sequence without interruptions. (4) Establish Pull — produce only what the customer needs, when they need it. (5) Pursue Perfection — continuously improve toward zero waste. These principles apply to any manufacturing environment, from job shops to high-volume production lines.",
  },
  {
    id: "seven-wastes",
    title: "The 7 Wastes (Muda) + 1",
    icon: Target,
    category: "Waste Elimination",
    body: "The original seven wastes (TIMWOOD): (1) Transport — unnecessary movement of materials between processes. (2) Inventory — excess WIP, raw materials, or finished goods tying up capital. (3) Motion — unnecessary movement of people (walking, reaching, bending). (4) Waiting — idle time waiting for materials, information, equipment, or approvals. (5) Overproduction — making more than needed or before it's needed (the worst waste). (6) Overprocessing — doing more work than the customer requires. (7) Defects — scrap, rework, and warranty claims. The 8th waste: underutilized talent — not leveraging workers' skills, ideas, and experience.",
  },
  {
    id: "five-s",
    title: "5S Workplace Organization",
    icon: ClipboardCheck,
    category: "Foundation",
    body: "5S creates organized, efficient, and safe workspaces: (1) Sort (Seiri) — remove unnecessary items; red-tag anything not needed daily. (2) Set in Order (Seiton) — organize remaining items with designated locations; shadow boards for tools, labeled storage, and floor markings. (3) Shine (Seiso) — clean everything and inspect during cleaning; cleaning IS inspection. (4) Standardize (Seiketsu) — create visual standards, checklists, and schedules for the first 3S. (5) Sustain (Shitsuke) — audit regularly (weekly 5S scores), recognize good practices, and embed 5S into daily routines. Start 5S at your own workstation — it's the most visible improvement you can make.",
  },
  {
    id: "value-stream-mapping",
    title: "Value Stream Mapping (VSM)",
    icon: Workflow,
    category: "Flow",
    body: "Value Stream Mapping visualizes the entire flow of material and information from supplier to customer. Current-state maps capture: process steps (cycle time, changeover time, uptime), inventory triangles (WIP between steps), information flow (schedules, kanban signals), and timeline (value-added time vs. lead time). Typical finding: value-added time is <5% of total lead time. Future-state maps define improvement targets: supermarkets (pull systems), FIFO lanes, continuous flow cells, leveled scheduling (heijunka), and kaizen bursts at bottlenecks. VSM is a team activity — walk the actual process (gemba walk) with operators, supervisors, and support functions.",
  },
  {
    id: "kanban-pull",
    title: "Kanban & Pull Systems",
    icon: Kanban,
    category: "Flow",
    body: "Kanban (\"signboard\" in Japanese) is a pull-based scheduling system that limits WIP and controls material flow. Types: production kanban (signals to produce), withdrawal kanban (signals to move), and supplier kanban (signals to deliver). Physical kanban: cards, bins, squares on the floor, or empty spaces on a shelf. Digital kanban: electronic signals in MES/ERP systems. Kanban rules: (1) Downstream pulls from upstream, (2) Produce only what is withdrawn, (3) Do not send defects downstream, (4) Number of kanbans should decrease over time. Calculate kanban quantity: K = (D × L × (1 + S)) / C, where D = demand, L = lead time, S = safety factor, C = container quantity.",
  },
  {
    id: "kaizen-events",
    title: "Kaizen Events & Continuous Improvement",
    icon: Lightbulb,
    category: "Culture",
    body: "Kaizen means \"change for the better\" — small, incremental improvements by everyone, every day. Kaizen events (blitzes) are focused 3-5 day improvement workshops targeting a specific process or area. Structure: (Day 1) Train, observe current state, collect data. (Day 2) Analyze root causes, brainstorm solutions. (Day 3-4) Implement changes — move equipment, create standard work, build fixtures. (Day 5) Validate results, document new standard, present to leadership. Daily kaizen: suggestion systems where operators submit small improvement ideas. Track kaizen ideas submitted, implemented, and resulting savings. A3 thinking provides a structured problem-solving format on one sheet of paper.",
  },
  {
    id: "standard-work",
    title: "Standard Work & Work Instructions",
    icon: ClipboardCheck,
    category: "Tools",
    body: "Standard work documents the current best-known method for performing a task. Three elements: (1) Takt time — the pace of customer demand. (2) Work sequence — the specific order of steps an operator performs. (3) Standard WIP — the minimum inventory needed to maintain flow. Standard work combination sheets show the relationship between manual work, machine time, and walking. Work instructions provide step-by-step detail with photos, key points, and reasons why. Standard work is NOT fixed forever — it's the baseline from which to improve. When an operator finds a better method, update the standard. Without standard work, you cannot distinguish normal from abnormal.",
  },
  {
    id: "smed",
    title: "SMED — Quick Changeover",
    icon: Timer,
    category: "Tools",
    body: "Single-Minute Exchange of Die (SMED) reduces changeover/setup time to under 10 minutes. Developed by Shigeo Shingo at Toyota. Four stages: (1) Observe and record the current changeover. (2) Separate internal (machine stopped) from external (machine running) activities. (3) Convert internal to external — pre-stage tools, fixtures, and materials while the machine runs. (4) Streamline remaining internal activities — quick-change fixtures, standardized connections, elimination of adjustments. Common techniques: color-coded tooling, intermediate jigs, parallel operations (two people), and one-turn/one-motion fasteners. A 2-hour changeover reduced to 10 minutes allows smaller batch sizes, lower inventory, and more flexibility.",
  },
  {
    id: "tpm",
    title: "Total Productive Maintenance (TPM)",
    icon: RefreshCcw,
    category: "TPM",
    body: "TPM aims for zero breakdowns, zero defects, and zero accidents through operator-driven maintenance. Eight pillars: (1) Autonomous Maintenance — operators perform daily cleaning, lubrication, and inspection. (2) Planned Maintenance — scheduled preventive/predictive maintenance. (3) Quality Maintenance — prevent defects caused by equipment condition. (4) Focused Improvement — cross-functional teams tackle chronic losses. (5) Early Equipment Management — design for maintainability. (6) Training & Education. (7) Safety, Health & Environment. (8) TPM in Administration. Start with autonomous maintenance: operators create cleaning and inspection checklists, identify abnormalities (leaks, vibration, loose bolts), and restore equipment to baseline condition.",
  },
  {
    id: "oee-deep-dive",
    title: "OEE — Overall Equipment Effectiveness",
    icon: Gauge,
    category: "Metrics",
    body: "OEE = Availability × Performance × Quality. Availability = (Run Time / Planned Production Time) — accounts for unplanned stops and changeovers. Performance = (Ideal Cycle Time × Total Count) / Run Time — accounts for slow cycles and small stops. Quality = Good Count / Total Count — accounts for scrap and rework. World-class OEE: 85%+ (Availability 90% × Performance 95% × Quality 99.9%). The six big losses: (1) Equipment failure, (2) Setup/adjustment, (3) Idling/minor stops, (4) Reduced speed, (5) Process defects, (6) Reduced yield (startup losses). Track OEE by machine, shift, and product. Focus improvement on the lowest of the three factors — that's your biggest opportunity.",
  },
  {
    id: "six-sigma-dmaic",
    title: "Six Sigma & DMAIC",
    icon: BarChart3,
    category: "Six Sigma",
    body: "Six Sigma aims for 3.4 defects per million opportunities (DPMO) using data-driven problem solving. DMAIC: (D) Define — project charter, VOC (Voice of Customer), SIPOC. (M) Measure — data collection plan, Gage R&R, process capability baseline. (A) Analyze — root cause analysis using fishbone, 5 Whys, hypothesis testing, regression, DOE. (I) Improve — generate solutions, pilot, optimize with DOE, mistake-proofing (poka-yoke). (C) Control — control plan, control charts, updated standard work, handoff to process owner. Belt system: Yellow Belt (awareness), Green Belt (part-time projects), Black Belt (full-time improvement leader), Master Black Belt (mentor/trainer). Lean Six Sigma combines waste elimination with variation reduction.",
  },
  {
    id: "poka-yoke",
    title: "Poka-Yoke (Mistake-Proofing)",
    icon: Target,
    category: "Tools",
    body: "Poka-yoke devices prevent errors from becoming defects. Three approaches: (1) Contact method — physical shapes that prevent incorrect assembly (asymmetric pins, keyed connectors, guide pins). (2) Fixed-value method — alerts when a specific number of actions isn't completed (torque wrenches, counting fixtures, part-present sensors). (3) Motion-step method — ensures steps are performed in correct sequence (interlocks, light-guided assembly). Classification: prevention (makes the error impossible) vs. detection (catches the error before it reaches the next process). Examples: USB-C connectors (reversible = mistake-proof), fixture pins that only accept correctly oriented parts, and barcode verification before packaging.",
  },
  {
    id: "gemba-walks",
    title: "Gemba Walks & Visual Management",
    icon: Users,
    category: "Culture",
    body: "Gemba (\"the real place\") walks bring leaders to where value is created. Purpose: observe actual work, ask questions, show respect, and identify improvement opportunities. Gemba walk etiquette: go to see (observe, don't audit), ask why (understand, don't blame), show respect (listen to operators), and follow up (act on what you learn). Visual management makes status instantly visible: andon lights (green/yellow/red machine status), production tracking boards (plan vs. actual), KPI dashboards, floor markings, shadow boards, and kanban squares. The goal: any abnormal condition should be visible within 5 seconds to anyone walking through the area.",
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

export default function LeanManufacturing() {
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
        title="Lean Manufacturing Toolkit — 5S, Kaizen, Six Sigma, TPM | JobLine.ai"
        description="Free interactive lean manufacturing guide: 5S, value stream mapping, kanban, kaizen, SMED, TPM, OEE, Six Sigma DMAIC, poka-yoke, and gemba walks for continuous improvement teams."
        canonical="/resources/lean"
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Continuous Improvement</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Lean Manufacturing Toolkit
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Master lean principles, tools, and techniques — from 5S and kanban to Six Sigma and TPM. Track your learning journey.
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
            <Input placeholder="Search lean topics…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                        <label htmlFor={`check-${section.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                          Mark as completed
                        </label>
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

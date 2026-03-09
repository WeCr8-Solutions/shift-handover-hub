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
  Kanban,
  ArrowRightLeft,
  Layers,
  Timer,
  BarChart3,
  Workflow,
  Package,
  ListOrdered,
  Target,
  Boxes,
  GitBranch,
  Shuffle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "kanban-sorting-progress";

const categories = ["All", "Kanban", "FIFO", "Sequencing", "Material Flow", "Pull Systems", "Leveling", "WIP Control", "Prioritization", "Visual Signals", "Advanced"] as const;

const sections = [
  {
    id: "kanban-fundamentals",
    title: "Kanban System Fundamentals",
    icon: Kanban,
    category: "Kanban",
    body: "Kanban ('signboard' in Japanese) is a pull-based scheduling and inventory control system developed by Taiichi Ohno at Toyota in the 1950s. Core rules: (1) Each container of parts has a kanban card attached. (2) The downstream process withdraws parts from the upstream process only when needed. (3) The upstream process produces only the quantity withdrawn. (4) No parts are produced or moved without a kanban. (5) Defective parts are never sent to the next process. (6) The number of kanbans is reduced over time to expose and solve problems. Kanban limits work-in-process (WIP), surfaces bottlenecks, and synchronizes production to actual demand rather than forecasts.",
  },
  {
    id: "kanban-types",
    title: "Types of Kanban Cards & Signals",
    icon: Layers,
    category: "Kanban",
    body: "Production Kanban — authorizes a work center to produce a specific quantity of a specific part. Withdrawal Kanban (Conveyance Kanban) — authorizes movement of parts from a supermarket to the downstream process. Supplier Kanban — signals an external supplier to deliver parts. Signal Kanban (Triangle Kanban) — used for batch processes; triggers production when inventory drops to a reorder point. Express Kanban — issued temporarily when unexpected demand occurs. Physical forms: printed cards in vinyl sleeves, colored bins (two-bin system), empty squares on the floor, golf balls in tubes, electronic signals (e-kanban) in MES systems. Each kanban must specify: part number, quantity, source location, destination, and container type.",
  },
  {
    id: "two-bin-system",
    title: "Two-Bin System (Dual Kanban)",
    icon: Boxes,
    category: "Pull Systems",
    body: "The two-bin system is the simplest kanban implementation. Two identical containers hold the same part. Operators draw from Bin A until empty, then switch to Bin B. The empty Bin A is sent to the supplier/upstream process as a replenishment signal. When Bin A returns full, the cycle repeats. Bin quantity calculation: Q = (D × L × (1 + S)) where D = average daily demand, L = replenishment lead time in days, S = safety factor (typically 0.1-0.5). Best for: C-class items (fasteners, hardware, consumables), items with steady demand, and low-value high-volume parts. Advantages: no computer system needed, visual and self-regulating, minimal training required. Color-code bins by part family for easy identification.",
  },
  {
    id: "fifo-lanes",
    title: "FIFO Lanes & Sequential Flow",
    icon: ListOrdered,
    category: "FIFO",
    body: "FIFO (First In, First Out) lanes ensure parts are processed in the order they arrive, preventing cherry-picking and maintaining traceability. Physical implementation: gravity roller conveyors, inclined shelving, or marked floor lanes. Load from one end, withdraw from the other. FIFO lane capacity = buffer between processes, typically sized for 1-4 hours of production. FIFO vs. Supermarket: use FIFO when products flow in sequence without mixing (one-piece flow ideal); use supermarkets when downstream processes consume different products at different rates. FIFO lane rules: (1) Maximum quantity is marked — when full, upstream MUST stop (prevents overproduction). (2) Sequence must never be broken. (3) Empty lane signals upstream to produce. Critical for traceability in aerospace (AS9100) and automotive (IATF 16949).",
  },
  {
    id: "supermarket-system",
    title: "Supermarket Pull Systems",
    icon: Package,
    category: "Pull Systems",
    body: "A supermarket is a controlled inventory point between processes where each product has a defined storage location and a set maximum quantity. Named after American grocery stores that inspired Taiichi Ohno. How it works: downstream process 'shops' for what it needs from the supermarket. The withdrawal triggers a production kanban to the upstream process to replenish what was taken. Supermarket sizing: calculate for each SKU based on demand variability, replenishment lead time, and service level target. Shelf organization: fixed locations, labeled with part number, min/max quantities, and kanban card holders. Supermarkets are placed at points where continuous flow is not possible — typically before and after batch processes (heat treat, plating, painting). Visual management: green/yellow/red zones indicate stock levels at a glance.",
  },
  {
    id: "heijunka-leveling",
    title: "Heijunka — Production Leveling",
    icon: BarChart3,
    category: "Leveling",
    body: "Heijunka levels both volume and product mix over a time period to create smooth, predictable production. Without leveling: Monday = 500 Part A, Tuesday = 300 Part B, Wednesday = 200 Part C. With leveling: each day = 100A + 60B + 40C, repeated. The heijunka box is a physical scheduling device — a grid with time slots (rows) and product types (columns). Kanban cards are placed in slots to sequence production. Benefits: reduces inventory, smooths supplier demand, levels workforce loading, and exposes process problems. Prerequisite: SMED (quick changeover) — you can only level mix if changeovers are fast. Pitch = takt time × pack quantity — the time interval for withdrawal from the pacemaker process. Start with volume leveling, then progress to mix leveling as changeover times decrease.",
  },
  {
    id: "wip-limits",
    title: "WIP Limits & Bottleneck Management",
    icon: Timer,
    category: "WIP Control",
    body: "Work-In-Process (WIP) limits cap the amount of work at each stage. Little's Law: Lead Time = WIP ÷ Throughput. Reducing WIP directly reduces lead time. Setting WIP limits: start with current WIP levels, then systematically reduce. When a WIP limit is hit, the upstream process MUST stop — this signals a problem that needs to be solved, not worked around. Theory of Constraints (TOC): identify the bottleneck (the process with the lowest throughput), exploit it (never let it sit idle), subordinate everything to it (don't overproduce elsewhere), elevate it (add capacity if needed), repeat. Drum-Buffer-Rope: the bottleneck sets the pace (drum), a time buffer protects it, and a rope ties material release to the bottleneck's consumption rate. Visualize WIP with kanban boards, queue columns, or physical lane markings.",
  },
  {
    id: "abc-analysis",
    title: "ABC Analysis & Pareto Classification",
    icon: Target,
    category: "Prioritization",
    body: "ABC analysis classifies inventory by value and consumption to prioritize management effort. Based on the Pareto principle (80/20 rule). Class A: ~20% of items representing ~80% of annual dollar usage — tight control, frequent counting, precise forecasting, kanban or JIT replenishment. Class B: ~30% of items representing ~15% of dollar usage — moderate control, periodic review, two-bin systems. Class C: ~50% of items representing ~5% of dollar usage — simple controls, large safety stocks, visual reorder systems. XYZ analysis adds demand variability: X = steady demand (easy to forecast), Y = variable demand, Z = sporadic/unpredictable demand. Combine ABC-XYZ for a 9-cell matrix: AX items get kanban, CZ items get min/max with generous buffers. Review classifications quarterly — demand patterns shift.",
  },
  {
    id: "milk-run",
    title: "Milk Run & Material Delivery Routes",
    icon: ArrowRightLeft,
    category: "Material Flow",
    body: "A milk run is a fixed-route, fixed-schedule material delivery system — like a dairy truck making regular stops. Instead of each workstation calling for parts individually (taxi model), a material handler follows a predetermined route at set intervals (every 30-60 minutes). At each stop: deliver replenished bins, pick up empty bins (kanban signals), deliver work orders/documents, and pick up completed work. Route design: sequence stops to minimize travel, size the tugger/cart for one route's load, time the route to fit within the pitch interval. Benefits: predictable material flow, reduced operator walking (operators stay at machines), consolidated trips reduce forklift traffic, and standardized timing helps identify delivery problems. Material handlers become the 'pulse' of the production system.",
  },
  {
    id: "priority-sequencing",
    title: "Priority Sequencing Rules",
    icon: Shuffle,
    category: "Sequencing",
    body: "Sequencing rules determine the order jobs are processed at a workstation. Common rules: FIFO (First In First Out) — fairest, simplest, maintains flow. SPT (Shortest Processing Time) — minimizes average wait time and WIP, but long jobs may be starved. EDD (Earliest Due Date) — minimizes maximum lateness, good for on-time delivery focus. CR (Critical Ratio = time remaining ÷ work remaining) — CR < 1.0 means the job is behind schedule. Weighted priority: combines due date, customer priority, and production value. In practice, most lean facilities use FIFO as the default with expedite override capability for genuine emergencies. Excessive expediting signals a systemic scheduling problem. Track expedite frequency as a KPI — world-class shops expedite < 5% of orders.",
  },
  {
    id: "conwip",
    title: "CONWIP — Constant WIP Systems",
    icon: GitBranch,
    category: "WIP Control",
    body: "CONWIP (Constant Work-In-Process) is a hybrid pull system that maintains a fixed number of jobs in the system regardless of mix. How it works: a CONWIP card is attached to a job when it enters the line. When the job exits, the card returns to the beginning and authorizes the next job's release. Unlike kanban (which controls WIP at each station), CONWIP controls total system WIP. Advantages over kanban: simpler for high-mix environments (fewer card types), naturally handles routing variations, and works well when product routings differ. CONWIP quantity = target throughput × target lead time (Little's Law). Start with current WIP, then reduce cards one at a time, solving problems as they surface. CONWIP is especially effective in job shops and machine shops where product mix varies daily.",
  },
  {
    id: "visual-scheduling",
    title: "Visual Scheduling Boards",
    icon: Workflow,
    category: "Visual Signals",
    body: "Visual scheduling boards make production status visible to everyone without computer access. Types: (1) T-card boards — cards in slots represent jobs at each work center; move cards as jobs progress. (2) Magnetic whiteboards — color-coded magnets for different product families or priorities. (3) Heijunka boxes — time-slotted boards for leveled scheduling. (4) Dispatch boards — jobs listed by work center with status columns (waiting, in-process, complete). (5) Digital andon displays — large screens showing real-time queue depth, cycle status, and KPIs. Information to display: job number, part number, quantity, due date, current operation, and status (on-time = green, at-risk = yellow, late = red). Update frequency: real-time for digital, every pitch interval for physical boards. The board should answer: 'What should I work on next?' within 5 seconds.",
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

export default function KanbanSortingTechniques() {
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
        title="Kanban & Sorting Techniques — Pull Systems, FIFO, WIP Control | JobLine.ai"
        description="Free interactive guide to kanban systems, FIFO lanes, supermarket pull systems, heijunka leveling, WIP limits, ABC analysis, CONWIP, milk runs, and priority sequencing for manufacturing."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />
        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Material Flow & Scheduling</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Kanban & Sorting Techniques</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Master pull systems, material flow techniques, and job sequencing — from kanban cards and FIFO lanes to heijunka leveling and CONWIP.
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
            <Input placeholder="Search kanban & sorting topics…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
            </Accordion>
          )}

          <AdPlacement format="rectangle" className="mt-12" />
        </main>
        <MarketingFooter />
      </div>
    </>
  );
}

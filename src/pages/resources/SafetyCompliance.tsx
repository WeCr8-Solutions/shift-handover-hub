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
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  Flame,
  HardHat,
  Zap,
  Wind,
  FileText,
  HeartPulse,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "safety-compliance-progress";

const categories = ["All", "PPE", "Lockout/Tagout", "Chemical", "Fire", "Electrical", "Ergonomics", "Respiratory", "Documentation", "Emergency", "Machine Guarding", "Confined Space", "Fall Protection"] as const;

const sections = [
  {
    id: "ppe-requirements",
    title: "Personal Protective Equipment (PPE)",
    icon: HardHat,
    category: "PPE",
    body: "PPE is your last line of defense against workplace hazards. Required PPE in manufacturing typically includes safety glasses (ANSI Z87.1), steel-toed boots (ASTM F2413), hearing protection (when noise exceeds 85 dB), cut-resistant gloves (ANSI A4+), and face shields for grinding operations. Employers must provide PPE at no cost, ensure proper fit, and train workers on correct use. Inspect PPE before every shift — cracked lenses, worn soles, and degraded hearing protection must be replaced immediately.",
  },
  {
    id: "lockout-tagout",
    title: "Lockout/Tagout (LOTO) Procedures",
    icon: Lock,
    category: "Lockout/Tagout",
    body: "LOTO (OSHA 29 CFR 1910.147) prevents unexpected machine startup during maintenance. The six steps: (1) Notify affected employees, (2) Shut down equipment using normal stopping procedure, (3) Isolate all energy sources (electrical, pneumatic, hydraulic, gravity, thermal), (4) Apply locks and tags — each worker applies their own lock, (5) Release stored energy (bleed lines, block elevated parts, discharge capacitors), (6) Verify isolation by attempting to start the machine. Never remove another worker's lock. Annual audits of LOTO procedures are required.",
  },
  {
    id: "sds-chemical-safety",
    title: "SDS & Chemical Hazard Communication",
    icon: Flame,
    category: "Chemical",
    body: "The Hazard Communication Standard (HazCom, 29 CFR 1910.1200) requires Safety Data Sheets (SDS) for every chemical in the workplace. Each SDS has 16 standardized sections covering identification, hazards, composition, first-aid measures, fire-fighting, accidental release, handling/storage, exposure controls, physical/chemical properties, stability/reactivity, toxicology, ecological info, disposal, transport, regulatory info, and other information. Common shop chemicals include cutting fluids, degreasers, solvents, and coolants. Know where your SDS binder is located and how to read GHS pictograms.",
  },
  {
    id: "fire-prevention",
    title: "Fire Prevention & Response",
    icon: Flame,
    category: "Fire",
    body: "Manufacturing fires commonly originate from metal grinding sparks, electrical faults, flammable liquid storage, and hot work (welding/cutting). Know the fire extinguisher classes: Class A (ordinary combustibles), Class B (flammable liquids), Class C (electrical), Class D (combustible metals like magnesium/titanium). Use the PASS technique: Pull the pin, Aim at the base, Squeeze the handle, Sweep side to side. Hot work permits are required for welding/cutting outside designated areas. Keep 35 feet of clearance from combustibles during hot work. Fire exits must never be blocked.",
  },
  {
    id: "electrical-safety",
    title: "Electrical Safety & Arc Flash",
    icon: Zap,
    category: "Electrical",
    body: "Electrical hazards cause approximately 160 workplace fatalities annually. NFPA 70E establishes arc flash protection boundaries and PPE categories. Only qualified electrical workers should perform work on energized equipment. Key rules: de-energize before working, verify zero energy with a rated voltage tester, maintain safe approach distances, use insulated tools, and wear arc-rated PPE within the flash protection boundary. Ground Fault Circuit Interrupters (GFCI) are required for temporary power and wet locations. Report damaged cords, missing covers, and tripped breakers immediately.",
  },
  {
    id: "machine-guarding",
    title: "Machine Guarding (OSHA Standards)",
    icon: Shield,
    category: "Machine Guarding",
    body: "OSHA 29 CFR 1910.212 requires guarding at every point of operation where an employee may be exposed to moving parts, flying chips, or sparks. Guard types include fixed barriers, interlocked guards (machine stops when opened), adjustable guards, and light curtains. The danger zone for rotating parts extends to the point of operation, ingoing nip points, and rotating parts. Never bypass, remove, or defeat a machine guard. If a guard is damaged or missing, stop the machine and report it to your supervisor before continuing work.",
  },
  {
    id: "ergonomics",
    title: "Ergonomics & Injury Prevention",
    icon: HeartPulse,
    category: "Ergonomics",
    body: "Musculoskeletal disorders (MSDs) account for over 30% of manufacturing injuries. Key ergonomic principles: maintain neutral postures, reduce excessive force, minimize repetitive motions, adjust workstation height to elbow level, use anti-fatigue mats, rotate tasks to vary muscle groups, and use mechanical lifting aids for loads over 35 lbs. Symptoms of MSDs include tingling, numbness, stiffness, and reduced grip strength. Early reporting prevents chronic conditions. Job Hazard Analysis (JHA) should evaluate ergonomic risk at each workstation.",
  },
  {
    id: "respiratory-protection",
    title: "Respiratory Protection Program",
    icon: Wind,
    category: "Respiratory",
    body: "OSHA 29 CFR 1910.134 requires respiratory protection when engineering controls cannot reduce airborne contaminants below Permissible Exposure Limits (PELs). Common manufacturing exposures include metal fumes (welding), coolant mist, dust (grinding/sanding), and solvent vapors. Respirator types range from N95 filtering facepieces to half-face and full-face cartridge respirators to supplied-air systems. Annual fit testing (qualitative or quantitative) is mandatory. Medical evaluation is required before respirator assignment. Clean-shaven faces are required for tight-fitting respirators.",
  },
  {
    id: "confined-space",
    title: "Confined Space Entry",
    icon: Eye,
    category: "Confined Space",
    body: "A permit-required confined space (PRCS) has limited entry/exit, is not designed for continuous occupancy, and contains recognized hazards (atmospheric, engulfment, entrapment). Examples in manufacturing: tanks, silos, hoppers, pits, and large machine interiors. Before entry: test atmosphere for oxygen (19.5–23.5%), flammable gases (<10% LEL), and toxic gases (H₂S, CO). Continuous monitoring during occupancy is required. An attendant must be stationed outside. Rescue plans must be established before entry. Never enter to rescue — call trained rescue personnel.",
  },
  {
    id: "fall-protection",
    title: "Fall Protection",
    icon: AlertTriangle,
    category: "Fall Protection",
    body: "Falls are the leading cause of construction deaths and a significant manufacturing hazard. OSHA requires fall protection at 4 feet in general industry (29 CFR 1910.28). Methods include guardrail systems (42\" top rail, 21\" mid rail), safety net systems, and personal fall arrest systems (PFAS) with full-body harnesses. Anchor points must support 5,000 lbs per attached worker. Inspect harnesses before each use — check webbing for cuts, fraying, and chemical damage. D-rings must not be bent or cracked. Ladders must extend 3 feet above landing surfaces.",
  },
  {
    id: "incident-reporting",
    title: "Incident Reporting & Investigation",
    icon: FileText,
    category: "Documentation",
    body: "All incidents, near-misses, and unsafe conditions must be reported immediately. OSHA requires recording injuries/illnesses on Form 300 (Log), Form 300A (Summary), and Form 301 (Individual Report). Severe injuries (hospitalization, amputation, loss of eye) must be reported to OSHA within 24 hours; fatalities within 8 hours. Root cause analysis tools include the 5 Whys, fishbone diagrams, and fault tree analysis. Near-miss reporting is critical — studies show every serious injury is preceded by approximately 300 near-misses. Create a no-blame reporting culture.",
  },
  {
    id: "emergency-action-plan",
    title: "Emergency Action Plans (EAP)",
    icon: HeartPulse,
    category: "Emergency",
    body: "OSHA 29 CFR 1910.38 requires written Emergency Action Plans covering fire, chemical spills, severe weather, active threats, and medical emergencies. Your EAP must include: evacuation procedures and routes, assembly points, methods for reporting emergencies, employee alarm systems, and names of contacts for plan details. Conduct evacuation drills at least annually. Know the location of fire extinguishers, eyewash stations, first aid kits, AEDs, and spill containment kits. Designated employees should be CPR/AED/first-aid trained.",
  },
  {
    id: "osha-rights",
    title: "Your OSHA Rights as a Worker",
    icon: Shield,
    category: "Documentation",
    body: "Under the OSH Act, you have the right to: a safe and healthful workplace, training in a language you understand, information about hazards (SDS, exposure records), access to OSHA injury/illness records, file a confidential complaint with OSHA, participate in inspections, and be free from retaliation for exercising safety rights. Employers cannot fire, demote, or discriminate against workers who report safety concerns. OSHA's whistleblower protection program (Section 11(c)) covers retaliation complaints. File complaints online at osha.gov or call 1-800-321-OSHA.",
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

export default function SafetyCompliance() {
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
        title="Shop Floor Safety & Compliance Guide — OSHA, LOTO, PPE | JobLine.ai"
        description="Free interactive guide to manufacturing safety and compliance: OSHA regulations, lockout/tagout, PPE requirements, chemical safety, machine guarding, ergonomics, and emergency procedures for shop floor workers."
        canonical="/resources/safety"
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Safety First</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Safety & Compliance Guide
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Essential OSHA regulations, hazard prevention, and compliance knowledge every manufacturing worker needs. Track your progress as you learn.
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
            <Input placeholder="Search safety topics…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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

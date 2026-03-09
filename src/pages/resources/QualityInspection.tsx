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
  Ruler,
  Target,
  BarChart3,
  ClipboardCheck,
  Shield,
  Microscope,
  Gauge,
  FileCheck,
  Layers,
  TrendingUp,
  Settings,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "quality-inspection-progress";

const categories = ["All", "Measurement", "GD&T", "SPC", "Inspection", "Standards", "Metrology", "Documentation", "Process Control", "Calibration"] as const;

const sections = [
  {
    id: "precision-measurement",
    title: "Precision Measurement Fundamentals",
    icon: Ruler,
    category: "Measurement",
    body: "Precision measurement is the foundation of quality control. Key instruments: calipers (digital/dial/vernier, ±0.001\"), micrometers (outside, inside, depth — ±0.0001\"), height gauges, bore gauges, pin gauges, and thread gauges. Understand resolution (smallest readable increment), accuracy (closeness to true value), and precision (repeatability). Always zero your instrument, clean the workpiece, measure at consistent temperature (68°F/20°C standard), and take multiple readings. Parallax error affects analog instruments — read at eye level.",
  },
  {
    id: "gdt-basics",
    title: "GD&T Fundamentals",
    icon: Target,
    category: "GD&T",
    body: "Geometric Dimensioning and Tolerancing (ASME Y14.5-2018) communicates allowable geometric variation. The 14 geometric characteristics fall into five categories: Form (flatness ⏥, straightness, circularity, cylindricity), Orientation (perpendicularity ⊥, angularity, parallelism ∥), Location (position ⌖, concentricity, symmetry), Profile (profile of a line, profile of a surface), and Runout (circular runout, total runout). Feature control frames specify the tolerance, datum references, and material condition modifiers (MMC Ⓜ, LMC Ⓛ, RFS). Master datum selection before measurement.",
  },
  {
    id: "cmm-operations",
    title: "CMM Operations & Programming",
    icon: Microscope,
    category: "Metrology",
    body: "Coordinate Measuring Machines (CMMs) provide 3D measurement capability with sub-micron accuracy. Types: bridge (most common), gantry (large parts), horizontal arm, and portable (articulating arms, laser trackers). CMMs use touch-trigger probes (Renishaw TP20/TP200), scanning probes for continuous contact, and non-contact sensors (laser, vision). Programming methods: manual point-to-point, teach/playback, offline with CAD models (PC-DMIS, Calypso, PolyWorks). Alignment sequence: level, rotate, translate. Always qualify the probe stylus before measuring. CMM room temperature should be 68°F ± 1°F.",
  },
  {
    id: "spc-control-charts",
    title: "SPC & Control Charts",
    icon: BarChart3,
    category: "SPC",
    body: "Statistical Process Control uses data to monitor and control manufacturing processes. Key charts: X-bar & R chart (subgroup averages and ranges), X-bar & S chart (averages and standard deviations), Individual & Moving Range (I-MR) chart for low-volume. Control limits (UCL/LCL) are calculated at ±3σ from the process mean — they are NOT specification limits. Out-of-control signals: point beyond control limits, 7+ points on one side of center, 7+ points trending up/down, 2 of 3 points beyond 2σ. Cp measures potential capability; Cpk measures actual capability relative to spec limits. Cpk ≥ 1.33 is typical; aerospace often requires Cpk ≥ 1.67.",
  },
  {
    id: "first-article-inspection",
    title: "First Article Inspection (FAI)",
    icon: FileCheck,
    category: "Inspection",
    body: "First Article Inspection (AS9102 for aerospace) verifies that the production process produces conforming parts before full production begins. FAI requires three forms: Form 1 (Part Number Accountability), Form 2 (Product Accountability — raw material, special processes, functional tests), and Form 3 (Characteristic Accountability — every dimension ballooned and measured). FAI is required for new parts, design changes, process changes, tooling changes, material changes, new suppliers, and after a 2-year production gap. Partial FAI may be acceptable when only specific characteristics are affected by the change.",
  },
  {
    id: "gage-rr",
    title: "Gage R&R Studies",
    icon: Gauge,
    category: "Process Control",
    body: "Gage R&R (Repeatability and Reproducibility) quantifies measurement system variation. Repeatability = variation when the same operator measures the same part repeatedly. Reproducibility = variation between different operators measuring the same parts. Method: AIAG MSA (Measurement Systems Analysis) recommends 10 parts × 3 operators × 3 trials. Results: %GRR < 10% = acceptable, 10-30% = conditionally acceptable, > 30% = unacceptable. Number of distinct categories (ndc) should be ≥ 5. If Gage R&R fails, investigate operator technique, instrument condition, fixture quality, and environmental factors before blaming the process.",
  },
  {
    id: "calibration-management",
    title: "Calibration Management",
    icon: Settings,
    category: "Calibration",
    body: "Calibration ensures measurement instruments provide accurate, traceable results. ISO 17025 governs calibration laboratory requirements. Key concepts: traceability to NIST (National Institute of Standards and Technology), calibration intervals based on usage/criticality/stability, calibration certificates documenting as-found and as-left readings, and gage block sets (Grade 0 for calibration, Grade AS-1 for shop use). Out-of-tolerance (OOT) events require a recall assessment — review all parts measured since last good calibration. Color-coded stickers indicate calibration status: green (current), red (overdue/OOT), yellow (limited use).",
  },
  {
    id: "incoming-inspection",
    title: "Incoming Material Inspection",
    icon: ClipboardCheck,
    category: "Inspection",
    body: "Incoming inspection verifies that raw materials and purchased components meet specifications before entering production. Check material certifications (mill certs) against purchase order requirements: alloy, temper/condition, heat number, mechanical properties (tensile, yield, elongation, hardness). Visual inspection for damage, corrosion, and dimensional conformance. Sampling plans (ANSI/ASQ Z1.4) define AQL-based acceptance criteria. Critical materials may require 100% inspection. Nonconforming material goes into a quarantine area (MRB — Material Review Board) for disposition: use-as-is, rework, return, or scrap.",
  },
  {
    id: "surface-finish",
    title: "Surface Finish Measurement",
    icon: Layers,
    category: "Metrology",
    body: "Surface finish (roughness) affects part function, wear, fatigue life, and sealing capability. Key parameters: Ra (arithmetic average roughness — most common), Rz (average maximum height), Rmax/Rt (maximum peak-to-valley). Measurement: contact profilometers (diamond stylus traverses surface) and non-contact methods (optical, interferometric). Common callouts: 32 Ra µin (general machining), 16 Ra µin (precision), 8 Ra µin (bearing surfaces), 4 Ra µin (sealing surfaces). Surface finish symbols on drawings indicate maximum Ra, lay direction, and machining allowance. Cutoff length (λc) and evaluation length affect readings.",
  },
  {
    id: "nonconformance-management",
    title: "Nonconformance & Corrective Action",
    icon: Shield,
    category: "Documentation",
    body: "Nonconformance Reports (NCRs) document deviations from specifications. Dispositions: use-as-is (with engineering concession), rework (bring into conformance), repair (does not fully meet spec but is acceptable), return to supplier, or scrap. Corrective Action Reports (CARs) address root causes: 8D methodology (D1-Team, D2-Problem Description, D3-Containment, D4-Root Cause, D5-Corrective Action, D6-Implement, D7-Prevent Recurrence, D8-Congratulate). Track COPQ (Cost of Poor Quality) — typically 15-20% of sales revenue in manufacturing. Leading indicators (process capability, audit findings) prevent quality escapes better than lagging indicators (scrap rate, customer returns).",
  },
  {
    id: "audit-readiness",
    title: "Quality Audit Readiness",
    icon: FileCheck,
    category: "Standards",
    body: "Quality audits verify QMS compliance. Types: internal audits (required annually per ISO 9001 clause 9.2), supplier audits, customer audits, and certification body audits (registrar). Prepare by reviewing your quality manual, procedures, work instructions, and records. Common audit findings: incomplete training records, missing calibration certificates, undocumented process changes, outdated controlled documents, and ineffective corrective actions. Auditors follow an audit trail: policy → procedure → work instruction → record → objective evidence. Process approach auditing (clause 4.4) follows inputs → activities → outputs → performance indicators.",
  },
  {
    id: "process-capability",
    title: "Process Capability Analysis",
    icon: TrendingUp,
    category: "Process Control",
    body: "Process capability compares process performance against specification limits. Cp = (USL - LSL) / 6σ measures potential capability (process spread vs. tolerance band). Cpk = min[(USL - x̄) / 3σ, (x̄ - LSL) / 3σ] accounts for centering. Pp and Ppk use overall standard deviation (long-term) vs. within-subgroup (short-term) for Cp/Cpk. Minimum requirements: Cpk ≥ 1.33 (general), ≥ 1.67 (safety/critical features), ≥ 2.0 (Six Sigma target). A minimum of 25 subgroups or 100 individual measurements is needed for reliable capability estimates. Normality testing (Anderson-Darling) should be performed before calculating capability indices.",
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

export default function QualityInspection() {
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
        title="Quality & Inspection Guide — SPC, GD&T, CMM, FAI | JobLine.ai"
        description="Free interactive guide to manufacturing quality and inspection: GD&T, SPC control charts, CMM operations, first article inspection, Gage R&R, calibration, surface finish, and process capability for quality professionals."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">For Quality Professionals</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Quality & Inspection Reference
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Master manufacturing quality — from precision measurement and GD&T to SPC, FAI, and process capability. Track your learning progress.
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
            <Input placeholder="Search quality topics…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
            </Accordion>
          )}

          <AdPlacement format="rectangle" className="mt-12" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}

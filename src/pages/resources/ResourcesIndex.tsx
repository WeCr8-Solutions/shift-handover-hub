import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BookOpen, Code, BookA, ArrowRight, GitCompare, GraduationCap, Briefcase, ShieldAlert, ClipboardCheck, TrendingUp, LayoutGrid, Kanban, Users, FileText, School, Ruler, Gauge, Library } from "lucide-react";

const sections = [
  {
    title: "Manufacturing Guides",
    description: "12 in-depth guides covering shift handoffs, work order management, CNC setup, quality workflows, scheduling, downtime tracking, setup reduction, and production visibility.",
    icon: BookOpen,
    href: "/resources/guides",
    count: "12 guides",
  },
  {
    title: "G-Code & M-Code Reference",
    description: "Complete reference with ~100 G-codes and ~80 M-codes for CNC milling and turning. Covers motion, canned cycles, compensation, coordinate systems, coolant, spindle, automation, and turning-specific codes. Searchable with category tabs.",
    icon: Code,
    href: "/resources/gcode",
    count: "180+ codes",
  },
  {
    title: "G-Code Academy",
    description: "Interactive CNC operator training — lathe and mill lesson tracks across four skill levels (Beginner to Automation), controller-specific tests for Fanuc, Haas, Siemens, and Heidenhain, GD&T certification practice, and a timed interview simulator. Built by machinists, for machinists.",
    icon: School,
    href: "/gcode-academy",
    count: "10 test banks · 4 levels",
  },
  {
    title: "Operator Acceptance Program (OAP)",
    description: "Employer-driven onboarding and certification for CNC operators. Build role-specific programs, assign mentors, run safety + measuring + tooling courses, and issue portable operator certificates. Standalone mode lets anyone earn a self-certified record for interviews.",
    icon: ClipboardCheck,
    href: "/oap",
    count: "12-section flow · portable cert",
  },
  {
    title: "Measuring Tools Library",
    description: "Free, mobile-friendly reference for every CNC measuring tool — calipers, micrometers, indicators, height gauges, bore gauges, gage blocks, CMM and more. Tap any tool for video tutorials, diagrams, typical use cases, and safety notes. Grouped by 13 inspection categories.",
    icon: Ruler,
    href: "/resources/measuring-tools",
    count: "13 categories · 60+ tools",
  },
  {
    title: "Tool Proficiency Tests",
    description: "Mentor-graded measurement proficiency tests with pass/fail tracking, retest scheduling, and printable backup forms. Satisfies AS9100 §7.1.5 inspection-equipment competence. Canonical templates for caliper, micrometer, dial indicator, and height gauge — employers can publish org-specific tests too.",
    icon: Gauge,
    href: "/oap/proficiency",
    count: "4 canonical tests · sign-off",
  },
  {
    title: "Industry Glossary",
    description: "90+ manufacturing terms defined in detail — CNC machining, quality management (ISO 9001, AS9100), lean manufacturing, GD&T, tooling, materials, and production planning. Written for machinists and engineers.",
    icon: BookA,
    href: "/resources/glossary",
    count: "90+ terms",
  },
  {
    title: "Beginner's Guide",
    description: "New to manufacturing? Start here — 13 sections covering shop floor basics, blueprint reading, CNC fundamentals, quality inspection, safety, lean manufacturing, tooling, materials, and essential metrics for new operators and students.",
    icon: GraduationCap,
    href: "/resources/beginners",
    count: "13 sections",
  },
  {
    title: "Manufacturing Careers",
    description: "Explore career paths in CNC machining, quality inspection, manufacturing engineering, production supervision, welding, robotics, and supply chain. Includes salary ranges, required skills, certifications, and advancement paths.",
    icon: Briefcase,
    href: "/resources/careers",
    count: "8 careers",
  },
  {
    title: "Safety & Compliance",
    description: "Interactive guide to OSHA regulations, lockout/tagout, PPE requirements, chemical safety (SDS/HazCom), machine guarding, electrical safety, confined space entry, and emergency procedures.",
    icon: ShieldAlert,
    href: "/resources/safety",
    count: "13 topics",
  },
  {
    title: "Quality & Inspection",
    description: "Deep dive into precision measurement, GD&T, CMM operations, SPC control charts, first article inspection (AS9102), Gage R&R, calibration, surface finish, and process capability analysis.",
    icon: ClipboardCheck,
    href: "/resources/quality",
    count: "12 topics",
  },
  {
    title: "Lean Manufacturing Toolkit",
    description: "Master lean principles, 5S, value stream mapping, kanban, kaizen, SMED quick changeover, TPM, OEE, Six Sigma DMAIC, poka-yoke mistake-proofing, and gemba walks.",
    icon: TrendingUp,
    href: "/resources/lean",
    count: "13 topics",
  },
  {
    title: "5S Methodology",
    description: "Complete 5S guide: Sort (Seiri), Set in Order (Seiton), Shine (Seiso), Standardize (Seiketsu), Sustain (Shitsuke). Includes red tag systems, floor marking standards, visual management, and audit scoring.",
    icon: LayoutGrid,
    href: "/resources/5s",
    count: "12 topics",
  },
  {
    title: "Kanban & Sorting Techniques",
    description: "Pull systems, FIFO lanes, supermarket systems, heijunka leveling, WIP limits, ABC analysis, CONWIP, milk runs, priority sequencing rules, and visual scheduling boards.",
    icon: Kanban,
    href: "/resources/kanban",
    count: "12 topics",
  },
  {
    title: "Industrial & Manufacturing Pioneers",
    description: "25+ visionaries who built modern industry — Carnegie (steel), Rockefeller (oil), Von Braun (space), Ford, Ohno, Deming, Tesla, Edison, Katherine Johnson, and more. Biographies, legacies, and Wikipedia links.",
    icon: Users,
    href: "/resources/pioneers",
    count: "25+ figures",
  },
  {
    title: "Essential Reading",
    description: "Curated book library for every shop role — Machinery's Handbook, CNC Programming Handbook, Toyota Production System, The Goal, Deming, Juran, and more. Filter by profession: operator, machinist, quality, lean, supervisor, engineer, owner.",
    icon: Library,
    href: "/resources/essential-reading",
    count: "19 books · 7 roles",
  },
  {
    title: "Tool Comparisons",
    description: "Side-by-side comparisons of job-shop software approaches: JobLine.ai, generic MES suites, and spreadsheet/whiteboard workflows. Includes practical selection criteria for deployment speed, operator adoption, routing visibility, and quality traceability.",
    icon: GitCompare,
    href: "/resources/comparisons",
    count: "Comparison guide",
  },
  {
    title: "ERP Selection Guide",
    description: "A practical 7-part series covering how to avoid costly selection mistakes, champion a system upgrade, define functionality needs, run discovery calls, build a budget, create an implementation plan, and own your go-live success.",
    icon: FileText,
    href: "/resources/erp-guide",
    count: "7-part series",
  },
];

export default function ResourcesIndex() {
  return (
    <>
      <SEOHead
        title="Manufacturing Resources — G-Code Reference, Glossary & Guides | JobLine.ai"
        description="Free manufacturing resources: 12 expert guides, 180+ G-code and M-code references, 90+ industry glossary terms, and tool comparisons for machine shops and production teams."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Manufacturing Resources
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Free guides, references, and tools for manufacturing teams —
              from G-code commands and industry terminology to shift handoff best practices and lean manufacturing.
            </p>
          </div>

          <AdPlacement format="horizontal" className="mb-8" />

          <div className="grid md:grid-cols-2 gap-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.title} to={section.href}>
                  <Card className="h-full group hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-xs">{section.count}</Badge>
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="leading-relaxed">{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-primary font-medium text-sm flex items-center gap-1">
                        Explore
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <AdPlacement format="rectangle" className="mt-12" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}

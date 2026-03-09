import { useState, useMemo, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollAwareAccordion } from "@/components/ScrollAwareAccordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Wrench,
  TrendingUp,
  GraduationCap,
  DollarSign,
  Briefcase,
  Award,
  Factory,
  Cpu,
  Shield,
  BarChart3,
  ClipboardCheck,
  Settings,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "careers-guide-progress";

const salaryBands = ["All", "$38K–$75K", "$40K–$72K", "$50K–$110K"] as const;
const growthLevels = ["All", "High demand", "Fastest growing", "Steady", "Strong"] as const;

const careerPaths = [
  {
    id: "cnc-machinist",
    title: "CNC Machinist",
    icon: Settings,
    salary: "$42K – $72K",
    growth: "High demand",
    entry: "Trade school / apprenticeship",
    description:
      "CNC Machinists set up and operate computer-controlled milling and turning machines. Entry-level operators load parts and monitor programs; experienced machinists write G-code, optimize feeds/speeds, and troubleshoot tooling issues. Advanced roles include multi-axis programming and Swiss-type lathe work.",
    skills: ["G-code / M-code", "Blueprint reading", "GD&T", "Precision measurement", "Feeds & speeds", "Setup reduction"],
    advancement: "CNC Programmer → Manufacturing Engineer → Shop Manager",
  },
  {
    id: "quality-inspector",
    title: "Quality Inspector",
    icon: ClipboardCheck,
    salary: "$40K – $68K",
    growth: "Steady",
    entry: "On-the-job training + certifications",
    description:
      "Quality Inspectors verify that manufactured parts meet engineering specifications using precision instruments (CMMs, calipers, micrometers, optical comparators). In aerospace and defense, inspectors conduct First Article Inspections (FAI) per AS9102 and maintain traceability documentation required by AS9100 and ITAR.",
    skills: ["CMM programming", "AS9102 FAI", "ISO 9001 / AS9100", "GD&T interpretation", "Statistical process control", "Gage R&R"],
    advancement: "Senior Inspector → Quality Engineer → Quality Manager",
  },
  {
    id: "manufacturing-engineer",
    title: "Manufacturing Engineer",
    icon: Factory,
    salary: "$65K – $105K",
    growth: "Strong",
    entry: "BS in Manufacturing/Mechanical Engineering",
    description:
      "Manufacturing Engineers design and optimize production processes. They select tooling, create process plans, specify fixtures, write CNC programs, and implement lean manufacturing initiatives. They bridge the gap between design engineering and the shop floor, solving problems that impact quality, cost, and delivery.",
    skills: ["CAM programming", "Process planning", "Lean / Six Sigma", "DFM analysis", "Fixture design", "Root cause analysis"],
    advancement: "Senior Mfg Engineer → Engineering Manager → Director of Operations",
  },
  {
    id: "production-supervisor",
    title: "Production Supervisor",
    icon: Briefcase,
    salary: "$55K – $85K",
    growth: "Steady",
    entry: "Shop floor experience + leadership skills",
    description:
      "Production Supervisors manage teams of operators across shifts. They assign work, monitor production schedules, handle shift handoffs, resolve quality issues, and ensure safety compliance. Strong supervisors understand every machine on their floor and can step in when needed. This role is the primary path for operators who want to move into management.",
    skills: ["Shift scheduling", "Conflict resolution", "Production planning", "Safety management", "KPI tracking", "Team development"],
    advancement: "Production Manager → Plant Manager → VP Operations",
  },
  {
    id: "welding-technician",
    title: "Welding Technician",
    icon: Wrench,
    salary: "$38K – $75K",
    growth: "High demand",
    entry: "Welding certification (AWS)",
    description:
      "Welding Technicians join metals using MIG, TIG, stick, or specialized processes like orbital welding. Aerospace and nuclear welding require certified welders with documented procedure qualifications (WPQ) and weld procedure specifications (WPS). Underwater, pipeline, and robotic welding are high-paying specializations.",
    skills: ["TIG / MIG / Stick welding", "Blueprint reading", "AWS D1.1 / D17.1", "Weld inspection", "Metallurgy basics", "Fixture setup"],
    advancement: "Senior Welder → Welding Inspector (CWI) → Welding Engineer",
  },
  {
    id: "automation-robotics",
    title: "Industrial Automation / Robotics",
    icon: Cpu,
    salary: "$60K – $110K",
    growth: "Fastest growing",
    entry: "AS/BS in Mechatronics or Electrical Engineering",
    description:
      "Automation technicians and engineers design, program, and maintain robotic cells, PLCs, and automated assembly systems. As manufacturers adopt Industry 4.0 technologies, demand for people who can integrate robots, vision systems, and IoT sensors is accelerating rapidly across all manufacturing sectors.",
    skills: ["PLC programming", "Robot programming (FANUC, ABB)", "Vision systems", "Electrical troubleshooting", "Python / SCADA", "Preventive maintenance"],
    advancement: "Senior Automation Tech → Controls Engineer → Automation Manager",
  },
  {
    id: "supply-chain",
    title: "Supply Chain & Production Planning",
    icon: BarChart3,
    salary: "$50K – $90K",
    growth: "Strong",
    entry: "BS in Supply Chain / Industrial Engineering",
    description:
      "Production Planners and Supply Chain professionals manage material flow, schedule work orders, coordinate vendors, and balance capacity against demand. They use ERP/MRP systems to ensure the right materials arrive at the right time. Strong analytical skills and understanding of lead times, lot sizing, and inventory management are essential.",
    skills: ["ERP / MRP systems", "Demand forecasting", "Inventory management", "Vendor management", "Capacity planning", "Excel / data analysis"],
    advancement: "Senior Planner → Supply Chain Manager → VP Supply Chain",
  },
  {
    id: "quality-engineer",
    title: "Quality / Compliance Engineer",
    icon: Shield,
    salary: "$65K – $100K",
    growth: "Strong",
    entry: "BS Engineering + quality certifications",
    description:
      "Quality Engineers build and maintain quality management systems (QMS), lead root cause analysis (8D, 5-Why, fishbone), manage audits (ISO 9001, AS9100, IATF 16949), and drive continuous improvement. In aerospace and defense, they manage ITAR compliance, NADCAP accreditation, and customer-specific quality requirements.",
    skills: ["ISO 9001 / AS9100 auditing", "Statistical analysis (SPC, Cpk)", "FMEA", "Root cause analysis", "CAPA management", "Regulatory compliance"],
    advancement: "Senior Quality Engineer → Quality Director → VP Quality",
  },
];

const certifications = [
  { name: "AWS Certified Welder", org: "American Welding Society", field: "Welding" },
  { name: "CNC Machinist Certificate", org: "NIMS", field: "Machining" },
  { name: "ASQ CQI / CQE", org: "American Society for Quality", field: "Quality" },
  { name: "Six Sigma Green/Black Belt", org: "ASQ / IASSC", field: "Lean / CI" },
  { name: "OSHA 10 / OSHA 30", org: "US Dept. of Labor", field: "Safety" },
  { name: "PMP", org: "Project Management Institute", field: "Management" },
  { name: "APICS CPIM / CSCP", org: "ASCM", field: "Supply Chain" },
  { name: "Certified Manufacturing Engineer (CMfgE)", org: "SME", field: "Engineering" },
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

export default function ManufacturingCareers() {
  const [search, setSearch] = useState("");
  const [growthFilter, setGrowthFilter] = useState<string>("All");
  const [explored, setExplored] = useState<Set<string>>(() => loadProgress());

  const toggleExplored = useCallback((id: string) => {
    setExplored((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setExplored(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return careerPaths.filter((c) => {
      const matchesGrowth = growthFilter === "All" || c.growth === growthFilter;
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q));
      return matchesGrowth && matchesSearch;
    });
  }, [search, growthFilter]);

  const progressPercent = Math.round((explored.size / careerPaths.length) * 100);

  return (
    <>
      <SEOHead
        title="Manufacturing Career Paths — CNC, Quality, Engineering & More | JobLine.ai"
        description="Explore manufacturing careers: CNC machinist, quality inspector, manufacturing engineer, production supervisor, welding technician, robotics, and supply chain. Salary ranges, skills, certifications, and advancement paths."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-5xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">Career Guide</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Manufacturing Career Paths
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manufacturing offers high-paying, hands-on careers that don't always require a four-year degree.
              Explore roles, mark ones you're interested in, and track your research.
            </p>
          </div>

          {/* Progress bar */}
          <Card className="mb-6">
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{explored.size} of {careerPaths.length} careers explored</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
                  {explored.size > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={resetProgress}>
                      <RotateCcw className="w-3 h-3" /> Reset
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>

          <AdPlacement format="horizontal" className="mb-6" />

          <Tabs defaultValue="careers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="careers">Career Paths</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
            </TabsList>

            <TabsContent value="careers" className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search careers, skills…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Growth filters */}
              <div className="flex flex-wrap gap-1.5">
                {(growthLevels as readonly string[]).map((level) => (
                  <Button
                    key={level}
                    variant={growthFilter === level ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setGrowthFilter(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No careers match your search.</p>
              ) : (
                <Accordion type="multiple" className="space-y-3">
                  {filtered.map((career) => {
                    const Icon = career.icon;
                    const isDone = explored.has(career.id);
                    return (
                      <AccordionItem key={career.id} value={career.id} className="border rounded-lg px-4 overflow-hidden">
                        <AccordionTrigger className="hover:no-underline py-4 gap-3">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{career.title}</span>
                                {isDone && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <DollarSign className="w-2.5 h-2.5" /> {career.salary}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <TrendingUp className="w-2.5 h-2.5" /> {career.growth}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 space-y-4">
                          <Badge variant="secondary" className="text-xs gap-1">
                            <GraduationCap className="w-3 h-3" /> {career.entry}
                          </Badge>
                          <p className="text-muted-foreground leading-relaxed text-sm">{career.description}</p>
                          <div>
                            <p className="text-xs font-medium text-foreground mb-2">Key Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {career.skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1">Career Advancement</p>
                            <p className="text-xs text-muted-foreground">{career.advancement}</p>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Checkbox
                              id={`explore-${career.id}`}
                              checked={isDone}
                              onCheckedChange={() => toggleExplored(career.id)}
                            />
                            <label htmlFor={`explore-${career.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                              Mark as explored
                            </label>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="certifications">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Industry Certifications
                  </CardTitle>
                  <CardDescription>
                    Certifications validate your skills, increase earning potential, and are often required for regulated industries like aerospace and defense.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {certifications.map((cert, i) => (
                      <div key={i} className="p-4 border rounded-lg space-y-1 hover:border-primary/50 transition-colors">
                        <p className="font-medium text-sm text-foreground">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">{cert.org}</p>
                        <Badge variant="outline" className="text-xs mt-1">{cert.field}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <AdPlacement format="rectangle" className="mt-12" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}

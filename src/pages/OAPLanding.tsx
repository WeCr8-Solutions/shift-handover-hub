import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardCheck,
  ShieldCheck,
  Ruler,
  Wrench,
  GraduationCap,
  Users,
  Building2,
  Code2,
  Award,
  ArrowRight,
  CheckCircle2,
  Globe2,
  TrendingUp,
  FileCheck,
  Target,
  Sparkles,
} from "lucide-react";
import { CertificatePreview } from "@/components/certificates/CertificatePreview";
import { BuyCertificateDialog } from "@/components/certificates/BuyCertificateDialog";
import { useState } from "react";
import { PresetProfessionsShowcase } from "@/components/learning/PresetProfessionsShowcase";

const sevenSections = [
  { icon: ShieldCheck, title: "Safety & PPE", desc: "Lockout/tagout, machine guarding, PPE protocol, emergency stops, and shop-floor hazards." },
  { icon: Ruler, title: "Measuring & GD&T", desc: "Calipers, micrometers, indicators, gage handling, and reading drawings to spec." },
  { icon: Wrench, title: "Tooling & Setup", desc: "Tool identification, offsets, work holding, soft jaws, and proper teardown procedures." },
  { icon: Code2, title: "Controls & G-Code", desc: "Fanuc, Haas, Siemens, Heidenhain — controller-specific operation and edits." },
  { icon: Target, title: "Machine Qualification", desc: "Per-machine sign-off: probe routines, first-piece, in-process checks, and shutdown." },
  { icon: FileCheck, title: "Quality & Documentation", desc: "FAI, inspection logs, traveler sign-offs, NCR awareness, and traceability." },
  { icon: Award, title: "Certification", desc: "Mentor-verified competency. Portable operator certificate the operator owns for life." },
];

const audiences = [
  {
    icon: Building2,
    color: "text-primary",
    title: "Manufacturers",
    tagline: "Cut onboarding from months to weeks.",
    bullets: [
      "Standardized acceptance program across every shift and station",
      "Mentor-driven sign-offs reduce supervisor burden",
      "Audit-ready training records for AS9100, ISO 9001, ITAR",
      "Lower scrap and rework — qualified operators only run live work",
      "Insurance and customer audits become a non-event",
    ],
  },
  {
    icon: Users,
    color: "text-primary",
    title: "Operators",
    tagline: "A certificate you own — not your employer.",
    bullets: [
      "Portable record of every machine, control, and tool you've qualified on",
      "Self-certification mode for job seekers and apprentices",
      "Show real, mentor-verified competency at interviews",
      "Track your skills as you grow across shops and roles",
      "Free to use in standalone learner mode",
    ],
  },
  {
    icon: GraduationCap,
    color: "text-primary",
    title: "Programmers & Engineers",
    tagline: "Know what your operators actually run.",
    bullets: [
      "Write programs against verified operator skill levels",
      "Tie setup sheets to the qualification level required",
      "Reduce scrap by routing complex work to certified operators",
      "Shorten the post-prove-out feedback loop",
      "Build a culture where craftsmanship is documented",
    ],
  },
];

const stats = [
  { value: "40-60%", label: "Faster operator ramp time", sub: "vs. unstructured onboarding" },
  { value: "7", label: "Standardized sections", sub: "Safety → Certification" },
  { value: "100%", label: "Portable certificate", sub: "Operator-owned for life" },
  { value: "$0", label: "Standalone learner mode", sub: "Free for individuals" },
];

const faqs = [
  {
    q: "Is OAP free?",
    a: "Yes. The standalone learner mode is free forever — anyone can earn a self-certified record. Employer mode (mentor sign-offs, audit reports, multi-operator tracking) is included with JobLine.ai Team plans.",
  },
  {
    q: "How is OAP different from a generic safety training?",
    a: "OAP is machine-specific and mentor-verified. A generic safety course teaches concepts. OAP qualifies an operator to run a specific machine, with a specific control, on specific work — signed off by a mentor who watched them do it.",
  },
  {
    q: "Does the operator keep their certificate if they leave?",
    a: "Yes. The operator owns their record. They can present their qualifications at interviews and continue to add to it across employers. This is the global standard we're building.",
  },
  {
    q: "Does it integrate with shift handoff and work orders?",
    a: "Yes — for JobLine.ai customers. Operator qualifications flow into work order routing so supervisors can see at a glance who's qualified to run what.",
  },
  {
    q: "What controllers and machines are supported?",
    a: "Fanuc, Haas, Siemens, and Heidenhain controls out of the box, plus generic mill, lathe, mill-turn, Swiss, and EDM templates. Custom machine types can be added.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Operator Acceptance Program (OAP)",
    description:
      "Global CNC operator onboarding and certification standard. Safety, measuring, tooling, controls, machine qualification, quality, and portable certification.",
    provider: {
      "@type": "Organization",
      name: "JobLine.ai",
      sameAs: "https://jobline.ai",
    },
    educationalCredentialAwarded: "Operator Acceptance Certificate",
    url: "https://jobline.ai/oap",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function OAPLanding() {
  const [buyOpen, setBuyOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Operator Acceptance Program (OAP) — The Global CNC Onboarding Standard"
        description="OAP is the operator acceptance and certification standard for CNC manufacturing. Safety, measuring, tooling, machine qualification, and portable operator certificates — built for manufacturers, operators, and programmers."
        keywords="operator acceptance program, OAP, CNC operator certification, machinist onboarding, CNC training program, mentor sign-off, manufacturing certification, operator competency, shop floor onboarding, machine qualification"
        canonical="/oap"
        ogImage="https://jobline.ai/oap-og.jpg"
        jsonLd={jsonLd}
      />

      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--foreground))_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              The Global CNC Onboarding Standard
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
              Operator <span className="text-primary">Acceptance</span> Program
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              A portable, mentor-verified certification standard for CNC operators. Built so manufacturers ramp
              faster, operators own their craft, and programmers can trust the floor.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/oap/app">
                  Launch the Program
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/oap/certificates/verify">Verify a Certificate</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/resources/measuring-tools">Measuring Tools Library</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Create a Free Operator Profile</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Free standalone mode for individuals · Employer mode included with JobLine.ai Team
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{s.value}</div>
                <div className="text-sm font-medium text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why OAP exists */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">The Problem</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              CNC onboarding is broken — at every shop, in every country.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Operators learn through tribal knowledge, get qualified by whoever's around that day, and leave with
              nothing portable. Shops re-train the same skills again and again. Insurance auditors and prime
              customers can't verify competency. Scrap and accidents trace back to "we thought they knew."
            </p>
            <p className="text-lg text-foreground font-semibold mt-6">
              OAP fixes this with one standard the whole industry can adopt.
            </p>
          </div>
        </div>
      </section>

      {/* The 7 Sections */}
      <section className="py-16 md:py-24 border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">The Standard</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Seven sections. One certificate.
            </h2>
            <p className="text-lg text-muted-foreground">
              Every operator runs the same gauntlet — adapted to mill, lathe, mill-turn, Swiss, or EDM.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {sevenSections.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={s.title} className="border-border hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-md shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-muted-foreground mb-1">
                          0{i + 1}
                        </div>
                        <CardTitle className="text-lg">{s.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">{s.desc}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Preset profession quick-start */}
      <PresetProfessionsShowcase />

      {/* Three audiences */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">Who Benefits</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Built for the whole shop floor.
            </h2>
            <p className="text-lg text-muted-foreground">
              Manufacturers, operators, and programmers all pull from the same record.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {audiences.map((a) => {
              const Icon = a.icon;
              return (
                <Card key={a.title} className="border-border flex flex-col">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                      <Icon className={`w-6 h-6 ${a.color}`} />
                    </div>
                    <CardTitle className="text-2xl">{a.title}</CardTitle>
                    <CardDescription className="text-base text-foreground/80 font-medium">
                      {a.tagline}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {a.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              From day one to certified, in one program.
            </h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              { step: "01", title: "Choose your mode", desc: "Standalone learner (free, self-certified) or Employer mode (mentor sign-offs, audit-ready, multi-operator)." },
              { step: "02", title: "Run the seven sections", desc: "Safety → Measuring → Tooling → Controls → Machine Qualification → Quality → Certification. Each section unlocks the next." },
              { step: "03", title: "Mentor verification", desc: "In employer mode, a designated mentor signs off on each competency. The operator demonstrates — the mentor confirms." },
              { step: "04", title: "Portable certificate", desc: "The operator owns the record. It moves with them across shops, roles, and careers — building the global standard." },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start group">
                <div className="text-4xl font-bold text-primary/30 group-hover:text-primary/60 transition-colors shrink-0 w-16">
                  {s.step}
                </div>
                <div className="flex-1 pb-6 border-b border-border last:border-0">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate preview */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <Badge variant="outline" className="mb-4">Portable Credential</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                A certificate the operator owns.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Every OAP completion produces a branded, verifiable certificate with a unique ID
                and QR code. Recruiters scan it, employers trust it, and operators carry it across
                shops for the rest of their career.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Unique cert ID — verify at jobline.ai/verify/OAP-XXXXXX-2026",
                  "Lists every machine, tool, and competency signed off",
                  "Mentor signature + organization stamp baked in",
                  "Print-ready PDF + LinkedIn-shareable URL",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button size="lg" onClick={() => setBuyOpen(true)} className="gap-2">
                  <Award className="w-4 h-4" />
                  Get my certificate — $12
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <CertificatePreview program="OAP" recipientName="Jane Operator" />
            </div>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">The Bigger Picture</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Manufacturing needs a competency standard.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card">
                <TrendingUp className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Skills shortage</h3>
                <p className="text-sm text-muted-foreground">
                  The industry needs hundreds of thousands of new machinists. We can't afford another decade of
                  unstructured onboarding.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <ShieldCheck className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Audit & compliance</h3>
                <p className="text-sm text-muted-foreground">
                  AS9100, ISO 9001, ITAR, and prime-customer audits all require evidence of operator competency.
                  OAP is that evidence.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <Sparkles className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Operator dignity</h3>
                <p className="text-sm text-muted-foreground">
                  Operators deserve a record of their craft that they own. OAP makes that record portable, verified,
                  and respected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Common Questions</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground">FAQ</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((f) => (
                <Card key={f.q} className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <ClipboardCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      {f.q}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{f.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Set the standard for your shop.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Launch the Operator Acceptance Program today. Free for individuals, included with JobLine.ai Team for shops.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/oap/app">
                  Launch OAP
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">View JobLine.ai Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />

      <BuyCertificateDialog open={buyOpen} onOpenChange={setBuyOpen} program="OAP" />
    </div>
  );
}

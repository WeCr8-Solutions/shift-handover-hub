import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Code2,
  Calculator,
  Cpu,
  Wrench,
  Ruler,
  Brain,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Building2,
  Users,
  Sparkles,
  BookOpen,
  Target,
  Award,
  Lock,
} from "lucide-react";
import { CertificatePreview } from "@/components/certificates/CertificatePreview";
import { BuyCertificateDialog } from "@/components/certificates/BuyCertificateDialog";
import { PresetProfessionsShowcase } from "@/components/learning/PresetProfessionsShowcase";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const tracks = [
  { icon: Wrench, title: "CNC Lathe", desc: "Turning, threading, boring, live tooling, sub-spindle." },
  { icon: Cpu, title: "CNC Mill", desc: "Milling, drilling, boring, 4/5-axis indexing & simultaneous." },
  { icon: Ruler, title: "GD&T", desc: "Symbols, datums, tolerance stacks, drawing interpretation." },
  { icon: Code2, title: "Controls", desc: "Fanuc, Haas, Siemens, Heidenhain — controller-specific syntax." },
];

const features = [
  { icon: BookOpen, title: "Theory + Code + Quiz", desc: "Every lesson has explanation, real G-code samples, live calculators, and a graded quiz." },
  { icon: Calculator, title: "Live Calculators", desc: "G96/G97 SFM ↔ RPM, G50 max-RPM advisor, feed-per-tooth, IPM, and speeds-and-feeds." },
  { icon: Target, title: "Stepped Progression", desc: "Beginner → Intermediate → Advanced → Automation. No skipping. Operator-first design." },
  { icon: Brain, title: "Interview Prep", desc: "Timed test bank: controller-specific, machine-type, and GD&T questions with scoring." },
  { icon: Award, title: "Milestone Badges", desc: "Earn portable badges: Operator Ready, Setup Tech, CNC Programmer, Lathe/Mill Certified." },
  { icon: Sparkles, title: "Free Forever Tier", desc: "Anyone can learn. Pro unlocks the full curriculum, all controllers, and certification tests." },
];

const audiences = [
  {
    icon: Building2,
    title: "Manufacturers",
    tagline: "Train operators without burning supervisor hours.",
    bullets: [
      "Standardized curriculum — every operator learns the same fundamentals",
      "Controller-specific tracks for Fanuc, Haas, Siemens, Heidenhain",
      "Reduce scrap by qualifying operators before they touch live work",
      "Track team progress through milestone badges",
      "Pairs directly with the OAP for on-machine sign-off",
    ],
  },
  {
    icon: Users,
    title: "Operators & Apprentices",
    tagline: "Learn at your pace — own your progress.",
    bullets: [
      "Free standalone mode — no employer required",
      "Lathe and mill tracks with hands-on G-code examples",
      "Live calculators replace the dog-eared cheat sheet",
      "Milestone badges you keep across jobs",
      "Interview-prep mode for your next role",
    ],
  },
  {
    icon: GraduationCap,
    title: "Programmers & Engineers",
    tagline: "Sharpen edges. Mentor your team.",
    bullets: [
      "Advanced track: macros, parametrics, probing, custom canned cycles",
      "Automation module: pallet pools, robotics, lights-out strategy",
      "Use lessons as on-the-floor training material",
      "Bridge the gap between operator and programmer skill levels",
      "GD&T module for design-for-manufacturability discussions",
    ],
  },
];

const levels = [
  { code: "01", level: "Beginner", goal: "Floor-ready CNC operator", desc: "Safety, machine anatomy, basic G/M codes, work offsets, tool changes, MDI fundamentals." },
  { code: "02", level: "Intermediate", goal: "Setup technician — MDI & hand programming", desc: "Hand-written programs, canned cycles, G96/G97, threading cycles, drilling cycles, work-holding." },
  { code: "03", level: "Advanced", goal: "Full CNC programmer", desc: "Macro programming, parametric programs, probing routines, sub-programs, multi-tool strategies." },
  { code: "04", level: "Automation", goal: "Senior programmer / manufacturing engineer", desc: "Lights-out, pallet pools, robot integration, post processing, full-shop production strategy." },
];

const stats = [
  { value: "4", label: "Progressive levels", sub: "Beginner → Automation" },
  { value: "4", label: "Controller dialects", sub: "Fanuc · Haas · Siemens · Heidenhain" },
  { value: "100%", label: "Browser-based", sub: "Nothing to install" },
  { value: "$0", label: "Free learner tier", sub: "Pro unlocks full library" },
];

const faqs = [
  {
    q: "Is G-Code Academy free?",
    a: "Yes — the free tier covers the Beginner track on both Lathe and Mill, plus core G-code reference. Pro unlocks Intermediate, Advanced, Automation, GD&T, all controller test banks, and certification tests.",
  },
  {
    q: "What controllers are covered?",
    a: "Fanuc, Haas, Siemens, and Heidenhain — each with its own syntax notes and dedicated test bank. Generic mill, lathe, mill-turn, and Swiss templates are also supported.",
  },
  {
    q: "How does it work with the Operator Acceptance Program (OAP)?",
    a: "GCA teaches the theory and syntax. OAP qualifies the operator on a specific machine with mentor sign-off. Milestone badges from GCA flow into the operator's OAP profile and stay with them for life.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Everything runs in the browser. Sign in with Google to save progress, badges, and machine experience to your portable profile.",
  },
  {
    q: "Can I use this without a JobLine.ai account?",
    a: "Yes. Standalone learner mode is free and requires only a Google sign-in to save your progress. No employer or organization required.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "G-Code Academy",
    description:
      "Interactive CNC training: lathe, mill, GD&T, and controller-specific G-code (Fanuc, Haas, Siemens, Heidenhain). Operator → Setup → Programmer → Automation.",
    provider: {
      "@type": "Organization",
      name: "JobLine.ai",
      sameAs: "https://jobline.ai",
    },
    educationalCredentialAwarded: "GCA Milestone Badges",
    url: "https://jobline.ai/gcode-academy",
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

function useGcaBanksWithPro() {
  return useQuery({
    queryKey: ["gca-banks-landing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gca_question_banks")
        .select("id, slug, title, topic, difficulty, is_pro_only, is_published, content_year, last_published_at")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        slug: string;
        title: string;
        topic: string;
        difficulty: string;
        is_pro_only: boolean;
        is_published: boolean;
        content_year?: number | null;
        last_published_at?: string | null;
      }[];
    },
  });
}

export default function GCALanding() {
  const [buyOpen, setBuyOpen] = useState(false);
  const { data: banks = [] } = useGcaBanksWithPro();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="G-Code Academy — Interactive CNC Operator Training"
        description="Learn CNC lathe, mill, GD&T, and controller-specific G-code (Fanuc, Haas, Siemens, Heidenhain). Free browser-based training for operators, apprentices, programmers, and manufacturers."
        keywords="g-code academy, CNC training, learn g-code, CNC operator training, Fanuc training, Haas training, Siemens training, Heidenhain, GD&T course, CNC lathe training, CNC mill training, machinist apprenticeship, CNC programming course"
        canonical="/gcode-academy"
        ogImage="https://jobline.ai/gcode-academy-og.jpg"
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
              Free Interactive CNC Training
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
              G-Code <span className="text-primary">Academy</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Browser-based CNC training for lathe, mill, GD&T, and every major controller.
              Theory, real code, live calculators, and milestone badges — built so anyone can become floor-ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/gcode-academy/app">
                  Launch the Academy
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/gcode-academy/certificates/verify">Verify a Certificate</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/resources/measuring-tools">Measuring Tools Library</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Create a Free Profile</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Free Beginner tracks · Pro unlocks Intermediate → Automation, GD&T, and certification tests
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

      {/* Why GCA */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">The Problem</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              CNC training is locked behind shops, schools, and paywalls.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Aspiring machinists wait for an apprenticeship slot. Operators stall because no one has time to teach
              them advanced cycles. Programmers want to mentor but lack a shared reference. Meanwhile the industry
              screams for talent.
            </p>
            <p className="text-lg text-foreground font-semibold mt-6">
              GCA is free, browser-based, and open to anyone with the will to learn.
            </p>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="py-16 md:py-24 border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">Tracks</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Four tracks. One academy.
            </h2>
            <p className="text-lg text-muted-foreground">
              Pick your machine. Pick your control. Build the skill.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {tracks.map((t) => {
              const Icon = t.icon;
              return (
                <Card key={t.title} className="border-border hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">{t.desc}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Preset profession quick-start */}
      <PresetProfessionsShowcase />

      {/* Levels */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">Progression</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Operator to engineer — in one path.
            </h2>
            <p className="text-lg text-muted-foreground">
              Each level builds on the last. No assumptions, no skipping.
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {levels.map((l) => (
              <div key={l.code} className="flex gap-6 items-start group">
                <div className="text-4xl font-bold text-primary/30 group-hover:text-primary/60 transition-colors shrink-0 w-16">
                  {l.code}
                </div>
                <div className="flex-1 pb-6 border-b border-border last:border-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{l.level}</h3>
                    <span className="text-sm text-primary font-medium">{l.goal}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">What's Inside</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Built like a workshop, not a textbook.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="border-border">
                  <CardHeader>
                    <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">{f.desc}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Study — Test Banks */}
      {banks.length > 0 && (
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <Badge variant="outline" className="mb-4">Practice Tests</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Test your knowledge.
              </h2>
              <p className="text-lg text-muted-foreground">
                10 question banks covering lathe, mill, controllers, GD&T, speeds &amp; feeds, and metrology.
                Free banks are open to all. Pro banks require a GCA Pro subscription.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {banks.map((b) => (
                <Card key={b.id} className="border-border hover:border-primary/40 transition-colors flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize text-xs">{b.difficulty}</Badge>
                      {b.is_pro_only && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Lock className="w-3 h-3" />
                          Pro
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-2 flex items-center gap-2 flex-wrap">
                      <span className="flex-1">{b.title}</span>
                      {b.content_year && (
                        <Badge variant="secondary" className="text-[10px]">Updated · {b.content_year}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">{b.topic}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-end pt-0">
                    <Button asChild size="sm" variant="outline" className="gap-1 w-full">
                      <Link to={`/gca/test/${b.slug}`}>
                        Take test
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Audiences */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">Who It's For</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Built for everyone on the shop floor.
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {audiences.map((a) => {
              const Icon = a.icon;
              return (
                <Card key={a.title} className="border-border flex flex-col">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                      <Icon className="w-6 h-6 text-primary" />
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

      {/* Pairs with OAP */}
      <section className="py-16 md:py-24 border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">Better Together</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              GCA teaches. OAP qualifies.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              G-Code Academy gives operators the theory and syntax. The Operator Acceptance Program puts them on
              the machine with a mentor and signs off their competency. Together they form a complete, portable
              record of craftsmanship.
            </p>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/oap">
                Explore the OAP
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Certificate preview */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="flex justify-center md:order-1 order-2">
              <CertificatePreview program="GCA" recipientName="Jane Operator" />
            </div>
            <div className="md:order-2 order-1">
              <Badge variant="outline" className="mb-4">Earn Your Credential</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                Pass the tests. Get the certificate.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Complete the GCA test banks and unlock a branded, verifiable certificate for $12.
                Lists every bank you mastered — Lathe, Mill, Fanuc, Haas, GD&T and more — with a
                public verification URL recruiters can scan.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Unique cert ID — GCA-XXXXXX-2026 format",
                  "Verifiable at jobline.ai/verify/your-id",
                  "Print, share, attach to your LinkedIn or résumé",
                  "Built on the same standard employers use for OAP",
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
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                Common questions.
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((f) => (
                <Card key={f.q} className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">{f.q}</CardTitle>
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

      {/* Final CTA */}
      <section className="py-16 md:py-24 border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Start learning. It's free.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Open the Academy in your browser. No install. No credit card. Save your progress with Google.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/gcode-academy/app">
                  Launch the Academy
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">See Pro Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />

      <BuyCertificateDialog open={buyOpen} onOpenChange={setBuyOpen} program="GCA" />
    </div>
  );
}

import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MfgVisibility100Callout } from "@/components/marketing/MfgVisibility100Callout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  Cpu,
  GraduationCap,
  Lightbulb,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const learningTiers = [
  {
    title: "Beginner",
    description: "Start with plain-language concepts like tokens, context window, and the basic differences between CLI, web, mobile, and chat-first AI.",
    goal: "Build confidence before jargon takes over.",
    href: "/learn/fundamentals",
  },
  {
    title: "Intermediate",
    description: "Move into role-based guides so the same ideas connect to machinists, quality, supervision, engineering, and field use from phones or browsers.",
    goal: "Translate concepts into real responsibilities.",
    href: "/learn/professions",
  },
  {
    title: "Advanced",
    description: "Use named tutorial tracks when you are ready to compare ecosystems, install tools, and understand environment fit for practical implementation.",
    goal: "Apply the ideas in real tooling and workflows.",
    href: "/learn/tutorials",
  },
  {
    title: "Automation",
    description: "Focus on agents, monitored automation, messaging surfaces, and where human-in-the-loop or human-on-the-loop design still belongs.",
    goal: "Design useful automation without losing control.",
    href: "/learn/glossary",
  },
] as const;

const modules = [
  {
    title: "Manufacturing AI Fundamentals",
    description:
      "Start with practical AI basics, why grounded answers matter, how vision inspection helps, and where robotics belongs.",
    href: "/learn/fundamentals",
    icon: ShieldCheck,
    status: "Live now",
  },
  {
    title: "Role-Based AI Guides",
    description:
      "Start with tokens, context windows, and human oversight, then read those same concepts through machining, inspection, supervision, engineering, and automation work.",
    href: "/learn/professions",
    icon: Briefcase,
    status: "Live now",
  },
  {
    title: "AI Tutorial Tracks",
    description:
      "Browse OpenClaw, Hermes, and NemoClaw learning clusters designed for high-intent tutorial searches.",
    href: "/learn/tutorials",
    icon: Cpu,
    status: "Live now",
  },
  {
    title: "AI Glossary for Manufacturing",
    description:
      "Use the glossary when someone needs a plain-language term explanation connected to manufacturing examples and reflection prompts.",
    href: "/learn/glossary",
    icon: Brain,
    status: "Live now",
  },
  {
    title: "Handbook Library",
    description:
      "Reference content that can cross-link with AI explanations so people understand the technical context behind the tools.",
    href: "/handbook",
    icon: BookOpen,
    status: "Connected",
  },
  {
    title: "Operator Acceptance Program",
    description:
      "Structured onboarding, learning checkpoints, and mentor sign-off for operators getting floor-ready.",
    href: "/oap",
    icon: Wrench,
    status: "Connected",
  },
  {
    title: "G-Code Academy",
    description:
      "Interactive CNC learning, test banks, and controller-specific study paths for operators and apprentices.",
    href: "/gcode-academy",
    icon: Cpu,
    status: "Connected",
  },
  {
    title: "Manufacturing Glossary",
    description:
      "Existing CNC and manufacturing terminology for core shop concepts, complementary to the new AI learning area.",
    href: "/resources/glossary",
    icon: GraduationCap,
    status: "Connected",
  },
];

export default function LearnIndex() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Learning Center"
        description="Public learning hub for AI literacy, OAP, G-Code Academy, and handbook resources built for manufacturing teams."
        canonical="/learn"
      />
      <MarketingNav />

      <main>
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl space-y-6">
              <Badge variant="secondary" className="gap-2">
                <Lightbulb className="h-3.5 w-3.5" />
                Learning Center
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Learn manufacturing AI in practical terms, by topic, by role, and by tutorial track.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  This learning center is an information-first public hub. It teaches the basics, explains why concepts matter
                  for real shop work, and connects readers to deeper guides, role-based explainers, and named tutorial ecosystems.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/learn/fundamentals">
                    Start with Fundamentals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/learn/professions">See Role Guides</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-4 px-4 py-12 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Card key={module.href} className="flex h-full flex-col border-border/70">
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">{module.status}</Badge>
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link to={module.href}>
                      Open Module
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="border-t border-border bg-muted/20">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl space-y-4 mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Choose a learning path tier</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                This learning center now uses the same progression labels already used in G-Code Academy: <strong className="text-foreground">Beginner</strong>, <strong className="text-foreground">Intermediate</strong>, <strong className="text-foreground">Advanced</strong>, and <strong className="text-foreground">Automation</strong>.
                The goal is one shared ladder instead of one set of levels for CNC learning and another set for AI learning.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {learningTiers.map((tier) => (
                <Card key={tier.title} className="h-full border-border/70">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit">{tier.title}</Badge>
                    <CardTitle className="text-lg">{tier.title}</CardTitle>
                    <CardDescription>{tier.goal}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <p>{tier.description}</p>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={tier.href}>
                        Open {tier.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <MfgVisibility100Callout />
      </section>

      <MarketingFooter />
    </div>
  );
}
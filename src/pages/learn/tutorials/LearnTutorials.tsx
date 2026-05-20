import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, Cpu, PackageCheck } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TutorialGlossaryText } from "./TutorialGlossaryText";

const tracks = [
  {
    title: "OpenClaw tutorials",
    description: "Installation, first-run setup, practical use cases, and troubleshooting paths designed to rank for high-intent searches.",
    bestFor: "Fastest beginner path",
    setupLevel: "Low",
    firstOutcome: "Get a local agent running quickly and try a first workflow fast.",
    icon: PackageCheck,
    href: "/learn/tutorials/openclaw-install",
  },
  {
    title: "Hermes tutorials",
    description: "Guides that mirror real setup questions, configuration steps, and related workflow examples instead of staying abstract.",
    bestFor: "Controlled endpoint experiments",
    setupLevel: "Higher",
    firstOutcome: "Stand up a more structured agent endpoint with sandbox context.",
    icon: Cpu,
    href: "/learn/tutorials/hermes-install",
  },
  {
    title: "NemoClaw tutorials",
    description: "A dedicated space for walkthroughs, FAQs, and adjacent learning paths around NemoClaw search intent.",
    bestFor: "Guardrails and sandboxing",
    setupLevel: "Medium",
    firstOutcome: "Launch a safer experimental environment before scaling workflows.",
    icon: BookOpenCheck,
    href: "/learn/tutorials/nemoclaw-install",
  },
];

export default function LearnTutorials() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI Tutorial Tracks | Learning Center"
        description="Tutorial clusters for OpenClaw, Hermes, NemoClaw, and other high-intent manufacturing AI learning searches."
        canonical="/learn/tutorials"
      />
      <MarketingNav />

      <main>
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl space-y-6">
              <Badge variant="secondary">Tutorial clusters</Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Named tutorial ecosystems built for high-intent searches.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                  This section is where dedicated install guides, walkthroughs, troubleshooting pages, and FAQ content will live for OpenClaw,
                  Hermes, NemoClaw, and other tutorial-driven learning tracks.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/learn/fundamentals">
                    Review fundamentals first
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/professions">Match tutorials to roles</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-4 px-4 py-12 md:grid-cols-3">
          {tracks.map((track) => {
            const Icon = track.icon;

            return (
              <Card key={track.title} className="flex h-full flex-col border-border/70">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{track.title}</CardTitle>
                  <CardDescription><TutorialGlossaryText text={track.description} /></CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-sm leading-6 text-muted-foreground">
                  <p className="mb-4">
                    <TutorialGlossaryText text="This track now includes a basic install guide built from public primary docs and search-intent research. More walkthrough, troubleshooting, and workflow pages can expand from this route family." />
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={track.href}>
                      Open install guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="container mx-auto px-4 pb-12">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Choose your first tutorial in 30 seconds</CardTitle>
              <CardDescription>Use this when you care more about getting a result this week than sounding sophisticated on social media.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                If you are under pressure and need the fastest first win, start with <strong>OpenClaw</strong>. If you want more guardrails, pick <strong>NemoClaw</strong>. Pick <strong>Hermes</strong> when you specifically need its more controlled <TutorialGlossaryText text="endpoint" /> style and accept extra setup.
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {tracks.map((track) => (
                  <div key={track.title} className="rounded-lg border border-border bg-background p-4">
                    <p className="mb-2 text-base font-semibold text-foreground">{track.title}</p>
                    <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Best for:</span> <TutorialGlossaryText text={track.bestFor} /></p>
                      <p><span className="font-semibold text-foreground">Setup level:</span> {track.setupLevel}</p>
                      <p><span className="font-semibold text-foreground">First outcome:</span> <TutorialGlossaryText text={track.firstOutcome} /></p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
import { Link } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roleGuides, starterConcepts } from "./learnProfessionData";

export default function LearnProfessions() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Role-Based AI Guides | Learning Center"
        description="Role-based AI learning guides for machinists, inspectors, supervisors, manufacturing engineers, and automation teams."
        canonical="/learn/professions"
      />
      <MarketingNav />

      <main>
        <section className="border-b border-border bg-card/40">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl space-y-6">
              <Badge variant="secondary">Role-based explainers</Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Learn AI in the context of the job you actually do.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                  The same concept lands differently for a machinist, an inspector, a supervisor, or an automation technician.
                  This section organizes the learning path by responsibility so the explanation stays practical. Most people should start with tokens,
                  context windows, and human oversight before they try to reason about agents, retrieval, or automation patterns.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/learn/fundamentals">
                    Start with fundamentals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/tutorials">Explore tutorial tracks</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl space-y-4 mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Start with the ideas almost everyone should learn first</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Most people do not need to begin with agents or advanced tooling. They should usually begin with what a token is,
              what a context window is, and where a person still needs to review or monitor the workflow.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {starterConcepts.map((concept) => (
              <Card key={concept.title} className="border-border/70">
                <CardHeader>
                  <CardTitle className="text-lg">{concept.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                  <p>{concept.summary}</p>
                  <p>{concept.whyItMatters}</p>
                  <div className="flex flex-col gap-2">
                    {concept.links.map((link) => (
                      <Button key={link.href} asChild variant="outline" size="sm" className="justify-between">
                        <Link to={link.href}>
                          {link.label}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-4 pb-12">
          <div className="max-w-4xl space-y-4 mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Role-based learning guides</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Each guide starts with the concepts that matter most for that job, then explains what those ideas change in practice.
              The goal is not to dump definitions. It is to help someone learn through the decisions and risks their role already understands.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roleGuides.map((role) => {
            const Icon = role.icon;

            return (
              <Card key={role.title} className="flex h-full flex-col border-border/70">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4 text-sm leading-6 text-muted-foreground">
                  <Button asChild variant="secondary" size="sm" className="w-full justify-between">
                    <Link to={`/learn/professions/${role.slug}`}>
                      Open role guide
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">Learn first</p>
                    <div className="flex flex-wrap gap-2">
                      {role.learnFirst.map((concept) => (
                        <Badge key={concept} variant="outline">{concept}</Badge>
                      ))}
                    </div>
                  </div>
                  <p>{role.summary}</p>
                  <ul className="space-y-2">
                    {role.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">How to teach this role</p>
                    <p>{role.teachingPrompt}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {role.links.map((link) => (
                      <Button key={link.href} asChild variant="outline" size="sm" className="justify-between">
                        <Link to={link.href}>
                          {link.label}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </section>

        <section className="border-t border-border bg-muted/20">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl space-y-4">
              <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {roleGuides.map((role) => (
                  <Button key={role.slug} asChild variant="outline" className="justify-between">
                    <Link to={`/learn/professions/${role.slug}`}>
                      {role.shortTitle}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Choose the next learning path</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                If you want simpler definitions, go to the glossary. If you want broader concepts first, use fundamentals. If you already have a tool in mind, jump to tutorials.
                This page should help people pick a path, not leave them at another dead end.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild>
                  <Link to="/learn/glossary">
                    Open the glossary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/fundamentals">Open fundamentals</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/tutorials">Open tutorial tracks</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/handbook">
                    Open handbook references
                    <FileText className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
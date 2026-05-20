import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Brain } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TERMS, getFeaturedLearnTerms, getLearnTermById } from "@/lib/LearnGlossaryData";

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={`${part}-${index}`} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default function LearnTermDetail() {
  const { termId } = useParams<{ termId: string }>();
  const term = termId ? getLearnTermById(termId) : undefined;

  if (!term) {
    return <Navigate to="/learn/glossary" replace />;
  }

  const relatedTerms = getFeaturedLearnTerms().filter((entry) => entry.id !== term.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${term.name} for Manufacturing | Learning Center`}
        description={`${term.oneLiner} ${term.whyItMatters}`}
        canonical={`/learn/glossary/${term.id}`}
      />
      <MarketingNav />

      <main>
        <section className="border-b border-border bg-card/40">
          <div className="container mx-auto px-4 py-14 md:py-16">
            <div className="max-w-4xl space-y-5">
              <Badge variant="secondary" className="gap-2">
                <Brain className="h-3.5 w-3.5" />
                {term.category}
              </Badge>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{term.name}</h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">{term.oneLiner}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Plain English</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    <BoldText text={term.plain} />
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Why it matters here</p>
                  <p className="text-sm leading-6 text-muted-foreground">{term.whyItMatters}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/learn/glossary">
                    Back to glossary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/fundamentals">Open fundamentals</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              {(term.benefits || term.drawbacks) && (
                <Card className="border-border/70">
                  <CardHeader>
                    <CardTitle>Benefits and drawbacks</CardTitle>
                    <CardDescription>Use the term where it fits. Do not assume every environment or pattern is the right answer for every workflow.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {term.benefits && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Benefits</p>
                        <ul className="space-y-2 text-sm leading-6 text-emerald-950">
                          {term.benefits.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {term.drawbacks && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Drawbacks</p>
                        <ul className="space-y-2 text-sm leading-6 text-amber-950">
                          {term.drawbacks.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-600" aria-hidden="true" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Picture it like this</CardTitle>
                  <CardDescription>Use simple language and analogies before technical phrasing takes over.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                  {term.visual && <p>{term.visual.body}</p>}
                  {term.visual?.breakdown && (
                    <div className="flex flex-wrap gap-2">
                      {term.visual.breakdown.map((item) => (
                        <Badge key={item} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  )}
                  {term.visual?.note && <p>{term.visual.note}</p>}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">Analogy</p>
                    <p>{term.analogy.aiSide}</p>
                    <p className="mt-2">{term.analogy.shopSide}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">Examples</p>
                    <div className="flex flex-wrap gap-2">
                      {term.examples.map((item) => (
                        <Badge key={item} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Related links</CardTitle>
                  <CardDescription>Use these pages to move from definition into adjacent workflows or broader context.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(term.relatedLinks ?? []).map((link) => (
                    <Button key={link.href} asChild variant="outline" className="w-full justify-between">
                      <Link to={link.href}>
                        {link.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Featured term pages</CardTitle>
                  <CardDescription>These pages keep the deeper glossary content crawlable instead of leaving everything buried inside an accordion list.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedTerms.map((entry) => (
                    <Button key={entry.id} asChild variant="outline" className="w-full justify-between">
                      <Link to={`/learn/glossary/${entry.id}`}>
                        {entry.name}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

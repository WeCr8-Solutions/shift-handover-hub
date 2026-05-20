import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleGuideBySlug, roleGuides } from "./learnProfessionData";

export default function LearnProfessionDetail() {
  const { roleSlug } = useParams<{ roleSlug: string }>();
  const role = roleSlug ? getRoleGuideBySlug(roleSlug) : undefined;

  if (!role) {
    return <Navigate to="/learn/professions" replace />;
  }

  const Icon = role.icon;
  const relatedRoles = roleGuides.filter((entry) => entry.slug !== role.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={role.seoTitle} description={role.seoDescription} canonical={`/learn/professions/${role.slug}`} />
      <MarketingNav />

      <main>
        <section className="border-b border-border bg-card/40">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl space-y-6">
              <Badge variant="secondary">Role guide</Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">{role.shortTitle}</h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">{role.seoDescription}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Who this page is for</p>
                  <p className="text-sm leading-6 text-muted-foreground">{role.audience}</p>
                </div>
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Start here</p>
                  <div className="flex flex-wrap gap-2">
                    {role.learnFirst.map((concept) => (
                      <Badge key={concept} variant="outline">{concept}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/learn/professions">
                    Back to role guides
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/fundamentals">Review fundamentals</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <Card className="border-border/70">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                  <p>{role.summary}</p>
                  <ul className="space-y-2">
                    {role.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">How to teach this role</p>
                    <p>{role.teachingPrompt}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Next links for this role</CardTitle>
                  <CardDescription>Use these pages when the reader is ready to move from explanation into broader concepts or adjacent workflows.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {role.links.map((link) => (
                    <Button key={link.href} asChild variant="outline" className="w-full justify-between">
                      <Link to={link.href}>
                        {link.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Related role pages</CardTitle>
                  <CardDescription>These role-specific landing pages are designed to be readable and searchable on their own.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedRoles.map((entry) => (
                    <Button key={entry.slug} asChild variant="outline" className="w-full justify-between">
                      <Link to={`/learn/professions/${entry.slug}`}>
                        {entry.shortTitle}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Broader learning paths</CardTitle>
                  <CardDescription>Move between role learning, glossary terms, and reference material without restarting the learning flow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/learn/glossary">
                      Open the glossary
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/learn/tutorials">
                      Open tutorial tracks
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/handbook">
                      Open handbook references
                      <FileText className="h-4 w-4" />
                    </Link>
                  </Button>
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

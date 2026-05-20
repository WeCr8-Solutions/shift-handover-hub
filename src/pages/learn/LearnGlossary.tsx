import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Lightbulb, Search, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TermCard } from "@/components/learn/TermCard";
import {
  getFeaturedLearnTerms,
  LEARN_CATEGORIES,
  SEO_RELATED_TERMS,
  TERMS,
  type LearnCategory,
} from "@/lib/LearnGlossaryData";

const IdeaDrawer = lazy(() => import("@/components/learn/IdeaDrawer").then((module) => ({ default: module.IdeaDrawer })));

import type { CapturedIdea } from "@/components/learn/IdeaDrawer";

const bridgeCards = [
  {
    title: "Connect to OAP",
    description: "Use AI terms to explain platform workflows before learners hit operator checkpoints or mentor sign-off.",
    href: "/oap/learn",
  },
  {
    title: "Connect to GCA",
    description: "Tie AI explanations to alarm interpretation, code patterns, machine context, and controller learning.",
    href: "/resources/gcode-academy",
  },
  {
    title: "Connect to Handbook",
    description: "Ground AI literacy in reference material so people can move from concept to procedure without leaving the app.",
    href: "/handbook",
  },
];

export default function LearnGlossary() {
  const featuredTerms = useMemo(() => getFeaturedLearnTerms(), []);
  const [activeCategory, setActiveCategory] = useState<"All" | LearnCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTermId, setDrawerTermId] = useState<string | null>(null);
  const [drawerTermName, setDrawerTermName] = useState<string | null>(null);
  const [drawerTermIcon, setDrawerTermIcon] = useState<string | null>(null);
  const [sessionIdeas, setSessionIdeas] = useState<CapturedIdea[]>([]);
  const [capturedIds, setCapturedIds] = useState<Set<string>>(new Set());

  const filteredTerms = useMemo(() => {
    let next = TERMS;

    if (activeCategory !== "All") {
      next = next.filter((term) => term.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      next = next.filter(
        (term) =>
          term.name.toLowerCase().includes(query) ||
          term.oneLiner.toLowerCase().includes(query) ||
          term.plain.toLowerCase().includes(query),
      );
    }

    return next;
  }, [activeCategory, searchQuery]);

  const handleSparkClick = useCallback((termId: string, termName: string) => {
    const term = TERMS.find((entry) => entry.id === termId);
    setDrawerTermId(termId);
    setDrawerTermName(termName);
    setDrawerTermIcon(term?.icon ?? "💡");
    setDrawerOpen(true);
  }, []);

  const handleIdeaSubmitted = useCallback((idea: CapturedIdea) => {
    setSessionIdeas((prev) => [idea, ...prev]);
    setCapturedIds((prev) => new Set(prev).add(idea.termId));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI Terms for Manufacturing | Learning Center"
        description="Plain-language AI glossary for operators, machinists, and manufacturing teams, connected to OAP, GCA, and handbook learning flows."
        canonical="/learn/glossary"
      />
      <MarketingNav />

      <main>
        <section className="border-b border-border bg-card/40">
          <div className="container mx-auto px-4 py-14 md:py-16">
            <div className="max-w-4xl space-y-5">
              <Badge variant="secondary" className="gap-2">
                <Brain className="h-3.5 w-3.5" />
                AI Terms for Manufacturing
              </Badge>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Plain-language AI concepts for manufacturing teams that want practical understanding first.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                  Use this glossary to explain AI in shop-floor language, connect concepts to real manufacturing situations,
                  and capture reflections about where the explanation applies in your work.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/learn">Back to Learning Center</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/resources/glossary">Open Manufacturing Glossary</Link>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setDrawerTermId(null);
                    setDrawerTermName(null);
                    setDrawerTermIcon(null);
                    setDrawerOpen(true);
                  }}
                >
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  My reflections
                  {sessionIdeas.length > 0 && <Badge className="ml-1 h-5 bg-green-500 px-1.5 text-xs hover:bg-green-500">{sessionIdeas.length}</Badge>}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="mb-4 max-w-3xl">
              <h2 className="text-2xl font-semibold text-foreground">Featured term explainers</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                These direct term pages keep the deeper glossary explanations crawlable and linkable for readers who land from search with one concept in mind.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featuredTerms.map((term) => (
                <Card key={term.id} className="flex h-full flex-col border-border/70">
                  <CardHeader>
                    <CardTitle className="text-lg">{term.name}</CardTitle>
                    <CardDescription>{term.oneLiner}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link to={`/learn/glossary/${term.id}`}>
                        Open term page
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Search and filter</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Start with the foundations if someone is new to AI. Use context, retrieval, and safety terms when you want to understand why answers improve, where trust comes from, and how these ideas fit actual shop work.
              </p>
            </div>
            <div className="relative w-full md:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search AI terms"
                className="pl-9"
                aria-label="Search AI terms"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {(["All", ...LEARN_CATEGORIES] as const).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={
                  activeCategory === category
                    ? "rounded-md border border-foreground bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                    : "rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                }
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {filteredTerms.length === 0 ? (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>No terms match your search</CardTitle>
                  <CardDescription>Try clearing the search or switching back to all categories.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("All");
                    }}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTerms.map((term, index) => (
                <TermCard
                  key={term.id}
                  term={term}
                  index={index}
                  onSparkClick={handleSparkClick}
                  ideaCaptured={capturedIds.has(term.id)}
                />
              ))
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-14">
          <div className="mb-6 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground">Integration bridges</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Learning content is strongest when it connects to the rest of the manufacturing knowledge stack. These are
              the first bridge points already present in this app.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {bridgeCards.map((item) => (
              <Card key={item.href} className="flex h-full flex-col border-border/70">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link to={item.href}>
                      Open
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-muted/20 p-4">
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">Related topics</p>
            <div className="flex flex-wrap gap-2">
              {SEO_RELATED_TERMS.map((term) => (
                <span key={term} className="rounded border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                  {term}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />

      <Suspense fallback={null}>
        <IdeaDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          termId={drawerTermId}
          termName={drawerTermName}
          termIcon={drawerTermIcon}
          onSubmitted={handleIdeaSubmitted}
          sessionIdeas={sessionIdeas}
        />
      </Suspense>
    </div>
  );
}
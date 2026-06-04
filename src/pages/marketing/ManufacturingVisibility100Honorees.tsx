import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Award, ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";
import {
  mergeManufacturing100Honorees,
  type Manufacturing100Honoree as Honoree,
} from "@/lib/manufacturing100Honorees";

function MovementBadge({ movement, previous, current }: { movement: string | null; previous: number | null; current: number | null }) {
  if (!movement || !current) return null;
  if (movement === "new") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
        <Sparkles className="h-3 w-3" /> NEW
      </span>
    );
  }
  if (movement === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <ArrowUp className="h-3 w-3" /> {previous! - current}
      </span>
    );
  }
  if (movement === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
        <ArrowDown className="h-3 w-3" /> {current - previous!}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <Minus className="h-3 w-3" /> —
    </span>
  );
}

export default function ManufacturingVisibility100Honorees() {
  const { data: honorees = [], isLoading } = useQuery({
    queryKey: ["mfg-100-honorees"],
    queryFn: async (): Promise<Honoree[]> => {
      const { data, error } = await supabase
        .from("mfg_100_honorees" as any)
        .select("*")
        .order("rank", { ascending: true, nullsFirst: false })
        .order("nominee_name", { ascending: true });
      if (error) throw error;
      return mergeManufacturing100Honorees((data ?? []) as unknown as Honoree[]);
    },
  });

  const ranked = honorees.filter(h => h.rank != null);
  const unranked = honorees.filter(h => h.rank == null);
  const edition = ranked[0]?.edition ?? "2026";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Manufacturing Visibility 100 — The {edition} Ranked List</title>
        <meta name="description" content={`The ranked annual recognition of the people moving precision manufacturing forward — programmers, operators, shops, educators, builders, and industry catalysts. Edition ${edition}.`} />
        <link rel="canonical" href="https://jobline.ai/manufacturing-100/honorees" />
        <meta property="og:title" content={`Manufacturing Visibility 100 — ${edition}`} />
        <meta property="og:url" content="https://jobline.ai/manufacturing-100/honorees" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Manufacturing Visibility 100 — ${edition}`,
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: ranked.length,
          itemListElement: ranked.map((h) => ({
            "@type": "ListItem",
            position: h.rank,
            url: h.slug ? `https://jobline.ai/manufacturing-100/${h.slug}` : undefined,
            name: h.nominee_name,
            description: h.display_blurb,
          })),
        })}</script>
      </Helmet>

      <section className="border-b">
        <div className="container max-w-5xl px-4 py-10 sm:py-16 md:py-24">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 sm:mb-4">
            <Award className="h-4 w-4" />
            <span>Edition {edition} · Ranked editorial list</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
            Manufacturing Visibility 100
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
            The {ranked.length} people moving precision manufacturing forward right now — ranked by editorial scoring across impact, innovation, visibility, education, SMB relevance, and momentum.
          </p>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            Disagree with a placement? <Link to="/manufacturing-100/nominate" className="text-primary hover:underline">Nominate someone better.</Link> Pushback is the point.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/manufacturing-100/nominate">Submit a nomination</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/manufacturing-100/methodology">How we scored</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container max-w-5xl py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : honorees.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <h2 className="text-2xl font-semibold">The first edition is in editorial review.</h2>
              <Button asChild className="mt-2">
                <Link to="/manufacturing-100/nominate">Submit a nomination</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {ranked.length > 0 && (
              <div className="space-y-3">
                {ranked.map(h => (
                  <Link
                    key={h.id}
                    to={h.slug ? `/manufacturing-100/${h.slug}` : "/manufacturing-100/honorees"}
                    className="block group"
                  >
                    <Card className="hover:shadow-md hover:border-primary/40 transition-all">
                      <CardContent className="py-4 flex items-start gap-4">
                        <div className="flex flex-col items-center min-w-[64px]">
                          <div className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums">
                            {h.rank}
                          </div>
                          <MovementBadge movement={h.rank_movement} previous={h.previous_rank} current={h.rank} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-lg group-hover:text-primary transition-colors">
                                {h.nominee_name}
                              </div>
                              {(h.nominee_role || h.nominee_company) && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {[h.nominee_role, h.nominee_company].filter(Boolean).join(" · ")}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="shrink-0 hidden sm:inline-flex">
                              {h.category}
                            </Badge>
                          </div>
                          {h.display_blurb && (
                            <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{h.display_blurb}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="sm:hidden text-xs">{h.category}</Badge>
                            {h.score_total != null && (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                Score {h.score_total}/100
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {unranked.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight mb-4">Unranked honorees</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Pending editorial scoring for the next edition.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {unranked.map(h => (
                    <Card key={h.id}>
                      <CardContent className="pt-5 pb-4">
                        <div className="font-medium">{h.nominee_name}</div>
                        {(h.nominee_role || h.nominee_company) && (
                          <div className="text-xs text-muted-foreground">
                            {[h.nominee_role, h.nominee_company].filter(Boolean).join(" · ")}
                          </div>
                        )}
                        <Badge variant="outline" className="mt-2 text-xs">{h.category}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Award, ArrowUp, ArrowDown, Sparkles, ArrowLeft } from "lucide-react";

interface Honoree {
  id: string;
  slug: string | null;
  nominee_name: string;
  nominee_company: string | null;
  nominee_role: string | null;
  nominee_linkedin: string | null;
  nominee_website: string | null;
  category: string;
  display_blurb: string;
  reason: string | null;
  evidence_links: any;
  rank: number | null;
  previous_rank: number | null;
  rank_movement: string | null;
  score_total: number | null;
  edition: string | null;
}

export default function ManufacturingVisibility100Detail() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["mfg-100-honoree", slug],
    queryFn: async (): Promise<Honoree | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("mfg_100_honorees" as any)
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Honoree) ?? null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <Navigate to="/manufacturing-100/honorees" replace />;
  }

  const h = data;
  const evidence = Array.isArray(h.evidence_links) ? (h.evidence_links as string[]) : [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{h.nominee_name} — Manufacturing Visibility 100</title>
        <meta name="description" content={h.display_blurb || `${h.nominee_name} on the Manufacturing Visibility 100.`} />
        <link rel="canonical" href={`https://jobline.ai/manufacturing-100/${h.slug}`} />
        <meta property="og:title" content={`${h.nominee_name} — Manufacturing Visibility 100${h.rank ? ` (#${h.rank})` : ""}`} />
        <meta property="og:description" content={h.display_blurb} />
        <meta property="og:type" content="profile" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: h.nominee_name,
          jobTitle: h.nominee_role ?? undefined,
          worksFor: h.nominee_company ? { "@type": "Organization", name: h.nominee_company } : undefined,
          url: h.nominee_website ?? undefined,
          sameAs: [h.nominee_linkedin, h.nominee_website].filter(Boolean),
          description: h.display_blurb,
        })}</script>
      </Helmet>

      <section className="border-b">
        <div className="container max-w-3xl py-10 md:py-14">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
            <Link to="/manufacturing-100/honorees">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to the list
            </Link>
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Award className="h-4 w-4" />
            <span>Manufacturing Visibility 100 · Edition {h.edition ?? "2026"}</span>
          </div>

          <div className="flex items-start gap-6">
            {h.rank && (
              <div className="text-5xl md:text-7xl font-bold tracking-tight tabular-nums leading-none">
                #{h.rank}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{h.nominee_name}</h1>
              {(h.nominee_role || h.nominee_company) && (
                <p className="text-lg text-muted-foreground mt-1">
                  {[h.nominee_role, h.nominee_company].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline">{h.category}</Badge>
                {h.score_total != null && (
                  <Badge variant="secondary" className="tabular-nums">Score {h.score_total}/100</Badge>
                )}
                {h.rank_movement === "new" && (
                  <Badge className="bg-primary/15 text-primary border-primary/30">
                    <Sparkles className="h-3 w-3 mr-1" /> New this year
                  </Badge>
                )}
                {h.rank_movement === "up" && h.previous_rank && h.rank && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    <ArrowUp className="h-3 w-3 mr-1" /> Up {h.previous_rank - h.rank} from #{h.previous_rank}
                  </Badge>
                )}
                {h.rank_movement === "down" && h.previous_rank && h.rank && (
                  <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30">
                    <ArrowDown className="h-3 w-3 mr-1" /> Down {h.rank - h.previous_rank} from #{h.previous_rank}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-3xl py-10 space-y-8">
        {h.display_blurb && (
          <div>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Why they're on the list</h2>
            <p className="text-lg leading-relaxed">{h.display_blurb}</p>
          </div>
        )}

        {h.reason && h.reason !== h.display_blurb && (
          <div>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Editorial citation</h2>
            <p className="text-foreground/80 whitespace-pre-wrap">{h.reason}</p>
          </div>
        )}

        {evidence.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Evidence</h2>
            <ul className="space-y-1">
              {evidence.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                    <ExternalLink className="h-3 w-3" /> {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {h.nominee_linkedin && (
            <Button asChild variant="outline" size="sm">
              <a href={h.nominee_linkedin} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" /> LinkedIn
              </a>
            </Button>
          )}
          {h.nominee_website && (
            <Button asChild variant="outline" size="sm">
              <a href={h.nominee_website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" /> Website
              </a>
            </Button>
          )}
        </div>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div>
              <h3 className="font-semibold">Think someone deserves this spot more?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The list is rebuilt every year. Public nominations carry equal weight to editorial picks.
              </p>
            </div>
            <Button asChild>
              <Link to="/manufacturing-100/nominate">Nominate someone</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

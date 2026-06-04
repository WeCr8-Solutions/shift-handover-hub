import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Award } from "lucide-react";

interface Honoree {
  id: string;
  nominee_name: string;
  nominee_company: string | null;
  nominee_role: string | null;
  nominee_linkedin: string | null;
  nominee_website: string | null;
  category: string;
  display_blurb: string;
  rank: number | null;
  published_at: string;
}

export default function ManufacturingVisibility100Honorees() {
  const { data: honorees = [], isLoading } = useQuery({
    queryKey: ["mfg-100-honorees"],
    queryFn: async (): Promise<Honoree[]> => {
      const { data, error } = await supabase
        .from("mfg_100_honorees" as any)
        .select("*")
        .order("rank", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Honoree[];
    },
  });

  const byCategory = honorees.reduce<Record<string, Honoree[]>>((acc, h) => {
    (acc[h.category] ??= []).push(h);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Manufacturing Visibility 100 Honorees — Jobline</title>
        <meta name="description" content="The annual editorial recognition of programmers, operators, shops, educators, and builders advancing precision manufacturing." />
        <link rel="canonical" href="https://jobline.ai/manufacturing-100/honorees" />
        <meta property="og:title" content="Manufacturing Visibility 100 Honorees" />
        <meta property="og:url" content="https://jobline.ai/manufacturing-100/honorees" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Manufacturing Visibility 100 Honorees",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: honorees.length,
          itemListElement: honorees.map((h, i) => ({
            "@type": "ListItem",
            position: h.rank ?? i + 1,
            name: h.nominee_name,
            description: h.display_blurb,
          })),
        })}</script>
      </Helmet>

      <section className="border-b">
        <div className="container max-w-5xl py-16 md:py-24">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Award className="h-4 w-4" />
            <span>Annual editorial recognition</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Manufacturing Visibility 100
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            The programmers, operators, shops, educators, and builders moving precision manufacturing forward. Updated annually by the Jobline editorial team.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/manufacturing-100/nominate">Submit a nomination</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/manufacturing-100/methodology">How we choose</Link>
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
              <p className="text-muted-foreground max-w-md mx-auto">
                Nominations are being scored against our published methodology. The inaugural list will appear here when it's ready.
              </p>
              <Button asChild className="mt-2">
                <Link to="/manufacturing-100/nominate">Submit a nomination</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {Object.entries(byCategory).map(([cat, list]) => (
              <div key={cat}>
                <h2 className="text-2xl font-semibold tracking-tight mb-4 capitalize">{cat.replace(/_/g, " ")}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {list.map(h => (
                    <Card key={h.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold">{h.nominee_name}</div>
                            {(h.nominee_role || h.nominee_company) && (
                              <div className="text-sm text-muted-foreground">
                                {[h.nominee_role, h.nominee_company].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </div>
                          {h.rank && <Badge variant="secondary">#{h.rank}</Badge>}
                        </div>
                        {h.display_blurb && (
                          <p className="text-sm text-foreground/80">{h.display_blurb}</p>
                        )}
                        <div className="flex gap-3 pt-1">
                          {h.nominee_linkedin && (
                            <a href={h.nominee_linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> LinkedIn
                            </a>
                          )}
                          {h.nominee_website && (
                            <a href={h.nominee_website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Website
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

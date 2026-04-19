/**
 * /employers — public directory of employers hiring on JobLine.
 * Anonymous-readable. Driven by list_public_employers RPC.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Search } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

interface EmployerListItem {
  id: string;
  name: string;
  public_slug: string;
  employer_tagline: string | null;
  employer_logo_url: string | null;
  employer_cover_url: string | null;
  employer_locations: string[] | null;
  employer_industries: string[] | null;
}

export default function EmployersIndex() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // simple debounce
  useState(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  });

  const { data: employers, isLoading } = useQuery({
    queryKey: ["public-employers", debounced],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_public_employers", {
        _search: debounced || undefined,
        _limit: 60,
      });
      if (error) throw error;
      return (data ?? []) as EmployerListItem[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Employers Hiring CNC & Manufacturing Talent | JobLine</title>
        <meta
          name="description"
          content="Browse manufacturers and machine shops hiring CNC operators, machinists and technicians on JobLine."
        />
        <link rel="canonical" href="https://jobline.ai/employers" />
      </Helmet>

      <MarketingNav />

      <header className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-12 md:py-16 max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">Employers hiring on JobLine</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Verified manufacturers and machine shops looking for CNC operators, machinists, and skilled trades.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDebounced(e.target.value);
              }}
              placeholder="Search by company name or tagline"
              className="pl-9"
            />
          </div>
        </div>
      </header>

      <div className="container py-10">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-16">Loading employers…</div>
        ) : !employers || employers.length === 0 ? (
          <Card className="max-w-xl mx-auto">
            <CardContent className="py-12 text-center">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-1">No employers yet</h2>
              <p className="text-muted-foreground text-sm mb-5">
                Be the first to claim your employer page and post jobs to the JobLine talent network.
              </p>
              <Button asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employers.map((e) => (
              <Link key={e.id} to={`/employers/${e.public_slug}`} className="group">
                <Card className="h-full overflow-hidden hover:border-primary transition-colors">
                  <div
                    className="h-20 bg-gradient-to-br from-primary/20 to-primary/5 bg-cover bg-center"
                    style={e.employer_cover_url ? { backgroundImage: `url(${e.employer_cover_url})` } : undefined}
                  />
                  <CardContent className="p-4 -mt-8">
                    <div className="h-14 w-14 rounded-lg bg-card border-4 border-background overflow-hidden flex items-center justify-center mb-3">
                      {e.employer_logo_url ? (
                        <img src={e.employer_logo_url} alt={e.name} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{e.name}</h3>
                    {e.employer_tagline && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{e.employer_tagline}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {e.employer_locations?.slice(0, 2).map((loc) => (
                        <Badge key={loc} variant="secondary" className="gap-1 text-[10px]">
                          <MapPin className="w-3 h-3" />{loc}
                        </Badge>
                      ))}
                      {e.employer_industries?.slice(0, 2).map((ind) => (
                        <Badge key={ind} variant="outline" className="text-[10px]">{ind}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <MarketingFooter />
    </div>
  );
}

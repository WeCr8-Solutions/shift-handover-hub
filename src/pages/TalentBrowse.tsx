import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, getRegionsForCountry } from "@/lib/talent/locations";
import {
  Search,
  MapPin,
  ShieldCheck,
  Award,
  X,
  ArrowRight,
  Filter,
} from "lucide-react";

interface Row {
  user_id: string;
  public_username: string;
  display_name: string | null;
  headline: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  years_experience: number | null;
  open_to_work: boolean;
  willing_to_relocate: boolean;
  avatar_url: string | null;
  public_published_at: string | null;
  cert_count: number;
  verified_cert_count: number;
}

const CERT_PRESETS = [
  "OAP",
  "GCA",
  "AS9100",
  "ISO 9001",
  "OSHA 10",
  "OSHA 30",
  "Forklift",
  "First Aid / CPR",
];

export default function TalentBrowse() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") ?? "";
  const city = params.get("city") ?? "";
  const region = params.get("region") ?? "";
  const country = params.get("country") ?? "";
  const cert = params.get("cert") ?? "";
  const openOnly = params.get("open") === "1";

  const regions = useMemo(() => getRegionsForCountry(country) ?? [], [country]);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc(
        "list_public_operator_profiles",
        {
          _limit: 60,
          _search: q || null,
          _city: city || null,
          _region: region || null,
          _country: country || null,
          _certification: cert || null,
          _open_to_work: openOnly ? true : null,
        },
      );
      if (cancelled) return;
      if (error) console.error("[talent-browse]", error);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [q, city, region, country, cert, openOnly]);

  const activeFilterCount =
    [q, city, region, country, cert].filter(Boolean).length + (openOnly ? 1 : 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse Verified Manufacturing Talent — JobLine",
    url: "https://jobline.ai/talent/browse",
    description:
      "Search public profiles of CNC machinists and shop-floor operators by city, state, profession, and certification.",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Talent — Search Machinists by City, State & Certification"
        description="Free public directory of verified CNC machinists and shop-floor operators. Filter by city, state, country, profession, and certifications including OAP, GCA, AS9100, and OSHA."
        keywords="machinist directory, cnc operator search, find machinists, OAP certified, GCA certified, manufacturing talent search"
        canonical="/talent/browse"
        jsonLd={jsonLd}
      />
      <MarketingNav />

      {/* Header */}
      <section className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container max-w-6xl py-8 md:py-12">
          <Badge variant="outline" className="mb-3 gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Public Talent Directory
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Browse verified machinists & operators
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Filter by city, state, profession, or certification. Free for
            everyone — no signup required.
          </p>
        </div>
      </section>

      <div className="container max-w-6xl py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Filters */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </h2>
            {activeFilterCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAll}
                className="h-8 gap-1 text-xs"
              >
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="q" className="text-xs">
              Profession / keyword
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="q"
                placeholder="CNC, Swiss, programmer…"
                value={q}
                onChange={(e) => update({ q: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs">City</Label>
            <Input
              id="city"
              placeholder="e.g. Houston"
              value={city}
              onChange={(e) => update({ city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Country</Label>
            <Select
              value={country || "any"}
              onValueChange={(v) =>
                update({ country: v === "any" ? null : v, region: null })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any country</SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {regions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">State / Province</Label>
              <Select
                value={region || "any"}
                onValueChange={(v) =>
                  update({ region: v === "any" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any region</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.code} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cert" className="text-xs">Certification</Label>
            <Input
              id="cert"
              placeholder="OAP, AS9100, OSHA…"
              value={cert}
              onChange={(e) => update({ cert: e.target.value })}
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {CERT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update({ cert: c === cert ? null : c })}
                  className={`text-xs px-2 py-0.5 rounded-full border transition ${
                    cert === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="open" className="text-sm cursor-pointer">
              Open to work only
            </Label>
            <Switch
              id="open"
              checked={openOnly}
              onCheckedChange={(v) => update({ open: v ? "1" : null })}
            />
          </div>
        </aside>

        {/* Results */}
        <main>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Searching…"
                : `${rows.length} ${rows.length === 1 ? "profile" : "profiles"} found`}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/talent" className="gap-1">
                Talent home <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground space-y-3">
                <p>No public profiles match these filters.</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rows.map((p) => (
                <Link
                  key={p.user_id}
                  to={`/talent/${p.public_username}`}
                  className="block group"
                >
                  <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          {p.avatar_url && (
                            <AvatarImage
                              src={p.avatar_url}
                              alt={p.display_name ?? "Operator"}
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(p.display_name ?? p.public_username ?? "?")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {p.display_name ?? p.public_username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{p.public_username}
                          </p>
                        </div>
                        {p.open_to_work && (
                          <Badge className="bg-green-500/10 text-green-700 border-green-500/30 shrink-0">
                            Open
                          </Badge>
                        )}
                      </div>

                      {p.headline && (
                        <p className="text-sm line-clamp-2">{p.headline}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {(p.location_city || p.location_region) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[p.location_city, p.location_region]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                        {p.years_experience != null && (
                          <span>{p.years_experience} yrs</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {p.verified_cert_count > 0 && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs border-primary/40 text-primary"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {p.verified_cert_count} verified
                          </Badge>
                        )}
                        {p.cert_count > p.verified_cert_count && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Award className="w-3 h-3" />
                            {p.cert_count - p.verified_cert_count} more cert
                            {p.cert_count - p.verified_cert_count === 1
                              ? ""
                              : "s"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      <MarketingFooter />
    </div>
  );
}

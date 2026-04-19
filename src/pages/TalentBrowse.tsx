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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, getRegionsForCountry } from "@/lib/talent/locations";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  ShieldCheck,
  Award,
  X,
  ArrowRight,
  Filter,
  Plane,
  Wrench,
  Star,
  SlidersHorizontal,
  Share2,
  CheckCircle2,
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
  top_skills: string[] | null;
  top_machines: string[] | null;
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

const SKILL_PRESETS = [
  "CNC Programming",
  "Setup",
  "GD&T",
  "Welding",
  "Hydraulics",
  "Diesel Diagnostics",
  "Waterjet",
  "Mazatrol",
  "SolidWorks",
  "Mastercam",
];

const MACHINE_PRESETS = [
  "CNC Mill",
  "CNC Lathe",
  "Swiss",
  "EDM",
  "Waterjet",
  "Press Brake",
  "MIG Welder",
  "Diesel Engine",
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recently published" },
  { value: "experience", label: "Most experienced" },
  { value: "verified", label: "Most verified certs" },
  { value: "name", label: "Name (A–Z)" },
];

export default function TalentBrowse() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const q = params.get("q") ?? "";
  const city = params.get("city") ?? "";
  const region = params.get("region") ?? "";
  const country = params.get("country") ?? "";
  const cert = params.get("cert") ?? "";
  const skill = params.get("skill") ?? "";
  const machine = params.get("machine") ?? "";
  const minYears = params.get("years") ?? "";
  const openOnly = params.get("open") === "1";
  const relocateOnly = params.get("relocate") === "1";
  const verifiedOnly = params.get("verified") === "1";
  const sort = params.get("sort") ?? "recent";

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
          _limit: 100,
          _search: q || null,
          _city: city || null,
          _region: region || null,
          _country: country || null,
          _certification: cert || null,
          _open_to_work: openOnly ? true : null,
          _skill: skill || null,
          _machine: machine || null,
          _min_years: minYears ? parseInt(minYears, 10) : null,
          _relocate: relocateOnly ? true : null,
          _verified_only: verifiedOnly ? true : null,
          _sort: sort,
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
  }, [q, city, region, country, cert, skill, machine, minYears, openOnly, relocateOnly, verifiedOnly, sort]);

  const activeFilterCount =
    [q, city, region, country, cert, skill, machine, minYears].filter(Boolean).length +
    (openOnly ? 1 : 0) +
    (relocateOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "JobLine Talent Search", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Search link copied to clipboard");
      }
    } catch {
      // user cancelled
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse Verified Manufacturing & Skilled-Trades Talent — JobLine",
    url: "https://jobline.ai/talent/browse",
    description:
      "Search public profiles of verified machinists, operators, welders, diesel mechanics, and skilled-trades professionals by city, state, skills, equipment, and certifications.",
  };

  const Filters = (
    <div className="space-y-5">
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
            <X className="w-3 h-3" /> Clear all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="q" className="text-xs">Profession / keyword</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="q"
            placeholder="CNC, welder, diesel, programmer…"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skill" className="text-xs flex items-center gap-1">
          <Star className="w-3 h-3" /> Skill
        </Label>
        <Input
          id="skill"
          placeholder="Welding, GD&T, Mazatrol…"
          value={skill}
          onChange={(e) => update({ skill: e.target.value })}
        />
        <div className="flex flex-wrap gap-1 pt-1">
          {SKILL_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ skill: s === skill ? null : s })}
              className={`text-xs px-2 py-0.5 rounded-full border transition ${
                skill === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="machine" className="text-xs flex items-center gap-1">
          <Wrench className="w-3 h-3" /> Equipment / machine
        </Label>
        <Input
          id="machine"
          placeholder="Haas, Waterjet, Press Brake…"
          value={machine}
          onChange={(e) => update({ machine: e.target.value })}
        />
        <div className="flex flex-wrap gap-1 pt-1">
          {MACHINE_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update({ machine: m === machine ? null : m })}
              className={`text-xs px-2 py-0.5 rounded-full border transition ${
                machine === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {m}
            </button>
          ))}
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
            onValueChange={(v) => update({ region: v === "any" ? null : v })}
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
        <Label className="text-xs">Min years of experience</Label>
        <Select
          value={minYears || "any"}
          onValueChange={(v) => update({ years: v === "any" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="1">1+ years</SelectItem>
            <SelectItem value="3">3+ years</SelectItem>
            <SelectItem value="5">5+ years</SelectItem>
            <SelectItem value="10">10+ years</SelectItem>
            <SelectItem value="15">15+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      <div className="space-y-2 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="open" className="text-sm cursor-pointer">
            Open to work only
          </Label>
          <Switch
            id="open"
            checked={openOnly}
            onCheckedChange={(v) => update({ open: v ? "1" : null })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="relocate" className="text-sm cursor-pointer flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5" /> Willing to relocate
          </Label>
          <Switch
            id="relocate"
            checked={relocateOnly}
            onCheckedChange={(v) => update({ relocate: v ? "1" : null })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="verified" className="text-sm cursor-pointer flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified certs only
          </Label>
          <Switch
            id="verified"
            checked={verifiedOnly}
            onCheckedChange={(v) => update({ verified: v ? "1" : null })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Talent — Search Machinists, Welders & Skilled Trades by City"
        description="Free public directory of verified CNC machinists, welders, diesel mechanics, and shop-floor operators. Filter by city, state, skills, equipment, and certifications including OAP, GCA, AS9100, and OSHA."
        keywords="machinist directory, cnc operator search, welder jobs, diesel mechanic, find skilled trades, OAP certified, GCA certified, manufacturing talent search"
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
            Browse verified machinists, operators & skilled trades
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Filter by city, state, skill, equipment, or certification. Free for
            everyone — no signup required.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Public profiles only
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Verified OAP / GCA badges
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" /> No paywall
            </span>
          </div>
        </div>
      </section>

      <div className="container max-w-6xl py-6 md:py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
        {/* Desktop filters */}
        <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          {Filters}
        </aside>

        {/* Results */}
        <main>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Searching…"
                : `${rows.length} ${rows.length === 1 ? "profile" : "profiles"} found`}
            </p>
            <div className="flex items-center gap-2">
              {/* Mobile filter trigger */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-1.5">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] sm:w-[400px] overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Refine search</SheetTitle>
                  </SheetHeader>
                  {Filters}
                  <Button className="w-full mt-6" onClick={() => setMobileFiltersOpen(false)}>
                    Show {rows.length} results
                  </Button>
                </SheetContent>
              </Sheet>

              <Select value={sort} onValueChange={(v) => update({ sort: v === "recent" ? null : v })}>
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleShare} className="gap-1">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {q && <FilterChip label={`"${q}"`} onClear={() => update({ q: null })} />}
              {skill && <FilterChip label={`Skill: ${skill}`} onClear={() => update({ skill: null })} />}
              {machine && <FilterChip label={`Equipment: ${machine}`} onClear={() => update({ machine: null })} />}
              {cert && <FilterChip label={`Cert: ${cert}`} onClear={() => update({ cert: null })} />}
              {city && <FilterChip label={city} onClear={() => update({ city: null })} />}
              {region && <FilterChip label={region} onClear={() => update({ region: null })} />}
              {country && <FilterChip label={country} onClear={() => update({ country: null })} />}
              {minYears && <FilterChip label={`${minYears}+ yrs`} onClear={() => update({ years: null })} />}
              {openOnly && <FilterChip label="Open to work" onClear={() => update({ open: null })} />}
              {relocateOnly && <FilterChip label="Relocate" onClear={() => update({ relocate: null })} />}
              {verifiedOnly && <FilterChip label="Verified only" onClear={() => update({ verified: null })} />}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52" />
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
                <p className="text-xs pt-2">
                  Are you a skilled-trades professional?{" "}
                  <Link to="/talent" className="text-primary hover:underline">
                    Build your free profile →
                  </Link>
                </p>
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
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {p.open_to_work && (
                            <Badge className="bg-green-500/10 text-green-700 border-green-500/30 text-[10px] px-1.5 py-0">
                              Open
                            </Badge>
                          )}
                          {p.willing_to_relocate && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                              <Plane className="w-2.5 h-2.5" /> Relocate
                            </Badge>
                          )}
                        </div>
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
                          <span>{p.years_experience} yrs exp</span>
                        )}
                      </div>

                      {(p.top_skills?.length || p.top_machines?.length) ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {(p.top_skills ?? []).slice(0, 3).map((s) => (
                            <Badge key={`s-${s}`} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {s}
                            </Badge>
                          ))}
                          {(p.top_machines ?? []).slice(0, 2).map((m) => (
                            <Badge key={`m-${m}`} variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                              <Wrench className="w-2.5 h-2.5" /> {m}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2 flex-wrap pt-1 border-t mt-2 -mx-1 px-1 pt-3">
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
                            {p.cert_count - p.verified_cert_count === 1 ? "" : "s"}
                          </Badge>
                        )}
                        {p.cert_count === 0 && (
                          <span className="text-[10px] text-muted-foreground">Profile published</span>
                        )}
                        <span className="ml-auto text-xs text-primary opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* CTA footer */}
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Don't see what you need?</p>
                <p className="text-sm text-muted-foreground">
                  Employers can run advanced searches, save lists, and contact candidates directly.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/talent">Talent home</Link>
                </Button>
                <Button asChild>
                  <Link to="/talent/search" className="gap-1">
                    Employer search <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <MarketingFooter />
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition"
    >
      {label}
      <X className="w-3 h-3" />
    </button>
  );
}

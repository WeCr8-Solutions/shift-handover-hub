/**
 * /employers/browse — public employer directory with rich filters.
 * Mirrors the talent browse experience for employer-side discovery.
 * Anonymous-readable. Driven by list_public_employers RPC.
 */
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
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Building2,
  X,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Share2,
  Briefcase,
  CheckCircle2,
  Factory,
} from "lucide-react";

interface Row {
  id: string;
  name: string;
  public_slug: string;
  employer_tagline: string | null;
  employer_logo_url: string | null;
  employer_cover_url: string | null;
  employer_locations: string[] | null;
  employer_industries: string[] | null;
  open_jobs_count: number;
  published_at: string | null;
}

const INDUSTRY_PRESETS = [
  "Aerospace",
  "Automotive",
  "Medical",
  "Defense",
  "Oil & Gas",
  "Energy",
  "Robotics",
  "Job Shop",
  "Production",
  "Prototype",
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recently joined" },
  { value: "jobs", label: "Most open jobs" },
  { value: "name", label: "Name (A–Z)" },
];

export default function EmployerBrowse() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const q = params.get("q") ?? "";
  const industry = params.get("industry") ?? "";
  const location = params.get("location") ?? "";
  const hiringOnly = params.get("hiring") === "1";
  const sort = params.get("sort") ?? "recent";

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
      const { data, error } = await (supabase as any).rpc("list_public_employers", {
        _limit: 100,
        _search: q || null,
        _industry: industry || null,
        _location: location || null,
        _hiring_only: hiringOnly ? true : null,
        _sort: sort,
      });
      if (cancelled) return;
      if (error) console.error("[employer-browse]", error);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [q, industry, location, hiringOnly, sort]);

  const activeFilterCount =
    [q, industry, location].filter(Boolean).length + (hiringOnly ? 1 : 0);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "JobLine Employers", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Search link copied to clipboard");
      }
    } catch {
      // user cancelled
    }
  };

  const totalOpenJobs = useMemo(
    () => rows.reduce((sum, r) => sum + (r.open_jobs_count || 0), 0),
    [rows],
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse Manufacturers & Employers Hiring — JobLine",
    url: "https://jobline.ai/employers/browse",
    description:
      "Search verified manufacturing employers, machine shops, and skilled-trades companies hiring on JobLine. Filter by industry, location, and active job openings.",
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
        <Label htmlFor="q" className="text-xs">Company name / keyword</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="q"
            placeholder="Acme, aerospace, swiss…"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry" className="text-xs flex items-center gap-1">
          <Factory className="w-3 h-3" /> Industry
        </Label>
        <Input
          id="industry"
          placeholder="Aerospace, Medical, Defense…"
          value={industry}
          onChange={(e) => update({ industry: e.target.value })}
        />
        <div className="flex flex-wrap gap-1 pt-1">
          {INDUSTRY_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ industry: s === industry ? null : s })}
              className={`text-xs px-2 py-0.5 rounded-full border transition ${
                industry === s
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
        <Label htmlFor="location" className="text-xs flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Location
        </Label>
        <Input
          id="location"
          placeholder="City, state, or country"
          value={location}
          onChange={(e) => update({ location: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <Label htmlFor="hiring" className="text-sm cursor-pointer flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" /> Actively hiring only
        </Label>
        <Switch
          id="hiring"
          checked={hiringOnly}
          onCheckedChange={(v) => update({ hiring: v ? "1" : null })}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Employers — Manufacturers & Machine Shops Hiring"
        description="Free public directory of verified manufacturing employers, machine shops, and skilled-trades companies hiring on JobLine. Filter by industry, location, and active jobs."
        keywords="manufacturers hiring, machine shop jobs, aerospace employers, defense employers, skilled trades companies, jobline employers"
        canonical="/employers/browse"
        jsonLd={jsonLd}
      />
      <MarketingNav />

      {/* Header */}
      <section className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container max-w-6xl py-8 md:py-12">
          <Badge variant="outline" className="mb-3 gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Public Employer Directory
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Browse manufacturers & employers hiring on JobLine
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Filter by industry, location, or active openings. Free for everyone — no signup required.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Verified employers only
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-primary" /> {totalOpenJobs} open jobs
            </span>
            <span className="flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-primary" /> No paywall
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
                : `${rows.length} ${rows.length === 1 ? "employer" : "employers"} found`}
            </p>
            <div className="flex items-center gap-2">
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
              {industry && <FilterChip label={`Industry: ${industry}`} onClear={() => update({ industry: null })} />}
              {location && <FilterChip label={`Location: ${location}`} onClear={() => update({ location: null })} />}
              {hiringOnly && <FilterChip label="Hiring now" onClear={() => update({ hiring: null })} />}
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
                <p>No employers match these filters.</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear filters
                  </Button>
                )}
                <p className="text-xs pt-2">
                  Are you a manufacturer or shop?{" "}
                  <Link to="/auth" className="text-primary hover:underline">
                    Claim your employer page →
                  </Link>
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rows.map((e) => (
                <Link
                  key={e.id}
                  to={`/employers/${e.public_slug}`}
                  className="block group"
                >
                  <Card className="h-full overflow-hidden transition-all group-hover:border-primary group-hover:shadow-md">
                    <div
                      className="h-20 bg-gradient-to-br from-primary/20 to-primary/5 bg-cover bg-center"
                      style={
                        e.employer_cover_url
                          ? { backgroundImage: `url(${e.employer_cover_url})` }
                          : undefined
                      }
                    />
                    <CardContent className="p-4 -mt-8 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-14 w-14 rounded-lg bg-card border-4 border-background overflow-hidden flex items-center justify-center shrink-0">
                          {e.employer_logo_url ? (
                            <img
                              src={e.employer_logo_url}
                              alt={e.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        {e.open_jobs_count > 0 && (
                          <Badge className="bg-green-500/10 text-green-700 border-green-500/30 mt-9 gap-1">
                            <Briefcase className="w-3 h-3" />
                            {e.open_jobs_count} open
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {e.name}
                        </h3>
                        {e.employer_tagline && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {e.employer_tagline}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {e.employer_locations?.slice(0, 2).map((loc) => (
                          <Badge key={loc} variant="secondary" className="gap-1 text-[10px]">
                            <MapPin className="w-3 h-3" />
                            {loc}
                          </Badge>
                        ))}
                        {e.employer_industries?.slice(0, 2).map((ind) => (
                          <Badge key={ind} variant="outline" className="text-[10px]">
                            {ind}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-end pt-1 border-t -mx-1 px-1 pt-3">
                        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                          View employer <ArrowRight className="w-3 h-3" />
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
                <p className="font-semibold">Are you a manufacturer or shop owner?</p>
                <p className="text-sm text-muted-foreground">
                  Build your employer page, post jobs, and reach verified machinists & operators.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/talent/browse">Browse talent</Link>
                </Button>
                <Button asChild>
                  <Link to="/employers/dashboard" className="gap-1">
                    Employer dashboard <ArrowRight className="w-4 h-4" />
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

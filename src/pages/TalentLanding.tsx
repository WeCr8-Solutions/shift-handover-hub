import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  ShieldCheck,
  Award,
  Briefcase,
  MapPin,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Users,
  CheckCircle2,
  Building2,
} from "lucide-react";

interface PublicProfileSummary {
  user_id: string;
  public_username: string;
  display_name: string | null;
  headline: string | null;
  location_city: string | null;
  location_region: string | null;
  years_experience: number | null;
  open_to_work: boolean;
  willing_to_relocate: boolean;
  avatar_url: string | null;
  public_published_at: string | null;
}

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Verified credentials",
    desc: "OAP and GCA certificates issued through JobLine are cryptographically verifiable on every profile — no resume bluffing.",
  },
  {
    icon: Award,
    title: "Portable across employers",
    desc: "Operators own their record. Move shops, take your machine qualifications, training history, and references with you.",
  },
  {
    icon: Briefcase,
    title: "Built for hiring",
    desc: "Employers search by machine, control type, GD&T proficiency, and location — and reach out directly through the platform.",
  },
];

const HOW_OPERATOR = [
  { step: "1", title: "Create your profile", desc: "Sign up free, add work history, skills, machines, and education." },
  { step: "2", title: "Auto-import certs", desc: "Any OAP or GCA cert issued to your email syncs in one click." },
  { step: "3", title: "Choose visibility", desc: "Stay private, open to verified employers only, or fully public." },
  { step: "4", title: "Get hired", desc: "Employers message you in-app — no recruiter spam, no scraping." },
];

const HOW_EMPLOYER = [
  { step: "1", title: "Activate Talent search", desc: "Included with any paid OAP or Team subscription." },
  { step: "2", title: "Filter & shortlist", desc: "Search by machine type, control, certifications, location, and years experience." },
  { step: "3", title: "Reach out in-app", desc: "Send a message — candidates accept or decline; no contact info leaks." },
  { step: "4", title: "Onboard with OAP", desc: "Move new hires straight into your Operator Acceptance Program." },
];

export default function TalentLanding() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<PublicProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).rpc("list_public_operator_profiles", {
        _limit: 12,
        _search: null,
      });
      if (!cancelled) {
        setProfiles((data ?? []) as PublicProfileSummary[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/talent/search?q=${encodeURIComponent(q)}` : "/talent/search");
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "JobLine Talent — Verified manufacturing operators & machinists",
    url: "https://jobline.ai/talent",
    description:
      "Browse verified CNC machinists and shop-floor operators with portable OAP and GCA Academy credentials. Build your profile, record your career history, and find employment.",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Talent — Verified Machinists & Operators"
        description="Find verified CNC machinists and operators with portable OAP/GCA credentials, or build your own profile to record your career history and get hired."
        keywords="cnc machinist jobs, manufacturing operators, OAP certified, machinist resume, shop floor talent, CNC operator hiring, portable certifications"
        canonical="/talent"
        jsonLd={jsonLd}
      />
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" aria-hidden />
        <div className="container relative py-16 md:py-24 max-w-6xl">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> JobLine Talent Network
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Verified machinists.
            <br />
            <span className="text-primary">Portable credentials.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            JobLine is the career home for CNC operators and the hiring stack for manufacturers. Build a
            verified profile from your real shop-floor history — or find the talent you've been searching for.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mazak, Fanuc, GD&T, Swiss-turn…"
                className="pl-9 h-12"
              />
            </div>
            <Button type="submit" size="lg" className="gap-2">
              Search <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Button asChild variant="outline">
              <Link to="/auth?signup=1" className="gap-2">
                <Users className="w-4 h-4" /> Build my profile (free)
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/oap" className="gap-2">
                <GraduationCap className="w-4 h-4" /> About OAP credentials
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container py-16 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUE_PROPS.map((v) => (
            <Card key={v.title} className="border-2">
              <CardHeader>
                <v.icon className="w-8 h-8 text-primary" />
                <CardTitle className="mt-2">{v.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{v.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent public profiles */}
      <section className="border-y bg-muted/30">
        <div className="container py-16 max-w-6xl">
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold">Recently published profiles</h2>
              <p className="text-muted-foreground mt-1">
                Operators who've made their profile public. Click through to see their verified record.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/talent/search" className="gap-2">
                Employer search <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No public profiles yet — be the first.
                <div className="mt-4">
                  <Button asChild>
                    <Link to="/auth?signup=1">Create your profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((p) => (
                <Link key={p.user_id} to={`/talent/${p.public_username}`} className="block group">
                  <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.display_name ?? "Operator"} />}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(p.display_name ?? "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{p.display_name ?? p.public_username}</p>
                          <p className="text-xs text-muted-foreground">@{p.public_username}</p>
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
                            {[p.location_city, p.location_region].filter(Boolean).join(", ")}
                          </span>
                        )}
                        {p.years_experience != null && <span>{p.years_experience} yrs</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* For operators */}
      <section className="container py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <Badge className="mb-3" variant="secondary">For operators</Badge>
            <h2 className="text-3xl font-bold">A career file you actually own</h2>
            <p className="mt-3 text-muted-foreground">
              Stop rebuilding your resume every time you change jobs. Record every machine you've qualified
              on, every certification you've earned, every project you've contributed to — once, then carry
              it for your career.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Free forever for individuals",
                "Auto-imports verified OAP/GCA Academy certificates",
                "Three privacy tiers: private, employers-only, public",
                "Transfer credentials to a new employer with a single token",
                "JSON-LD person schema — discoverable on Google",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 gap-2">
              <Link to="/auth?signup=1">
                Create my profile <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {HOW_OPERATOR.map((s) => (
              <div key={s.step} className="flex gap-4 p-4 rounded-lg border bg-card">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For employers */}
      <section className="border-t bg-muted/30">
        <div className="container py-16 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-3 lg:order-2">
              {HOW_EMPLOYER.map((s) => (
                <div key={s.step} className="flex gap-4 p-4 rounded-lg border bg-card">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:order-1">
              <Badge className="mb-3" variant="secondary">For employers</Badge>
              <h2 className="text-3xl font-bold">Hire the talent already in our pipeline</h2>
              <p className="mt-3 text-muted-foreground">
                Every operator on JobLine has been onboarded by another shop, qualified on real machines,
                and tested through OAP. Filter by exactly the skills you need — then onboard them straight
                into your own Operator Acceptance Program.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Verified credentials with cryptographic proof",
                  "Filter by machine, control type, GD&T, location, experience",
                  "In-app messaging — no email scraping, no recruiter middlemen",
                  "Saved candidate lists with hiring stages",
                  "One-click onboard into your own OAP enrollment",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 mt-8">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/talent/search">
                    <Building2 className="w-4 h-4" /> Open Talent Search
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Your shop-floor career, in one verified place.</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Free for operators, integrated with the JobLine shift handoff and digital expeditor system you
          already work in every day.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/auth?signup=1">Create free profile</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/oap">Learn about OAP</Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

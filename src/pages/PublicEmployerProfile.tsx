/**
 * /employers/:slug — public-facing employer profile page.
 * Anonymous-readable. Driven by the get_public_employer + get_public_employer_jobs RPCs
 * which return only safe branding/job columns (never billing or subscription data).
 */
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useProfileViewTracker } from "@/hooks/useProfileViewTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Globe, Linkedin, MapPin, Mail, Briefcase, ArrowLeft } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

interface Employer {
  id: string;
  name: string;
  public_slug: string | null;
  employer_tagline: string | null;
  employer_about: string | null;
  employer_logo_url: string | null;
  employer_cover_url: string | null;
  employer_website: string | null;
  employer_linkedin: string | null;
  employer_hiring_email: string | null;
  employer_locations: string[] | null;
  employer_industries: string[] | null;
  employer_paid_contact: boolean;
  logo_url: string | null;
  description: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  remote: boolean;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  required_skills: string[] | null;
  published_at: string | null;
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return min ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
}

export default function PublicEmployerProfile() {
  const { slug } = useParams<{ slug: string }>();

  const { data: employer, isLoading, error } = useQuery({
    queryKey: ["public-employer", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_employer", { _slug: slug! });
      if (error) throw error;
      return (data?.[0] as Employer | undefined) ?? null;
    },
    enabled: !!slug,
  });

  const { data: jobs } = useQuery({
    queryKey: ["public-employer-jobs", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_employer_jobs", { _slug: slug! });
      if (error) throw error;
      return (data ?? []) as Job[];
    },
    enabled: !!slug && !!employer,
  });

  useProfileViewTracker("employer", slug ?? null);

  const logo = employer?.employer_logo_url || employer?.logo_url;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingNav />
        <div className="container py-16 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (error || !employer) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingNav />
        <div className="container py-16 max-w-xl text-center">
          <h1 className="text-2xl font-semibold mb-2">Employer not found</h1>
          <p className="text-muted-foreground mb-6">
            This employer page either doesn't exist or isn't public.
          </p>
          <Button asChild variant="outline">
            <Link to="/employers"><ArrowLeft className="w-4 h-4 mr-2" />Browse all employers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const title = `${employer.name} — Hiring on JobLine`;
  const desc = employer.employer_tagline || employer.employer_about?.slice(0, 155) || `${employer.name} is hiring CNC and manufacturing talent on JobLine.`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        {logo && <meta property="og:image" content={logo} />}
        <link rel="canonical" href={`https://jobline.ai/employers/${slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: employer.name,
            description: employer.employer_about || employer.employer_tagline || undefined,
            url: `https://jobline.ai/employers/${slug}`,
            logo: logo || undefined,
            sameAs: [employer.employer_website, employer.employer_linkedin].filter(Boolean),
          })}
        </script>
      </Helmet>

      <MarketingNav />

      {/* Hero cover — gradient overlay ensures legibility on any uploaded image */}
      <div className="relative h-56 md:h-80 border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            background: employer.employer_cover_url
              ? `url(${employer.employer_cover_url}) center/cover`
              : "radial-gradient(120% 140% at 0% 0%, hsl(var(--primary)/0.35) 0%, transparent 55%), radial-gradient(120% 140% at 100% 0%, hsl(var(--primary)/0.18) 0%, transparent 60%), linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.6) 100%)",
          }}
          aria-hidden
        />
        {/* Bottom-fade overlay for text contrast on cover photos */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
          aria-hidden
        />
      </div>

      <div className="container -mt-24 md:-mt-32 relative z-10 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-6 md:items-end">
          <div className="h-28 w-28 md:h-36 md:w-36 rounded-2xl bg-card border-4 border-background shadow-2xl overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-border/60">
            {logo ? (
              <img src={logo} alt={`${employer.name} logo`} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-14 w-14 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{employer.name}</h1>
            {employer.employer_tagline && (
              <p className="text-muted-foreground mt-2 text-lg md:text-xl max-w-2xl">
                {employer.employer_tagline}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {employer.employer_locations?.map((loc) => (
                <Badge key={loc} variant="secondary" className="gap-1">
                  <MapPin className="w-3 h-3" />{loc}
                </Badge>
              ))}
              {employer.employer_industries?.map((ind) => (
                <Badge key={ind} variant="outline">{ind}</Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pb-2">
            {employer.employer_website && (
              <Button asChild variant="outline" size="sm">
                <a href={employer.employer_website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />Website
                </a>
              </Button>
            )}
            {employer.employer_linkedin && (
              <Button asChild variant="outline" size="sm">
                <a href={employer.employer_linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />LinkedIn
                </a>
              </Button>
            )}
            {employer.employer_hiring_email && (
              <Button asChild size="sm">
                <a href={`mailto:${employer.employer_hiring_email}`}>
                  <Mail className="w-4 h-4 mr-2" />Contact
                </a>
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid md:grid-cols-3 gap-8 pb-16">
          {/* About */}
          <div className="md:col-span-2 space-y-8">
            {employer.employer_about && (
              <Card>
                <CardHeader><CardTitle>About {employer.name}</CardTitle></CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-foreground">
                  {employer.employer_about}
                </CardContent>
              </Card>
            )}

            {/* Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />Open positions
                  <Badge variant="secondary" className="ml-2">{jobs?.length ?? 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!jobs || jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No openings published right now. Check back soon.</p>
                ) : (
                  jobs.map((j) => {
                    const salary = formatSalary(j.salary_min, j.salary_max);
                    return (
                      <div key={j.id} className="border border-border rounded-lg p-4 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold">{j.title}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                              <span className="capitalize">{j.employment_type.replace(/_/g, " ")}</span>
                              {j.location && <span>· {j.location}</span>}
                              {j.remote && <span>· Remote OK</span>}
                              {salary && <span>· {salary}</span>}
                            </div>
                          </div>
                          {employer.employer_hiring_email && (
                            <Button asChild size="sm" variant="outline">
                              <a href={`mailto:${employer.employer_hiring_email}?subject=Application: ${encodeURIComponent(j.title)}`}>Apply</a>
                            </Button>
                          )}
                        </div>
                        {j.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-3 whitespace-pre-line">{j.description}</p>
                        )}
                        {j.required_skills && j.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {j.required_skills.map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">For job seekers</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Build a verified Talent profile to be discovered by {employer.name} and other shops.</p>
                <Button asChild className="w-full"><Link to="/talent">Join Talent Network</Link></Button>
                <Button asChild variant="outline" className="w-full"><Link to="/operator/profile">Create your profile</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Hiring on JobLine?</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Claim your free employer page and post jobs to reach certified CNC operators.</p>
                <Button asChild variant="outline" className="w-full"><Link to="/employers">Browse employers</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin,
  Linkedin,
  Globe,
  ShieldCheck,
  Award,
  Wrench,
  Briefcase,
  GraduationCap,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface PublicProfile {
  user_id: string;
  public_username: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  years_experience: number | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  avatar_url: string | null;
  willing_to_relocate: boolean;
  open_to_work: boolean;
  preferred_employment_types: string[] | null;
  public_published_at: string | null;
}

interface CertRow {
  id: string;
  name: string;
  issuer: string | null;
  issued_date: string | null;
  expires_date: string | null;
  credential_url: string | null;
  verification_source: string;
  linked_cert_id: string | null;
}
interface SkillRow {
  id: string;
  skill: string;
  proficiency: string;
  years_used: number | null;
}
interface MachineRow {
  id: string;
  machine_category: string;
  machine_make: string | null;
  machine_model: string | null;
  control_type: string | null;
  proficiency: string;
  years_experience: number | null;
}
interface WorkRow {
  id: string;
  employer_name: string;
  job_title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
  description: string | null;
}
interface EducationRow {
  id: string;
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
}

export default function PublicOperatorProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [machines, setMachines] = useState<MachineRow[]>([]);
  const [work, setWork] = useState<WorkRow[]>([]);
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data } = await (supabase as any).rpc("get_public_operator_profile", {
        _username: username,
      });
      const row = (data ?? [])[0] as PublicProfile | undefined;
      if (cancelled) return;
      if (!row) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(row);

      // Related sections — public RLS via parent profile_visibility = 'public'
      const [c, s, m, w, e] = await Promise.all([
        supabase
          .from("operator_certifications")
          .select("id, name, issuer, issued_date, expires_date, credential_url, verification_source, linked_cert_id")
          .eq("user_id", row.user_id)
          .order("issued_date", { ascending: false, nullsFirst: false }),
        supabase
          .from("operator_skills")
          .select("id, skill, proficiency, years_used")
          .eq("user_id", row.user_id)
          .order("skill"),
        supabase
          .from("operator_machine_proficiencies")
          .select("id, machine_category, machine_make, machine_model, control_type, proficiency, years_experience")
          .eq("user_id", row.user_id)
          .order("machine_category"),
        supabase
          .from("operator_work_history")
          .select("id, employer_name, job_title, start_date, end_date, is_current, location, description")
          .eq("user_id", row.user_id)
          .order("start_date", { ascending: false, nullsFirst: false }),
        supabase
          .from("operator_education")
          .select("id, school_name, degree, field_of_study, start_date, end_date")
          .eq("user_id", row.user_id)
          .order("end_date", { ascending: false, nullsFirst: false }),
      ]);

      if (cancelled) return;
      setCerts((c.data as CertRow[] | null) ?? []);
      setSkills((s.data as SkillRow[] | null) ?? []);
      setMachines((m.data as MachineRow[] | null) ?? []);
      setWork((w.data as WorkRow[] | null) ?? []);
      setEducation((e.data as EducationRow[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingNav />
        <main className="container max-w-4xl py-10 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Profile not found" noindex canonical={`/talent/${username ?? ""}`} />
        <MarketingNav />
        <main className="container max-w-2xl py-20 text-center space-y-4">
          <h1 className="text-3xl font-bold">Profile not found</h1>
          <p className="text-muted-foreground">
            This profile is private, doesn't exist, or hasn't been published yet.
          </p>
          <Button onClick={() => navigate("/talent")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Talent
          </Button>
        </main>
      </div>
    );
  }

  const fullName = profile.display_name ?? profile.public_username;
  const location = [profile.location_city, profile.location_region, profile.location_country]
    .filter(Boolean)
    .join(", ");
  const verifiedCount = certs.filter((c) => c.verification_source.startsWith("verified_")).length;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: fullName,
    url: `https://jobline.ai/talent/${profile.public_username}`,
    description: profile.headline ?? profile.bio ?? undefined,
    image: profile.avatar_url ?? undefined,
    address: location
      ? {
          "@type": "PostalAddress",
          addressLocality: profile.location_city ?? undefined,
          addressRegion: profile.location_region ?? undefined,
          addressCountry: profile.location_country ?? undefined,
        }
      : undefined,
    sameAs: [profile.linkedin_url, profile.portfolio_url].filter(Boolean),
    hasCredential: certs.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      credentialCategory: c.verification_source.startsWith("verified_") ? "Verified" : "Self-reported",
      recognizedBy: c.issuer ? { "@type": "Organization", name: c.issuer } : undefined,
      url: c.credential_url ?? undefined,
    })),
    knowsAbout: skills.map((s) => s.skill),
    seeks: profile.open_to_work
      ? { "@type": "Demand", name: "Open to manufacturing & CNC opportunities" }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${fullName} — ${profile.headline ?? "Manufacturing Operator"}`}
        description={
          profile.bio?.slice(0, 155) ??
          profile.headline ??
          `Verified manufacturing operator profile on JobLine — ${verifiedCount} verified credential(s).`
        }
        canonical={`/talent/${profile.public_username}`}
        ogType="profile"
        ogImage={profile.avatar_url ?? undefined}
        jsonLd={personJsonLd}
      />
      <MarketingNav />

      <main className="container max-w-4xl py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/talent")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> All profiles
        </Button>

        {/* Header card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={fullName} />}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold">{fullName}</h1>
                  <p className="text-sm text-muted-foreground">@{profile.public_username}</p>
                </div>
                {profile.headline && <p className="text-lg text-muted-foreground">{profile.headline}</p>}

                <div className="flex flex-wrap items-center gap-2">
                  {profile.open_to_work && (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
                      <Briefcase className="w-3 h-3 mr-1" /> Open to work
                    </Badge>
                  )}
                  {profile.willing_to_relocate && <Badge variant="outline">Will relocate</Badge>}
                  {verifiedCount > 0 && (
                    <Badge className="bg-primary/10 text-primary border-primary/30">
                      <ShieldCheck className="w-3 h-3 mr-1" /> {verifiedCount} verified
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {location}
                    </span>
                  )}
                  {profile.years_experience != null && (
                    <span>{profile.years_experience} years experience</span>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="w-4 h-4" /> Portfolio
                    </a>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link to="/talent/search">Employer? Contact via Talent Search</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/auth?signup=1">Build your own profile</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {profile.bio && (
          <Card>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-line text-sm leading-relaxed">{profile.bio}</CardContent>
          </Card>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" /> Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {certs.map((c) => {
                const verified = c.verification_source.startsWith("verified_");
                return (
                  <div key={c.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{c.name}</p>
                        {verified && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </Badge>
                        )}
                      </div>
                      {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
                      <p className="text-xs text-muted-foreground">
                        {c.issued_date ? `Issued ${c.issued_date}` : ""}
                        {c.expires_date ? ` · Expires ${c.expires_date}` : ""}
                      </p>
                    </div>
                    {c.credential_url && (
                      <a
                        href={c.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1 shrink-0"
                      >
                        Verify <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Machines */}
        {machines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" /> Machine proficiencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {machines.map((m) => (
                  <div key={m.id} className="border rounded-lg p-3">
                    <p className="font-medium text-sm">{m.machine_category}</p>
                    <p className="text-xs text-muted-foreground">
                      {[m.machine_make, m.machine_model].filter(Boolean).join(" ")}
                      {m.control_type ? ` · ${m.control_type}` : ""}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <Badge variant="secondary" className="capitalize">{m.proficiency}</Badge>
                      {m.years_experience != null && <span className="text-muted-foreground">{m.years_experience} yrs</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s.id} variant="secondary" className="text-sm py-1.5 px-3">
                    {s.skill}
                    <span className="ml-2 text-xs text-muted-foreground capitalize">· {s.proficiency}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work history */}
        {work.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> Work history
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {work.map((w, i) => (
                <div key={w.id}>
                  <p className="font-medium">{w.job_title}</p>
                  <p className="text-sm text-muted-foreground">{w.employer_name}{w.location ? ` · ${w.location}` : ""}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.start_date ?? "—"} – {w.is_current ? "Present" : w.end_date ?? "—"}
                  </p>
                  {w.description && (
                    <p className="mt-1 text-sm whitespace-pre-line">{w.description}</p>
                  )}
                  {i < work.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {education.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" /> Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {education.map((e) => (
                <div key={e.id}>
                  <p className="font-medium">{e.school_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[e.degree, e.field_of_study].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.start_date ?? "—"} – {e.end_date ?? "—"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer CTA */}
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="font-medium">Want a profile like this?</p>
            <p className="text-sm text-muted-foreground">
              Free, verified, and yours forever — across every shop you ever work for.
            </p>
            <Button asChild>
              <Link to="/auth?signup=1">Create my profile</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <MarketingFooter />
    </div>
  );
}

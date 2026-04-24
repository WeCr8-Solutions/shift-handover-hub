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
import { TalentSocialPanel } from "@/components/talent/TalentSocialPanel";
import { usePublicOperatorSocial } from "@/hooks/useOperatorSocial";
import { PublicProfileQrCard } from "@/components/talent/PublicProfileQrCard";
import {
  ServicesSection,
  GallerySection,
  TestimonialsSection,
  BusinessHoursSection,
  LocationMapSection,
  SaveContactButton,
} from "@/components/talent/MiniSiteSections";
import { useProfileViewTracker } from "@/hooks/useProfileViewTracker";
import type { ServiceItem, GalleryItem, TestimonialItem, BusinessHours } from "@/lib/talent/miniSiteTypes";
import { withJoblineUtm } from "@/lib/talent/outboundLinks";
import { getSocialHref, openSocialLink } from "@/lib/talent/socialDeepLinks";
import { getPublicTalentUrl } from "@/lib/talent/publicHost";
import { formatDateRange } from "@/lib/talent/format";
import "@/styles/print-talent.css";
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
  Share2,
  Mail,
  Calendar,
  Trophy,
  Users,
  UserCheck,
  Quote,
  FileText,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Github,
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
  twitter_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  github_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  resume_pdf_url: string | null;
  willing_to_relocate: boolean;
  open_to_work: boolean;
  preferred_employment_types: string[] | null;
  public_published_at: string | null;
  show_only_verified_certs: boolean | null;
  social_visibility: Record<string, boolean> | null;
}

interface CertRow {
  id: string;
  name: string;
  issuer: string | null;
  issued_date: string | null;
  expires_date: string | null;
  credential_id?: string | null;
  credential_url: string | null;
  attachment_url: string | null;
  verification_source: string;
  linked_cert_id: string | null;
  is_public: boolean;
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
  const [miniSite, setMiniSite] = useState<{
    services: ServiceItem[];
    gallery: GalleryItem[];
    testimonials: TestimonialItem[];
    business_hours: BusinessHours | null;
    latitude: number | null;
    longitude: number | null;
    contact_email: string | null;
    contact_phone: string | null;
    vcard_full_name: string | null;
    vcard_title: string | null;
    vcard_company: string | null;
    card_slug: string | null;
    cta_label: string | null;
    cta_url: string | null;
  } | null>(null);
  const { counts: socialCounts } = usePublicOperatorSocial(username);

  useProfileViewTracker("talent", username ?? null);

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
          .select("id, name, issuer, issued_date, expires_date, credential_id, credential_url, attachment_url, verification_source, linked_cert_id, is_public")
          .eq("user_id", row.user_id)
          .eq("is_public", true)
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

      // Mini-site fields — RLS allows public read when profile_visibility = 'public'.
      // NOTE: contact_email / contact_phone are NEVER selected on the public surface.
      // All outreach must go through in-app messaging (`/talent/search` → talent_contact_requests).
      const { data: ms } = await supabase
        .from("operator_profiles")
        .select(
          `services, gallery, testimonials, business_hours, latitude, longitude,
           vcard_full_name, vcard_title, vcard_company,
           card_slug, cta_label, cta_url`
        )
        .eq("user_id", row.user_id)
        .maybeSingle();

      if (cancelled) return;
      setCerts((c.data as CertRow[] | null) ?? []);
      setSkills((s.data as SkillRow[] | null) ?? []);
      setMachines((m.data as MachineRow[] | null) ?? []);
      setWork((w.data as WorkRow[] | null) ?? []);
      setEducation((e.data as EducationRow[] | null) ?? []);
      if (ms) {
        const r = ms as Record<string, unknown>;
        setMiniSite({
          services: (r.services as ServiceItem[]) ?? [],
          gallery: (r.gallery as GalleryItem[]) ?? [],
          testimonials: (r.testimonials as TestimonialItem[]) ?? [],
          business_hours: (r.business_hours as BusinessHours | null) ?? null,
          latitude: (r.latitude as number | null) ?? null,
          longitude: (r.longitude as number | null) ?? null,
          contact_email: null,
          contact_phone: null,
          vcard_full_name: (r.vcard_full_name as string | null) ?? null,
          vcard_title: (r.vcard_title as string | null) ?? null,
          vcard_company: (r.vcard_company as string | null) ?? null,
          card_slug: (r.card_slug as string | null) ?? null,
          cta_label: (r.cta_label as string | null) ?? null,
          cta_url: (r.cta_url as string | null) ?? null,
        });
      }
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
  const visibleCerts = profile.show_only_verified_certs
    ? certs.filter((c) => c.verification_source.startsWith("verified_"))
    : certs;
  const visibleSkills = profile.show_only_verified_certs ? [] : skills;
  const visibleMachines = profile.show_only_verified_certs ? [] : machines;
  const verifiedCount = visibleCerts.filter((c) => c.verification_source.startsWith("verified_")).length;

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
    sameAs: [
      profile.linkedin_url,
      profile.portfolio_url,
      profile.website_url,
      profile.twitter_url,
      profile.instagram_url,
      profile.facebook_url,
      profile.youtube_url,
      profile.github_url,
    ].filter(Boolean),
    hasCredential: visibleCerts.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      credentialCategory: c.verification_source.startsWith("verified_") ? "Verified" : "Self-reported",
      recognizedBy: c.issuer ? { "@type": "Organization", name: c.issuer } : undefined,
      url: c.credential_url ?? undefined,
    })),
    knowsAbout: visibleSkills.map((s) => s.skill),
    seeks: profile.open_to_work
      ? { "@type": "Demand", name: "Open to manufacturing & CNC opportunities" }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${fullName} — ${profile.headline ?? "Verified Talent"}`}
        description={
          profile.bio?.slice(0, 155) ??
          profile.headline ??
          `Verified talent profile on JobLine — ${verifiedCount} verified credential(s).`
        }
        canonical={`/talent/${profile.public_username}`}
        ogType="profile"
        ogImage={profile.avatar_url ?? "https://jobline.ai/profile-og.jpg"}
        jsonLd={personJsonLd}
      />
      <MarketingNav />

      <main className="container max-w-4xl py-4 sm:py-8 space-y-4 sm:space-y-6 pb-24 sm:pb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/talent")} className="gap-2 -ml-2 no-print">
          <ArrowLeft className="w-4 h-4" /> All profiles
        </Button>

        {/* Hero header — gradient cover + overlapping avatar for share-worthy first impression */}
        <Card className="overflow-hidden border-0 shadow-xl ring-1 ring-border/60 animate-fade-in">
          {/* Cover: custom banner photo if uploaded, otherwise gradient */}
          {profile.banner_url ? (
            <div className="relative h-32 sm:h-48 md:h-56 w-full overflow-hidden bg-muted" aria-hidden>
              <img
                src={profile.banner_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
            </div>
          ) : (
            <div
              className="relative h-28 sm:h-40 w-full"
              aria-hidden
              style={{
                background:
                  "radial-gradient(120% 140% at 0% 0%, hsl(var(--primary)/0.35) 0%, transparent 55%), radial-gradient(120% 140% at 100% 0%, hsl(var(--primary)/0.18) 0%, transparent 60%), linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent 0 14px, hsl(var(--primary-foreground)) 14px 15px)",
                }}
              />
            </div>
          )}

          <CardContent className="relative p-5 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 -mt-12 sm:-mt-16">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 mx-auto sm:mx-0 ring-4 ring-background shadow-xl">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={fullName} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl sm:text-4xl font-semibold">
                  {fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left sm:pt-16">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight break-words tracking-tight">
                    {fullName}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">@{profile.public_username}</p>
                </div>
                {profile.headline && (
                  <p className="text-base sm:text-lg text-foreground/90 leading-snug font-medium">
                    {profile.headline}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {profile.open_to_work && (
                    <Badge className="bg-success/10 text-success border-success/30">
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

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {location}
                    </span>
                  )}
                  {profile.years_experience != null && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {profile.years_experience} yrs
                    </span>
                  )}
                  {(() => {
                    const sv = profile.social_visibility ?? {};
                    const show = (k: string) => sv[k] !== false; // default visible
                    return (
                      <>
                        {profile.linkedin_url && show("linkedin") && (
                          <SocialLink href={profile.linkedin_url} icon={Linkedin} label="LinkedIn" track nofollow />
                        )}
                        {profile.portfolio_url && show("portfolio") && (
                          <SocialLink href={profile.portfolio_url} icon={Globe} label="Portfolio" track />
                        )}
                        {profile.website_url && show("website") && (
                          <SocialLink href={profile.website_url} icon={Globe} label="Website" track />
                        )}
                        {profile.twitter_url && show("twitter") && (
                          <SocialLink href={profile.twitter_url} icon={Twitter} label="X / Twitter" />
                        )}
                        {profile.instagram_url && show("instagram") && (
                          <SocialLink href={profile.instagram_url} icon={Instagram} label="Instagram" />
                        )}
                        {profile.facebook_url && show("facebook") && (
                          <SocialLink href={profile.facebook_url} icon={Facebook} label="Facebook" />
                        )}
                        {profile.youtube_url && show("youtube") && (
                          <SocialLink href={profile.youtube_url} icon={Youtube} label="YouTube" />
                        )}
                        {profile.github_url && show("github") && (
                          <SocialLink href={profile.github_url} icon={Github} label="GitHub" />
                        )}
                        {profile.resume_pdf_url && (
                          <a
                            href={profile.resume_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                          >
                            <FileText className="w-4 h-4" /> Resume
                          </a>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Snapshot stats strip */}
            <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
              <Stat label="Verified" value={verifiedCount} />
              <Stat label="Machines" value={visibleMachines.length} />
              <Stat label="Skills" value={visibleSkills.length} />
              <Stat label="Roles" value={work.length} />
              <Stat label="Followers" value={socialCounts.follower_count} />
              <Stat label="Following" value={socialCounts.following_count} />
            </div>

            {/* Desktop CTAs (mobile uses sticky bar below) */}
            <div className="mt-5 hidden sm:flex flex-wrap gap-2 no-print">
              <Button asChild size="sm">
                <Link to="/talent/search">Employers: contact via Talent Search</Link>
              </Button>
              {miniSite && (
                <SaveContactButton
                  vcard={{
                    fullName: miniSite.vcard_full_name ?? fullName,
                    title: miniSite.vcard_title ?? profile.headline,
                    company: miniSite.vcard_company,
                    // Personal email/phone are intentionally omitted — outreach happens
                    // through JobLine in-app messaging only.
                    email: null,
                    phone: null,
                    website: profile.portfolio_url,
                    addressCity: profile.location_city,
                    addressRegion: profile.location_region,
                    addressCountry: profile.location_country,
                    profileUrl: getPublicTalentUrl(profile.public_username),
                  }}
                  label="Save contact (.vcf)"
                />
              )}
              {miniSite?.card_slug && (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/card/${miniSite.card_slug}`}>Open business card</Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link to="/auth?signup=1">Build your own profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR + Share/Print + verified-on-JobLine strip */}
        <PublicProfileQrCard
          username={profile.public_username}
          fullName={fullName}
          latestCertId={
            certs.find((c) => c.linked_cert_id && c.verification_source.startsWith("verified_"))
              ?.linked_cert_id ?? null
          }
        />

        {/* Coworker social: connect, follow, recommendations */}
        <TalentSocialPanel
          username={profile.public_username}
          recipientUserId={profile.user_id}
          recipientName={fullName}
        />

        {/* About */}
        {profile.bio && (
          <Card>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-line text-sm leading-relaxed">{profile.bio}</CardContent>
          </Card>
        )}

        {/* Mini-site: services, gallery, testimonials, hours, location */}
        {miniSite && (
          <>
            <ServicesSection services={miniSite.services} />
            <GallerySection items={miniSite.gallery} />
            <TestimonialsSection items={miniSite.testimonials} />
            <BusinessHoursSection hours={miniSite.business_hours} />
            <LocationMapSection
              city={profile.location_city}
              region={profile.location_region}
              country={profile.location_country}
              latitude={miniSite.latitude}
              longitude={miniSite.longitude}
            />
          </>
        )}

        {/* Accomplishments — highlight reel for employers */}
        {(() => {
          const expertMachines = visibleMachines.filter((m) => m.proficiency?.toLowerCase() === "expert").length;
          const items: { icon: typeof Trophy; label: string; sub?: string }[] = [];
          if (verifiedCount > 0) {
            items.push({
              icon: ShieldCheck,
              label: `${verifiedCount} verified credential${verifiedCount === 1 ? "" : "s"}`,
              sub: "Issued & verified through JobLine",
            });
          }
          if (profile.years_experience && profile.years_experience >= 5) {
            items.push({
              icon: Trophy,
              label: `${profile.years_experience}+ years on the floor`,
              sub: "Sustained manufacturing experience",
            });
          }
          if (expertMachines > 0) {
            items.push({
              icon: Wrench,
              label: `${expertMachines} expert-level machine${expertMachines === 1 ? "" : "s"}`,
              sub: "Self-attested expert proficiency",
            });
          }
          if (socialCounts.recommendation_count > 0) {
            items.push({
              icon: Quote,
              label: `${socialCounts.recommendation_count} peer recommendation${socialCounts.recommendation_count === 1 ? "" : "s"}`,
              sub: "From coworkers & supervisors",
            });
          }
          if (socialCounts.follower_count >= 5) {
            items.push({
              icon: Users,
              label: `${socialCounts.follower_count} followers`,
              sub: "Trusted by the community",
            });
          }
          if (!items.length) return null;
          return (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" /> Accomplishments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((it, i) => {
                    const Icon = it.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                        <div className="shrink-0 rounded-md bg-primary/10 text-primary p-2">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-tight">{it.label}</p>
                          {it.sub && <p className="text-xs text-muted-foreground mt-0.5">{it.sub}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {visibleCerts.length > 0 && (() => {
          const oapCerts = visibleCerts.filter((c) => c.verification_source === "verified_oap");
          const gcaCerts = visibleCerts.filter((c) => c.verification_source === "verified_gca");
          const externalVerified = visibleCerts.filter(
            (c) => c.verification_source.startsWith("verified_") && c.verification_source !== "verified_oap" && c.verification_source !== "verified_gca",
          );
          const selfReported = visibleCerts.filter((c) => !c.verification_source.startsWith("verified_"));

          return (
            <>
              {/* JobLine OAP — Approved badge cards */}
              {oapCerts.length > 0 && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" /> JobLine OAP — Approved
                      <Badge className="ml-1 bg-primary text-primary-foreground">{oapCerts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {oapCerts.map((c) => (
                        <CertBadgeCard key={c.id} cert={c} variant="oap" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* GCA badges */}
              {gcaCerts.length > 0 && (
                <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-warning" /> G-Code Academy badges
                      <Badge className="ml-1 bg-warning text-warning-foreground">{gcaCerts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {gcaCerts.map((c) => (
                        <CertBadgeCard key={c.id} cert={c} variant="gca" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Other verified + self-reported */}
              {(externalVerified.length > 0 || selfReported.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" /> Additional certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...externalVerified, ...selfReported].map((c) => {
                      const verified = c.verification_source.startsWith("verified_");
                      return (
                        <div key={c.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{c.name}</p>
                              {verified && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                                </Badge>
                              )}
                            </div>
                            {c.issuer && <p className="text-sm text-muted-foreground">{c.issuer}</p>}
                            <p className="text-xs text-muted-foreground">
                              {c.issued_date ? `Issued ${formatDateRange(c.issued_date, null).split(" – ")[0]}` : ""}
                              {c.expires_date ? ` · Expires ${formatDateRange(c.expires_date, null).split(" – ")[0]}` : ""}
                            </p>
                            {(c.linked_cert_id || c.credential_id) && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Certificate #{c.linked_cert_id ?? c.credential_id}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {c.attachment_url && (
                              <a href={c.attachment_url} target="_blank" rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm flex items-center gap-1">
                                Open <FileText className="w-3 h-3" />
                              </a>
                            )}
                            {c.credential_url && (
                              <a href={c.credential_url} target="_blank" rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm flex items-center gap-1">
                                Verify <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}

        {/* Machines — grouped by category */}
        {visibleMachines.length > 0 && (() => {
          const grouped = visibleMachines.reduce<Record<string, MachineRow[]>>((acc, m) => {
            const key = m.machine_category || "Other";
            (acc[key] ||= []).push(m);
            return acc;
          }, {});
          const categories = Object.keys(grouped).sort();
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" /> Machine proficiencies
                  <Badge variant="secondary" className="ml-1">{visibleMachines.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {categories.map((cat) => (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {cat}
                      </h3>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {grouped[cat].length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {grouped[cat].map((m) => (
                        <div key={m.id} className="border rounded-lg p-3 bg-card">
                          <p className="font-medium text-sm">
                            {[m.machine_make, m.machine_model].filter(Boolean).join(" ") || m.machine_category}
                          </p>
                          {m.control_type && (
                            <p className="text-xs text-muted-foreground">Control: {m.control_type}</p>
                          )}
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <Badge
                              variant="secondary"
                              className={`capitalize ${
                                m.proficiency?.toLowerCase() === "expert"
                                  ? "bg-primary/15 text-primary border-primary/30"
                                  : ""
                              }`}
                            >
                              {m.proficiency}
                            </Badge>
                            {m.years_experience != null && (
                              <span className="text-muted-foreground">{m.years_experience} yrs</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })()}

        {/* Skills */}
        {visibleSkills.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {visibleSkills.map((s) => (
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
                    {formatDateRange(w.start_date, w.end_date, w.is_current)}
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
                    {formatDateRange(e.start_date, e.end_date)}
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

      {/* Sticky mobile action bar — primary employer/share CTAs always reachable */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 no-print">
        <div className="container max-w-4xl px-3 py-2 flex items-center gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link to="/talent/search">
              <Mail className="w-4 h-4 mr-1.5" /> Contact
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={async () => {
              const url = getPublicTalentUrl(profile.public_username);
              const shareData = {
                title: `${fullName} · JobLine Talent`,
                text: profile.headline ?? `${fullName} on JobLine`,
                url,
              };
              try {
                if (navigator.share) await navigator.share(shareData);
                else await navigator.clipboard.writeText(url);
              } catch {
                /* dismissed */
              }
            }}
          >
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </Button>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}

/** Compact stat tile used in the mobile-friendly snapshot strip. */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <div className="text-lg sm:text-xl font-semibold leading-none">{value}</div>
      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-1">
        {label}
      </div>
    </div>
  );
}

/** Badge-style card for verified JobLine OAP / GCA certifications. */
function CertBadgeCard({ cert, variant }: { cert: CertRow; variant: "oap" | "gca" }) {
  const isOap = variant === "oap";
  return (
    <div
      className={`relative rounded-lg border p-3 bg-card overflow-hidden ${
        isOap ? "border-primary/40" : "border-warning/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 rounded-md p-2 ${
            isOap ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning"
          }`}
          aria-hidden
        >
          {isOap ? <ShieldCheck className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight break-words">{cert.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isOap ? "JobLine OAP · Approved" : "G-Code Academy · Passed"}
            {cert.issued_date
              ? ` · ${formatDateRange(cert.issued_date, null).split(" – ")[0]}`
              : ""}
          </p>
          {(cert.linked_cert_id || cert.credential_id) && (
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              Certificate #{cert.linked_cert_id ?? cert.credential_id}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {cert.credential_url && (
              <a
                href={cert.credential_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                Verify on jobline.ai <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {cert.attachment_url && (
              <a
                href={cert.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                Open PDF <FileText className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
  track,
  nofollow,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  track?: boolean;
  nofollow?: boolean;
}) {
  const normalized = getSocialHref(href);
  const finalHref = track ? (withJoblineUtm(normalized, "talent_profile") ?? normalized) : normalized;
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let users open in a new tab via modifier keys / middle click.
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    openSocialLink(finalHref);
  };
  return (
    <a
      href={finalHref}
      onClick={handleClick}
      target="_blank"
      rel={`noopener noreferrer${nofollow ? " nofollow" : ""}`}
      className="flex items-center gap-1 text-primary hover:underline"
      aria-label={label}
    >
      <Icon className="w-4 h-4" /> {label}
    </a>
  );
}

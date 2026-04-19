import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { useOperatorProfile } from "@/hooks/useOperatorProfile";
import { useContactRequests } from "@/hooks/useTalent";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User as UserIcon, Award, ShieldCheck, Wrench, Briefcase, GraduationCap,
  Mail, Eye, Globe, Lock, Sparkles, BookOpen, Calculator, ExternalLink,
  ArrowRight, CheckCircle2, AlertTriangle, Share2,
} from "lucide-react";
import { getPublicTalentUrl } from "@/lib/talent/publicHost";

export default function TalentDashboard() {
  const navigate = useNavigate();
  const { user, profile: authProfile, isReady } = useAuth();
  const { organization } = useOrgContext();
  const {
    profile, certifications, skills, machines, workHistory, education, loading,
  } = useOperatorProfile();
  const { inbound, loading: inboundLoading } = useContactRequests();

  useEffect(() => {
    if (isReady && !user) navigate("/auth?next=/talent/dashboard");
  }, [isReady, user, navigate]);

  // Profile completeness — 8 weighted fields
  const completeness = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      !!profile.headline,
      !!profile.bio,
      !!profile.location_city,
      (profile.years_experience ?? 0) > 0,
      certifications.length > 0,
      skills.length > 0,
      machines.length > 0,
      workHistory.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile, certifications, skills, machines, workHistory]);

  const verifiedCerts = certifications.filter((c) => c.verification_source.startsWith("verified_"));
  const oapCerts = verifiedCerts.filter((c) => c.verification_source === "verified_oap");
  const gcaCerts = verifiedCerts.filter((c) => c.verification_source === "verified_gca");
  const pendingInbound = inbound.filter((r) => r.candidate_response === "pending");

  const visibility = profile?.profile_visibility ?? "private";
  const VisibilityIcon = visibility === "public" ? Globe : visibility === "employers_only" ? ShieldCheck : Lock;
  const publicUrl = profile?.public_username ? getPublicTalentUrl(profile.public_username) : null;

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 space-y-6 max-w-6xl">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Talent Dashboard — JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <main className="container py-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back{authProfile?.display_name ? `, ${authProfile.display_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted-foreground mt-1">
              Your personal talent network hub — manage your profile, certifications, and employer interest.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/operator/profile")} className="gap-2">
              <UserIcon className="w-4 h-4" /> Edit Profile
            </Button>
            {publicUrl && (
              <Button variant="outline" asChild className="gap-2">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> View Public
                </a>
              </Button>
            )}
          </div>
        </div>

        {!profile && (
          <Alert className="border-primary/30 bg-primary/5">
            <Sparkles className="w-4 h-4" />
            <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
              <span>You haven't created your talent profile yet. Get discovered by employers in minutes.</span>
              <Button size="sm" onClick={() => navigate("/operator/profile")}>Create Profile</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Top row: completeness + visibility + inbound */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Profile Strength
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{completeness}%</div>
              <Progress value={completeness} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completeness < 100 ? "Complete more sections to rank higher in employer searches." : "Your profile is fully complete."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <VisibilityIcon className="w-4 h-4" /> Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant={visibility === "public" ? "default" : "secondary"} className="capitalize">
                {visibility.replace("_", " ")}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {visibility === "private" && "Hidden from search. Only you can see this profile."}
                {visibility === "employers_only" && "Visible to verified employers signed in to JobLine."}
                {visibility === "public" && "Indexed publicly with masked contact info."}
              </p>
              <Button size="sm" variant="ghost" className="h-7 px-2 -ml-2" onClick={() => navigate("/operator/profile")}>
                Change <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" /> Employer Interest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{inboundLoading ? "—" : pendingInbound.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingInbound.length > 0 ? "New contact requests awaiting response." : "No new requests right now."}
              </p>
              {inbound.length > 0 && (
                <Button size="sm" variant="ghost" className="h-7 px-2 -ml-2" onClick={() => navigate("/operator/inbox")}>
                  Open Inbox <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Certifications & Badges */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> Certifications & Badges</CardTitle>
                <CardDescription>Verified credentials boost employer trust.</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                {oapCerts.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <ShieldCheck className="w-3 h-3" /> OAP Approved × {oapCerts.length}
                  </Badge>
                )}
                {gcaCerts.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Award className="w-3 h-3" /> GCA × {gcaCerts.length}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {certifications.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-muted-foreground">No certifications yet.</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => navigate("/oap")}>Earn an OAP cert</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/gcode-academy")}>Start G-Code Academy</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certifications.slice(0, 6).map((c) => {
                  const isVerified = c.verification_source.startsWith("verified_");
                  return (
                    <div key={c.id} className="border border-border rounded-lg p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm leading-tight">{c.name}</div>
                        {isVerified && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.issuer || "Self-reported"}</div>
                      {c.issued_date && (
                        <div className="text-xs text-muted-foreground">Issued {new Date(c.issued_date).toLocaleDateString()}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills + Machines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="w-4 h-4" /> Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add skills to appear in employer searches.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s.id} variant="secondary" className="capitalize">
                      {s.skill} <span className="text-muted-foreground ml-1">· {s.proficiency}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Wrench className="w-4 h-4" /> Machines</CardTitle>
            </CardHeader>
            <CardContent>
              {machines.length === 0 ? (
                <p className="text-sm text-muted-foreground">List the machines and controls you've run.</p>
              ) : (
                <div className="space-y-2">
                  {machines.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{m.machine_make ? `${m.machine_make} ${m.machine_model ?? ""}` : m.machine_category}</span>
                      <Badge variant="outline" className="capitalize text-xs">{m.proficiency}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Experience preview */}
        {(workHistory.length > 0 || education.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Briefcase className="w-4 h-4" /> Recent Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workHistory.slice(0, 3).map((w) => (
                    <div key={w.id}>
                      <div className="font-medium text-sm">{w.job_title}</div>
                      <div className="text-xs text-muted-foreground">{w.employer_name}{w.location ? ` · ${w.location}` : ""}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {education.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="w-4 h-4" /> Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {education.slice(0, 3).map((e) => (
                    <div key={e.id}>
                      <div className="font-medium text-sm">{e.school_name}</div>
                      <div className="text-xs text-muted-foreground">{[e.degree, e.field_of_study].filter(Boolean).join(" · ")}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Learning + Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="w-4 h-4" /> Keep Learning</CardTitle>
              <CardDescription>Free, employer-recognized programs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/gcode-academy")}>
                <span className="flex items-center gap-2"><Award className="w-4 h-4" /> G-Code Academy</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/oap")}>
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> OAP Walkthrough</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/oap/my-transcript")}>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> My OAP Transcript</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Calculator className="w-4 h-4" /> Operator Tools</CardTitle>
              <CardDescription>Speed/feed, trig, conversions — free for talent users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/tools")}>
                <span className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Open Tool Library</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to="/talent/browse">
                  <span className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Browse Public Talent</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {organization && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              You also belong to <strong>{organization.name}</strong>.{" "}
              <button className="underline" onClick={() => navigate("/dashboard")}>
                Switch to your shop dashboard
              </button>.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}

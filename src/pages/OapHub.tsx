import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useOapCourses, useMyOapEnrollments, useMyOapQuizAttempts, useCanonicalRolePrograms } from "@/hooks/useOapProgram";
import { useAuth } from "@/contexts/AuthContext";
import {
  ClipboardCheck,
  GraduationCap,
  Trophy,
  Clock,
  Award,
  ArrowRight,
  Ruler,
  Gauge,
} from "lucide-react";
import { BuyCertificateDialog } from "@/components/certificates/BuyCertificateDialog";
import { MediaOverlayDisplay } from "@/components/training/MediaOverlayDisplay";

export default function OapHub() {
  const { user } = useAuth();
  const { data: courses = [], isLoading } = useOapCourses();
  const { data: enrollments = [] } = useMyOapEnrollments(user?.id ?? null);
  const { data: attempts = [] } = useMyOapQuizAttempts(user?.id ?? null);
  const { data: presetPrograms = [] } = useCanonicalRolePrograms();
  const [certOpen, setCertOpen] = useState(false);
  const verticals = Array.from(new Set(presetPrograms.map((p) => p.vertical ?? "machining")));

  const passedQuizzes = attempts.filter((a) => a.passed).length;
  const totalQuizzes = attempts.length;
  const completionPct =
    courses.length > 0 ? Math.round((passedQuizzes / courses.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>OAP Learning Hub — Operator Acceptance Program</title>
        <meta
          name="description"
          content="Self-paced OAP study: 7 sections covering safety, measurement, tooling, machine qualification, and floor certification."
        />
      </Helmet>
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">OAP Learning Hub</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            7-section operator acceptance program. Study on your own, then have a
            mentor sign off your floor walkthrough to earn your certificate.
          </p>
        </div>

        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Trophy} label="Quizzes passed" value={`${passedQuizzes}/${courses.length}`} />
            <StatCard icon={ClipboardCheck} label="Quiz attempts" value={String(totalQuizzes)} />
            <StatCard icon={Award} label="Active enrollments" value={String(enrollments.filter((e) => e.status === "in_progress").length)} />
            <StatCard icon={Clock} label="Est. total" value={`${courses.reduce((s, c) => s + (c.estimated_minutes ?? 0), 0)} min`} />
          </div>
        )}

        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm">
                {user && completionPct >= 50
                  ? `You're ${completionPct}% through OAP study — lock it in.`
                  : "Earn your verifiable OAP certificate"}
              </p>
              <p className="text-xs text-muted-foreground">
                $12 one-time · branded PDF · public verification URL · no account required.
              </p>
            </div>
            <Button onClick={() => setCertOpen(true)}>
              Get my certificate — $12 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <BuyCertificateDialog
              open={certOpen}
              onOpenChange={setCertOpen}
              program="OAP"
              defaultProgramName="Operator Acceptance Program — Floor Certified"
            />
          </CardContent>
        </Card>

        {/* Measurement skill surfaces — separate from the 12 study sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="hover:border-primary transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Measuring Tools Library
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Video tutorials, diagrams, and usage notes for 60+ inspection tools across 13 categories — calipers, micrometers, indicators, CMM and more. Free reference, no test required.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link to="/resources/measuring-tools">
                  Open Library <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:border-primary transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                Tool Proficiency Tests
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Mentor-graded measurement tests with pass/fail tracking, retest scheduling, and printable backup forms. Satisfies AS9100 §7.1.5 inspection-equipment competence.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link to="/oap/proficiency">
                  Take a Proficiency Test <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading sections…</p>
          )}
          {courses.map((c) => (
            <Card key={c.id} className="hover:border-primary transition overflow-hidden flex flex-col">
              {c.cover_media_id && (
                <MediaOverlayDisplay
                  mediaId={c.cover_media_id}
                  overlayText={c.cover_overlay_text}
                  overlayOpacity={c.cover_overlay_opacity}
                  overlayPosition={c.cover_overlay_position}
                  overlayTextColor={c.cover_overlay_text_color}
                  rounded={false}
                  aspect="16/9"
                />
              )}
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{c.section_number}</Badge>
                  <span className="flex-1">{c.title}</span>
                  {c.content_year && (
                    <Badge variant="secondary" className="text-[10px]">Updated · {c.content_year}</Badge>
                  )}
                </CardTitle>
                {c.summary && (
                  <p className="text-xs text-muted-foreground">{c.summary}</p>
                )}
              </CardHeader>
              <CardContent className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> ~{c.estimated_minutes ?? 30} min
                </div>
                <Button asChild size="sm">
                  <Link to={`/oap/learn/${c.slug}`}>
                    Open <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {!isLoading && courses.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">
              No sections published yet — check back soon.
            </p>
          )}
        </div>

        {presetPrograms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> Preset profession programs
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {presetPrograms.length} ready-made certification tracks across {verticals.length} trade verticals — CNC machining, cabinetry, automotive, welding, construction, electrical, plumbing, and HVAC. Org admins can clone any of these into their shop in one click from the Employer panel.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {verticals.map((v) => {
                  const count = presetPrograms.filter((p) => (p.vertical ?? "machining") === v).length;
                  return (
                    <Badge key={v} variant="secondary" className="text-[11px] capitalize">
                      {v} · {count}
                    </Badge>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {presetPrograms.slice(0, 6).map((p) => (
                  <div key={p.id} className="text-xs border rounded p-2">
                    <div className="font-medium truncate">{p.name}</div>
                    {p.description && (
                      <div className="text-muted-foreground line-clamp-2 mt-0.5">{p.description}</div>
                    )}
                  </div>
                ))}
              </div>
              {presetPrograms.length > 6 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  +{presetPrograms.length - 6} more available in the Employer panel.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your portable transcript</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                See every credential you've earned across employers and generate a one-time
                transfer code to share with a prospective employer.
              </p>
              <Button asChild variant="outline">
                <Link to="/oap/my-transcript">Open my transcript →</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Already studying with a mentor?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Mentors and supervisors can open the in-shop walkthrough check-off
              screen to sign off your floor certification.
            </p>
            <Button asChild variant="outline">
              <Link to="/oap/walkthrough">Open Mentor Walkthrough →</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

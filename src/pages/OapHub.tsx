import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useOapCourses, useMyOapEnrollments, useMyOapQuizAttempts } from "@/hooks/useOapProgram";
import { useAuth } from "@/contexts/AuthContext";
import {
  ClipboardCheck,
  GraduationCap,
  Trophy,
  Clock,
  Award,
  ArrowRight,
} from "lucide-react";
import { BuyCertificateDialog } from "@/components/certificates/BuyCertificateDialog";

export default function OapHub() {
  const { user } = useAuth();
  const { data: courses = [], isLoading } = useOapCourses();
  const { data: enrollments = [] } = useMyOapEnrollments(user?.id ?? null);
  const { data: attempts = [] } = useMyOapQuizAttempts(user?.id ?? null);
  const [certOpen, setCertOpen] = useState(false);

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading sections…</p>
          )}
          {courses.map((c) => {
            const passed = attempts.some((a) => a.passed && a.quiz_id && false); // quiz-to-course join can be added; UI shows via player
            return (
              <Card key={c.id} className="hover:border-primary transition">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{c.section_number}</Badge>
                    {c.title}
                  </CardTitle>
                  {c.summary && (
                    <p className="text-xs text-muted-foreground">{c.summary}</p>
                  )}
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> ~{c.estimated_minutes ?? 30} min
                    {passed && <Badge variant="default" className="ml-2">Passed</Badge>}
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/oap/learn/${c.slug}`}>
                      Open <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

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

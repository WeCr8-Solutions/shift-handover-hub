import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { MarketingNav } from "@/components/marketing/MarketingNav";

type Measurement = { label: string; target: number; tolerance: number; unit: string };

interface ProficiencyTest {
  id: string;
  slug: string;
  name: string;
  tool_slug: string | null;
  description: string | null;
  instructions_md: string | null;
  measurements: Measurement[];
  passing_score: number;
  mentor_required: boolean;
  retest_days: number;
  printable_template_md: string | null;
  is_canonical: boolean;
}

interface Attempt {
  id: string;
  test_id: string;
  user_id: string;
  organization_id: string | null;
  recorded_measurements: Array<{ label: string; recorded: number | null; pass: boolean | null }>;
  score: number | null;
  status: "pending" | "passed" | "failed" | "needs_retest";
  mentor_notes: string | null;
  mentor_signoff_at: string | null;
  retest_due_at: string | null;
  submitted_at: string;
  graded_at: string | null;
}

export default function ToolProficiency() {
  const [params] = useSearchParams();
  const toolSlug = params.get("tool");
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const qc = useQueryClient();

  const { data: tests, isLoading } = useQuery({
    queryKey: ["tool-prof-tests", toolSlug],
    queryFn: async () => {
      let q = supabase.from("tool_proficiency_tests" as any).select("*").order("name");
      if (toolSlug) q = q.eq("tool_slug", toolSlug);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ProficiencyTest[];
    },
  });

  const { data: myAttempts } = useQuery({
    queryKey: ["tool-prof-attempts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_proficiency_attempts" as any)
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Attempt[];
    },
  });

  return (
    <>
      <MarketingNav />
      <Helmet>
        <title>Tool Measurement Proficiency Tests | Jobline.ai</title>
        <meta
          name="description"
          content="Take mentor-graded measurement proficiency tests for calipers, micrometers, indicators, and more. Pass/fail tracking, retest scheduling, and printable backup forms."
        />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Tool Measurement Proficiency</h1>
          <p className="text-muted-foreground text-sm">
            Mentor-graded tests for measuring tools. Pass/fail status,
            retest tracking, and printable backup forms — for your own records
            or to satisfy AS9100 §7.1.5 inspection-equipment competence.
          </p>
        </header>

        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Available Tests</TabsTrigger>
            <TabsTrigger value="history">My History</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-3 mt-4">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !tests?.length ? (
              <p className="text-sm text-muted-foreground">
                No tests available yet
                {toolSlug ? ` for "${toolSlug}".` : "."}
              </p>
            ) : (
              tests.map((t) => (
                <TestCard
                  key={t.id}
                  test={t}
                  onSubmitted={() => qc.invalidateQueries({ queryKey: ["tool-prof-attempts"] })}
                  organizationId={organization?.id ?? null}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            {!myAttempts?.length ? (
              <p className="text-sm text-muted-foreground">No attempts yet.</p>
            ) : (
              myAttempts.map((a) => {
                const test = tests?.find((t) => t.id === a.test_id);
                return <AttemptCard key={a.id} attempt={a} testName={test?.name ?? "Test"} />;
              })
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-10 text-center text-sm text-muted-foreground">
          <Link to="/resources/measuring-tools" className="underline">
            ← Back to Measuring Tools Library
          </Link>
        </div>
      </div>
    </>
  );
}

function TestCard({
  test,
  onSubmitted,
  organizationId,
}: {
  test: ProficiencyTest;
  onSubmitted: () => void;
  organizationId: string | null;
}) {
  const [readings, setReadings] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const recorded = useMemo(
    () =>
      test.measurements.map((m, i) => {
        const raw = readings[i];
        const num = raw === undefined || raw === "" ? null : Number(raw);
        const pass =
          num === null || Number.isNaN(num) ? null : Math.abs(num - m.target) <= m.tolerance;
        return { label: m.label, recorded: num, pass };
      }),
    [test.measurements, readings],
  );

  const completed = recorded.filter((r) => r.recorded !== null && !Number.isNaN(r.recorded ?? NaN));
  const passed = completed.filter((r) => r.pass).length;
  const score =
    completed.length === 0 ? 0 : Math.round((passed / test.measurements.length) * 100);
  const wouldPass = score >= test.passing_score;

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to submit a test");
      return;
    }
    if (completed.length < test.measurements.length) {
      toast.error("Enter all measurements before submitting");
      return;
    }
    setSubmitting(true);
    try {
      const status = test.mentor_required ? "pending" : wouldPass ? "passed" : "failed";
      const { error } = await supabase.from("tool_proficiency_attempts" as any).insert({
        test_id: test.id,
        user_id: user.id,
        organization_id: organizationId,
        recorded_measurements: recorded,
        score,
        status,
      });
      if (error) throw error;
      toast.success(
        test.mentor_required
          ? "Submitted for mentor review"
          : wouldPass
            ? `Passed — ${score}%`
            : `Did not pass — ${score}%`,
      );
      setReadings({});
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message ?? "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const printBackup = () => {
    // HTML-escape any field interpolated into the popup document to prevent
    // stored XSS (org admins/supervisors can set test.name & template_md).
    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    const rawMd = test.printable_template_md ?? `# ${test.name}\n\n(no template)`;
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) {
      toast.error("Pop-up blocked — allow pop-ups to print");
      return;
    }
    w.document.write(`<!doctype html><html><head><title>${esc(test.name)} — Printable</title>
      <style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.6;color:#111}
      table{border-collapse:collapse;width:100%;margin:14px 0}
      th,td{border:1px solid #999;padding:8px 10px;text-align:left;font-size:13px}
      th{background:#f4f4f4}
      h1{border-bottom:2px solid #111;padding-bottom:8px}
      pre{white-space:pre-wrap;font-family:inherit}</style></head>
      <body><pre>${esc(rawMd)}</pre>
      <script>window.onload=()=>setTimeout(()=>window.print(),200)</script></body></html>`);
    w.document.close();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
              {test.name}
              {test.is_canonical && <Badge variant="secondary">Jobline Canonical</Badge>}
              {test.mentor_required && (
                <Badge variant="outline" className="text-[10px]">Mentor sign-off</Badge>
              )}
            </CardTitle>
            {test.description && (
              <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={printBackup}>
            <Printer className="w-3.5 h-3.5 mr-1" /> Printable backup
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {test.instructions_md && (
          <div className="text-xs whitespace-pre-wrap bg-muted/40 p-3 rounded border">
            {test.instructions_md}
          </div>
        )}

        <div className="space-y-2">
          {test.measurements.map((m, i) => {
            const r = recorded[i];
            return (
              <div
                key={i}
                className="flex items-end gap-3 p-2 rounded border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`m-${test.id}-${i}`} className="text-xs">
                    {m.label}
                  </Label>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Target {m.target} {m.unit} · Tol ±{m.tolerance} {m.unit}
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    id={`m-${test.id}-${i}`}
                    type="number"
                    step="0.0001"
                    placeholder={`Reading (${m.unit})`}
                    value={readings[i] ?? ""}
                    onChange={(e) =>
                      setReadings((prev) => ({ ...prev, [i]: e.target.value }))
                    }
                  />
                </div>
                <div className="w-6 flex justify-center">
                  {r.recorded === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : r.pass ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t">
          <div className="text-sm">
            <span className="font-mono">
              {passed}/{test.measurements.length}
            </span>{" "}
            correct ·{" "}
            <span className={wouldPass ? "text-green-600 font-semibold" : "text-destructive"}>
              {score}%
            </span>{" "}
            <span className="text-muted-foreground text-xs">
              (need {test.passing_score}%)
            </span>
          </div>
          <Button onClick={submit} disabled={submitting || !user}>
            {submitting ? "Submitting…" : test.mentor_required ? "Submit for review" : "Submit"}
          </Button>
        </div>
        {!user && (
          <p className="text-xs text-muted-foreground text-center">
            <Link to="/auth?redirect=/oap/proficiency" className="underline">
              Sign in
            </Link>{" "}
            to submit attempts and track results.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AttemptCard({ attempt, testName }: { attempt: Attempt; testName: string }) {
  const StatusIcon =
    attempt.status === "passed"
      ? CheckCircle2
      : attempt.status === "failed"
        ? XCircle
        : attempt.status === "needs_retest"
          ? Clock
          : FileText;
  const tone =
    attempt.status === "passed"
      ? "text-green-600"
      : attempt.status === "failed"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon className={`w-5 h-5 ${tone}`} />
          <div className="min-w-0">
            <div className="font-medium truncate">{testName}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(attempt.submitted_at).toLocaleString()}
              {attempt.score !== null && ` · ${attempt.score}%`}
            </div>
          </div>
        </div>
        <Badge variant={attempt.status === "passed" ? "default" : "secondary"}>
          {attempt.status.replace("_", " ")}
        </Badge>
      </CardContent>
    </Card>
  );
}

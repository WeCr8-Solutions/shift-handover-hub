import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, TrendingDown, BarChart3 } from "lucide-react";

type Program = "gca" | "oap";

interface Props {
  program: Program;
  /** GCA: bank_id. OAP: quiz_id. */
  parentId: string;
}

interface AttemptRow {
  id: string;
  user_id: string;
  score_pct: number | null;
  passed: boolean | null;
  duration_seconds: number | null;
  answers: any;
  started_at: string | null;
  completed_at: string | null;
}

interface QuestionRow {
  id: string;
  prompt: string;
  question_type: string;
  correct_answers: any;
}

/**
 * Read-only attempts review for admins.
 *
 * - Lists the most recent 50 attempts for a bank/quiz.
 * - Computes per-question accuracy from the `answers` jsonb column so admins
 *   can spot questions with chronically low correct rates and revise them.
 *
 * RLS: platform admins can already SELECT both attempts tables, and org admins
 * see only their org's rows. No extra checks required here.
 */
export function AttemptsReviewPanel({ program, parentId }: Props) {
  const attemptsTable = program === "gca" ? "gca_test_attempts" : "oap_quiz_attempts";
  const parentColumn = program === "gca" ? "bank_id" : "quiz_id";
  // Use the admin-only views — base tables no longer expose correct_answers
  // to the `authenticated` role at the column level.
  const questionsTable = program === "gca" ? "gca_questions_admin" : "oap_quiz_questions_admin";
  const questionParent = program === "gca" ? "bank_id" : "quiz_id";

  const attemptsQuery = useQuery({
    queryKey: ["admin-attempts", program, parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(attemptsTable as any)
        .select("id, user_id, score_pct, passed, duration_seconds, answers, started_at, completed_at")
        .eq(parentColumn, parentId)
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AttemptRow[];
    },
    enabled: !!parentId,
  });

  const questionsQuery = useQuery({
    queryKey: ["admin-attempt-questions", program, parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(questionsTable as any)
        .select("id, prompt, question_type, correct_answers")
        .eq(questionParent, parentId);
      if (error) throw error;
      return (data ?? []) as unknown as QuestionRow[];
    },
    enabled: !!parentId,
  });

  const attempts = attemptsQuery.data ?? [];
  const questions = questionsQuery.data ?? [];

  const stats = useMemo(() => computePerQuestionAccuracy(attempts, questions), [attempts, questions]);

  const passRate = attempts.length
    ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
    : null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Attempts" value={attempts.length.toString()} />
        <SummaryCard label="Pass rate" value={passRate === null ? "—" : `${passRate}%`} />
        <SummaryCard
          label="Weakest question"
          value={stats.weakest ? `${Math.round(stats.weakest.accuracyPct)}%` : "—"}
          hint={stats.weakest?.prompt.slice(0, 32) ?? undefined}
        />
      </div>

      {/* Per-question accuracy */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Per-question accuracy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {questionsQuery.isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : stats.rows.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3">No graded answers yet.</p>
          ) : (
            <ScrollArea className="h-[260px]">
              <div className="divide-y">
                {stats.rows.map((r) => (
                  <div key={r.questionId} className="px-3 py-2 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{r.prompt}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.answeredCount} answered · {r.correctCount} correct
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        r.accuracyPct < 40
                          ? "border-destructive/50 text-destructive"
                          : r.accuracyPct < 70
                            ? "border-warning/50 text-warning"
                            : "border-success/50 text-success"
                      }
                    >
                      {r.answeredCount === 0 ? "—" : `${Math.round(r.accuracyPct)}%`}
                    </Badge>
                    {r.accuracyPct < 40 && r.answeredCount >= 3 && (
                      <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recent attempts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent attempts (last 50)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {attemptsQuery.isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : attempts.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3">No attempts yet.</p>
          ) : (
            <ScrollArea className="h-[260px]">
              <div className="divide-y text-xs">
                {attempts.map((a) => (
                  <div key={a.id} className="px-3 py-2 flex items-center gap-3">
                    {a.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    )}
                    <span className="font-mono text-[10px] text-muted-foreground truncate w-24">
                      {a.user_id.slice(0, 8)}…
                    </span>
                    <span className="font-medium">
                      {a.score_pct == null ? "—" : `${Math.round(Number(a.score_pct))}%`}
                    </span>
                    <span className="text-muted-foreground ml-auto">
                      {a.completed_at ? new Date(a.completed_at).toLocaleString() : "in progress"}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
        {hint && <div className="text-[10px] text-muted-foreground truncate">{hint}</div>}
      </CardContent>
    </Card>
  );
}

interface PerQuestionRow {
  questionId: string;
  prompt: string;
  answeredCount: number;
  correctCount: number;
  accuracyPct: number;
}

interface PerQuestionStats {
  rows: PerQuestionRow[];
  weakest: PerQuestionRow | null;
}

/**
 * Walks the `answers` jsonb on each attempt and tallies correctness per question.
 * Tolerates both legacy (numeric-index) and current (keyed) answer shapes.
 */
function computePerQuestionAccuracy(
  attempts: AttemptRow[],
  questions: QuestionRow[]
): PerQuestionStats {
  const byId = new Map<string, QuestionRow>();
  questions.forEach((q) => byId.set(q.id, q));

  const tallies = new Map<string, { answered: number; correct: number }>();

  for (const a of attempts) {
    const ans = a.answers;
    if (!ans || typeof ans !== "object") continue;
    const entries = Array.isArray(ans)
      ? ans.map((row: any) => [row?.question_id ?? row?.id, row?.answer ?? row?.value])
      : Object.entries(ans);

    for (const [qid, given] of entries) {
      if (typeof qid !== "string") continue;
      const q = byId.get(qid);
      if (!q) continue;
      const t = tallies.get(qid) ?? { answered: 0, correct: 0 };
      t.answered += 1;
      if (isAnswerCorrect(q, given)) t.correct += 1;
      tallies.set(qid, t);
    }
  }

  const rows: PerQuestionRow[] = questions
    .map((q) => {
      const t = tallies.get(q.id) ?? { answered: 0, correct: 0 };
      return {
        questionId: q.id,
        prompt: q.prompt,
        answeredCount: t.answered,
        correctCount: t.correct,
        accuracyPct: t.answered === 0 ? 0 : (t.correct / t.answered) * 100,
      };
    })
    .sort((a, b) => a.accuracyPct - b.accuracyPct);

  const answeredRows = rows.filter((r) => r.answeredCount >= 3);
  return { rows, weakest: answeredRows[0] ?? null };
}

function isAnswerCorrect(q: QuestionRow, given: unknown): boolean {
  const correct = q.correct_answers ?? [];
  const correctSet = new Set(
    (Array.isArray(correct) ? correct : [correct]).map((x) => String(x))
  );
  const givenList = Array.isArray(given) ? given : [given];
  const givenSet = new Set(givenList.map((x) => String(x)));
  if (correctSet.size !== givenSet.size) return false;
  for (const v of correctSet) if (!givenSet.has(v)) return false;
  return true;
}

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle, Trophy, Timer, RotateCcw, Lock } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GcaBank {
  id: string;
  slug: string;
  title: string;
  topic: string;
  description: string | null;
  difficulty: string;
  passing_score_pct: number;
  is_pro_only: boolean;
}

interface GcaQuestion {
  id: string;
  bank_id: string;
  question_type: string;
  prompt: string;
  choices: { key: string; label: string }[];
  points: number;
  sort_order: number;
}

interface GradedQuestion {
  question_id: string;
  is_correct: boolean;
  correct_answers: string[];
  explanation: string | null;
}

interface GradeResult {
  score_pct: number;
  passed: boolean;
  passing_score_pct: number;
  earned: number;
  total: number;
  questions: GradedQuestion[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useGcaBank(bankSlug: string) {
  return useQuery({
    queryKey: ["gca-bank", bankSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gca_question_banks")
        .select("*")
        .eq("slug", bankSlug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as GcaBank;
    },
  });
}

function useGcaQuestions(bankId: string | undefined) {
  return useQuery({
    queryKey: ["gca-questions", bankId],
    enabled: !!bankId,
    queryFn: async () => {
      // correct_answers + explanation are revoked from `authenticated` at the
      // column level — request only safe columns here.
      const { data, error } = await supabase
        .from("gca_questions")
        .select("id, bank_id, question_type, prompt, choices, points, sort_order")
        .eq("bank_id", bankId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as GcaQuestion[];
    },
  });
}

function useLastGcaAttempt(bankId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["gca-last-attempt", bankId, userId],
    enabled: !!bankId && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("gca_test_attempts")
        .select("score_pct, passed, completed_at")
        .eq("bank_id", bankId!)
        .eq("user_id", userId!)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
}

function useSubmitGcaAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      bank_id: string;
      answers: Record<string, string[]>;
      started_at: string;
    }): Promise<GradeResult> => {
      const { data, error } = await supabase.rpc("grade_gca_attempt", {
        _bank_id: params.bank_id,
        _answers: params.answers as unknown as Json,
        _started_at: params.started_at,
      });
      if (error) throw error;
      return data as unknown as GradeResult;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["gca-last-attempt", vars.bank_id] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to score test"),
  });
}

// ─── GcaTestPlayer ────────────────────────────────────────────────────────────

interface Props {
  bankSlug: string;
  hasProAccess: boolean;
  onUpgrade?: () => void;
}

export function GcaTestPlayer({ bankSlug, hasProAccess, onUpgrade }: Props) {
  const { user } = useAuth();
  const { data: bank, isLoading: bankLoading } = useGcaBank(bankSlug);
  const { data: questions = [], isLoading: qLoading } = useGcaQuestions(bank?.id);
  const lastAttempt = useLastGcaAttempt(bank?.id, user?.id);
  const submit = useSubmitGcaAttempt();

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [result, setResult] = useState<GradeResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Map question_id → graded info for post-submit review rendering
  const gradedById = useMemo(() => {
    const map: Record<string, GradedQuestion> = {};
    result?.questions.forEach((g) => { map[g.question_id] = g; });
    return map;
  }, [result]);

  const isProOnly = bank?.is_pro_only ?? false;
  const locked = isProOnly && !hasProAccess;

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => (answers[q.id]?.length ?? 0) > 0),
    [questions, answers],
  );

  useEffect(() => {
    if (submit.data) {
      setResult(submit.data);
      setReviewOpen(true);
    }
  }, [submit.data]);

  if (bankLoading || qLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground text-center">
          Loading test…
        </CardContent>
      </Card>
    );
  }

  if (!bank) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground text-center">
          Test bank not found.
        </CardContent>
      </Card>
    );
  }

  if (locked) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
          <Lock className="w-10 h-10 text-muted-foreground" />
          <div>
            <p className="font-semibold">Pro required</p>
            <p className="text-sm text-muted-foreground mt-1">
              The <strong>{bank.title}</strong> test is a Pro-only bank.
            </p>
          </div>
          {onUpgrade && (
            <Button onClick={onUpgrade}>Upgrade to GCA Pro</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground text-center">
          No questions in this bank yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              {bank.title}
            </CardTitle>
            {bank.description && (
              <p className="text-xs text-muted-foreground mt-1 max-w-prose">{bank.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{bank.difficulty}</Badge>
            <Badge variant="outline" className="gap-1">
              <Timer className="w-3 h-3" />
              Pass ≥ {bank.passing_score_pct}%
            </Badge>
            {lastAttempt.data && (
              <span className="text-xs text-muted-foreground">
                Last: {lastAttempt.data.score_pct}%{" "}
                {lastAttempt.data.passed ? "✓ passed" : "✗ did not pass"}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {questions.map((q, idx) => (
          <GcaQuestionRow
            key={q.id}
            index={idx}
            question={q}
            value={answers[q.id] ?? []}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
            review={reviewOpen}
            graded={gradedById[q.id]}
          />
        ))}

        {!result && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {Object.keys(answers).length}/{questions.length} answered
            </span>
            <Button
              onClick={() =>
                submit.mutate({
                  bank_id: bank.id,
                  answers,
                  started_at: startedAt,
                })
              }
              disabled={!allAnswered || submit.isPending || !user}
            >
              {submit.isPending ? "Scoring…" : user ? "Submit test" : "Sign in to submit"}
            </Button>
          </div>
        )}

        {result && (
          <div
            className={
              "rounded-md border p-4 flex items-center gap-3 " +
              (result.passed
                ? "border-primary bg-primary/5"
                : "border-destructive bg-destructive/5")
            }
          >
            {result.passed ? (
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-destructive shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {result.passed ? "Passed" : "Did not pass"} — {result.score_pct}%
              </p>
              {!result.passed && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review the explanations below, then try again.
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 shrink-0"
              onClick={() => {
                setAnswers({});
                setResult(null);
                setReviewOpen(false);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── GcaQuestionRow ───────────────────────────────────────────────────────────

function GcaQuestionRow({
  index,
  question,
  value,
  onChange,
  review,
  graded,
}: {
  index: number;
  question: GcaQuestion;
  value: string[];
  onChange: (v: string[]) => void;
  review: boolean;
  graded?: GradedQuestion;
}) {
  const choices = question.choices ?? [];
  const correct = new Set(graded?.correct_answers ?? []);
  const isMulti =
    question.question_type === "multi_select" || question.question_type === "multi_choice";

  const choiceClass = (key: string) => {
    if (!review) return "border-border";
    if (correct.has(key)) return "border-primary bg-primary/5";
    if (value.includes(key) && !correct.has(key)) return "border-destructive bg-destructive/5";
    return "border-border";
  };

  return (
    <div className="space-y-2 border rounded-md p-3">
      <Label className="text-sm font-medium block">
        {index + 1}. {question.prompt}
      </Label>

      {isMulti ? (
        <div className="space-y-1">
          {choices.map((c) => (
            <label
              key={c.key}
              className={`flex items-center gap-2 text-sm border rounded p-2 cursor-pointer ${choiceClass(c.key)}`}
            >
              <Checkbox
                checked={value.includes(c.key)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? Array.from(new Set([...value, c.key]))
                    : value.filter((k) => k !== c.key);
                  onChange(next);
                }}
                disabled={review}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <RadioGroup value={value[0] ?? ""} onValueChange={(v) => onChange([v])} disabled={review}>
          <div className="space-y-1">
            {choices.map((c) => (
              <label
                key={c.key}
                className={`flex items-center gap-2 text-sm border rounded p-2 cursor-pointer ${choiceClass(c.key)}`}
              >
                <RadioGroupItem value={c.key} id={`${question.id}-${c.key}`} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </RadioGroup>
      )}

      {review && graded?.explanation && (
        <p className="text-xs text-muted-foreground italic pt-1 border-t">
          {graded.explanation}
        </p>
      )}
    </div>
  );
}

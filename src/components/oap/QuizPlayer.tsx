import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOapQuizQuestions,
  useSubmitQuizAttempt,
  type OapQuiz,
  type OapQuizQuestion,
  type OapGradedQuestion,
} from "@/hooks/useOapProgram";
import { CheckCircle2, XCircle, Timer, Trophy } from "lucide-react";
import { InspectionToolVideoCard } from "@/components/training/InspectionToolVideoCard";

interface Props {
  quiz: OapQuiz;
  onComplete?: () => void;
  /** When provided, embeds an inspection-tool video card above the questions. */
  toolSlugs?: string[];
}

export function QuizPlayer({ quiz, onComplete, toolSlugs }: Props) {
  const { user } = useAuth();
  const { data: questions = [], isLoading } = useOapQuizQuestions(quiz.id);
  const submit = useSubmitQuizAttempt();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [gradedById, setGradedById] = useState<Record<string, OapGradedQuestion>>({});

  const lastAttempt = useQuery({
    queryKey: ["oap-quiz-last-attempt", quiz.id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("oap_quiz_attempts")
        .select("*")
        .eq("quiz_id", quiz.id)
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const setAnswer = (q: OapQuizQuestion, value: string[]) =>
    setAnswers((prev) => ({ ...prev, [q.id]: value }));

  const allAnswered = useMemo(
    () => questions.every((q) => (answers[q.id]?.length ?? 0) > 0),
    [questions, answers],
  );

  useEffect(() => {
    if (submit.data) {
      setResult({ score: submit.data.score_pct, passed: submit.data.passed });
      setReviewOpen(true);
      const map: Record<string, OapGradedQuestion> = {};
      submit.data.questions.forEach((g) => { map[g.question_id] = g; });
      setGradedById(map);
      onComplete?.();
    }
  }, [submit.data, onComplete]);

  const handleSubmit = () => {
    submit.mutate({
      quiz_id: quiz.id,
      answers,
      started_at: startedAt,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Loading quiz…</CardContent>
      </Card>
    );
  }

  if (!questions.length) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No questions in this quiz yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> {quiz.title}
            </CardTitle>
            {quiz.description && (
              <p className="text-xs text-muted-foreground mt-1">{quiz.description}</p>
            )}
          </div>
          <div className="text-right space-y-1">
            <Badge variant="outline" className="gap-1">
              <Timer className="w-3 h-3" /> Pass ≥ {quiz.passing_score_pct}%
            </Badge>
            {lastAttempt.data && (
              <div className="text-xs text-muted-foreground">
                Last: {lastAttempt.data.score_pct}% ·{" "}
                {lastAttempt.data.passed ? "passed" : "did not pass"}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {toolSlugs && toolSlugs.length > 0 && (
          <InspectionToolVideoCard
            slugs={toolSlugs}
            title="Need a refresher? Watch the tool"
            subtitle="Tutorials open here so you don't lose answers in progress."
            openLinksInNewTab
          />
        )}
        {questions.map((q, idx) => (
          <QuestionRow
            key={q.id}
            index={idx}
            question={q}
            value={answers[q.id] ?? []}
            onChange={(v) => setAnswer(q, v)}
            review={reviewOpen}
            graded={gradedById[q.id]}
          />
        ))}

        {!result && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {Object.keys(answers).length}/{questions.length} answered
            </div>
            <Button onClick={handleSubmit} disabled={!allAnswered || submit.isPending}>
              {submit.isPending ? "Scoring…" : "Submit quiz"}
            </Button>
          </div>
        )}

        {result && (
          <div
            className={
              "rounded-md border p-3 flex items-center gap-2 " +
              (result.passed ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5")
            }
          >
            {result.passed ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
            <div className="text-sm font-medium">
              {result.passed ? "Passed" : "Did not pass"} — {result.score}%
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => {
                setAnswers({});
                setResult(null);
                setReviewOpen(false);
              }}
            >
              Try again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionRow({
  index,
  question,
  value,
  onChange,
  review,
  graded,
}: {
  index: number;
  question: OapQuizQuestion;
  value: string[];
  onChange: (v: string[]) => void;
  review: boolean;
  graded?: OapGradedQuestion;
}) {
  const choices = question.choices ?? [];
  const correct = new Set(graded?.correct_answers ?? []);
  const isMulti =
    question.question_type === "multi_choice" ||
    question.question_type === "multi_select";

  const showFeedback = review;
  const isRight = (key: string) =>
    showFeedback && correct.has(key)
      ? "border-primary bg-primary/5"
      : showFeedback && value.includes(key) && !correct.has(key)
        ? "border-destructive bg-destructive/5"
        : "border-border";

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
              className={`flex items-center gap-2 text-sm border rounded p-2 cursor-pointer ${isRight(c.key)}`}
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
        <RadioGroup
          value={value[0] ?? ""}
          onValueChange={(v) => onChange([v])}
          disabled={review}
        >
          <div className="space-y-1">
            {choices.map((c) => (
              <label
                key={c.key}
                className={`flex items-center gap-2 text-sm border rounded p-2 cursor-pointer ${isRight(c.key)}`}
              >
                <RadioGroupItem value={c.key} id={`${question.id}-${c.key}`} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </RadioGroup>
      )}

      {showFeedback && graded?.explanation && (
        <p className="text-xs text-muted-foreground italic">{graded.explanation}</p>
      )}
    </div>
  );
}

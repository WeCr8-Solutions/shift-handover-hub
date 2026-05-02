import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonChoicesField } from "./JsonChoicesField";
import { Trash2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export interface EditableQuestion {
  id?: string;
  question_type: string;
  prompt: string;
  choices: any[];
  correct_answers: any[];
  explanation: string | null;
  points: number;
  sort_order: number;
}

interface Props {
  initial: EditableQuestion;
  onSave: (q: EditableQuestion) => void;
  onDelete?: () => void;
  saving?: boolean;
  readOnly?: boolean;
}

/**
 * Canonical question_type values (post-normalization migration).
 * Players accept legacy aliases (`multiple_choice` → `single_choice`,
 * `multi_select` → `multi_choice`) for backwards compat, but the editor
 * only writes the canonical names.
 */
const TYPES = [
  { value: "single_choice", label: "Single Choice (one correct)" },
  { value: "multi_choice", label: "Multi-Select (≥1 correct)" },
  { value: "true_false", label: "True / False" },
  { value: "fill_in", label: "Fill-in" },
  { value: "drag_drop", label: "Drag & Drop" },
];

const LEGACY_TYPE_MAP: Record<string, string> = {
  multiple_choice: "single_choice",
  multi_select: "multi_choice",
};

function canonicalType(t: string): string {
  return LEGACY_TYPE_MAP[t] ?? t;
}

interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Mirrors the server-side `grade_gca_attempt` / `grade_oap_quiz_attempt`
 * cardinality checks so admins catch problems before round-tripping the DB.
 */
export function validateQuestion(q: EditableQuestion): ValidationResult {
  const errors: string[] = [];
  const type = canonicalType(q.question_type);

  if (!q.prompt?.trim()) errors.push("Prompt cannot be empty.");
  if (!Number.isFinite(q.points) || q.points < 0) errors.push("Points must be ≥ 0.");

  const choiceKeys = (q.choices ?? [])
    .map((c) => (c && typeof c === "object" ? c.key : null))
    .filter((k): k is string => typeof k === "string" && k.length > 0);
  const validKeySet = new Set(choiceKeys);

  if (type === "single_choice" || type === "multi_choice") {
    if (choiceKeys.length < 2) errors.push("Choice questions need at least 2 choices.");
    const labelsBlank = (q.choices ?? []).some(
      (c) => !c?.label || !String(c.label).trim()
    );
    if (labelsBlank) errors.push("Every choice needs a non-empty label.");

    const correct = (q.correct_answers ?? []).filter(
      (a) => typeof a === "string" && validKeySet.has(a)
    );
    const orphan = (q.correct_answers ?? []).filter(
      (a) => typeof a === "string" && !validKeySet.has(a) && a !== "true" && a !== "false"
    );
    if (orphan.length) errors.push(`Correct answers reference unknown keys: ${orphan.join(", ")}.`);

    if (type === "single_choice" && correct.length !== 1) {
      errors.push("Single-choice questions must have exactly one correct answer.");
    }
    if (type === "multi_choice" && correct.length < 1) {
      errors.push("Multi-select questions need at least one correct answer.");
    }
  } else if (type === "true_false") {
    const ans = q.correct_answers ?? [];
    const valid =
      ans.length === 1 &&
      (ans[0] === "true" || ans[0] === "false" || ans[0] === true || ans[0] === false);
    if (!valid) errors.push('True/False must have exactly one correct answer ("true" or "false").');
  } else if (type === "fill_in") {
    const ans = (q.correct_answers ?? []).filter(
      (a) => typeof a === "string" && a.trim().length > 0
    );
    if (ans.length === 0) errors.push("Fill-in questions need at least one accepted answer.");
  }

  return { ok: errors.length === 0, errors };
}

export function QuestionEditor({ initial, onSave, onDelete, saving, readOnly }: Props) {
  const [q, setQ] = useState<EditableQuestion>({
    ...initial,
    question_type: canonicalType(initial.question_type),
  });

  useEffect(() => {
    setQ({ ...initial, question_type: canonicalType(initial.question_type) });
  }, [initial.id]);

  const isMulti = q.question_type === "multi_choice";
  const showChoices = ["single_choice", "multi_choice"].includes(q.question_type);
  const validation = validateQuestion(q);

  const handleSave = () => {
    if (!validation.ok) {
      toast.error(validation.errors[0]);
      return;
    }
    onSave(q);
  };

  return (
    <Card className="border-border">
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="md:col-span-2">
            <Label className="text-xs">Type</Label>
            <Select
              value={q.question_type}
              onValueChange={(v) => {
                const next: EditableQuestion = { ...q, question_type: v };
                if (v === "true_false") {
                  // True/False stores plain "true"/"false" strings (no choices array needed by player,
                  // but we mirror them as keyed choices for editor display & grader sanity).
                  next.choices = [
                    { key: "true", label: "True" },
                    { key: "false", label: "False" },
                  ];
                  next.correct_answers = ["true"];
                } else if (v === "single_choice" || v === "multi_choice") {
                  // Reset T/F-shaped choices when switching back to a normal choice type
                  if (
                    next.choices?.length === 2 &&
                    next.choices.every((c: any) => c?.key === "true" || c?.key === "false")
                  ) {
                    next.choices = [];
                    next.correct_answers = [];
                  }
                }
                setQ(next);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Points</Label>
            <Input
              type="number"
              min={0}
              value={q.points}
              onChange={(e) => setQ({ ...q, points: Number(e.target.value) || 0 })}
              className="h-8"
              disabled={readOnly}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Prompt</Label>
          <Textarea
            value={q.prompt}
            onChange={(e) => setQ({ ...q, prompt: e.target.value })}
            rows={2}
            disabled={readOnly}
          />
        </div>

        {showChoices && (
          <JsonChoicesField
            choices={q.choices}
            correctAnswers={q.correct_answers}
            onChoicesChange={(c) => setQ({ ...q, choices: c })}
            onCorrectChange={(a) => setQ({ ...q, correct_answers: a })}
            multiSelect={isMulti}
          />
        )}

        {q.question_type === "true_false" && (
          <div>
            <Label className="text-xs">Correct answer</Label>
            <Select
              value={(q.correct_answers?.[0] as string) ?? "true"}
              onValueChange={(v) => setQ({ ...q, correct_answers: [v] })}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {q.question_type === "fill_in" && (
          <div>
            <Label className="text-xs">Accepted answers (comma-separated)</Label>
            <Input
              value={(q.correct_answers as string[]).join(", ")}
              onChange={(e) =>
                setQ({
                  ...q,
                  correct_answers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              className="h-8"
              disabled={readOnly}
            />
          </div>
        )}

        <div>
          <Label className="text-xs">Explanation (optional, shown only in practice mode)</Label>
          <Textarea
            value={q.explanation ?? ""}
            onChange={(e) => setQ({ ...q, explanation: e.target.value || null })}
            rows={2}
            disabled={readOnly}
          />
        </div>

        {!validation.ok && !readOnly && (
          <div className="rounded border border-destructive/40 bg-destructive/5 p-2 space-y-1">
            <div className="flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertTriangle className="w-3 h-3" /> {validation.errors.length} validation issue{validation.errors.length === 1 ? "" : "s"}
            </div>
            <ul className="text-[11px] text-destructive/90 list-disc pl-4">
              {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {!readOnly && (
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !validation.ok} className="gap-1">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
              {validation.ok && (
                <Badge variant="outline" className="text-[10px] h-5 border-success/40 text-success">
                  Valid
                </Badge>
              )}
            </div>
            {onDelete && q.id && (
              <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

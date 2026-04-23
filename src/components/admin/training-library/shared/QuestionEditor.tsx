import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { JsonChoicesField } from "./JsonChoicesField";
import { Trash2, Save } from "lucide-react";

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

const TYPES = [
  { value: "multiple_choice", label: "Multiple Choice (one)" },
  { value: "multi_select", label: "Multi-Select" },
  { value: "true_false", label: "True / False" },
  { value: "fill_in", label: "Fill-in" },
  { value: "drag_drop", label: "Drag & Drop" },
];

export function QuestionEditor({ initial, onSave, onDelete, saving, readOnly }: Props) {
  const [q, setQ] = useState<EditableQuestion>(initial);

  useEffect(() => setQ(initial), [initial.id]);

  const isMulti = q.question_type === "multi_select";
  const showChoices = ["multiple_choice", "multi_select", "true_false"].includes(q.question_type);

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
                  next.choices = ["True", "False"];
                  next.correct_answers = [0];
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

        {q.question_type === "fill_in" && (
          <div>
            <Label className="text-xs">Accepted answers (comma-separated)</Label>
            <Input
              value={(q.correct_answers as string[]).join(", ")}
              onChange={(e) => setQ({ ...q, correct_answers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              className="h-8"
              disabled={readOnly}
            />
          </div>
        )}

        <div>
          <Label className="text-xs">Explanation (optional)</Label>
          <Textarea
            value={q.explanation ?? ""}
            onChange={(e) => setQ({ ...q, explanation: e.target.value || null })}
            rows={2}
            disabled={readOnly}
          />
        </div>

        {!readOnly && (
          <div className="flex justify-between items-center pt-2 border-t">
            <Button size="sm" onClick={() => onSave(q)} disabled={saving} className="gap-1">
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
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

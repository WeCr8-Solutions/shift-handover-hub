import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

interface Props {
  choices: any[];
  correctAnswers: any[];
  onChoicesChange: (choices: string[]) => void;
  onCorrectChange: (correct: any[]) => void;
  multiSelect: boolean;
}

/**
 * Editor for question choices + correct-answer marking.
 * Choices are stored as `string[]`; correct_answers stores indices (numbers).
 */
export function JsonChoicesField({
  choices,
  correctAnswers,
  onChoicesChange,
  onCorrectChange,
  multiSelect,
}: Props) {
  const stringChoices: string[] = (choices ?? []).map((c) => (typeof c === "string" ? c : c?.text ?? String(c)));
  const correctIdx: number[] = (correctAnswers ?? []).map((a) => (typeof a === "number" ? a : Number(a))).filter((n) => !isNaN(n));

  const updateChoice = (i: number, value: string) => {
    const next = [...stringChoices];
    next[i] = value;
    onChoicesChange(next);
  };

  const addChoice = () => onChoicesChange([...stringChoices, ""]);

  const removeChoice = (i: number) => {
    const next = stringChoices.filter((_, idx) => idx !== i);
    onChoicesChange(next);
    onCorrectChange(correctIdx.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)));
  };

  const toggleCorrect = (i: number) => {
    if (multiSelect) {
      const has = correctIdx.includes(i);
      onCorrectChange(has ? correctIdx.filter((c) => c !== i) : [...correctIdx, i]);
    } else {
      onCorrectChange([i]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Choices ({multiSelect ? "select all correct" : "select one correct"})</Label>
      <div className="space-y-1.5">
        {stringChoices.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <Checkbox
              checked={correctIdx.includes(i)}
              onCheckedChange={() => toggleCorrect(i)}
              aria-label={`Mark choice ${i + 1} correct`}
            />
            <Input
              value={c}
              onChange={(e) => updateChoice(i, e.target.value)}
              placeholder={`Choice ${i + 1}`}
              className="h-8 text-sm"
            />
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeChoice(i)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={addChoice} className="gap-1">
        <Plus className="w-3.5 h-3.5" /> Add choice
      </Button>
    </div>
  );
}

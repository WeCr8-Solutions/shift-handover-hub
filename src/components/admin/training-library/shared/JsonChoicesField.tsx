import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

export interface KeyedChoice {
  key: string;
  label: string;
}

interface Props {
  choices: any[];
  correctAnswers: any[];
  onChoicesChange: (choices: KeyedChoice[]) => void;
  onCorrectChange: (correct: string[]) => void;
  multiSelect: boolean;
}

/**
 * Editor for question choices + correct-answer marking.
 *
 * Canonical storage (post-normalization migration):
 *   choices         = [{ key: "a", label: "..." }, ...]
 *   correct_answers = ["a", "b"]   // array of choice keys
 *
 * This component is backwards-compatible: if it receives legacy `string[]`
 * choices or numeric-index `correct_answers`, it transparently upgrades them
 * to the keyed format on first edit.
 */

const KEY_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

function nextKey(used: Set<string>): string {
  for (const ch of KEY_ALPHABET) {
    if (!used.has(ch)) return ch;
  }
  // Fallback for >26 choices (rare): a1, a2...
  let i = 1;
  while (used.has(`a${i}`)) i++;
  return `a${i}`;
}

function normalizeChoices(raw: any[]): KeyedChoice[] {
  const used = new Set<string>();
  const out: KeyedChoice[] = [];
  (raw ?? []).forEach((c, i) => {
    if (c && typeof c === "object" && typeof c.key === "string" && typeof c.label === "string") {
      used.add(c.key);
      out.push({ key: c.key, label: c.label });
      return;
    }
    // Legacy: string OR { text: "..." } OR anything stringifiable
    const label = typeof c === "string" ? c : (c?.label ?? c?.text ?? String(c ?? ""));
    const key = nextKey(used);
    used.add(key);
    out.push({ key, label });
  });
  return out;
}

function normalizeCorrect(raw: any[], choices: KeyedChoice[]): string[] {
  const keysByIdx = choices.map((c) => c.key);
  const validKeys = new Set(keysByIdx);
  const out = new Set<string>();
  (raw ?? []).forEach((a) => {
    if (typeof a === "string") {
      // Already a key, OR a "true"/"false" string for T/F questions
      if (validKeys.has(a)) out.add(a);
      else if (a === "true" || a === "false") out.add(a);
    } else if (typeof a === "number" && Number.isFinite(a)) {
      const k = keysByIdx[a];
      if (k) out.add(k);
    }
  });
  return Array.from(out);
}

export function JsonChoicesField({
  choices,
  correctAnswers,
  onChoicesChange,
  onCorrectChange,
  multiSelect,
}: Props) {
  const keyed = normalizeChoices(choices);
  const correctKeys = normalizeCorrect(correctAnswers, keyed);

  const updateLabel = (key: string, label: string) => {
    onChoicesChange(keyed.map((c) => (c.key === key ? { ...c, label } : c)));
  };

  const addChoice = () => {
    const used = new Set(keyed.map((c) => c.key));
    onChoicesChange([...keyed, { key: nextKey(used), label: "" }]);
  };

  const removeChoice = (key: string) => {
    onChoicesChange(keyed.filter((c) => c.key !== key));
    onCorrectChange(correctKeys.filter((k) => k !== key));
  };

  const toggleCorrect = (key: string) => {
    if (multiSelect) {
      onCorrectChange(
        correctKeys.includes(key)
          ? correctKeys.filter((k) => k !== key)
          : [...correctKeys, key]
      );
    } else {
      onCorrectChange([key]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">
        Choices ({multiSelect ? "select all correct" : "select one correct"})
      </Label>
      <div className="space-y-1.5">
        {keyed.map((c) => (
          <div key={c.key} className="flex items-center gap-2">
            <Checkbox
              checked={correctKeys.includes(c.key)}
              onCheckedChange={() => toggleCorrect(c.key)}
              aria-label={`Mark choice ${c.key.toUpperCase()} correct`}
            />
            <span className="text-[10px] font-mono text-muted-foreground w-4 text-center uppercase">
              {c.key}
            </span>
            <Input
              value={c.label}
              onChange={(e) => updateLabel(c.key, e.target.value)}
              placeholder={`Choice ${c.key.toUpperCase()}`}
              className="h-8 text-sm"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => removeChoice(c.key)}
              aria-label={`Remove choice ${c.key.toUpperCase()}`}
            >
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

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TermQuiz } from "@/lib/LearnGlossaryData";

interface Props {
  quiz: TermQuiz;
  termId: string;
}

export function TermQuizSection({ quiz, termId }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const correctIdx = quiz.options.findIndex((option) => option.correct);
  const isRight = answered && selected === correctIdx;

  return (
    <div>
      <p className="mb-3 text-sm font-medium leading-snug text-foreground">{quiz.question}</p>

      <div className="mb-3 flex flex-col gap-2" role="group" aria-label="Quiz options">
        {quiz.options.map((option, index) => {
          const isSelected = selected === index;
          const showRight = answered && index === correctIdx;
          const showWrong = answered && isSelected && index !== correctIdx;

          return (
            <button
              key={option.text}
              type="button"
              id={`quiz-opt-${termId}-${index}`}
              disabled={answered}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm transition-all duration-150",
                !answered && "cursor-pointer hover:border-border/80 hover:bg-muted/40",
                !answered && isSelected && "border-primary bg-primary/5",
                !answered && !isSelected && "border-border bg-transparent",
                showRight && "border-green-400 bg-green-50 text-green-700",
                showWrong && "border-red-300 bg-red-50 text-red-600 opacity-70",
                answered && !isSelected && !showRight && "opacity-50",
              )}
              onClick={() => {
                if (!answered) {
                  setSelected(index);
                }
              }}
              onKeyDown={(event) => {
                if (!answered && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  setSelected(index);
                }
              }}
            >
              <span
                className={cn(
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  !answered && isSelected && "border-primary bg-primary text-primary-foreground",
                  !answered && !isSelected && "border-border text-muted-foreground",
                  showRight && "border-green-500 bg-green-500 text-white",
                  showWrong && "border-red-400 bg-red-400 text-white",
                )}
              >
                {showRight ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : showWrong ? (
                  <XCircle className="h-3 w-3" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {!answered ? (
        <Button size="sm" className="text-xs" disabled={selected === null} onClick={() => setAnswered(true)}>
          Check Answer
        </Button>
      ) : (
        <div
          className={cn(
            "rounded-md border px-3 py-2.5 text-xs leading-relaxed",
            isRight ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          {isRight ? quiz.correctExplanation : quiz.wrongExplanation}
        </div>
      )}
    </div>
  );
}
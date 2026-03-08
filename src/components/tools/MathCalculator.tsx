import { Button } from "@/components/ui/button";
import { Delete, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalculator } from "@/hooks/useCalculator";

// Re-export for tests that import from here
export { safeEvaluate } from "@/hooks/useCalculator";

// ─── Button layout ───────────────────────────────────────
const BUTTONS = [
  ["(", ")", "%", "C"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "-"],
  ["0", ".", "⌫", "+"],
  ["^", "√", "π", "="],
];

export function MathCalculator() {
  const { display, expression, error, history, press, clearHistory, loadFromHistory } = useCalculator();

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className="rounded-lg border bg-muted/30 p-3 min-h-[72px] flex flex-col justify-end">
        <p className="text-xs text-muted-foreground font-mono truncate min-h-[16px]">
          {expression || " "}
        </p>
        <p className={cn(
          "text-2xl font-bold font-mono text-right truncate",
          error ? "text-destructive text-base" : "text-foreground"
        )}>
          {error || display}
        </p>
      </div>

      {/* Button grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {BUTTONS.flat().map((key) => {
          const isOp = "÷×-+^%".includes(key);
          const isEquals = key === "=";
          const isFunc = ["(", ")", "√", "π"].includes(key);
          const isClear = key === "C";
          const isBackspace = key === "⌫";
          return (
            <Button
              key={key}
              variant={isEquals ? "default" : isClear ? "destructive" : "outline"}
              className={cn(
                "h-11 text-base font-semibold",
                isOp && "text-primary bg-primary/5 hover:bg-primary/10 border-primary/20",
                isFunc && "text-muted-foreground text-sm",
                isBackspace && "text-muted-foreground",
              )}
              onClick={() => press(key)}
            >
              {isBackspace ? <Delete className="w-4 h-4" /> : key}
            </Button>
          );
        })}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">History</p>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearHistory}>
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {history.map((entry, i) => (
              <button
                key={i}
                onClick={() => loadFromHistory(entry)}
                className="w-full flex justify-between text-xs px-2 py-1 rounded hover:bg-muted/50 transition-colors font-mono"
              >
                <span className="text-muted-foreground truncate mr-2">{entry.expression}</span>
                <span className="font-medium text-foreground shrink-0">= {entry.result}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Supports: + − × ÷ ^ % √ π · Parentheses · sin cos tan log ln abs
      </p>
    </div>
  );
}

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Delete, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Safe math expression evaluator (no eval) ───────────────
type Token = { type: "number"; value: number } | { type: "op"; value: string } | { type: "lparen" } | { type: "rparen" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " ") { i++; continue; }
    if (ch === "(") { tokens.push({ type: "lparen" }); i++; continue; }
    if (ch === ")") { tokens.push({ type: "rparen" }); i++; continue; }
    if ("+-×÷*/^%".includes(ch)) {
      // Handle unary minus: at start, after operator, or after '('
      if (ch === "-" && (tokens.length === 0 || tokens[tokens.length - 1].type === "op" || tokens[tokens.length - 1].type === "lparen")) {
        let num = "-";
        i++;
        while (i < expr.length && (isDigitOrDot(expr[i]))) { num += expr[i]; i++; }
        tokens.push({ type: "number", value: parseFloat(num) });
        continue;
      }
      const op = ch === "×" ? "*" : ch === "÷" ? "/" : ch;
      tokens.push({ type: "op", value: op }); i++; continue;
    }
    if (isDigitOrDot(ch)) {
      let num = "";
      while (i < expr.length && isDigitOrDot(expr[i])) { num += expr[i]; i++; }
      tokens.push({ type: "number", value: parseFloat(num) });
      continue;
    }
    // Try to match named functions: sqrt, sin, cos, tan, log, ln, abs, pi, e
    const rest = expr.slice(i).toLowerCase();
    if (rest.startsWith("sqrt")) { tokens.push({ type: "op", value: "sqrt" }); i += 4; continue; }
    if (rest.startsWith("sin")) { tokens.push({ type: "op", value: "sin" }); i += 3; continue; }
    if (rest.startsWith("cos")) { tokens.push({ type: "op", value: "cos" }); i += 3; continue; }
    if (rest.startsWith("tan")) { tokens.push({ type: "op", value: "tan" }); i += 3; continue; }
    if (rest.startsWith("log")) { tokens.push({ type: "op", value: "log" }); i += 3; continue; }
    if (rest.startsWith("ln")) { tokens.push({ type: "op", value: "ln" }); i += 2; continue; }
    if (rest.startsWith("abs")) { tokens.push({ type: "op", value: "abs" }); i += 3; continue; }
    if (rest.startsWith("pi") || rest.startsWith("π")) {
      tokens.push({ type: "number", value: Math.PI });
      i += rest.startsWith("pi") ? 2 : 1; continue;
    }
    if (ch.toLowerCase() === "e" && (i + 1 >= expr.length || !isAlpha(expr[i + 1]))) {
      tokens.push({ type: "number", value: Math.E }); i++; continue;
    }
    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

function isDigitOrDot(c: string) { return (c >= "0" && c <= "9") || c === "."; }
function isAlpha(c: string) { return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z"); }

// Recursive descent parser with proper precedence
function parseExpr(tokens: Token[], pos: { i: number }): number {
  let left = parseTerm(tokens, pos);
  while (pos.i < tokens.length && tokens[pos.i].type === "op" && (tokens[pos.i].value === "+" || tokens[pos.i].value === "-")) {
    const op = (tokens[pos.i] as { type: "op"; value: string }).value;
    pos.i++;
    const right = parseTerm(tokens, pos);
    left = op === "+" ? left + right : left - right;
  }
  return left;
}

function parseTerm(tokens: Token[], pos: { i: number }): number {
  let left = parseExponent(tokens, pos);
  while (pos.i < tokens.length) {
    const t = tokens[pos.i];
    if (t.type !== "op" || !"*/%".includes(t.value)) break;
    const op = t.value;
    pos.i++;
    const right = parseExponent(tokens, pos);
    if (op === "*") left *= right;
    else if (op === "/") { if (right === 0) throw new Error("Division by zero"); left /= right; }
    else left %= right;
  }
  return left;
}

function parseExponent(tokens: Token[], pos: { i: number }): number {
  let base = parseUnary(tokens, pos);
  while (pos.i < tokens.length && tokens[pos.i].type === "op" && (tokens[pos.i] as { type: "op"; value: string }).value === "^") {
    pos.i++;
    const exp = parseUnary(tokens, pos);
    base = Math.pow(base, exp);
  }
  return base;
}

function parseUnary(tokens: Token[], pos: { i: number }): number {
  const tok = tokens[pos.i];
  if (!tok) throw new Error("Unexpected end");
  // Unary functions
  if (tok.type === "op" && ["sqrt", "sin", "cos", "tan", "log", "ln", "abs"].includes(tok.value)) {
    pos.i++;
    const arg = parseUnary(tokens, pos);
    switch (tok.value) {
      case "sqrt": return Math.sqrt(arg);
      case "sin": return Math.sin(arg);
      case "cos": return Math.cos(arg);
      case "tan": return Math.tan(arg);
      case "log": return Math.log10(arg);
      case "ln": return Math.log(arg);
      case "abs": return Math.abs(arg);
      default: throw new Error(`Unknown function: ${tok.value}`);
    }
  }
  return parsePrimary(tokens, pos);
}

function parsePrimary(tokens: Token[], pos: { i: number }): number {
  const tok = tokens[pos.i];
  if (!tok) throw new Error("Unexpected end");
  if (tok.type === "number") { pos.i++; return tok.value; }
  if (tok.type === "lparen") {
    pos.i++;
    const val = parseExpr(tokens, pos);
    if (pos.i >= tokens.length || tokens[pos.i].type !== "rparen") throw new Error("Missing )");
    pos.i++;
    return val;
  }
  throw new Error("Unexpected token");
}

export function safeEvaluate(expr: string): number {
  if (!expr.trim()) throw new Error("Empty expression");
  const tokens = tokenize(expr);
  if (tokens.length === 0) throw new Error("Empty expression");
  const pos = { i: 0 };
  const result = parseExpr(tokens, pos);
  if (pos.i < tokens.length) throw new Error("Unexpected token after expression");
  if (!isFinite(result)) throw new Error("Result is not finite");
  return result;
}

// ─── Format display number ────────────────────────────────
function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  const fixed = n.toFixed(10).replace(/\.?0+$/, "");
  return fixed.length < 16 ? fixed : n.toPrecision(10);
}

// ─── Calculator UI ────────────────────────────────────────
const BUTTONS = [
  ["(", ")", "%", "C"],
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "-"],
  ["0", ".", "⌫", "+"],
  ["^", "√", "π", "="],
];

interface HistoryEntry { expression: string; result: string }

export function MathCalculator() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handlePress = useCallback((key: string) => {
    setError(null);
    switch (key) {
      case "C":
        setDisplay("0");
        setExpression("");
        break;
      case "⌫":
        setExpression((prev) => {
          const next = prev.slice(0, -1);
          setDisplay(next || "0");
          return next;
        });
        break;
      case "=": {
        try {
          const raw = expression.replace(/√/g, "sqrt");
          const result = safeEvaluate(raw);
          const formatted = formatResult(result);
          setHistory((prev) => [{ expression, result: formatted }, ...prev].slice(0, 20));
          setDisplay(formatted);
          setExpression(formatted);
        } catch (e: any) {
          setError(e.message || "Error");
        }
        break;
      }
      case "√":
        setExpression((prev) => {
          const next = prev + "√(";
          setDisplay(next);
          return next;
        });
        break;
      case "π":
        setExpression((prev) => {
          const next = prev + "π";
          setDisplay(next);
          return next;
        });
        break;
      default:
        setExpression((prev) => {
          const next = prev === "0" && key !== "." ? key : prev + key;
          setDisplay(next);
          return next;
        });
    }
  }, [expression]);

  const loadFromHistory = (entry: HistoryEntry) => {
    setExpression(entry.result);
    setDisplay(entry.result);
    setError(null);
  };

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
              onClick={() => handlePress(key)}
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
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setHistory([])}>
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

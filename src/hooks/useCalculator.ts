import { useState, useCallback } from "react";

// ─── Safe math expression evaluator (no eval) ───────────────
type Token =
  | { type: "number"; value: number }
  | { type: "op"; value: string }
  | { type: "lparen" }
  | { type: "rparen" };

function isDigitOrDot(c: string) {
  return (c >= "0" && c <= "9") || c === ".";
}
function isAlpha(c: string) {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

const FUNCTIONS = ["sqrt", "sin", "cos", "tan", "log", "ln", "abs"] as const;
const OPERATORS = "+-×÷*/^%";

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " ") { i++; continue; }
    if (ch === "(") { tokens.push({ type: "lparen" }); i++; continue; }
    if (ch === ")") { tokens.push({ type: "rparen" }); i++; continue; }

    if (OPERATORS.includes(ch)) {
      // Unary minus: at start, after operator, or after '('
      if (
        ch === "-" &&
        (tokens.length === 0 ||
          tokens[tokens.length - 1].type === "op" ||
          tokens[tokens.length - 1].type === "lparen")
      ) {
        let num = "-";
        i++;
        while (i < expr.length && isDigitOrDot(expr[i])) { num += expr[i]; i++; }
        const parsed = parseFloat(num);
        if (isNaN(parsed)) throw new Error("Invalid number");
        tokens.push({ type: "number", value: parsed });
        continue;
      }
      const op = ch === "×" ? "*" : ch === "÷" ? "/" : ch;
      tokens.push({ type: "op", value: op });
      i++;
      continue;
    }

    if (isDigitOrDot(ch)) {
      let num = "";
      let dotCount = 0;
      while (i < expr.length && isDigitOrDot(expr[i])) {
        if (expr[i] === ".") dotCount++;
        if (dotCount > 1) throw new Error("Invalid number: multiple decimals");
        num += expr[i];
        i++;
      }
      tokens.push({ type: "number", value: parseFloat(num) });
      continue;
    }

    // Named functions & constants
    const rest = expr.slice(i).toLowerCase();
    let matched = false;
    for (const fn of FUNCTIONS) {
      if (rest.startsWith(fn)) {
        tokens.push({ type: "op", value: fn });
        i += fn.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    if (rest.startsWith("pi") || ch === "π") {
      // Implicit multiplication: 2π → 2 * π
      if (tokens.length > 0 && (tokens[tokens.length - 1].type === "number" || tokens[tokens.length - 1].type === "rparen")) {
        tokens.push({ type: "op", value: "*" });
      }
      tokens.push({ type: "number", value: Math.PI });
      i += ch === "π" ? 1 : 2;
      continue;
    }

    if (ch.toLowerCase() === "e" && (i + 1 >= expr.length || !isAlpha(expr[i + 1]))) {
      if (tokens.length > 0 && (tokens[tokens.length - 1].type === "number" || tokens[tokens.length - 1].type === "rparen")) {
        tokens.push({ type: "op", value: "*" });
      }
      tokens.push({ type: "number", value: Math.E });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

// ─── Recursive descent parser ─────────────────────────────
// Precedence (low → high): +- → */% → ^ → unary functions → primary

function parseExpr(tokens: Token[], pos: { i: number }): number {
  let left = parseTerm(tokens, pos);
  while (pos.i < tokens.length) {
    const t = tokens[pos.i];
    if (t.type !== "op" || (t.value !== "+" && t.value !== "-")) break;
    const op = t.value;
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
    else if (op === "/") {
      if (right === 0) throw new Error("Division by zero");
      left /= right;
    } else left %= right;
  }
  return left;
}

function parseExponent(tokens: Token[], pos: { i: number }): number {
  let base = parseUnary(tokens, pos);
  while (pos.i < tokens.length) {
    const t = tokens[pos.i];
    if (t.type !== "op" || t.value !== "^") break;
    pos.i++;
    const exp = parseUnary(tokens, pos);
    base = Math.pow(base, exp);
  }
  return base;
}

function parseUnary(tokens: Token[], pos: { i: number }): number {
  const tok = tokens[pos.i];
  if (!tok) throw new Error("Unexpected end of expression");
  if (tok.type === "op" && (FUNCTIONS as readonly string[]).includes(tok.value)) {
    pos.i++;
    const arg = parseUnary(tokens, pos);
    switch (tok.value) {
      case "sqrt": {
        if (arg < 0) throw new Error("√ of negative number");
        return Math.sqrt(arg);
      }
      case "sin": return Math.sin(arg);
      case "cos": return Math.cos(arg);
      case "tan": return Math.tan(arg);
      case "log": {
        if (arg <= 0) throw new Error("log of non-positive number");
        return Math.log10(arg);
      }
      case "ln": {
        if (arg <= 0) throw new Error("ln of non-positive number");
        return Math.log(arg);
      }
      case "abs": return Math.abs(arg);
      default: throw new Error(`Unknown function: ${tok.value}`);
    }
  }
  return parsePrimary(tokens, pos);
}

function parsePrimary(tokens: Token[], pos: { i: number }): number {
  const tok = tokens[pos.i];
  if (!tok) throw new Error("Unexpected end of expression");
  if (tok.type === "number") { pos.i++; return tok.value; }
  if (tok.type === "lparen") {
    pos.i++;
    const val = parseExpr(tokens, pos);
    if (pos.i >= tokens.length || tokens[pos.i].type !== "rparen") {
      throw new Error("Missing closing parenthesis");
    }
    pos.i++;
    return val;
  }
  throw new Error("Unexpected token");
}

/** Safely evaluate a math expression string. No eval(). */
export function safeEvaluate(expr: string): number {
  const trimmed = expr.trim();
  if (!trimmed) throw new Error("Empty expression");
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) throw new Error("Empty expression");
  const pos = { i: 0 };
  const result = parseExpr(tokens, pos);
  if (pos.i < tokens.length) throw new Error("Unexpected token after expression");
  if (!isFinite(result)) throw new Error("Result is not finite");
  return result;
}

/** Format a number for display */
export function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString("en-US", { useGrouping: false });
  const fixed = n.toFixed(10).replace(/\.?0+$/, "");
  return fixed.length < 16 ? fixed : n.toPrecision(10);
}

// ─── Calculator Hook ──────────────────────────────────────
export interface HistoryEntry {
  expression: string;
  result: string;
}

export interface UseCalculatorReturn {
  display: string;
  expression: string;
  error: string | null;
  history: HistoryEntry[];
  /** Whether the last action was "=" — next digit press resets */
  justEvaluated: boolean;
  press: (key: string) => void;
  clearHistory: () => void;
  loadFromHistory: (entry: HistoryEntry) => void;
}

/**
 * Hook encapsulating calculator state and input logic.
 *
 * Handles:
 * - Digit/operator input with proper sequencing
 * - Auto-reset after "=" when typing a new number
 * - Chaining: pressing an operator after "=" continues from the result
 * - Implicit multiplication before π and e
 * - Operator replacement (pressing + then × replaces + with ×)
 * - Backspace, clear, parentheses
 * - History (last 20 entries)
 */
export function useCalculator(): UseCalculatorReturn {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const isOperator = (ch: string) => "÷×-+^%".includes(ch);
  const lastChar = (s: string) => s[s.length - 1] || "";

  const press = useCallback((key: string) => {
    setError(null);

    // ─── Clear ─────────────────────────────────
    if (key === "C") {
      setDisplay("0");
      setExpression("");
      setJustEvaluated(false);
      return;
    }

    // ─── Backspace ─────────────────────────────
    if (key === "⌫") {
      if (justEvaluated) {
        setDisplay("0");
        setExpression("");
        setJustEvaluated(false);
        return;
      }
      setExpression((prev) => {
        // Handle multi-char tokens like "√("
        let next = prev;
        if (prev.endsWith("√(")) {
          next = prev.slice(0, -2);
        } else {
          next = prev.slice(0, -1);
        }
        setDisplay(next || "0");
        return next;
      });
      return;
    }

    // ─── Equals ────────────────────────────────
    if (key === "=") {
      setExpression((prev) => {
        try {
          const raw = prev.replace(/√/g, "sqrt");
          const result = safeEvaluate(raw);
          const formatted = formatResult(result);
          setHistory((h) => [{ expression: prev, result: formatted }, ...h].slice(0, 20));
          setDisplay(formatted);
          setJustEvaluated(true);
          return formatted;
        } catch (e: any) {
          setError(e.message || "Error");
          return prev;
        }
      });
      return;
    }

    // ─── Digits & dot ──────────────────────────
    if ((key >= "0" && key <= "9") || key === ".") {
      setExpression((prev) => {
        // After "=", start fresh with a new number
        if (justEvaluated) {
          setJustEvaluated(false);
          const next = key === "." ? "0." : key;
          setDisplay(next);
          return next;
        }
        // Prevent multiple dots in the current number segment
        if (key === ".") {
          const lastNum = prev.split(/[+\-×÷*/%^(]/).pop() || "";
          if (lastNum.includes(".")) {
            setDisplay(prev);
            return prev;
          }
        }
        const next = prev === "" && key !== "." ? key : prev + key;
        setDisplay(next);
        return next;
      });
      return;
    }

    // ─── Operators ─────────────────────────────
    if (isOperator(key)) {
      setExpression((prev) => {
        setJustEvaluated(false);
        // Replace last operator if chaining
        if (prev.length > 0 && isOperator(lastChar(prev))) {
          const next = prev.slice(0, -1) + key;
          setDisplay(next);
          return next;
        }
        // Don't allow operator at empty start (except minus for negative)
        if (prev === "" && key !== "-") return prev;
        const next = prev + key;
        setDisplay(next);
        return next;
      });
      return;
    }

    // ─── √ ─────────────────────────────────────
    if (key === "√") {
      setExpression((prev) => {
        const base = justEvaluated ? "" : prev;
        setJustEvaluated(false);
        const next = base + "√(";
        setDisplay(next);
        return next;
      });
      return;
    }

    // ─── π ─────────────────────────────────────
    if (key === "π") {
      setExpression((prev) => {
        const base = justEvaluated ? "" : prev;
        setJustEvaluated(false);
        const next = base + "π";
        setDisplay(next);
        return next;
      });
      return;
    }

    // ─── Parentheses ───────────────────────────
    if (key === "(" || key === ")") {
      setExpression((prev) => {
        const base = justEvaluated && key === "(" ? "" : prev;
        setJustEvaluated(false);
        // Smart paren: if "(" after a number, insert multiplication
        if (key === "(" && base.length > 0) {
          const lc = lastChar(base);
          if (lc >= "0" && lc <= "9" || lc === ")" || lc === "π") {
            const next = base + "×(";
            setDisplay(next);
            return next;
          }
        }
        const next = base + key;
        setDisplay(next);
        return next;
      });
      return;
    }

    // ─── Fallback: append ──────────────────────
    setExpression((prev) => {
      const next = prev + key;
      setDisplay(next);
      return next;
    });
  }, [justEvaluated]);

  const clearHistory = useCallback(() => setHistory([]), []);

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    setExpression(entry.result);
    setDisplay(entry.result);
    setError(null);
    setJustEvaluated(true);
  }, []);

  return { display, expression, error, history, justEvaluated, press, clearHistory, loadFromHistory };
}

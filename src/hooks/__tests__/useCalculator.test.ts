import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalculator, safeEvaluate, formatResult } from "../useCalculator";

// ─── safeEvaluate unit tests ──────────────────────────────

describe("safeEvaluate – basic arithmetic", () => {
  it("adds integers", () => expect(safeEvaluate("2+3")).toBe(5));
  it("subtracts", () => expect(safeEvaluate("10-4")).toBe(6));
  it("multiplies", () => expect(safeEvaluate("6*7")).toBe(42));
  it("multiplies with ×", () => expect(safeEvaluate("6×7")).toBe(42));
  it("divides", () => expect(safeEvaluate("15÷3")).toBe(5));
  it("divides with /", () => expect(safeEvaluate("15/3")).toBe(5));
  it("handles decimals", () => expect(safeEvaluate("0.1+0.2")).toBeCloseTo(0.3));
  it("modulo", () => expect(safeEvaluate("10%3")).toBe(1));
});

describe("safeEvaluate – operator precedence", () => {
  it("multiply before add", () => expect(safeEvaluate("2+3×4")).toBe(14));
  it("divide before subtract", () => expect(safeEvaluate("10-6÷2")).toBe(7));
  it("parens override", () => expect(safeEvaluate("(2+3)×4")).toBe(20));
  it("nested parens", () => expect(safeEvaluate("((2+3)×(4-1))")).toBe(15));
  it("exponent before multiply", () => expect(safeEvaluate("2×3^2")).toBe(18));
  it("complex: 2^3+4×5-6÷2", () => expect(safeEvaluate("2^3+4×5-6÷2")).toBe(25));
});

describe("safeEvaluate – unary minus", () => {
  it("negative number", () => expect(safeEvaluate("-5")).toBe(-5));
  it("negative start + addition", () => expect(safeEvaluate("-5+3")).toBe(-2));
  it("negative in parens", () => expect(safeEvaluate("(-3)×2")).toBe(-6));
});

describe("safeEvaluate – functions", () => {
  it("sqrt(9) = 3", () => expect(safeEvaluate("sqrt(9)")).toBe(3));
  it("sqrt(2)", () => expect(safeEvaluate("sqrt(2)")).toBeCloseTo(1.41421356));
  it("sin(0) = 0", () => expect(safeEvaluate("sin(0)")).toBe(0));
  it("cos(0) = 1", () => expect(safeEvaluate("cos(0)")).toBe(1));
  it("abs(-7) = 7", () => expect(safeEvaluate("abs(-7)")).toBe(7));
  it("log(100) = 2", () => expect(safeEvaluate("log(100)")).toBeCloseTo(2));
  it("ln(1) = 0", () => expect(safeEvaluate("ln(1)")).toBe(0));
});

describe("safeEvaluate – constants & implicit multiply", () => {
  it("pi", () => expect(safeEvaluate("pi")).toBeCloseTo(Math.PI));
  it("π symbol", () => expect(safeEvaluate("π")).toBeCloseTo(Math.PI));
  it("2*pi", () => expect(safeEvaluate("2*pi")).toBeCloseTo(2 * Math.PI));
  it("2π implicit multiply", () => expect(safeEvaluate("2π")).toBeCloseTo(2 * Math.PI));
});

describe("safeEvaluate – error handling", () => {
  it("division by zero", () => expect(() => safeEvaluate("5÷0")).toThrow("Division by zero"));
  it("empty string", () => expect(() => safeEvaluate("")).toThrow());
  it("missing closing paren", () => expect(() => safeEvaluate("(2+3")).toThrow("Missing closing parenthesis"));
  it("unexpected char", () => expect(() => safeEvaluate("2&3")).toThrow());
  it("sqrt of negative", () => expect(() => safeEvaluate("sqrt(-1)")).toThrow("√ of negative"));
  it("log of zero", () => expect(() => safeEvaluate("log(0)")).toThrow());
  it("multiple decimals", () => expect(() => safeEvaluate("1.2.3")).toThrow("multiple decimals"));
});

describe("formatResult", () => {
  it("integers display without decimals", () => expect(formatResult(42)).toBe("42"));
  it("trims trailing zeros", () => expect(formatResult(3.1)).toBe("3.1"));
  it("handles very small numbers", () => expect(formatResult(0.0000001).length).toBeLessThan(16));
  it("negative integers", () => expect(formatResult(-100)).toBe("-100"));
});

// ─── useCalculator hook tests ─────────────────────────────

describe("useCalculator – basic interaction", () => {
  it("starts with display 0", () => {
    const { result } = renderHook(() => useCalculator());
    expect(result.current.display).toBe("0");
    expect(result.current.expression).toBe("");
  });

  it("pressing digits builds expression", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("1"));
    act(() => result.current.press("2"));
    act(() => result.current.press("3"));
    expect(result.current.display).toBe("123");
    expect(result.current.expression).toBe("123");
  });

  it("pressing C clears everything", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("5"));
    act(() => result.current.press("+"));
    act(() => result.current.press("3"));
    act(() => result.current.press("C"));
    expect(result.current.display).toBe("0");
    expect(result.current.expression).toBe("");
  });

  it("evaluates simple addition", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("2"));
    act(() => result.current.press("+"));
    act(() => result.current.press("3"));
    act(() => result.current.press("="));
    expect(result.current.display).toBe("5");
    expect(result.current.error).toBeNull();
  });

  it("evaluates multiplication with precedence", () => {
    const { result } = renderHook(() => useCalculator());
    // 2+3×4 = 14
    "2+3×4".split("").forEach(k => act(() => result.current.press(k)));
    act(() => result.current.press("="));
    expect(result.current.display).toBe("14");
  });
});

describe("useCalculator – chaining after equals", () => {
  it("digit after = starts fresh", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("5"));
    act(() => result.current.press("+"));
    act(() => result.current.press("3"));
    act(() => result.current.press("="));
    expect(result.current.display).toBe("8");
    // Now type a new digit
    act(() => result.current.press("7"));
    expect(result.current.display).toBe("7");
    expect(result.current.expression).toBe("7");
  });

  it("operator after = chains from result", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("5"));
    act(() => result.current.press("+"));
    act(() => result.current.press("3"));
    act(() => result.current.press("="));
    expect(result.current.display).toBe("8");
    // Now press + to chain
    act(() => result.current.press("+"));
    act(() => result.current.press("2"));
    act(() => result.current.press("="));
    expect(result.current.display).toBe("10");
  });
});

describe("useCalculator – operator replacement", () => {
  it("replaces last operator when pressing a different one", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("5"));
    act(() => result.current.press("+"));
    act(() => result.current.press("×"));
    expect(result.current.expression).toBe("5×");
  });
});

describe("useCalculator – backspace", () => {
  it("removes last character", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("1"));
    act(() => result.current.press("2"));
    act(() => result.current.press("3"));
    act(() => result.current.press("⌫"));
    expect(result.current.display).toBe("12");
  });

  it("clears after = on backspace", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("5"));
    act(() => result.current.press("="));
    act(() => result.current.press("⌫"));
    expect(result.current.display).toBe("0");
  });

  it("removes √( as a unit", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("√"));
    expect(result.current.expression).toBe("√(");
    act(() => result.current.press("⌫"));
    expect(result.current.expression).toBe("");
  });
});

describe("useCalculator – decimal handling", () => {
  it("prevents double dot in same number", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("1"));
    act(() => result.current.press("."));
    act(() => result.current.press("5"));
    act(() => result.current.press("."));
    // Should still be 1.5, not 1.5.
    expect(result.current.expression).toBe("1.5");
  });

  it("allows dots in separate numbers", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("1"));
    act(() => result.current.press("."));
    act(() => result.current.press("5"));
    act(() => result.current.press("+"));
    act(() => result.current.press("2"));
    act(() => result.current.press("."));
    act(() => result.current.press("3"));
    act(() => result.current.press("="));
    expect(result.current.display).toBe("3.8");
  });
});

describe("useCalculator – history", () => {
  it("records history on =", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("2"));
    act(() => result.current.press("+"));
    act(() => result.current.press("2"));
    act(() => result.current.press("="));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].result).toBe("4");
  });

  it("loadFromHistory sets expression", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("9"));
    act(() => result.current.press("+"));
    act(() => result.current.press("1"));
    act(() => result.current.press("="));
    act(() => result.current.loadFromHistory({ expression: "9+1", result: "10" }));
    expect(result.current.display).toBe("10");
  });

  it("clearHistory empties list", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("1"));
    act(() => result.current.press("="));
    act(() => result.current.clearHistory());
    expect(result.current.history).toHaveLength(0);
  });
});

describe("useCalculator – error display", () => {
  it("shows error for division by zero", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("5"));
    act(() => result.current.press("÷"));
    act(() => result.current.press("0"));
    act(() => result.current.press("="));
    expect(result.current.error).toBe("Division by zero");
  });

  it("clears error on next keypress", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("5"));
    act(() => result.current.press("÷"));
    act(() => result.current.press("0"));
    act(() => result.current.press("="));
    expect(result.current.error).toBeTruthy();
    act(() => result.current.press("1"));
    expect(result.current.error).toBeNull();
  });
});

describe("useCalculator – smart parentheses", () => {
  it("inserts × before ( after a digit", () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.press("5"));
    act(() => result.current.press("("));
    expect(result.current.expression).toBe("5×(");
  });
});

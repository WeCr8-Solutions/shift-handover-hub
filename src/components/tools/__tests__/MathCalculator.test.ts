import { describe, it, expect } from "vitest";
import { safeEvaluate } from "../MathCalculator";

describe("safeEvaluate – basic arithmetic", () => {
  it("adds integers", () => expect(safeEvaluate("2+3")).toBe(5));
  it("subtracts", () => expect(safeEvaluate("10-4")).toBe(6));
  it("multiplies", () => expect(safeEvaluate("6×7")).toBe(42));
  it("divides", () => expect(safeEvaluate("15÷3")).toBe(5));
  it("handles decimals", () => expect(safeEvaluate("0.1+0.2")).toBeCloseTo(0.3));
  it("modulo", () => expect(safeEvaluate("10%3")).toBe(1));
});

describe("safeEvaluate – operator precedence", () => {
  it("multiplication before addition", () => expect(safeEvaluate("2+3×4")).toBe(14));
  it("division before subtraction", () => expect(safeEvaluate("10-6÷2")).toBe(7));
  it("parentheses override precedence", () => expect(safeEvaluate("(2+3)×4")).toBe(20));
  it("nested parentheses", () => expect(safeEvaluate("((2+3)×(4-1))")).toBe(15));
  it("exponent before multiply", () => expect(safeEvaluate("2×3^2")).toBe(18));
});

describe("safeEvaluate – unary minus", () => {
  it("negative number", () => expect(safeEvaluate("-5")).toBe(-5));
  it("negative start with addition", () => expect(safeEvaluate("-5+3")).toBe(-2));
  it("negative in parentheses", () => expect(safeEvaluate("(-3)×2")).toBe(-6));
});

describe("safeEvaluate – functions", () => {
  it("sqrt", () => expect(safeEvaluate("sqrt(9)")).toBe(3));
  it("sqrt(2)", () => expect(safeEvaluate("sqrt(2)")).toBeCloseTo(1.41421356));
  it("sin(0)", () => expect(safeEvaluate("sin(0)")).toBe(0));
  it("cos(0)", () => expect(safeEvaluate("cos(0)")).toBe(1));
  it("abs(-7)", () => expect(safeEvaluate("abs(-7)")).toBe(7));
  it("log(100)", () => expect(safeEvaluate("log(100)")).toBeCloseTo(2));
  it("ln(1)", () => expect(safeEvaluate("ln(1)")).toBe(0));
});

describe("safeEvaluate – constants", () => {
  it("pi", () => expect(safeEvaluate("pi")).toBeCloseTo(Math.PI));
  it("π symbol", () => expect(safeEvaluate("π")).toBeCloseTo(Math.PI));
  it("2*pi", () => expect(safeEvaluate("2*pi")).toBeCloseTo(2 * Math.PI));
});

describe("safeEvaluate – complex expressions", () => {
  it("quadratic-like", () => expect(safeEvaluate("(-3+sqrt(9+16))÷2")).toBeCloseTo(1));
  it("mixed operators", () => expect(safeEvaluate("2^3+4×5-6÷2")).toBe(25));
  it("chained exponents", () => expect(safeEvaluate("2^2^3")).toBe(256));
});

describe("safeEvaluate – error handling", () => {
  it("division by zero throws", () => expect(() => safeEvaluate("5÷0")).toThrow("Division by zero"));
  it("empty string throws", () => expect(() => safeEvaluate("")).toThrow());
  it("mismatched parens throws", () => expect(() => safeEvaluate("(2+3")).toThrow());
  it("unexpected char throws", () => expect(() => safeEvaluate("2&3")).toThrow());
});

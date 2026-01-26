import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    const result = cn("bg-red-500", "text-white");
    expect(result).toBe("bg-red-500 text-white");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("handles falsy values", () => {
    const isActive = false;
    const result = cn("base-class", isActive && "active-class", null, undefined);
    expect(result).toBe("base-class");
  });

  it("merges tailwind classes correctly", () => {
    // tailwind-merge should handle conflicting classes
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("handles arrays of classes", () => {
    const result = cn(["class-1", "class-2"], "class-3");
    expect(result).toBe("class-1 class-2 class-3");
  });

  it("handles objects with conditional classes", () => {
    const result = cn({
      "active": true,
      "disabled": false,
      "visible": true,
    });
    expect(result).toBe("active visible");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles mixed inputs", () => {
    const result = cn(
      "base",
      ["array-1", "array-2"],
      { conditional: true },
      undefined,
      "final"
    );
    expect(result).toBe("base array-1 array-2 conditional final");
  });
});

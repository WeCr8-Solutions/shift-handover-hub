import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PackageChip } from "./PackageChip";

describe("PackageChip", () => {
  it("links to the package detail and shows number + sequence", () => {
    render(
      <MemoryRouter>
        <PackageChip packageId="abc" packageNumber="PKG-00007" sequence={3} />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/packages/abc");
    expect(link).toHaveTextContent("PKG-00007");
    expect(link).toHaveTextContent("·3");
  });

  it("falls back to PKG label when no number is provided", () => {
    render(
      <MemoryRouter>
        <PackageChip packageId="abc" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link")).toHaveTextContent("PKG");
  });
});

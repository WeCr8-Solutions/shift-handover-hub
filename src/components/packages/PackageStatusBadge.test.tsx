import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PackageStatusBadge } from "./PackageStatusBadge";

describe("PackageStatusBadge", () => {
  it.each([
    ["draft", "Draft"],
    ["in_progress", "In Progress"],
    ["ready_to_ship", "Ready to Ship"],
    ["shipped", "Shipped"],
    ["closed", "Closed"],
    ["cancelled", "Cancelled"],
  ] as const)("renders %s as %s", (status, label) => {
    render(<PackageStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

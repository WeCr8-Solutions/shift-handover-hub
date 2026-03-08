import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReadOnlyGate } from "../ReadOnlyGate";

describe("ReadOnlyGate", () => {
  it("renders children directly when canEdit is true", () => {
    render(
      <ReadOnlyGate canEdit={true}>
        <button>Save</button>
      </ReadOnlyGate>
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).not.toBeDisabled();
  });

  it("wraps children in disabled fieldset when canEdit is false", () => {
    render(
      <ReadOnlyGate canEdit={false}>
        <input type="text" data-testid="input" />
      </ReadOnlyGate>
    );

    // The fieldset should be disabled
    const fieldset = document.querySelector("fieldset");
    expect(fieldset).toBeTruthy();
    expect(fieldset?.disabled).toBe(true);

    // Notice should be shown
    expect(screen.getByText(/managed by your organization admin/i)).toBeInTheDocument();
  });

  it("shows custom message when provided", () => {
    render(
      <ReadOnlyGate canEdit={false} message="Custom read-only message">
        <span>Content</span>
      </ReadOnlyGate>
    );
    expect(screen.getByText("Custom read-only message")).toBeInTheDocument();
  });

  it("does not render notice when canEdit is true", () => {
    render(
      <ReadOnlyGate canEdit={true}>
        <span>Content</span>
      </ReadOnlyGate>
    );
    expect(screen.queryByText(/managed by your organization admin/i)).not.toBeInTheDocument();
  });
});

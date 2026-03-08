import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LazyTabContent } from "../LazyTabContent";
import { Tabs } from "@/components/ui/tabs";

function renderWithTabs(activeTab: string, contentValue: string, children: React.ReactNode) {
  return render(
    <Tabs value={activeTab}>
      <LazyTabContent value={contentValue} activeTab={activeTab}>
        {children}
      </LazyTabContent>
    </Tabs>
  );
}

describe("LazyTabContent", () => {
  it("renders children when tab is active", () => {
    renderWithTabs("general", "general", <span>General Content</span>);
    expect(screen.getByText("General Content")).toBeInTheDocument();
  });

  it("does not render children when tab has never been active", () => {
    renderWithTabs("general", "billing", <span>Billing Content</span>);
    expect(screen.queryByText("Billing Content")).not.toBeInTheDocument();
  });

  it("keeps children in DOM after tab was previously active", () => {
    const { container, rerender } = render(
      <Tabs value="billing">
        <LazyTabContent value="billing" activeTab="billing">
          <span data-testid="billing-content">Billing Content</span>
        </LazyTabContent>
      </Tabs>
    );

    expect(screen.getByTestId("billing-content")).toBeInTheDocument();

    // Switch away — Radix hides inactive tabs with hidden attribute
    rerender(
      <Tabs value="general">
        <LazyTabContent value="billing" activeTab="general">
          <span data-testid="billing-content">Billing Content</span>
        </LazyTabContent>
      </Tabs>
    );

    // Children should still be in the DOM (just hidden by Radix), not unmounted
    const el = container.querySelector("[data-testid='billing-content']");
    expect(el).toBeTruthy();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LazyTabContent } from "../LazyTabContent";

// We need to wrap with a Tabs provider for TabsContent to work
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

  it("keeps children mounted after tab was previously active", () => {
    const { rerender } = render(
      <Tabs value="billing">
        <LazyTabContent value="billing" activeTab="billing">
          <span>Billing Content</span>
        </LazyTabContent>
      </Tabs>
    );

    expect(screen.getByText("Billing Content")).toBeInTheDocument();

    // Switch away
    rerender(
      <Tabs value="general">
        <LazyTabContent value="billing" activeTab="general">
          <span>Billing Content</span>
        </LazyTabContent>
      </Tabs>
    );

    // Content should still be in DOM (hidden by TabsContent), but mounted
    // TabsContent hides inactive tabs, but the children are still rendered
    expect(screen.getByText("Billing Content")).toBeInTheDocument();
  });
});

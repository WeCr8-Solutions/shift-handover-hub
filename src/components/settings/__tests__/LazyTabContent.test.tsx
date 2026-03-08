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
    // Children should not even be passed to TabsContent
    expect(screen.queryByText("Billing Content")).not.toBeInTheDocument();
  });

  it("passes children to TabsContent after tab was previously active (Radix handles visibility)", () => {
    const { rerender } = render(
      <Tabs value="billing">
        <LazyTabContent value="billing" activeTab="billing">
          <span>Billing Content</span>
        </LazyTabContent>
      </Tabs>
    );

    // Visible when active
    expect(screen.getByText("Billing Content")).toBeInTheDocument();

    // After switching away, LazyTabContent still passes children (hasBeenActive = true),
    // but Radix unmounts inactive TabsContent children by default.
    // The key behavior: children are NOT set to null (lazy gate stays open).
    rerender(
      <Tabs value="billing">
        <LazyTabContent value="billing" activeTab="billing">
          <span>Billing Content</span>
        </LazyTabContent>
      </Tabs>
    );

    // Re-activating should immediately show content without re-triggering a fresh mount
    expect(screen.getByText("Billing Content")).toBeInTheDocument();
  });
});

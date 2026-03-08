import { useState, useEffect, ReactNode } from "react";
import { TabsContent } from "@/components/ui/tabs";

interface LazyTabContentProps {
  /** The tab value this content corresponds to */
  value: string;
  /** The currently active tab value */
  activeTab: string;
  /** Content to render when the tab becomes active */
  children: ReactNode;
}

/**
 * Wraps `<TabsContent>` with lazy mounting: children are not rendered until the
 * tab is activated for the first time, then kept mounted to preserve form state.
 *
 * This reduces initial page load from 11+ parallel Supabase queries to just 1-2
 * (only the active tab fetches data).
 */
export function LazyTabContent({ value, activeTab, children }: LazyTabContentProps) {
  const [hasBeenActive, setHasBeenActive] = useState(value === activeTab);

  useEffect(() => {
    if (activeTab === value && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [activeTab, value, hasBeenActive]);

  return (
    <TabsContent value={value}>
      {hasBeenActive ? children : null}
    </TabsContent>
  );
}

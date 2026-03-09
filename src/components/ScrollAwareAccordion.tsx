import { useCallback, useRef } from "react";
import { Accordion } from "@/components/ui/accordion";

interface ScrollAwareAccordionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Accordion wrapper that scrolls newly-opened items into view
 * so the user never loses their place on long resource pages.
 */
export function ScrollAwareAccordion({ children, className }: ScrollAwareAccordionProps) {
  const prevValues = useRef<string[]>([]);

  const handleValueChange = useCallback((values: string[]) => {
    // Find newly opened item
    const newlyOpened = values.find((v) => !prevValues.current.includes(v));
    prevValues.current = values;

    if (newlyOpened) {
      // Small delay to let the content render/expand
      requestAnimationFrame(() => {
        const trigger = document.querySelector(`[data-value="${newlyOpened}"]`);
        if (trigger) {
          const rect = trigger.getBoundingClientRect();
          // Only scroll if the trigger is near or above the top of the viewport
          if (rect.top < 80) {
            trigger.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    }
  }, []);

  return (
    <Accordion type="multiple" className={className} onValueChange={handleValueChange}>
      {children}
    </Accordion>
  );
}

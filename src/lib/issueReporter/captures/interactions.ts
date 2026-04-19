/**
 * Interaction capture plugin. Records meaningful clicks (buttons, links,
 * elements with role/aria) as breadcrumbs. Lightweight and passive.
 */
import { breadcrumbs } from "../breadcrumbs";

let installed = false;

export function installInteractionCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>(
        "button, a, [role='button'], [role='menuitem'], [role='tab']"
      );
      if (!el) return;

      const label =
        el.getAttribute("aria-label") ||
        el.getAttribute("data-testid") ||
        el.textContent?.trim().slice(0, 60) ||
        el.tagName.toLowerCase();

      breadcrumbs.add({
        category: "click",
        message: label,
        data: {
          tag: el.tagName.toLowerCase(),
          href: el.tagName === "A" ? (el as HTMLAnchorElement).getAttribute("href") : undefined,
        },
      });
    },
    { capture: true, passive: true }
  );
}

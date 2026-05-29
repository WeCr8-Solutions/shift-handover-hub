import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { navigationMemory } from "@/lib/navigationMemory";

/**
 * Scroll-position manager:
 *  - PUSH / REPLACE: save current scroll for the outgoing entry, scroll new page to top.
 *  - POP (Back / Forward): restore the saved scroll for the incoming entry.
 *
 * Pairs with `navigationMemory` (sessionStorage-backed) so async data loads
 * don't lose the user's place.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();
  const prev = useRef<{ pathname: string; search: string } | null>(null);

  useEffect(() => {
    // Save outgoing scroll before we mutate position.
    if (prev.current) {
      navigationMemory.save(prev.current.pathname, prev.current.search);
    }

    if (navType === "POP") {
      const restored = navigationMemory.restore(pathname, search);
      if (!restored) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    prev.current = { pathname, search };
  }, [pathname, search, navType]);

  // Persist scroll continuously so quick Back catches the latest position.
  useEffect(() => {
    const onHide = () => navigationMemory.save(pathname, search);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [pathname, search]);

  return null;
}

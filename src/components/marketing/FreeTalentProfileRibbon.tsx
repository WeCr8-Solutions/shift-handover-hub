import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "jl_free_talent_ribbon_dismissed_v1";

/**
 * Breaking-news style overlay ribbon — fixed to viewport bottom, narrow height.
 * - Dismissible (persisted in localStorage)
 * - Hidden for authenticated users and on /auth
 */
export function FreeTalentProfileRibbon() {
  const { user } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  };

  if (user) return null;
  if (location.pathname.startsWith("/auth")) return null;
  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Breaking: Talent profiles are always free"
      className="fixed inset-x-0 bottom-0 z-[60] h-8 sm:h-9 flex items-stretch bg-foreground text-background shadow-[0_-2px_12px_-4px_hsl(var(--foreground)/0.4)]"
    >
      {/* Red "BREAKING" tag */}
      <div className="flex items-center px-2.5 sm:px-3 bg-destructive text-destructive-foreground font-bold text-[10px] sm:text-xs uppercase tracking-wider shrink-0">
        Free
      </div>

      {/* Scrolling / static headline */}
      <div className="flex-1 min-w-0 flex items-center overflow-hidden px-3">
        <p className="text-xs sm:text-sm font-medium truncate">
          Talent profiles are{" "}
          <span className="font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-sm">
            always free
          </span>
          <span className="hidden sm:inline text-background/80">
            {" "}— get found by hiring shops with OAP &amp; GCA badges.
          </span>
        </p>
      </div>

      {/* CTA */}
      <Link
        to="/auth"
        className="flex items-center gap-1 px-3 sm:px-4 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
      >
        Claim <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      {/* Dismiss */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex items-center justify-center px-2 hover:bg-background/10 transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "jl_free_talent_ribbon_dismissed_v1";

// Routes where the ribbon should NEVER show (app / authenticated / utility)
const HIDDEN_PREFIXES = [
  "/dashboard",
  "/auth",
  "/reset-password",
  "/admin",
  "/settings",
  "/profile",
  "/queue",
  "/teams",
  "/setup",
  "/testing",
  "/updates",
  "/station",
  "/handoff",
  "/ncr",
  "/quote",
  "/history",
  "/notifications",
  "/onboarding",
  "/oap/test",
  "/gca/test",
  "/verify",
  "/cert/success",
];

/**
 * Breaking-news style overlay ribbon — fixed to viewport bottom on marketing pages.
 * - Globally mounted (App.tsx) so it persists while scrolling on every public page
 * - Dismissible (persisted in localStorage)
 * - Hidden for authenticated users and on app/utility routes
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
  if (!visible) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <div
      role="region"
      aria-label="Breaking: Talent profiles are always free"
      className="fixed inset-x-0 bottom-0 z-[100] h-9 flex items-stretch bg-card text-card-foreground border-t border-border shadow-[0_-2px_12px_-4px_hsl(var(--foreground)/0.3)]"
    >
      <div className="flex items-center px-2.5 sm:px-3 bg-destructive/80 text-destructive-foreground font-bold text-[10px] sm:text-xs uppercase tracking-wider shrink-0">
        Free
      </div>

      <div className="flex-1 min-w-0 flex items-center overflow-hidden px-3">
        <p className="text-xs sm:text-sm font-medium truncate">
          Talent profiles are{" "}
          <span className="font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">
            always free
          </span>
          <span className="hidden sm:inline text-muted-foreground">
            {" "}— get found by hiring shops with OAP &amp; GCA badges.
          </span>
        </p>
      </div>

      <Link
        to="/auth"
        className="flex items-center gap-1 px-3 sm:px-4 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
      >
        Claim <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex items-center justify-center px-2 hover:bg-accent transition-colors shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

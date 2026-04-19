import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "jl_free_talent_ribbon_dismissed_v1";

/**
 * News-style sticky bottom ribbon for marketing pages.
 * - Dismissible (persisted in localStorage)
 * - Hidden for authenticated users
 * - Hidden on /auth and dashboard-style routes
 */
export function FreeTalentProfileRibbon() {
  const { user } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    setVisible(!dismissed);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  // Don't show to logged-in users or on auth pages
  if (user) return null;
  if (location.pathname.startsWith("/auth")) return null;
  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Promotion: Talent profiles are always free"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-primary/30 bg-gradient-to-r from-primary/15 via-background/95 to-primary/10 backdrop-blur-md shadow-[0_-4px_20px_-8px_hsl(var(--primary)/0.25)]"
    >
      <div className="container mx-auto px-3 py-2.5 flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
        </div>
        <p className="flex-1 text-xs sm:text-sm leading-snug text-foreground">
          <span className="font-semibold text-primary">New ·</span>{" "}
          <span className="font-medium">Talent profiles are always free</span>
          <span className="hidden sm:inline text-muted-foreground">
            {" "}— show off your machines, GD&T skills & OAP/GCA badges to hiring shops.
          </span>
        </p>
        <Button asChild size="sm" className="h-8 gap-1 text-xs shrink-0">
          <Link to="/auth">
            Claim free <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

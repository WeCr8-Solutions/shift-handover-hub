import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FreeTalentProfileBannerProps {
  className?: string;
  variant?: "full" | "inline";
}

/**
 * Marketing banner: talent profiles are always free.
 * CTA → /auth (operator signup is the default new-user role).
 */
export function FreeTalentProfileBanner({
  className,
  variant = "full",
}: FreeTalentProfileBannerProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm",
          className
        )}
      >
        <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden />
        <span className="text-foreground">
          <strong>Talent profiles are always free</strong> — show off your
          skills, certs & OAP/GCA badges to hiring shops.
        </span>
        <Button asChild size="sm" className="gap-1">
          <Link to="/auth">
            Claim yours <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "container my-10 sm:my-14",
        className
      )}
      aria-label="Talent profile — always free"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2.5 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Free forever for operators
              </div>
              <h3 className="mt-1 text-xl sm:text-2xl font-bold leading-tight">
                Your talent profile is always free
              </h3>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                Build a verified shop-floor profile with machines, controls,
                GD&T skills, OAP & GCA badges — and get found by hiring shops.
                No subscription required.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="gap-2 shrink-0">
            <Link to="/auth">
              Claim your profile <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

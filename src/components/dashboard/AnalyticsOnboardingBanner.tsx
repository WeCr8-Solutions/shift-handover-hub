import { Sparkles, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsOnboardingBannerProps {
  activeStations: number;
  handoffs: number;
  parts: number;
}

/**
 * Shown at the top of Production Analytics when the org has not yet generated
 * meaningful production data. Provides a visible, growing utilization story
 * so new orgs see the analytics panel populating with their setup progress.
 */
export function AnalyticsOnboardingBanner({
  activeStations,
  handoffs,
  parts,
}: AnalyticsOnboardingBannerProps) {
  const steps = [
    { label: "Stations active", value: activeStations, target: 1 },
    { label: "Handoffs logged", value: handoffs, target: 1 },
    { label: "Parts produced", value: parts, target: 1 },
  ];

  const completed = steps.filter((s) => s.value >= s.target).length;
  const progressPct = Math.round((completed / steps.length) * 100);

  return (
    <div
      className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/0 to-transparent p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Utilization is live — your shop's story builds here
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Charts populate automatically as stations come online and operators
            submit handoffs. Every event grows the picture below.
          </p>

          {/* Progress chips */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {steps.map((s) => {
              const done = s.value >= s.target;
              return (
                <div
                  key={s.label}
                  className={cn(
                    "rounded-md border px-2.5 py-2 text-[11px] flex items-center gap-1.5 min-w-0",
                    done
                      ? "border-primary/30 bg-primary/5 text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">
                    <span className="font-mono font-semibold">{s.value}</span>{" "}
                    <span className="opacity-70">{s.label}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Analytics readiness"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {completed} of {steps.length} signals captured · keep going
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

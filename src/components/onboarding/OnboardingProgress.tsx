import { useNavigate } from "react-router-dom";
import { useOnboardingContext, ONBOARDING_STEPS } from "./OnboardingProvider";
import type { OnboardingStep } from "./OnboardingProvider";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Play, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ── Module-level constants ───────────────────────────────────────────────────

const STEP_ROUTE_MAP: Record<string, string> = {
  welcome: "/setup",
  "organization-setup": "/setup",
  "shop-setup": "/setup",
  "dashboard-overview": "/dashboard",
  "station-cards": "/dashboard",
  "handoff-submission": "/dashboard",
  "performance-updates": "/dashboard",
  "team-management": "/teams",
  "admin-features": "/admin",
};

// Steps displayed in the list (exclude synthetic 'complete' sentinel)
const VISIBLE_STEPS = ONBOARDING_STEPS.filter((s) => s.id !== "complete");

// ─────────────────────────────────────────────────────────────────────────────

interface OnboardingProgressProps {
  showRestart?: boolean;
  compact?: boolean;
}

export function OnboardingProgress({ showRestart = true, compact = false }: OnboardingProgressProps) {
  const navigate = useNavigate();
  const {
    isComplete,
    isLoading,
    getProgress,
    isStepCompleted,
    startTour,
    resetOnboarding,
    goToStep,
    markWelcomeSeen,
    currentStep,
  } = useOnboardingContext();

  if (isLoading) return null;

  const progress = getProgress();

  // Navigate to the correct page for the current step, then kick off the tour
  const handleStartTour = () => {
    const route = STEP_ROUTE_MAP[currentStep] ?? "/dashboard";
    navigate(route);
    setTimeout(() => startTour(), 300);
  };

  const handleRestart = async () => {
    await resetOnboarding();
    navigate("/setup");
    setTimeout(() => startTour(), 300);
  };

  const handleStepClick = async (stepId: string) => {
    await markWelcomeSeen();
    await goToStep(stepId as OnboardingStep);
    navigate(STEP_ROUTE_MAP[stepId] ?? "/dashboard");
    setTimeout(() => startTour(stepId as OnboardingStep), 300);
  };

  // ── Compact variant ────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-2 w-24" />
        <span className="text-sm text-muted-foreground">{progress}% complete</span>
        {!isComplete && (
          <Button variant="ghost" size="sm" onClick={handleStartTour}>
            <Play className="w-3 h-3 mr-1" />
            Continue
          </Button>
        )}
      </div>
    );
  }

  // ── Full card variant ──────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Onboarding Progress</CardTitle>
            <CardDescription>
              {isComplete ? "You've completed the onboarding tour!" : "Complete the tour to learn all features"}
            </CardDescription>
          </div>
          {isComplete && (
            <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 shrink-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Complete
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps list */}
        <div className="space-y-1">
          {VISIBLE_STEPS.map((step) => {
            const completed = isStepCompleted(step.id);
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left hover:bg-accent ${
                  isCurrent ? "bg-primary/5 hover:bg-primary/10" : ""
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className={`w-5 h-5 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground/40"}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${completed ? "text-muted-foreground" : ""}`}>{step.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                </div>
                {isCurrent && !isComplete && (
                  <span className="inline-flex items-center rounded-md border border-border px-2 py-1 text-xs font-medium shrink-0">
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!isComplete && (
            <Button className="flex-1" onClick={handleStartTour}>
              <Play className="w-4 h-4 mr-2" />
              {currentStep === "welcome" ? "Start Tour" : "Continue Tour"}
            </Button>
          )}
          {showRestart && (
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

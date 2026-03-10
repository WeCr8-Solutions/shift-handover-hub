import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useOnboardingContext, CORE_STEPS, PRO_STEPS } from "@/components/onboarding/OnboardingProvider";
import type { OnboardingStep } from "@/components/onboarding/OnboardingProvider";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, RotateCcw, Play, GraduationCap, Star, Sparkles } from "lucide-react";

const STEP_ROUTE_MAP: Partial<Record<OnboardingStep, string>> = {
  welcome: "/setup",
  "organization-setup": "/setup",
  "shop-setup": "/setup",
  "dashboard-overview": "/dashboard",
  "station-cards": "/dashboard",
  "quote-to-workorder": "/queue",
  "handoff-submission": "/dashboard",
  "performance-updates": "/dashboard",
  "team-management": "/teams",
  "admin-features": "/admin",
};

type StepRowProps = {
  step: {
    id: OnboardingStep;
    title: string;
    description: string;
  };
  isCurrent: boolean;
  isComplete: boolean;
  isStepCompleted: (stepId: OnboardingStep) => boolean;
};

function StepRow({ step, isCurrent, isComplete, isStepCompleted }: StepRowProps) {
  const completed = isStepCompleted(step.id);

  return (
    <div className={`flex items-center gap-3 rounded-md p-2 ${isCurrent ? "bg-primary/5" : ""}`}>
      {completed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-status-ok" />
      ) : (
        <Circle className={`h-4 w-4 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground/40"}`} />
      )}

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${completed ? "text-muted-foreground" : "font-medium"}`}>{step.title}</p>
        <p className="text-xs text-muted-foreground">{step.description}</p>
      </div>

      {isCurrent && !isComplete && (
        <Badge variant="outline" className="shrink-0 text-xs">
          Current
        </Badge>
      )}
    </div>
  );
}

export function OnboardingSettings() {
  const navigate = useNavigate();
  const { isComplete, isLoading, getProgress, isStepCompleted, resetOnboarding, startTour, currentStep } =
    useOnboardingContext();

  if (isLoading) return null;

  const progress = getProgress();

  const handleRestart = async () => {
    await resetOnboarding();
    navigate("/setup");
    window.setTimeout(() => startTour(), 300);
  };

  const handleContinue = () => {
    const route = (currentStep && STEP_ROUTE_MAP[currentStep]) || "/setup";
    navigate(route);
    window.setTimeout(() => {
      if (currentStep) {
        startTour(currentStep);
      } else {
        startTour();
      }
    }, 300);
  };

  const handleLaunchProTour = (stepId: OnboardingStep) => {
    const route = STEP_ROUTE_MAP[stepId] || "/dashboard";
    navigate(route);
    window.setTimeout(() => startTour(stepId), 300);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Getting Started Tour
          </CardTitle>
          <CardDescription>
            {isComplete
              ? "You've completed the core onboarding. Restart anytime to revisit."
              : "Complete these essentials to get up and running."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Core Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-1">
            {CORE_STEPS.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                isCurrent={step.id === currentStep && !isComplete}
                isComplete={isComplete}
                isStepCompleted={isStepCompleted}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {!isComplete && (
              <Button onClick={handleContinue}>
                <Play className="mr-2 h-4 w-4" />
                Continue Tour
              </Button>
            )}

            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart Tour
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" />
            Manufacturing Pro Tours
            <Badge variant="secondary" className="ml-1 text-xs">
              Optional
            </Badge>
          </CardTitle>
          <CardDescription>
            Dive deeper into advanced features. Take any of these tours whenever you're ready — they're not required to
            use the platform.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {PRO_STEPS.map((step) => {
            const completed = isStepCompleted(step.id);

            return (
              <div
                key={step.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
              >
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <Star className="h-5 w-5 shrink-0 text-amber-500/60" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>

                <Button
                  size="sm"
                  variant={completed ? "ghost" : "outline"}
                  onClick={() => handleLaunchProTour(step.id)}
                  className="shrink-0"
                >
                  <Play className="mr-1 h-3 w-3" />
                  {completed ? "Replay" : "Start"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

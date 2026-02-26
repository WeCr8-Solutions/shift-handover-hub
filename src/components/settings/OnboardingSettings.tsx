import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingContext, ONBOARDING_STEPS } from "@/components/onboarding/OnboardingProvider";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, RotateCcw, Play, GraduationCap } from "lucide-react";

export function OnboardingSettings() {
  const navigate = useNavigate();
  const {
    isComplete,
    isLoading,
    getProgress,
    isStepCompleted,
    resetOnboarding,
    startTour,
    currentStep,
  } = useOnboardingContext();

  if (isLoading) return null;

  const progress = getProgress();
  const stepsToShow = ONBOARDING_STEPS.filter(s => s.id !== 'complete');

  const STEP_ROUTE_MAP: Record<string, string> = {
    'welcome': '/setup',
    'organization-setup': '/setup',
    'shop-setup': '/setup',
    'dashboard-overview': '/dashboard',
    'station-cards': '/dashboard',
    'handoff-submission': '/dashboard',
    'performance-updates': '/dashboard',
    'team-management': '/teams',
    'admin-features': '/admin',
  };

  const handleRestart = async () => {
    await resetOnboarding();
    navigate('/setup');
    setTimeout(() => startTour(), 300);
  };

  const handleContinue = () => {
    const route = STEP_ROUTE_MAP[currentStep] || '/setup';
    navigate(route);
    setTimeout(() => startTour(currentStep), 300);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Onboarding Tour
          </CardTitle>
          <CardDescription>
            {isComplete
              ? "You've completed the onboarding tour. Restart anytime to revisit features."
              : "Continue your guided tour to learn all platform features."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tour Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="space-y-1">
            {stepsToShow.map((step) => {
              const completed = isStepCompleted(step.id);
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2 rounded-md ${
                    isCurrent ? 'bg-primary/5' : ''
                  }`}
                >
                  {completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className={`w-4 h-4 shrink-0 ${
                      isCurrent ? 'text-primary' : 'text-muted-foreground/40'
                    }`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${completed ? 'text-muted-foreground' : 'font-medium'}`}>
                      {step.title}
                    </p>
                  </div>
                  {isCurrent && !isComplete && (
                    <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!isComplete && (
              <Button onClick={handleContinue}>
                <Play className="w-4 h-4 mr-2" />
                Continue Tour
              </Button>
            )}
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

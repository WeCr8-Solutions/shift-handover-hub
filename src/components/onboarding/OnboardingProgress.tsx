import { useOnboardingContext, ONBOARDING_STEPS } from './OnboardingProvider';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Play, RotateCcw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface OnboardingProgressProps {
  showRestart?: boolean;
  compact?: boolean;
}

export function OnboardingProgress({ showRestart = true, compact = false }: OnboardingProgressProps) {
  const { 
    isComplete, 
    isLoading, 
    getProgress, 
    isStepCompleted,
    startTour,
    resetOnboarding,
    currentStep,
  } = useOnboardingContext();

  if (isLoading) return null;

  const progress = getProgress();
  const stepsToShow = ONBOARDING_STEPS.filter(s => s.id !== 'complete');

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-2 w-24" />
        <span className="text-sm text-muted-foreground">{progress}% complete</span>
        {!isComplete && (
          <Button variant="ghost" size="sm" onClick={() => startTour()}>
            <Play className="w-3 h-3 mr-1" />
            Continue
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Onboarding Progress</CardTitle>
            <CardDescription>
              {isComplete 
                ? 'You\'ve completed the onboarding tour!' 
                : 'Complete the tour to learn all features'}
            </CardDescription>
          </div>
          {isComplete && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          {stepsToShow.map((step) => {
            const completed = isStepCompleted(step.id);
            const isCurrent = step.id === currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                  isCurrent ? 'bg-primary/5' : ''
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className={`w-5 h-5 shrink-0 ${
                    isCurrent ? 'text-primary' : 'text-muted-foreground/40'
                  }`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${completed ? 'text-muted-foreground' : ''}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                {isCurrent && !isComplete && (
                  <Badge variant="outline" className="shrink-0">Current</Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!isComplete && (
            <Button className="flex-1" onClick={() => startTour()}>
              <Play className="w-4 h-4 mr-2" />
              {currentStep === 'welcome' ? 'Start Tour' : 'Continue Tour'}
            </Button>
          )}
          {showRestart && (
            <Button variant="outline" onClick={resetOnboarding}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

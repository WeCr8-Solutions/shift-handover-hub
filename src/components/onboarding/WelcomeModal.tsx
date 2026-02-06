import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useOnboardingContext, ONBOARDING_STEPS } from './OnboardingProvider';
import { 
  Sparkles, 
  Play, 
  SkipForward, 
  CheckCircle2,
  LayoutDashboard,
  FileEdit,
  Lightbulb,
  Users,
  Settings,
  Rocket,
  Factory
} from 'lucide-react';

const STEP_ICONS: Record<string, React.ReactNode> = {
  'welcome': <Sparkles className="w-5 h-5" />,
  'organization-setup': <Factory className="w-5 h-5" />,
  'shop-setup': <Factory className="w-5 h-5" />,
  'dashboard-overview': <LayoutDashboard className="w-5 h-5" />,
  'station-cards': <LayoutDashboard className="w-5 h-5" />,
  'handoff-submission': <FileEdit className="w-5 h-5" />,
  'performance-updates': <Lightbulb className="w-5 h-5" />,
  'team-management': <Users className="w-5 h-5" />,
  'admin-features': <Settings className="w-5 h-5" />,
  'complete': <Rocket className="w-5 h-5" />,
};

export function WelcomeModal() {
  const navigate = useNavigate();
  const { 
    currentStep, 
    isComplete, 
    isLoading, 
    showTour,
    hasSeenWelcome,
    completeStep,
    markWelcomeSeen,
    goToStep,
    startTour, 
    skipOnboarding,
    getProgress,
    isStepCompleted,
  } = useOnboardingContext();

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
  
  const [isOpen, setIsOpen] = useState(true);

  // Only show for users who haven't seen the welcome modal yet
  // Don't show if loading, complete, tour is active, or already seen welcome
  if (isLoading || isComplete || showTour || currentStep === 'complete' || hasSeenWelcome) {
    return null;
  }

  const progress = getProgress();
  const currentStepData = ONBOARDING_STEPS.find(s => s.id === currentStep);

  const handleStartTour = async () => {
    setIsOpen(false);
    
    // Mark welcome as seen and complete the welcome step
    await markWelcomeSeen();
    await completeStep('welcome');
    
    // Always navigate to setup for new users to complete organization + shop setup
    navigate('/setup');
    
    setTimeout(() => startTour(), 300);
  };

  const handleSkip = async () => {
    // Mark welcome as seen even when skipping
    await markWelcomeSeen();
    await skipOnboarding();
    setIsOpen(false);
    navigate('/dashboard');
  };

  const handleClose = async () => {
    // Mark welcome as seen when closing
    await markWelcomeSeen();
    setIsOpen(false);
  };

  const handleStepClick = async (stepId: string) => {
    setIsOpen(false);
    await markWelcomeSeen();
    await goToStep(stepId as any);
    
    navigate(STEP_ROUTE_MAP[stepId] || '/dashboard');
    setTimeout(() => startTour(stepId as any), 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            {currentStep === 'welcome' ? 'Welcome to JobLine.ai Digital Expeditor!' : `Continue Your Tour`}
          </DialogTitle>
          <DialogDescription className="text-base">
            {currentStep === 'welcome' 
              ? 'Let\'s set up your shop first, then take a tour to learn how to move work orders through your production line.'
              : `You're ${progress}% through the onboarding. Ready to continue?`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tour Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Overview */}
        <div className="grid grid-cols-2 gap-2 py-2">
          {ONBOARDING_STEPS.filter(s => s.id !== 'complete').map((step) => {
            const isCurrentStep = step.id === currentStep;
            const completed = isStepCompleted(step.id);
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-2 p-2 rounded-md text-sm text-left transition-colors cursor-pointer hover:bg-accent ${
                  isCurrentStep 
                    ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                    : completed 
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/50'
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                    isCurrentStep ? 'border-primary' : 'border-muted-foreground/30'
                  }`} />
                )}
                <span className={`flex-1 ${completed ? 'line-through' : ''}`}>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Current Step Highlight */}
        {currentStepData && currentStep !== 'welcome' && (
          <div className="bg-secondary/50 rounded-lg p-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {STEP_ICONS[currentStep]}
              </div>
              <div>
                <p className="font-medium">Next: {currentStepData.title}</p>
                <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={handleSkip}>
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Tour
          </Button>
          <Button className="flex-1" onClick={handleStartTour}>
            <Play className="w-4 h-4 mr-2" />
            {currentStep === 'welcome' ? 'Start Tour' : 'Continue Tour'}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          You can restart the tour anytime from your profile settings
        </p>
      </DialogContent>
    </Dialog>
  );
}

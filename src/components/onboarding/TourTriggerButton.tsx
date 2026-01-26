import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOnboardingContext, OnboardingStep } from './OnboardingProvider';

interface TourTriggerButtonProps {
  step?: OnboardingStep;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  showLabel?: boolean;
}

export function TourTriggerButton({ 
  step, 
  variant = 'ghost', 
  size = 'icon',
  showLabel = false 
}: TourTriggerButtonProps) {
  const { startTour, isComplete } = useOnboardingContext();

  const handleClick = () => {
    startTour(step);
  };

  if (showLabel) {
    return (
      <Button variant={variant} size={size === 'icon' ? 'sm' : size} onClick={handleClick}>
        <HelpCircle className="w-4 h-4 mr-2" />
        {isComplete ? 'Replay Tour' : 'Take Tour'}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size={size} onClick={handleClick}>
          <HelpCircle className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isComplete ? 'Replay page tour' : 'Take a guided tour'}</p>
      </TooltipContent>
    </Tooltip>
  );
}

import React, { createContext, useContext, ReactNode } from 'react';
import { useOnboarding, OnboardingStep, ONBOARDING_STEPS } from '@/hooks/useOnboarding';

interface OnboardingContextType {
  completedSteps: string[];
  currentStep: OnboardingStep;
  isComplete: boolean;
  isLoading: boolean;
  hasSeenWelcome: boolean;
  showTour: boolean;
  isNewSignup: boolean;
  setShowTour: (show: boolean) => void;
  completeStep: (stepId: OnboardingStep) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  markWelcomeSeen: () => Promise<void>;
  goToStep: (stepId: OnboardingStep) => Promise<void>;
  startTour: (step?: OnboardingStep) => void;
  endTour: () => void;
  isStepCompleted: (stepId: OnboardingStep) => boolean;
  getProgress: () => number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
}

export { ONBOARDING_STEPS };
export type { OnboardingStep };

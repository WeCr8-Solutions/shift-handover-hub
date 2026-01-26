import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type OnboardingStep = 
  | 'welcome'
  | 'dashboard-overview'
  | 'station-cards'
  | 'handoff-submission'
  | 'performance-updates'
  | 'team-management'
  | 'admin-features'
  | 'complete';

export const ONBOARDING_STEPS: { id: OnboardingStep; title: string; description: string }[] = [
  { id: 'welcome', title: 'Welcome to JobLine.ai', description: 'Let\'s take a quick tour of the platform' },
  { id: 'dashboard-overview', title: 'Dashboard Overview', description: 'Your command center for shift operations' },
  { id: 'station-cards', title: 'Station Cards', description: 'Monitor machine status at a glance' },
  { id: 'handoff-submission', title: 'Shift Handoffs', description: 'Submit detailed handoff reports' },
  { id: 'performance-updates', title: 'Performance Updates', description: 'Suggest process improvements' },
  { id: 'team-management', title: 'Team Management', description: 'Organize your workforce' },
  { id: 'admin-features', title: 'Admin Features', description: 'Manage the entire system' },
  { id: 'complete', title: 'All Set!', description: 'You\'re ready to use JobLine.ai' },
];

interface OnboardingState {
  completedSteps: string[];
  currentStep: OnboardingStep;
  isComplete: boolean;
  isLoading: boolean;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    completedSteps: [],
    currentStep: 'welcome',
    isComplete: false,
    isLoading: true,
  });
  const [showTour, setShowTour] = useState(false);
  const [isNewSignup, setIsNewSignup] = useState(false);

  // Fetch onboarding state from database
  useEffect(() => {
    async function fetchOnboardingState() {
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching onboarding state:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (data) {
        setState({
          completedSteps: data.completed_steps || [],
          currentStep: (data.current_step as OnboardingStep) || 'welcome',
          isComplete: data.is_complete || false,
          isLoading: false,
        });
      } else {
        // Create initial onboarding record
        const { error: insertError } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user.id });

        if (insertError) {
          console.error('Error creating onboarding record:', insertError);
        }

        setState({
          completedSteps: [],
          currentStep: 'welcome',
          isComplete: false,
          isLoading: false,
        });
        
        // Mark as new signup and show tour only for brand new users
        setIsNewSignup(true);
        setShowTour(true);
      }
    }

    fetchOnboardingState();
  }, [user]);

  const completeStep = useCallback(async (stepId: OnboardingStep) => {
    if (!user) return;

    const newCompletedSteps = [...new Set([...state.completedSteps, stepId])];
    const currentIndex = ONBOARDING_STEPS.findIndex(s => s.id === stepId);
    const nextStep = ONBOARDING_STEPS[currentIndex + 1]?.id || 'complete';
    const isComplete = nextStep === 'complete';

    setState(prev => ({
      ...prev,
      completedSteps: newCompletedSteps,
      currentStep: nextStep,
      isComplete,
    }));

    const { error } = await supabase
      .from('user_onboarding')
      .update({
        completed_steps: newCompletedSteps,
        current_step: nextStep,
        is_complete: isComplete,
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating onboarding:', error);
    }
  }, [user, state.completedSteps]);

  const skipOnboarding = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isComplete: true, currentStep: 'complete' }));
    setShowTour(false);

    await supabase
      .from('user_onboarding')
      .update({
        is_complete: true,
        current_step: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }, [user]);

  const resetOnboarding = useCallback(async () => {
    if (!user) return;

    setState({
      completedSteps: [],
      currentStep: 'welcome',
      isComplete: false,
      isLoading: false,
    });

    await supabase
      .from('user_onboarding')
      .update({
        completed_steps: [],
        current_step: 'welcome',
        is_complete: false,
        completed_at: null,
      })
      .eq('user_id', user.id);

    setShowTour(true);
  }, [user]);

  const startTour = useCallback((step?: OnboardingStep) => {
    if (step) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
    setShowTour(true);
  }, []);

  const endTour = useCallback(() => {
    setShowTour(false);
  }, []);

  const isStepCompleted = useCallback((stepId: OnboardingStep) => {
    return state.completedSteps.includes(stepId);
  }, [state.completedSteps]);

  const getProgress = useCallback(() => {
    const totalSteps = ONBOARDING_STEPS.length - 1; // Exclude 'complete'
    return Math.round((state.completedSteps.length / totalSteps) * 100);
  }, [state.completedSteps]);

  return {
    ...state,
    showTour,
    setShowTour,
    isNewSignup,
    completeStep,
    skipOnboarding,
    resetOnboarding,
    startTour,
    endTour,
    isStepCompleted,
    getProgress,
  };
}

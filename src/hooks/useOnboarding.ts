import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type OnboardingStep = 
  | 'welcome'
  | 'organization-setup'
  | 'shop-setup'
  | 'dashboard-overview'
  | 'station-cards'
  | 'handoff-submission'
  | 'performance-updates'
  | 'team-management'
  | 'admin-features'
  | 'complete';

export const ONBOARDING_STEPS: { id: OnboardingStep; title: string; description: string }[] = [
  { id: 'welcome', title: 'Welcome to JobLine.ai', description: 'Your Digital Expeditor for manufacturing workflows' },
  { id: 'organization-setup', title: 'Create Your Organization', description: 'Set up your company workspace with secure data isolation' },
  { id: 'shop-setup', title: 'Set Up Your Shop', description: 'Configure teams, stations, routing templates, and users' },
  { id: 'dashboard-overview', title: 'Digital Expeditor Dashboard', description: 'Track work orders through your production line' },
  { id: 'station-cards', title: 'Select & Deliver Work Orders', description: 'Pick available jobs and confirm delivery to next station' },
  { id: 'handoff-submission', title: 'Shift Handoffs', description: 'Document handoffs and continuous improvement notes' },
  { id: 'performance-updates', title: 'Job Performance Updates', description: 'Suggest process improvements and track implementation' },
  { id: 'team-management', title: 'Team Management', description: 'Organize operators, supervisors, and station assignments' },
  { id: 'admin-features', title: 'Admin Features', description: 'Full system oversight and bulk data management' },
  { id: 'complete', title: 'All Set!', description: 'You\'re ready to use JobLine.ai Digital Expeditor' },
];

interface OnboardingState {
  completedSteps: string[];
  currentStep: OnboardingStep;
  isComplete: boolean;
  isLoading: boolean;
  hasSeenWelcome: boolean;
  setupWizardDismissed: boolean;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    completedSteps: [],
    currentStep: 'welcome',
    isComplete: false,
    isLoading: true,
    hasSeenWelcome: true, // Default to true to prevent flash
    setupWizardDismissed: false,
  });
  const [showTour, setShowTour] = useState(false);
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
          hasSeenWelcome: data.has_seen_welcome || false,
          setupWizardDismissed: (data as any).setup_wizard_dismissed || false,
        });
      } else {
        // Create initial onboarding record for new users
        const { error: insertError } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user.id, has_seen_welcome: false });

        if (insertError) {
          console.error('Error creating onboarding record:', insertError);
        }

        setState({
          completedSteps: [],
          currentStep: 'welcome',
          isComplete: false,
          isLoading: false,
          hasSeenWelcome: false, // New user has not seen welcome
          setupWizardDismissed: false,
        });
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

  const markWelcomeSeen = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, hasSeenWelcome: true }));

    await supabase
      .from('user_onboarding')
      .update({ has_seen_welcome: true })
      .eq('user_id', user.id);
  }, [user]);

  const resetOnboarding = useCallback(async () => {
    if (!user) return;

    setState({
      completedSteps: [],
      currentStep: 'welcome',
      isComplete: false,
      isLoading: false,
      hasSeenWelcome: false,
      setupWizardDismissed: false,
    });

    await supabase
      .from('user_onboarding')
      .update({
        completed_steps: [],
        current_step: 'welcome',
        is_complete: false,
        completed_at: null,
        has_seen_welcome: false,
        setup_wizard_dismissed: false,
      } as any)
      .eq('user_id', user.id);

    setShowTour(true);
  }, [user]);

  const dismissSetupWizard = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, setupWizardDismissed: true }));

    await supabase
      .from('user_onboarding')
      .update({ setup_wizard_dismissed: true } as any)
      .eq('user_id', user.id);
  }, [user]);

  const goToStep = useCallback(async (stepId: OnboardingStep) => {
    if (!user) return;
    
    setState(prev => ({ ...prev, currentStep: stepId }));
    
    await supabase
      .from('user_onboarding')
      .update({ current_step: stepId })
      .eq('user_id', user.id);
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

  // Derive isNewSignup from hasSeenWelcome - user is "new" if they haven't seen the welcome
  const isNewSignup = !state.hasSeenWelcome && !state.isComplete;

  return {
    ...state,
    showTour,
    setShowTour,
    isNewSignup,
    completeStep,
    skipOnboarding,
    resetOnboarding,
    markWelcomeSeen,
    dismissSetupWizard,
    goToStep,
    startTour,
    endTour,
    isStepCompleted,
    getProgress,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const WELCOME_SEEN_STORAGE_PREFIX = 'jobline:onboarding:welcome-seen:';

function getWelcomeSeenStorageKey(userId: string) {
  return `${WELCOME_SEEN_STORAGE_PREFIX}${userId}`;
}

function readWelcomeSeenFallback(userId: string) {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(getWelcomeSeenStorageKey(userId)) === 'true';
}

function writeWelcomeSeenFallback(userId: string, value: boolean) {
  if (typeof window === 'undefined') return;
  const key = getWelcomeSeenStorageKey(userId);
  if (value) {
    window.localStorage.setItem(key, 'true');
    return;
  }
  window.localStorage.removeItem(key);
}

export type OnboardingStep = 
  | 'welcome'
  | 'organization-setup'
  | 'shop-setup'
  | 'data-source'
  | 'dashboard-overview'
  | 'station-cards'
  | 'quote-to-workorder'
  | 'handoff-submission'
  | 'performance-updates'
  | 'team-management'
  | 'admin-features'
  | 'complete';

export interface OnboardingStepDef {
  id: OnboardingStep;
  title: string;
  description: string;
  /** If true, step is optional "Manufacturing Pro" content */
  optional?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  { id: 'welcome', title: 'Welcome to JobLine.ai', description: 'Your Digital Expeditor for manufacturing workflows' },
  { id: 'organization-setup', title: 'Create Your Organization', description: 'Set up your company workspace with secure data isolation' },
  { id: 'shop-setup', title: 'Set Up Your Shop', description: 'Configure teams, stations, routing templates, and users' },
  { id: 'data-source', title: 'Choose Your Data Source', description: 'Run native on Lovable Cloud, or connect JobBOSS or SAP S/4HANA' },
  { id: 'dashboard-overview', title: 'Digital Expeditor Dashboard', description: 'See shift statistics, active stations, and team performance at a glance' },
  { id: 'station-cards', title: 'Select & Deliver Work Orders', description: 'Pick available jobs at your station and confirm delivery to the next operation' },
  { id: 'handoff-submission', title: 'Shift Handoffs', description: 'Document end-of-shift handoffs with machine condition, quality notes, and continuous improvement ideas' },
  // Optional "Manufacturing Pro" tours
  { id: 'quote-to-workorder', title: 'Quotes & Routing', description: 'Learn how quotes convert to work orders with production routing templates', optional: true },
  { id: 'performance-updates', title: 'Job Performance Updates', description: 'Suggest process improvements, track implementation status, and drive continuous improvement', optional: true },
  { id: 'team-management', title: 'Team Management', description: 'Organize operators & supervisors, assign stations, and manage team permissions', optional: true },
  { id: 'admin-features', title: 'Admin & Oversight', description: 'Full system oversight, bulk data management, activity logs, and RLS health checks', optional: true },
  { id: 'complete', title: 'All Set!', description: 'You\'re ready to use JobLine.ai Digital Expeditor' },
];

/** Core steps that count toward mandatory onboarding completion */
export const CORE_STEPS = ONBOARDING_STEPS.filter(s => !s.optional && s.id !== 'complete');
/** Optional "Manufacturing Pro" tours */
export const PRO_STEPS = ONBOARDING_STEPS.filter(s => s.optional);

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
    hasSeenWelcome: false,
    setupWizardDismissed: false,
  });
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    async function fetchOnboardingState() {
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const localWelcomeSeen = readWelcomeSeenFallback(user.id);

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
        const hasSeenWelcome = Boolean(data.has_seen_welcome || localWelcomeSeen);
        if (hasSeenWelcome) {
          writeWelcomeSeenFallback(user.id, true);
        }
        setState({
          completedSteps: data.completed_steps || [],
          currentStep: (data.current_step as OnboardingStep) || 'welcome',
          isComplete: data.is_complete || false,
          isLoading: false,
          hasSeenWelcome,
          setupWizardDismissed: data.setup_wizard_dismissed || false,
        });
      } else {
        // Insert directly and tolerate duplicate rows from the new-user trigger.
        const { error: insertError } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user.id, has_seen_welcome: false });

        if (insertError && insertError.code !== '23505') {
          console.error('Error creating onboarding record:', insertError);
        }

        setState({
          completedSteps: [],
          currentStep: 'welcome',
          isComplete: false,
          isLoading: false,
          hasSeenWelcome: localWelcomeSeen,
          setupWizardDismissed: false,
        });
      }
    }

    fetchOnboardingState();
  }, [user]);

  const completeStep = useCallback(async (stepId: OnboardingStep) => {
    if (!user) return;

    const newCompletedSteps = [...new Set([...state.completedSteps, stepId])];
    
    // Find the next incomplete core step, or mark complete
    const coreStepIds = CORE_STEPS.map(s => s.id);
    const nextCoreStep = coreStepIds.find(id => !newCompletedSteps.includes(id));
    const nextStep: OnboardingStep = nextCoreStep || 'complete';
    const isComplete = !nextCoreStep;

    // Save snapshot for rollback
    const prevState = { ...state };

    // Optimistic update
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
      // Rollback on failure
      setState(prev => ({
        ...prev,
        completedSteps: prevState.completedSteps,
        currentStep: prevState.currentStep,
        isComplete: prevState.isComplete,
      }));
      toast.error('Failed to save progress. Please try again.');
    }
  }, [state, user]);

  const skipOnboarding = useCallback(async () => {
    if (!user) return;

    const prevState = { ...state };
    writeWelcomeSeenFallback(user.id, true);
    setState(prev => ({ ...prev, isComplete: true, currentStep: 'complete' }));
    setShowTour(false);

    const { error } = await supabase
      .from('user_onboarding')
      .update({
        is_complete: true,
        current_step: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error skipping onboarding:', error);
      setState(prev => ({
        ...prev,
        isComplete: prevState.isComplete,
        currentStep: prevState.currentStep,
      }));
      toast.error('Saved locally. Cloud sync will retry later.');
    }
  }, [user, state]);

  const markWelcomeSeen = useCallback(async () => {
    if (!user) return;

    writeWelcomeSeenFallback(user.id, true);
    setState(prev => ({ ...prev, hasSeenWelcome: true }));

    const { error } = await supabase
      .from('user_onboarding')
      .update({ has_seen_welcome: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking welcome seen:', error);
      // Don't rollback this one — it's a minor UX flag, and rolling back
      // would cause the welcome modal to re-appear which is worse
    }
  }, [user]);

  const resetOnboarding = useCallback(async () => {
    if (!user) return;

    const prevState = { ...state };
    setShowTour(false);
    writeWelcomeSeenFallback(user.id, false);

    setState({
      completedSteps: [],
      currentStep: 'welcome',
      isComplete: false,
      isLoading: false,
      hasSeenWelcome: false,
      setupWizardDismissed: false,
    });

    const { error } = await supabase
      .from('user_onboarding')
      .update({
        completed_steps: [],
        current_step: 'welcome',
        is_complete: false,
        completed_at: null,
        has_seen_welcome: false,
        setup_wizard_dismissed: false,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error resetting onboarding:', error);
      writeWelcomeSeenFallback(user.id, prevState.hasSeenWelcome);
      setState({ ...prevState, isLoading: false });
      toast.error('Failed to reset onboarding. Please try again.');
      return;
    }
  }, [user, state]);

  const dismissSetupWizard = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, setupWizardDismissed: true }));

    const { error } = await supabase
      .from('user_onboarding')
      .update({ setup_wizard_dismissed: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error dismissing setup wizard:', error);
      setState(prev => ({ ...prev, setupWizardDismissed: false }));
      toast.error('Failed to save preference. Please try again.');
    }
  }, [user]);

  const goToStep = useCallback(async (stepId: OnboardingStep) => {
    if (!user) return;
    
    const prevStep = state.currentStep;
    setState(prev => ({ ...prev, currentStep: stepId }));
    
    const { error } = await supabase
      .from('user_onboarding')
      .update({ current_step: stepId })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error navigating to step:', error);
      setState(prev => ({ ...prev, currentStep: prevStep }));
    }
  }, [user, state.currentStep]);

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
    // Progress is based on core (mandatory) steps only
    const coreIds = CORE_STEPS.map(s => s.id);
    const completedCore = state.completedSteps.filter(id => coreIds.includes(id as OnboardingStep));
    return Math.round((completedCore.length / coreIds.length) * 100);
  }, [state.completedSteps]);

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

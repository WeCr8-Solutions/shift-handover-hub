import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useOnboardingContext, OnboardingStep } from './OnboardingProvider';
import { useLocation } from 'react-router-dom';

const TOUR_STEPS: Record<string, Step[]> = {
  '/dashboard': [
    {
      target: '[data-tour="shift-stats"]',
      content: 'Here you can see your shift statistics at a glance - parts completed, scrap rate, and team performance metrics.',
      title: 'Shift Statistics',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="work-center-filter"]',
      content: 'Filter stations by work center type - CNC, Welding, Assembly, and more. Quickly find what you need.',
      title: 'Work Center Filters',
      placement: 'bottom',
    },
    {
      target: '[data-tour="station-grid"]',
      content: 'Each card represents a work station. Colors indicate status: green for running, yellow for setup, red for down.',
      title: 'Station Cards',
      placement: 'top',
    },
    {
      target: '[data-tour="new-handoff"]',
      content: 'Click here to submit a shift handoff report when your shift ends. This ensures smooth transitions.',
      title: 'New Handoff',
      placement: 'left',
    },
  ],
  '/teams': [
    {
      target: '[data-tour="team-list"]',
      content: 'View and manage your teams here. Each team can have its own members and assigned stations.',
      title: 'Team List',
      disableBeacon: true,
      placement: 'right',
    },
    {
      target: '[data-tour="create-team"]',
      content: 'Create new teams for different shifts, departments, or work areas.',
      title: 'Create Team',
      placement: 'bottom',
    },
  ],
  '/admin': [
    {
      target: '[data-tour="admin-stats"]',
      content: 'Overview of your entire operation - total stations, active teams, and user counts.',
      title: 'Admin Statistics',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="admin-tabs"]',
      content: 'Switch between Users, Stations, Teams, and Activity Logs to manage different aspects of the system.',
      title: 'Admin Sections',
      placement: 'bottom',
    },
    {
      target: '[data-tour="bulk-upload"]',
      content: 'Upload Excel files to bulk import stations, users, and teams. Great for initial setup!',
      title: 'Bulk Upload',
      placement: 'left',
    },
  ],
  '/setup': [
    {
      target: '[data-tour="setup-progress"]',
      content: 'Track your setup progress here. Complete all three steps to get started with JobLine.',
      title: 'Setup Progress',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="quick-setup"]',
      content: 'The fastest way to set up - upload an Excel file with all your data at once.',
      title: 'Quick Setup',
      placement: 'bottom',
    },
    {
      target: '[data-tour="manual-steps"]',
      content: 'Or set up step by step - create teams, add stations, then invite team members.',
      title: 'Manual Setup',
      placement: 'top',
    },
  ],
};

// Map routes to onboarding steps
const ROUTE_TO_STEP: Record<string, OnboardingStep> = {
  '/dashboard': 'dashboard-overview',
  '/teams': 'team-management',
  '/admin': 'admin-features',
  '/setup': 'welcome',
};

export function GuidedTour() {
  const location = useLocation();
  const { showTour, setShowTour, completeStep, currentStep, isComplete } = useOnboardingContext();
  const [steps, setSteps] = useState<Step[]>([]);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const routeSteps = TOUR_STEPS[location.pathname];
    if (routeSteps && showTour && !isComplete) {
      setSteps(routeSteps);
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => setRun(true), 500);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [location.pathname, showTour, isComplete]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setShowTour(false);
      
      // Mark the corresponding step as complete
      const step = ROUTE_TO_STEP[location.pathname];
      if (step && status === STATUS.FINISHED) {
        completeStep(step);
      }
    }

    if (action === ACTIONS.CLOSE || (type === EVENTS.STEP_AFTER && action === ACTIONS.SKIP)) {
      setRun(false);
      setShowTour(false);
    }
  };

  if (!steps.length || isComplete) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      hideCloseButton={false}
      scrollToFirstStep
      disableOverlayClose
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--card))',
          textColor: 'hsl(var(--card-foreground))',
          arrowColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        tooltipTitle: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: '0.875rem',
          padding: '0.5rem 0',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        spotlight: {
          borderRadius: '0.5rem',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}

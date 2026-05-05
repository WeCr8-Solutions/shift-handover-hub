import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from "react-joyride";
import { useOnboardingContext, OnboardingStep } from "./OnboardingProvider";
import { useLocation } from "react-router-dom";
import { useQuoteSystem } from "@/hooks/useQuoteSystem";

// Extended step type so we can tag quote-system-only steps without losing Joyride typings
type TourStep = Step & { data?: { requiresQuoteSystem?: boolean } };

const TOUR_STEPS: Record<string, TourStep[]> = {
  "/dashboard": [
    {
      target: '[data-tour="shift-stats"]',
      content:
        "Your Digital Expeditor dashboard shows real-time shift statistics — parts completed, scrap rates, and team performance. Use this to spot bottlenecks early.",
      title: "📊 Shift Statistics",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: '[data-tour="work-center-filter"]',
      content:
        "Filter stations by work center type — CNC, Welding, Assembly, Grinding, and more. Quickly zero in on your department or assigned area.",
      title: "🔍 Work Center Filters",
      placement: "bottom",
    },
    {
      target: '[data-tour="station-grid"]',
      content:
        "Each card is a live workstation. Colors indicate status: green = running, yellow = idle, red = down. Click any card to select work orders, view handoff history, or start a new job.",
      title: "🏭 Station Cards — Your Digital Expeditor",
      placement: "top",
    },
    {
      target: '[data-tour="add-work-order"]',
      content:
        "Add new work orders with full production routing — from raw material receiving through each machining operation to final QC and shipping.",
      title: "📦 Add Work Orders",
      placement: "left",
    },
    {
      target: '[data-tour="new-handoff"]',
      content:
        "End-of-shift handoffs capture machine condition, quality notes, tooling status, and improvement ideas. The next operator sees everything they need to hit the ground running.",
      title: "🔄 Shift Handoffs & Continuous Improvement",
      placement: "left",
    },
  ],
  "/queue": [
    {
      target: '[data-tour="queue-tabs"]',
      content: "Switch between your Work Queue (active jobs) and Outside Processing (parts at external vendors).",
      title: "📋 Queue Management",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: '[data-tour="queue-filters"]',
      content: "Filter by status, priority, station, or operator. Find exactly what you need.",
      title: "🔍 Queue Filters",
      placement: "bottom",
    },
    {
      target: '[data-tour="queue-views"]',
      content:
        "Choose your preferred view — Kanban board for visual workflow, List for details, or Calendar for scheduling.",
      title: "👁️ View Options",
      placement: "bottom",
    },
    // Shown only when quote system is DISABLED
    {
      target: '[data-tour="add-queue-item"]',
      content:
        "Create work orders for production tracking and prioritization. Want quotes too? Enable the Quote System in Settings → Manufacturing.",
      title: "📝 Work Orders",
      placement: "left",
    },
    // Shown only when quote system is ENABLED (replaces the step above)
    {
      target: '[data-tour="add-queue-item"]',
      content:
        "Create quotes for estimation or work orders for production. Quotes flow through approval before converting to tracked work orders.",
      title: "📝 Quotes & Work Orders",
      placement: "left",
      data: { requiresQuoteSystem: true },
    },
    {
      target: '[data-tour="kanban-quote-card"]',
      content:
        "Quotes appear with an amber border. Click to review, get estimates from engineering, then convert to a work order when approved.",
      title: "💡 Quote Cards",
      placement: "right",
      data: { requiresQuoteSystem: true },
    },
    {
      target: '[data-tour="kanban-wo-card"]',
      content:
        "Work orders have a blue border and track through your full production routing — from first operation to final ship.",
      title: "🔧 Work Order Cards",
      placement: "right",
    },
    {
      target: '[data-tour="routing-tab"]',
      content:
        "The Routing tab shows every production step — from quote review through shipping. Each step maps to a station in your shop.",
      title: "🗺️ Production Routing",
      placement: "bottom",
    },
    {
      target: '[data-tour="routing-template-selector"]',
      content:
        "Load a saved routing template from your organization library. Templates save time by pre-filling steps for common part types.",
      title: "📋 Routing Templates",
      placement: "bottom",
    },
    {
      target: '[data-tour="routing-save-template"]',
      content:
        "Customized a routing? Save it as a reusable template so your team can apply it to future work orders with one click.",
      title: "💾 Save as Template",
      placement: "left",
    },
    {
      target: '[data-tour="ai-planner"]',
      content:
        "Meet your AI Planning Assistant. Ask it 'what should we run next?', 'who's overloaded?', or 'where can I move this program?' — it analyzes your live shop floor and gives instant answers.",
      title: "✨ AI Planning Assistant",
      placement: "left",
    },
  ],
  "/teams": [
    {
      target: '[data-tour="team-list"]',
      content:
        "Your teams organize operators, supervisors, and their assigned stations. Each team sees only their own data.",
      title: "👥 Team Management",
      disableBeacon: true,
      placement: "right",
    },
    {
      target: '[data-tour="create-team"]',
      content:
        "Create teams for shifts, departments, or work areas. Each team can have its own stations and work orders.",
      title: "➕ Create Teams",
      placement: "bottom",
    },
  ],
  "/admin": [
    {
      target: '[data-tour="admin-stats"]',
      content: "System-wide overview — total stations, active teams, user counts, and organization health.",
      title: "📈 Admin Dashboard",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: '[data-tour="admin-tabs"]',
      content: "Manage Users, Stations, Teams, and review Activity Logs for complete system oversight.",
      title: "⚙️ Admin Sections",
      placement: "bottom",
    },
    {
      target: '[data-tour="bulk-upload"]',
      content: "Bulk import from Excel — upload stations, routing templates, users, and teams in one step.",
      title: "📥 Bulk Upload",
      placement: "left",
    },
  ],
  "/setup": [
    {
      target: '[data-tour="setup-progress"]',
      content: "Track your setup progress. Complete all steps to enable the full Digital Expeditor workflow.",
      title: "✅ Setup Progress",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: '[data-tour="quick-setup"]',
      content: "The fastest way to set up — upload an Excel file with teams, stations, routing templates, and users.",
      title: "⚡ Quick Setup",
      placement: "bottom",
    },
    {
      target: '[data-tour="manual-steps"]',
      content:
        "Or set up step by step: 1) Create Organization → 2) Add Teams → 3) Configure Stations → 4) Invite Members.",
      title: "📋 Manual Setup Steps",
      placement: "top",
    },
  ],
};

// Map routes to onboarding steps for completion tracking
const ROUTE_TO_STEP: Record<string, OnboardingStep> = {
  "/setup": "organization-setup",
  "/dashboard": "dashboard-overview",
  "/queue": "quote-to-workorder",
  "/teams": "team-management",
  "/admin": "admin-features",
};

function filterSteps(steps: TourStep[], quoteSystemEnabled: boolean): TourStep[] {
  if (quoteSystemEnabled) {
    // Remove the non-quote "Work Orders" step — the quote-aware version replaces it
    return steps.filter((s) => s.title !== "📝 Work Orders");
  }
  // Remove all quote-system-specific steps
  return steps.filter((s) => !s.data?.requiresQuoteSystem);
}

export function GuidedTour() {
  const location = useLocation();
  const { showTour, setShowTour, completeStep, isStepCompleted } = useOnboardingContext();
  const { isQuoteSystemEnabled } = useQuoteSystem();
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const rawSteps = TOUR_STEPS[location.pathname];

    if (!rawSteps || !showTour) {
      setRun(false);
      return;
    }

    // Guard: dashboard tour requires shop setup to be done first
    if (location.pathname === "/dashboard") {
      const shopReady = isStepCompleted("shop-setup") || isStepCompleted("organization-setup");
      if (!shopReady) {
        setRun(false);
        return;
      }
    }

    const filtered = filterSteps(rawSteps, isQuoteSystemEnabled);
    if (filtered.length === 0) {
      setRun(false);
      return;
    }

    setSteps(filtered);
    // Small delay so the page has time to render tour targets
    const timer = setTimeout(() => setRun(true), 500);
    return () => clearTimeout(timer);
  }, [location.pathname, showTour, isStepCompleted, isQuoteSystemEnabled]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data;

    const isDone =
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED ||
      action === ACTIONS.CLOSE ||
      (type === EVENTS.STEP_AFTER && action === ACTIONS.SKIP);

    if (isDone) {
      setRun(false);
      setShowTour(false);

      // Only mark as complete when the user finishes (not skips/closes early)
      if (status === STATUS.FINISHED) {
        const step = ROUTE_TO_STEP[location.pathname];
        if (step) completeStep(step);
      }
    }
  };

  if (!steps.length) return null;

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
          primaryColor: "hsl(var(--primary))",
          backgroundColor: "hsl(var(--card))",
          textColor: "hsl(var(--card-foreground))",
          arrowColor: "hsl(var(--card))",
          overlayColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "0.5rem",
          padding: "1rem",
        },
        tooltipTitle: {
          fontSize: "1.125rem",
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: "0.875rem",
          padding: "0.5rem 0",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: "0.375rem",
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          marginRight: "0.5rem",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
        },
        spotlight: {
          borderRadius: "0.5rem",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}

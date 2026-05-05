import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useOnboardingContext, ONBOARDING_STEPS } from "./OnboardingProvider";
import type { OnboardingStep } from "./OnboardingProvider";
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
  Factory,
  Cloud,
  Plug,
} from "lucide-react";

// ── Module-level constants (not re-created on every render) ──────────────────

const STEP_ICONS: Record<string, React.ReactNode> = {
  welcome: <Sparkles className="w-5 h-5" />,
  "organization-setup": <Factory className="w-5 h-5" />,
  "shop-setup": <Factory className="w-5 h-5" />,
  "data-source": <Plug className="w-5 h-5" />,
  "dashboard-overview": <LayoutDashboard className="w-5 h-5" />,
  "station-cards": <LayoutDashboard className="w-5 h-5" />,
  "handoff-submission": <FileEdit className="w-5 h-5" />,
  "performance-updates": <Lightbulb className="w-5 h-5" />,
  "team-management": <Users className="w-5 h-5" />,
  "admin-features": <Settings className="w-5 h-5" />,
  complete: <Rocket className="w-5 h-5" />,
};

const STEP_ROUTE_MAP: Record<string, string> = {
  welcome: "/setup",
  "organization-setup": "/setup",
  "shop-setup": "/setup",
  "data-source": "/settings/integrations/native",
  "dashboard-overview": "/dashboard",
  "station-cards": "/dashboard",
  "handoff-submission": "/dashboard",
  "performance-updates": "/dashboard",
  "team-management": "/teams",
  "admin-features": "/admin",
};

// Data-source paths shown on the "data-source" onboarding step
const DATA_SOURCES = [
  {
    id: "native",
    title: "Native (Lovable Cloud)",
    description: "Run everything in Lovable Cloud — no ERP needed.",
    icon: <Cloud className="w-5 h-5" />,
    route: "/settings/integrations/native",
    badge: "Default",
  },
  {
    id: "jobboss",
    title: "JobBOSS Sync",
    description: "Pull work orders from JobBOSS into Lovable Cloud.",
    icon: <Factory className="w-5 h-5" />,
    route: "/settings/integrations/jobboss",
    badge: "Read-only",
  },
  {
    id: "sap",
    title: "SAP S/4HANA Sync",
    description: "Sync production orders from SAP sandbox or production tenants.",
    icon: <Sparkles className="w-5 h-5" />,
    route: "/settings/integrations/sap",
    badge: "OAuth",
  },
];

function isPublicFacingRoute(pathname: string) {
  return [
    pathname === "/",
    pathname === "/pricing",
    pathname === "/gcode-academy",
    pathname === "/oap",
    pathname.startsWith("/verify"),
    pathname.startsWith("/gcode-academy/certificates"),
    pathname.startsWith("/oap/certificates"),
    pathname.startsWith("/resources"),
    pathname.startsWith("/handbook"),
    pathname.startsWith("/talent"),
    pathname.startsWith("/blog"),
    pathname.startsWith("/help"),
    pathname.startsWith("/use-cases"),
    pathname.startsWith("/industries"),
    pathname.startsWith("/features"),
    pathname.startsWith("/compare"),
    pathname.startsWith("/status"),
  ].some(Boolean);
}

function isEligibleWelcomeRoute(pathname: string) {
  return pathname === "/setup" || pathname === "/dashboard";
}

// ─────────────────────────────────────────────────────────────────────────────

export function WelcomeModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const location = useLocation();
  const { organization } = useOrganization();
  const isItarOrg = !!organization?.requires_us_person_declaration;
  const [isOpen, setIsOpen] = useState(true);

  // Gate: never show for unauthenticated users, on public landing page, or for returning/complete users
  if (
    !user ||
    isLoading ||
    isComplete ||
    showTour ||
    currentStep === "complete" ||
    hasSeenWelcome ||
    isPublicFacingRoute(location.pathname) ||
    !isEligibleWelcomeRoute(location.pathname)
  ) {
    return null;
  }

  const progress = getProgress();
  const currentStepData = ONBOARDING_STEPS.find((s) => s.id === currentStep);

  // Shared teardown: always mark welcome as seen so we don't show again
  const dismiss = async () => {
    await markWelcomeSeen();
    setIsOpen(false);
  };

  const handleStartTour = async () => {
    setIsOpen(false);
    await markWelcomeSeen();
    await completeStep("welcome");
    // Always start new users at setup so they create org + shop first
    navigate("/setup");
    setTimeout(() => startTour(), 300);
  };

  const handleSkip = async () => {
    await markWelcomeSeen();
    await skipOnboarding();
    setIsOpen(false);
    navigate("/dashboard");
  };

  const handleDontShowAgain = async () => {
    await markWelcomeSeen();
    await skipOnboarding();
    setIsOpen(false);
  };

  const handleStepClick = async (stepId: string) => {
    setIsOpen(false);
    await markWelcomeSeen();
    await goToStep(stepId as OnboardingStep);
    navigate(STEP_ROUTE_MAP[stepId] ?? "/dashboard");
    setTimeout(() => startTour(stepId as OnboardingStep), 300);
  };

  // FIX: wrapping onOpenChange so ESC / overlay-click also marks welcome as seen,
  // preventing the modal from reappearing on the next render cycle.
  const handleOpenChange = (open: boolean) => {
    if (!open) dismiss();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            {currentStep === "welcome" ? "Welcome to JobLine.ai Digital Expeditor!" : "Continue Your Tour"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {currentStep === "welcome"
              ? "Let's set up your shop first, then take a tour to learn how to move work orders through your production line."
              : `You're ${progress}% through the onboarding. Ready to continue?`}
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

        {/* Steps overview */}
        <div className="grid grid-cols-2 gap-2 py-2">
          {ONBOARDING_STEPS.filter((s) => s.id !== "complete").map((step) => {
            const isCurrentStep = step.id === currentStep;
            const completed = isStepCompleted(step.id);

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-2 p-2 rounded-md text-sm text-left transition-colors cursor-pointer hover:bg-accent ${
                  isCurrentStep
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : completed
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      isCurrentStep ? "border-primary" : "border-muted-foreground/30"
                    }`}
                  />
                )}
                <span className={`flex-1 truncate ${completed ? "line-through" : ""}`}>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Current step highlight (hidden on welcome and data-source steps) */}
        {currentStepData && currentStep !== "welcome" && currentStep !== "data-source" && (
          <div className="bg-secondary/50 rounded-lg p-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {STEP_ICONS[currentStep]}
              </div>
              <div className="min-w-0">
                <p className="font-medium">Next: {currentStepData.title}</p>
                <p className="text-sm text-muted-foreground truncate">{currentStepData.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data-source picker — shown on the data-source step */}
        {currentStep === "data-source" && (
          <div className="space-y-2 mt-2">
            <p className="text-sm font-medium">Pick where your work orders come from:</p>
            <div className="grid gap-2">
              {DATA_SOURCES.map((src) => (
                <button
                  key={src.id}
                  onClick={async () => {
                    setIsOpen(false);
                    await markWelcomeSeen();
                    await completeStep("data-source");
                    navigate(src.route);
                  }}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card text-left hover:border-primary hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {src.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{src.title}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {src.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{src.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              You can switch or add sources anytime from Settings → Integrations.
            </p>
          </div>
        )}

        {/* Primary actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={handleSkip}>
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Tour
          </Button>
          <Button className="flex-1" onClick={handleStartTour}>
            <Play className="w-4 h-4 mr-2" />
            {currentStep === "welcome" ? "Start Tour" : "Continue Tour"}
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="link" size="sm" className="text-muted-foreground p-0 h-auto" onClick={handleDontShowAgain}>
            Don&apos;t show again
          </Button>
          <p className="text-xs text-muted-foreground">Access anytime from Settings → Onboarding</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

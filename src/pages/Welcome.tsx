/**
 * /welcome — Owner post-claim setup wizard.
 *
 * Gated stepper that must be completed (or "Skip & explore"-bypassed) before
 * the dashboard unlocks and team invites become available. Each required step
 * persists its done flag via `record_owner_setup_step`; the final
 * "open for operations" call requires all required steps marked done server-side.
 *
 * Steps mostly deep-link into existing settings pages for the heavy lifting,
 * then come back with a "Mark complete" action so the user keeps momentum.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Check,
  ChevronRight,
  Building2,
  User,
  Database,
  Factory,
  FileSignature,
  CreditCard,
  Rocket,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/hooks/useOrganization";
import {
  useOwnerSetupGate,
  OWNER_SETUP_STEPS,
  type OwnerSetupStepId,
} from "@/hooks/useOwnerSetupGate";
import { DelegateSetupCard } from "@/components/onboarding/DelegateSetupCard";
import { ConciergeActivityLogPanel } from "@/components/onboarding/ConciergeActivityLogPanel";

interface StepMeta {
  id: OwnerSetupStepId;
  title: string;
  oneLiner: string;
  why: string;
  eta: string;
  icon: React.ElementType;
  ctaPrimary: { label: string; to?: string };
  optional?: boolean;
}

const STEPS: StepMeta[] = [
  {
    id: "profile",
    title: "Verify your owner profile",
    oneLiner: "Confirm name, role, contact, and accept platform terms.",
    why: "Identifies you as the responsible owner on every audit log, signed document, and team invite.",
    eta: "2 min",
    icon: User,
    ctaPrimary: { label: "Open profile", to: "/profile" },
  },
  {
    id: "organization",
    title: "Confirm your organization",
    oneLiner: "Legal name, address, time zone, and ITAR status.",
    why: "Drives data residency, compliance gates, and how members see your shop on every dashboard.",
    eta: "3 min",
    icon: Building2,
    ctaPrimary: { label: "Open organization settings", to: "/settings/organization" },
  },
  {
    id: "data_source",
    title: "Pick your data source",
    oneLiner: "Native (Lovable Cloud), JobBOSS, or SAP S/4HANA.",
    why: "Tells JobLine where your work orders live. ITAR shops are locked to read-through.",
    eta: "2 min",
    icon: Database,
    ctaPrimary: { label: "Choose data source", to: "/settings/integrations" },
  },
  {
    id: "shop_floor",
    title: "Build your shop floor",
    oneLiner: "Departments, teams, and stations — or seed a typical layout.",
    why: "Members can only be assigned once stations exist. Routing templates depend on this too.",
    eta: "5 min",
    icon: Factory,
    ctaPrimary: { label: "Set up stations", to: "/teams" },
  },
  {
    id: "concierge_review",
    title: "Review concierge documents",
    oneLiner: "Sign MSA, ITAR, and Go-Live prepared by your concierge.",
    why: "Only required when you purchased a concierge engagement. Auto-skipped otherwise.",
    eta: "5 min",
    icon: FileSignature,
    ctaPrimary: { label: "Open concierge pack", to: "/settings/concierge-documents" },
    optional: true,
  },
  {
    id: "billing",
    title: "Confirm billing & seats",
    oneLiner: "Tier, seat count, billing email, and payment method.",
    why: "Locks your subscription so service continues uninterrupted after the trial.",
    eta: "2 min",
    icon: CreditCard,
    ctaPrimary: { label: "Open billing", to: "/settings/billing" },
  },
];

export default function Welcome() {
  const { stepId } = useParams<{ stepId?: string }>();
  const navigate = useNavigate();
  const { organization, loading: orgLoading } = useOrganization();
  const gate = useOwnerSetupGate();

  const activeStepId =
    (OWNER_SETUP_STEPS as readonly string[]).includes(stepId ?? "")
      ? (stepId as OwnerSetupStepId)
      : firstIncomplete(gate.steps) ?? "profile";
  const activeStep = STEPS.find((s) => s.id === activeStepId)!;

  const [marking, setMarking] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Auto-skip concierge step when org has no engagement
  useEffect(() => {
    if (gate.loading || !organization) return;
    const hasEngagement = Boolean(
      (organization as any).onboarding_engagement_id ?? null,
    );
    if (!hasEngagement && !gate.steps.concierge_review) {
      gate.markStep("concierge_review", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate.loading, organization]);

  if (orgLoading || gate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-xl font-semibold">No organization yet</h1>
          <p className="text-sm text-muted-foreground">
            You're signed in but not part of an organization. Accept a QR invite,
            paste your concierge claim link, or contact your concierge.
          </p>
          <Button asChild variant="outline">
            <Link to="/claim/account-owner">Open claim page</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (gate.isOpenForOperations) {
    return <ReadyScreen onContinue={() => navigate("/dashboard")} />;
  }

  if (!gate.isOwnerAdmin) {
    // Non-owners shouldn't be here — send them to dashboard.
    navigate("/dashboard", { replace: true });
    return null;
  }

  const completedCount = REQUIRED_COUNT(gate.steps);
  const totalRequired = STEPS.filter((s) => !s.optional).length;
  const pct = Math.round((completedCount / totalRequired) * 100);

  const handleMarkComplete = async () => {
    setMarking(true);
    const res = await gate.markStep(activeStep.id, true);
    setMarking(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save progress");
      return;
    }
    const next = nextIncomplete(activeStep.id, { ...gate.steps, [activeStep.id]: true });
    if (next) navigate(`/welcome/${next}`);
    else navigate("/welcome/review");
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    const res = await gate.openForOperations();
    setFinalizing(false);
    if (!res.ok) {
      toast.error(res.error ?? "Setup isn't complete yet");
      return;
    }
    toast.success("You're open for operations 🎉");
    navigate("/dashboard");
  };

  const handleSkipExplore = async () => {
    await gate.setExploreOnly(true);
    toast.message("Setup paused", {
      description: "Invites and work-order creation stay locked until you finish.",
    });
    navigate("/dashboard");
  };

  const showReview = stepId === "review";

  return (
    <div className="min-h-screen bg-muted/20">
      <Helmet>
        <title>Welcome · Open your shop for operations</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="border-b bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">Welcome to JobLine.ai</div>
              <div className="text-xs text-muted-foreground">
                Setting up {organization.name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground hidden sm:block">
              {completedCount} of {totalRequired} required steps · {pct}%
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkipExplore}>
              Skip &amp; explore
            </Button>
          </div>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-primary transition-all"
            style={{ width: `${pct}%` }}
            aria-label={`${pct}% complete`}
          />
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-1">
          {STEPS.map((s) => {
            const done = gate.steps[s.id];
            const isActive = !showReview && s.id === activeStep.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/welcome/${s.id}`)}
                className={cn(
                  "w-full text-left flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors border",
                  isActive
                    ? "bg-primary/5 border-primary/30"
                    : "border-transparent hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs shrink-0",
                    done
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {s.title}
                    {s.optional && (
                      <Badge variant="outline" className="ml-2 text-[10px] py-0">
                        optional
                      </Badge>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">{s.eta}</span>
                </span>
              </button>
            );
          })}
          <Separator className="my-3" />
          <button
            onClick={() => navigate("/welcome/review")}
            className={cn(
              "w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 border",
              showReview ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-muted/50",
            )}
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground">
              <Rocket className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-medium">Review &amp; open shop</span>
          </button>
        </aside>

        <main className="space-y-6">
          {showReview ? (
            <ReviewCard
              steps={gate.steps}
              finalizing={finalizing}
              onFinalize={handleFinalize}
              onJumpTo={(id) => navigate(`/welcome/${id}`)}
            />
          ) : (
            <StepCard
              step={activeStep}
              done={gate.steps[activeStep.id]}
              marking={marking}
              onMarkComplete={handleMarkComplete}
            />
          )}
          <DelegateSetupCard />
          <ConciergeActivityLogPanel />
        </main>
      </div>
    </div>
  );
}

/* ---------------- internal pieces ---------------- */

function StepCard({
  step,
  done,
  marking,
  onMarkComplete,
}: {
  step: StepMeta;
  done: boolean;
  marking: boolean;
  onMarkComplete: () => void;
}) {
  const Icon = step.icon;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 text-primary p-2.5">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {step.title}
              {done && (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Check className="w-3 h-3 mr-1" /> Done
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{step.oneLiner}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <span className="font-medium">Why this matters: </span>
          <span className="text-muted-foreground">{step.why}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {step.ctaPrimary.to && (
            <Button asChild variant="default">
              <Link to={step.ctaPrimary.to}>
                {step.ctaPrimary.label} <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
          <Button
            onClick={onMarkComplete}
            variant={done ? "outline" : "secondary"}
            disabled={marking}
          >
            {marking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {done ? "Marked complete" : "Mark this step complete"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: complete the action in the linked page, then return here and mark it done.
          Progress is saved automatically and survives a refresh.
        </p>
      </CardContent>
    </Card>
  );
}

function ReviewCard({
  steps,
  finalizing,
  onFinalize,
  onJumpTo,
}: {
  steps: Record<OwnerSetupStepId, boolean>;
  finalizing: boolean;
  onFinalize: () => void;
  onJumpTo: (id: OwnerSetupStepId) => void;
}) {
  const required = STEPS.filter((s) => !s.optional);
  const ready = required.every((s) => steps[s.id]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" /> Open your shop for operations
        </CardTitle>
        <CardDescription>
          When everything below is green, we'll unlock the dashboard, team invites,
          and work-order creation for your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y rounded-md border">
          {STEPS.map((s) => {
            const done = steps[s.id];
            return (
              <li
                key={s.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded-full",
                      done
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px]">·</span>}
                  </span>
                  <span>
                    {s.title}{" "}
                    {s.optional && (
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    )}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onJumpTo(s.id)}>
                  {done ? "Review" : "Finish"}
                </Button>
              </li>
            );
          })}
        </ul>

        <Button
          onClick={onFinalize}
          disabled={!ready || finalizing}
          className="w-full"
          size="lg"
        >
          {finalizing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
          Open shop for operations
        </Button>

        {!ready && (
          <p className="text-xs text-muted-foreground text-center">
            Complete all required steps to unlock this button.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ReadyScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 w-fit mb-2">
            <Rocket className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
          </div>
          <CardTitle>You're open for operations</CardTitle>
          <CardDescription>
            Your shop is configured. Invite your team and start running work.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-2">
          <Button asChild>
            <Link to="/teams?invite=open">Invite team</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/settings/integrations">Connect a machine</Link>
          </Button>
          <Button onClick={onContinue} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function firstIncomplete(steps: Record<OwnerSetupStepId, boolean>): OwnerSetupStepId | undefined {
  return STEPS.filter((s) => !s.optional).find((s) => !steps[s.id])?.id;
}
function nextIncomplete(
  current: OwnerSetupStepId,
  steps: Record<OwnerSetupStepId, boolean>,
): OwnerSetupStepId | undefined {
  const idx = STEPS.findIndex((s) => s.id === current);
  for (let i = idx + 1; i < STEPS.length; i++) {
    if (!STEPS[i].optional && !steps[STEPS[i].id]) return STEPS[i].id;
  }
  return STEPS.filter((s) => !s.optional).find((s) => !steps[s.id])?.id;
}
function REQUIRED_COUNT(steps: Record<OwnerSetupStepId, boolean>) {
  return STEPS.filter((s) => !s.optional && steps[s.id]).length;
}

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, AlertOctagon, MessageCircle, Loader2 } from "lucide-react";
import type { IntakeModuleKey } from "@/hooks/useIntakeResponses";

export interface IntakeStepMeta {
  key: IntakeModuleKey;
  label: string;
  description: string;
}

export const INTAKE_STEPS: IntakeStepMeta[] = [
  { key: "org_profile", label: "Company profile", description: "Confirm your shop's name, address, and compliance posture." },
  { key: "equipment", label: "Equipment", description: "List the machines on your floor." },
  { key: "stations", label: "Stations & departments", description: "Tell us how your shop is organized." },
  { key: "users_roles", label: "Users & roles", description: "Invite your team and assign roles." },
  { key: "routing", label: "Routing templates", description: "Pick or upload your standard job routings." },
  { key: "quality", label: "Quality checkpoints", description: "Choose the inspection gates you run." },
  { key: "erp", label: "ERP integration", description: "Native, JobBOSS, or SAP — your call." },
  { key: "training", label: "Training programs", description: "Assign OAP role programs to operators." },
  { key: "documents", label: "Documents", description: "Upload manuals, policies, setup sheets." },
  { key: "review", label: "Review & submit", description: "Final confirmation. We'll take it from here." },
];

interface Props {
  activeKey: IntakeModuleKey;
  onSelect: (k: IntakeModuleKey) => void;
  checklist: any[];
  responses: Set<IntakeModuleKey>;
  percentComplete: number;
  orgName: string;
  isSaving: boolean;
  children: ReactNode;
}

export function IntakeWizardShell({
  activeKey, onSelect, checklist, responses, percentComplete, orgName, isSaving, children,
}: Props) {
  const blockerMap = new Map(checklist.map((c) => [c.module_key, c.customer_blocker_note]));
  const statusMap = new Map(checklist.map((c) => [c.module_key, c.status]));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{orgName} — Concierge setup</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={percentComplete} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground tabular-nums">{percentComplete}%</span>
            </div>
          </div>
          {isSaving && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving
            </Badge>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[260px_1fr] gap-6">
        <nav className="space-y-1 lg:sticky lg:top-24 self-start">
          {INTAKE_STEPS.map((step, i) => {
            const isActive = step.key === activeKey;
            const submitted = responses.has(step.key);
            const status = statusMap.get(step.key);
            const blocker = blockerMap.get(step.key);
            const Icon = status === "done"
              ? CheckCircle2
              : blocker
                ? AlertOctagon
                : submitted
                  ? CheckCircle2
                  : Circle;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => onSelect(step.key)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm flex items-start gap-2 transition-colors ${
                  isActive ? "bg-primary/10 text-primary border border-primary/30" : "hover:bg-muted"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  status === "done" ? "text-status-ok" : blocker ? "text-destructive" : submitted ? "text-status-ok" : "text-muted-foreground"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium leading-tight">
                    <span className="text-muted-foreground mr-1">{i + 1}.</span>{step.label}
                  </div>
                  {blocker && (
                    <div className="text-xs text-destructive mt-0.5 line-clamp-2">
                      <MessageCircle className="w-3 h-3 inline mr-1" />{blocker}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <a
            href="mailto:concierge@jobline.ai?subject=Help%20with%20onboarding"
            className="block mt-4"
          >
            <Button variant="outline" size="sm" className="w-full gap-2">
              <MessageCircle className="w-4 h-4" /> Need help?
            </Button>
          </a>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}

export function IntakeStepCard({
  title, description, blocker, status, children, footer,
}: {
  title: string;
  description: string;
  blocker?: string | null;
  status?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {status && (
            <Badge variant={status === "done" ? "secondary" : "outline"} className="capitalize">
              {status.replace("_", " ")}
            </Badge>
          )}
        </div>
        {blocker && (
          <div className="mt-3 rounded border border-destructive/40 bg-destructive/5 p-3 text-xs flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-destructive">JobLine flagged this step</div>
              <div className="text-foreground/80 mt-0.5">{blocker}</div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {footer && <div className="px-6 pb-6">{footer}</div>}
    </Card>
  );
}

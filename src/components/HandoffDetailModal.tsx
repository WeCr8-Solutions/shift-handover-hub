import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, getJobStateStatus, getJobStateShortName } from "./StatusBadge";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Clock, User, FileText, Circle, Package, CheckCircle2,
  ArrowRight, Loader2, Route, Wrench, AlertTriangle, ExternalLink,
} from "lucide-react";
import type { ShiftHandoffRecord } from "@/types/handoff";
import { ReadinessChecklist } from "@/components/ReadinessChecklist";
import { useDataAccessLog } from "@/hooks/useDataAccessLog";

interface RoutingStep {
  id: string;
  step_number: number;
  operation_type: string;
  operation_name: string;
  status: string;
  station_id: string | null;
  station_name?: string;
  completed_at: string | null;
  completed_by_name: string | null;
  estimated_duration: number | null;
}

interface HandoffDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: ShiftHandoffRecord | null;
  onViewWorkOrder?: (workOrder: string) => void;
}

const STEP_STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  completed: { bg: "bg-status-ok/10", text: "text-status-ok", icon: CheckCircle2 },
  in_progress: { bg: "bg-status-warning/10", text: "text-status-warning", icon: Loader2 },
  pending: { bg: "bg-muted", text: "text-muted-foreground", icon: Circle },
  skipped: { bg: "bg-muted", text: "text-muted-foreground/50", icon: Circle },
};

export function HandoffDetailModal({ open, onOpenChange, record, onViewWorkOrder }: HandoffDetailModalProps) {
  const [routingSteps, setRoutingSteps] = useState<RoutingStep[]>([]);
  const [loadingRouting, setLoadingRouting] = useState(false);
  const { logAccess } = useDataAccessLog();

  useEffect(() => {
    if (!open || !record) {
      setRoutingSteps([]);
      return;
    }

    // ITAR audit trail: record that this handoff was viewed.
    void logAccess({
      tableName: "shift_handoff_records",
      recordId: record.recordId,
      operation: "READ",
      metadata: record.workOrder ? { work_order: record.workOrder } : undefined,
    });



    const fetchRouting = async () => {
      setLoadingRouting(true);
      // Find the queue_item by work_order match
      const { data: queueItem } = await supabase
        .from("queue_items")
        .select("id")
        .eq("work_order", record.workOrder)
        .limit(1)
        .maybeSingle();

      if (queueItem) {
        const { data: steps } = await supabase
          .from("work_order_routing")
          .select(`
            id, step_number, operation_type, operation_name, status,
            station_id, completed_at, completed_by_name, estimated_duration,
            station:stations(name)
          `)
          .eq("queue_item_id", queueItem.id)
          .order("step_number", { ascending: true });

        if (steps) {
          setRoutingSteps(
            steps.map((s: any) => ({
              ...s,
              station_name: s.station?.name || null,
            }))
          );
        }
      }
      setLoadingRouting(false);
    };

    fetchRouting();
  }, [open, record]);

  if (!record) return null;

  const createdDate = new Date(record.createdAt);
  const Icon = workCenterIcons[record.workCenterType] || Circle;
  const iconColor = workCenterColors[record.workCenterType];

  const currentStepIndex = routingSteps.findIndex(
    (s) => s.status === "in_progress" || s.status === "pending"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-secondary", iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono">{record.machineId}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-mono text-sm text-muted-foreground">{record.workOrder}</span>
              </div>
              <div className="text-xs text-muted-foreground font-normal mt-0.5">
                {format(createdDate, "MMM d, yyyy 'at' HH:mm")} — {record.shift} Shift
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Status + Part Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={getJobStateStatus(record.jobState.primaryState)}>
            {getJobStateShortName(record.jobState.primaryState)}
          </StatusBadge>
          <Badge variant="outline" className="text-xs">
            {record.workCenterType}
          </Badge>
          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
            <span>Part: <span className="font-mono text-foreground">{record.part.partNumber}</span></span>
            <span>Rev: <span className="font-mono text-foreground">{record.part.revision}</span></span>
            <span>Op: <span className="font-mono text-foreground">{record.part.operationNumber}</span></span>
          </div>
          {onViewWorkOrder && record.workOrder && record.workOrder !== "—" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs ml-auto"
              onClick={() => {
                onOpenChange(false);
                onViewWorkOrder(record.workOrder);
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Work Order
            </Button>
          )}
        </div>

        <Separator />

        {/* Personnel */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Outgoing</div>
              <div className="font-medium">{record.personnel.outgoingOperator}</div>
              {record.signOff.outgoingTime && (
                <div className="text-xs text-muted-foreground">{record.signOff.outgoingTime}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Incoming</div>
              <div className="font-medium">{record.personnel.incomingOperator}</div>
              {record.signOff.incomingTime && (
                <div className="text-xs text-muted-foreground">{record.signOff.incomingTime}</div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
            <FileText className="w-3.5 h-3.5" />
            Handoff Summary
          </div>
          <p className="text-sm">{record.handoffSummary}</p>
        </div>

        {/* Quality Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Completed", value: record.qualityStatus.partsCompletedThisShift, color: "text-status-ok" },
            { label: "Scrap", value: record.qualityStatus.scrapCount, color: record.qualityStatus.scrapCount > 0 ? "text-status-critical" : "text-foreground" },
            { label: "Rework", value: record.qualityStatus.reworkCount, color: record.qualityStatus.reworkCount > 0 ? "text-status-warning" : "text-foreground" },
            { label: "Dims Verified", value: record.qualityStatus.criticalDimsVerified ? "Yes" : "No", color: record.qualityStatus.criticalDimsVerified ? "text-status-ok" : "text-status-warning" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</div>
              <div className={cn("font-mono text-lg font-semibold", stat.color)}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Process Notes */}
        {record.setupProcess.processNotesForNextShift && (
          <div className="bg-accent/30 border border-accent/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-accent-foreground mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Notes for Next Shift
            </div>
            <p className="text-sm">{record.setupProcess.processNotesForNextShift}</p>
          </div>
        )}

        {/* Issues / Follow-ups */}
        {record.issuesFollowUps && record.issuesFollowUps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Wrench className="w-3.5 h-3.5" />
              Issues & Follow-ups ({record.issuesFollowUps.length})
            </div>
            {record.issuesFollowUps.map((issue, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-2.5 text-sm">
                <div className="font-medium">{issue.issue}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Action: {issue.actionRequired} — Owner: {issue.owner}
                </div>
              </div>
            ))}
          </div>
        )}

        {record.machineReadiness && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Wrench className="w-4 h-4 text-primary" />
                Machine Readiness
              </div>
              <ReadinessChecklist readiness={record.machineReadiness} />
            </div>
          </>
        )}

        <Separator />

        {/* Routing Steps */}
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Route className="w-4 h-4 text-primary" />
            Routing Steps
          </div>

          {loadingRouting ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading routing…
            </div>
          ) : routingSteps.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No routing defined for this work order
            </div>
          ) : (
            <div className="relative space-y-0">
              {routingSteps.map((step, idx) => {
                const config = STEP_STATUS_STYLES[step.status] || STEP_STATUS_STYLES.pending;
                const StepIcon = config.icon;
                const isActive = idx === currentStepIndex;
                const isLast = idx === routingSteps.length - 1;

                return (
                  <div key={step.id} className="flex gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2",
                        isActive ? "border-primary bg-primary/10" : "border-border",
                        config.bg,
                      )}>
                        <StepIcon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : config.text, step.status === "in_progress" && "animate-spin")} />
                      </div>
                      {!isLast && (
                        <div className={cn(
                          "w-0.5 flex-1 min-h-[24px]",
                          step.status === "completed" ? "bg-status-ok/30" : "bg-border",
                        )} />
                      )}
                    </div>

                    {/* Step content */}
                    <div className={cn("pb-4 flex-1", isLast && "pb-0")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">#{step.step_number}</span>
                          <span className={cn("text-sm font-medium", isActive && "text-primary")}>
                            {step.operation_name || step.operation_type}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] capitalize", config.text)}
                        >
                          {step.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        {step.station_name && <span>{step.station_name}</span>}
                        {step.estimated_duration != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.estimated_duration}min
                          </span>
                        )}
                        {step.completed_at && (
                          <span className="text-status-ok">
                            ✓ {format(new Date(step.completed_at), "MMM d HH:mm")}
                            {step.completed_by_name && ` by ${step.completed_by_name}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

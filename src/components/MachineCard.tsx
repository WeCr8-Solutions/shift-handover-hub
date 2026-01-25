import { MachineInfo, JobState } from "@/types/handoff";
import { StatusBadge, getJobStateStatus, getJobStateShortName } from "./StatusBadge";
import { AlertTriangle, Droplets, Wind, Wrench, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MachineCardProps {
  machine: MachineInfo;
  onClick?: () => void;
}

function getStateDataAttr(state?: JobState): string {
  if (!state) return "idle";
  switch (state) {
    case "Part Running":
      return "running";
    case "Setup in Progress":
    case "First Article in Process":
      return "setup";
    case "Waiting on QA":
    case "Waiting on Tooling":
    case "Waiting on Material":
      return "waiting";
    case "Machine Down / Issue":
      return "down";
    default:
      return "idle";
  }
}

export function MachineCard({ machine, onClick }: MachineCardProps) {
  const { currentJob, condition } = machine;
  const stateAttr = getStateDataAttr(currentJob?.state);
  
  const hasIssues = 
    condition.coolantLevel === "Low" ||
    condition.airPressure === "Low" ||
    condition.chipCondition === "Needs Cleaning" ||
    condition.wayLube === "Check" ||
    condition.guardsDoors === "Issue" ||
    condition.activeAlarms;

  const progress = currentJob 
    ? Math.round((currentJob.partsComplete / currentJob.partsRequired) * 100) 
    : 0;

  return (
    <div
      className={cn("machine-card cursor-pointer group")}
      data-state={stateAttr}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-mono text-sm font-semibold text-foreground">
            {machine.machineId}
          </h3>
          <p className="text-xs text-muted-foreground">{machine.name}</p>
        </div>
        {currentJob && (
          <StatusBadge 
            status={getJobStateStatus(currentJob.state)}
            pulse={currentJob.state === "Part Running"}
          >
            {getJobStateShortName(currentJob.state)}
          </StatusBadge>
        )}
      </div>

      {/* Current Job Info */}
      {currentJob && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="data-label">Work Order</span>
            <span className="font-mono text-xs text-foreground">{currentJob.workOrder}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="data-label">Part Number</span>
            <span className="font-mono text-xs text-foreground">{currentJob.partNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="data-label">Operator</span>
            <span className="text-xs text-foreground">{currentJob.operator}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {currentJob && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="data-label">Progress</span>
            <span className="font-mono text-xs text-foreground">
              {currentJob.partsComplete} / {currentJob.partsRequired}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                stateAttr === "running" && "bg-state-running",
                stateAttr === "setup" && "bg-state-setup",
                stateAttr === "waiting" && "bg-state-waiting",
                stateAttr === "down" && "bg-state-down"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Condition Indicators */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <ConditionIcon 
          ok={condition.coolantLevel === "OK"} 
          icon={Droplets} 
          label="Coolant" 
        />
        <ConditionIcon 
          ok={condition.airPressure === "OK"} 
          icon={Wind} 
          label="Air" 
        />
        <ConditionIcon 
          ok={condition.chipCondition === "Clear"} 
          icon={Wrench} 
          label="Chips" 
        />
        {condition.activeAlarms && (
          <div className="ml-auto flex items-center gap-1 text-status-critical">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">ALARM</span>
          </div>
        )}
        {!hasIssues && (
          <div className="ml-auto flex items-center gap-1 text-status-ok">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs">All OK</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionIcon({ 
  ok, 
  icon: Icon, 
  label 
}: { 
  ok: boolean; 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
}) {
  return (
    <div 
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
        ok ? "text-muted-foreground" : "text-status-warning bg-status-warning/10"
      )}
      title={`${label}: ${ok ? "OK" : "Needs Attention"}`}
    >
      <Icon className="w-3 h-3" />
    </div>
  );
}

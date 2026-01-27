import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StationInfo, JobState } from "@/types/handoff";
import { StatusBadge, getJobStateStatus, getJobStateShortName } from "./StatusBadge";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { AlertTriangle, Check, Plus, ListTodo, Lightbulb, Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StationCardProps {
  station: StationInfo;
  stationDbId?: string; // Database UUID for linking to queue
  onClick?: () => void;
  onNewHandoff?: () => void;
  onPerformanceUpdate?: () => void;
  onViewQueue?: () => void;
}

function getStateDataAttr(state?: JobState): string {
  if (!state) return "idle";
  switch (state) {
    case "Part Running":
    case "Processing":
      return "running";
    case "Setup in Progress":
    case "First Article in Process":
      return "setup";
    case "Waiting on QA":
    case "Waiting on Tooling":
    case "Waiting on Material":
    case "On Hold":
      return "waiting";
    case "Machine Down / Issue":
      return "down";
    case "Ready for Pickup":
      return "running";
    default:
      return "idle";
  }
}

function hasConditionIssue(condition: StationInfo["condition"]): boolean {
  if ("status" in condition) {
    return condition.status === "Issue";
  }
  if ("coolantLevel" in condition) {
    return (
      condition.coolantLevel === "Low" ||
      condition.airPressure === "Low" ||
      condition.chipCondition === "Needs Cleaning" ||
      condition.wayLube === "Check" ||
      condition.guardsDoors === "Issue" ||
      condition.activeAlarms
    );
  }
  if ("gasLevel" in condition) {
    return (
      condition.gasLevel === "Low" ||
      condition.wireLevel === "Low" ||
      condition.tipCondition === "Replace" ||
      condition.groundConnection === "Issue"
    );
  }
  if ("waterPressure" in condition) {
    return (
      condition.waterPressure === "Low" ||
      condition.abrasiveLevel === "Low" ||
      condition.nozzleCondition !== "OK" ||
      condition.tankLevel === "Low"
    );
  }
  return false;
}

function hasAlarm(condition: StationInfo["condition"]): boolean {
  if ("activeAlarms" in condition) {
    return condition.activeAlarms;
  }
  if ("status" in condition) {
    return condition.status === "Issue";
  }
  return false;
}

export function StationCard({ station, stationDbId, onClick, onNewHandoff, onPerformanceUpdate, onViewQueue }: StationCardProps) {
  const navigate = useNavigate();
  const { currentJob, condition, workCenterType } = station;
  const stateAttr = getStateDataAttr(currentJob?.state);
  const hasIssues = hasConditionIssue(condition);
  const hasActiveAlarm = hasAlarm(condition);
  
  const Icon = workCenterIcons[workCenterType];
  const iconColor = workCenterColors[workCenterType];

  const progress = currentJob && currentJob.partsRequired > 0
    ? Math.round((currentJob.partsComplete / currentJob.partsRequired) * 100) 
    : 0;

  const handleViewQueue = () => {
    if (onViewQueue) {
      onViewQueue();
    } else if (stationDbId) {
      navigate(`/queue?station=${stationDbId}`);
    } else {
      navigate('/queue');
    }
  };

  return (
    <div
      className={cn("machine-card group")}
      data-state={stateAttr}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 cursor-pointer" onClick={onClick}>
          <div className={cn("p-2 rounded-lg bg-secondary", iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold text-foreground">
              {station.stationId}
            </h3>
            <p className="text-xs text-muted-foreground">{station.name}</p>
            <p className="text-[10px] text-muted-foreground/70">{workCenterType}</p>
          </div>
        </div>
        {currentJob && (
          <StatusBadge 
            status={getJobStateStatus(currentJob.state)}
            pulse={currentJob.state === "Part Running" || currentJob.state === "Processing"}
          >
            {getJobStateShortName(currentJob.state)}
          </StatusBadge>
        )}
      </div>

      {/* Current Job Info */}
      {currentJob && currentJob.workOrder !== "TOOL-MGMT" && (
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
      {currentJob && currentJob.partsRequired > 0 && (
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

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mb-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-8 text-xs"
          onClick={(e) => { e.stopPropagation(); handleViewQueue(); }}
        >
          <ListTodo className="w-3 h-3 mr-1" />
          Queue
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="h-8 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Actions
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onNewHandoff?.()}>
              <Play className="w-4 h-4 mr-2" />
              New Handoff
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPerformanceUpdate?.()}>
              <Lightbulb className="w-4 h-4 mr-2" />
              Performance Update
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewQueue}>
              <ListTodo className="w-4 h-4 mr-2" />
              View Queue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        {hasActiveAlarm && (
          <div className="flex items-center gap-1 text-status-critical">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">ISSUE</span>
          </div>
        )}
        {hasIssues && !hasActiveAlarm && (
          <div className="flex items-center gap-1 text-status-warning">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs">Attention</span>
          </div>
        )}
        {!hasIssues && !hasActiveAlarm && (
          <div className="ml-auto flex items-center gap-1 text-status-ok">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs">All OK</span>
          </div>
        )}
      </div>
    </div>
  );
}

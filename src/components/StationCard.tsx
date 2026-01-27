import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StationInfo, JobState } from "@/types/handoff";
import { StatusBadge, getJobStateStatus, getJobStateShortName } from "./StatusBadge";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { AlertTriangle, Check, Plus, ListTodo, Lightbulb, Play, ChevronRight, Clock, Package, Pause, Timer, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface ActiveQueueItem {
  id: string;
  title: string;
  work_order: string | null;
  part_number: string | null;
  status: string;
  started_at: string | null;
  estimated_duration: number | null;
  priority: string;
}

interface StationCardProps {
  station: StationInfo;
  stationDbId?: string; // Database UUID for linking to queue
  onClick?: () => void;
  onNewHandoff?: () => void;
  onPerformanceUpdate?: () => void;
  onViewQueue?: () => void;
  onAddWorkOrder?: () => void;
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

export function StationCard({ station, stationDbId, onClick, onNewHandoff, onPerformanceUpdate, onViewQueue, onAddWorkOrder }: StationCardProps) {
  const navigate = useNavigate();
  const { currentJob, condition, workCenterType } = station;
  const [activeQueueItem, setActiveQueueItem] = useState<ActiveQueueItem | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Update timer every minute for duration display
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Fetch active queue item for this station
  useEffect(() => {
    if (!stationDbId) return;
    
    const fetchActiveItem = async () => {
      // Get active/in-progress item
      const { data } = await supabase
        .from("queue_items")
        .select("id, title, work_order, part_number, status, started_at, estimated_duration, priority")
        .eq("station_id", stationDbId)
        .in("status", ["in_progress", "on_hold"])
        .order("status", { ascending: true }) // in_progress comes first
        .limit(1)
        .maybeSingle();
      
      setActiveQueueItem(data as ActiveQueueItem | null);
      
      // Get queue count
      const { count } = await supabase
        .from("queue_items")
        .select("*", { count: "exact", head: true })
        .eq("station_id", stationDbId)
        .in("status", ["pending", "queued"]);
      
      setQueueCount(count || 0);
    };
    
    fetchActiveItem();
    
    // Subscribe to changes
    const channel = supabase
      .channel(`station-queue-${stationDbId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "queue_items",
        filter: `station_id=eq.${stationDbId}`,
      }, () => {
        fetchActiveItem();
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [stationDbId]);
  
  const effectiveJob = currentJob || (activeQueueItem ? {
    workOrder: activeQueueItem.work_order || activeQueueItem.title,
    partNumber: activeQueueItem.part_number || "",
    state: "Part Running" as JobState,
    operator: "",
    partsComplete: 0,
    partsRequired: 0,
  } : undefined);
  
  const stateAttr = getStateDataAttr(effectiveJob?.state);
  const hasIssues = hasConditionIssue(condition);
  const hasActiveAlarm = hasAlarm(condition);
  
  const Icon = workCenterIcons[workCenterType];
  const iconColor = workCenterColors[workCenterType];

  const progress = effectiveJob && effectiveJob.partsRequired > 0
    ? Math.round((effectiveJob.partsComplete / effectiveJob.partsRequired) * 100) 
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

  // Calculate elapsed time and remaining duration
  const getTimeInfo = () => {
    if (!activeQueueItem?.started_at) return null;
    
    const startTime = new Date(activeQueueItem.started_at).getTime();
    const elapsedMs = currentTime - startTime;
    const elapsedMins = Math.floor(elapsedMs / 60000);
    const elapsedHours = Math.floor(elapsedMins / 60);
    const elapsedDisplay = elapsedHours > 0 
      ? `${elapsedHours}h ${elapsedMins % 60}m`
      : `${elapsedMins}m`;
    
    if (!activeQueueItem.estimated_duration) {
      return { elapsed: elapsedDisplay, remaining: null, progress: null, isOverdue: false };
    }
    
    const estimatedMs = activeQueueItem.estimated_duration * 60000;
    const remainingMs = estimatedMs - elapsedMs;
    const remainingMins = Math.floor(remainingMs / 60000);
    const isOverdue = remainingMs <= 0;
    
    let remainingDisplay: string;
    if (isOverdue) {
      const overdueMins = Math.abs(remainingMins);
      const overdueHours = Math.floor(overdueMins / 60);
      remainingDisplay = overdueHours > 0 
        ? `+${overdueHours}h ${overdueMins % 60}m over`
        : `+${overdueMins}m over`;
    } else {
      const remainingHours = Math.floor(remainingMins / 60);
      remainingDisplay = remainingHours > 0 
        ? `${remainingHours}h ${remainingMins % 60}m left`
        : `${remainingMins}m left`;
    }
    
    const progress = Math.min((elapsedMs / estimatedMs) * 100, 100);
    
    return { elapsed: elapsedDisplay, remaining: remainingDisplay, progress, isOverdue };
  };

  const timeInfo = getTimeInfo();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600 border-red-500/50 bg-red-500/10";
      case "urgent": return "text-orange-600 border-orange-500/50 bg-orange-500/10";
      case "high": return "text-amber-600 border-amber-500/50 bg-amber-500/10";
      default: return "";
    }
  };

  // Calculate elapsed time if work is in progress
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
        <div className="flex flex-col items-end gap-1">
          {effectiveJob && (
            <StatusBadge 
              status={getJobStateStatus(effectiveJob.state)}
              pulse={effectiveJob.state === "Part Running" || effectiveJob.state === "Processing"}
            >
              {getJobStateShortName(effectiveJob.state)}
            </StatusBadge>
          )}
          {queueCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {queueCount} in queue
            </span>
          )}
        </div>
      </div>

      {/* Active Work Status Display */}
      {activeQueueItem && (
        <div className={cn(
          "mb-3 p-2 rounded-lg border",
          activeQueueItem.status === "in_progress" && "bg-green-500/10 border-green-500/30",
          activeQueueItem.status === "on_hold" && "bg-amber-500/10 border-amber-500/30",
          getPriorityColor(activeQueueItem.priority) && activeQueueItem.priority !== "normal" && activeQueueItem.priority !== "low"
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px]",
                activeQueueItem.status === "in_progress" && "bg-green-500/10 text-green-600 border-green-500/30",
                activeQueueItem.status === "on_hold" && "bg-amber-500/10 text-amber-600 border-amber-500/30"
              )}
            >
              {activeQueueItem.status === "in_progress" ? (
                <>
                  <Play className="w-2.5 h-2.5 mr-1" />
                  RUNNING
                </>
              ) : (
                <>
                  <Pause className="w-2.5 h-2.5 mr-1" />
                  ON HOLD
                </>
              )}
            </Badge>
            
            {timeInfo && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Timer className="w-2.5 h-2.5" />
                  {timeInfo.elapsed}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs font-medium">
            <Package className="w-3 h-3 text-primary" />
            {activeQueueItem.work_order || activeQueueItem.title}
          </div>
          
          {activeQueueItem.part_number && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Part: {activeQueueItem.part_number}
            </p>
          )}

          {/* Duration Progress */}
          {timeInfo?.progress !== null && timeInfo?.progress !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-[10px] font-medium flex items-center gap-1",
                  timeInfo.isOverdue ? "text-red-500" : "text-muted-foreground"
                )}>
                  {timeInfo.isOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                  {timeInfo.remaining}
                </span>
              </div>
              <Progress 
                value={timeInfo.progress} 
                className={cn(
                  "h-1",
                  timeInfo.isOverdue && "[&>div]:bg-red-500"
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* Machine Down Status */}
      {hasActiveAlarm && !activeQueueItem && (
        <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div>
              <span className="text-xs font-medium text-red-600">Machine Down</span>
              <p className="text-[10px] text-muted-foreground">Requires attention</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Job Info (from handoff records) */}
      {currentJob && currentJob.workOrder !== "TOOL-MGMT" && !activeQueueItem && (
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
      {effectiveJob && effectiveJob.partsRequired > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="data-label">Progress</span>
            <span className="font-mono text-xs text-foreground">
              {effectiveJob.partsComplete} / {effectiveJob.partsRequired}
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
            <DropdownMenuItem onClick={() => onAddWorkOrder?.()}>
              <Package className="w-4 h-4 mr-2" />
              Add Work Order
            </DropdownMenuItem>
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

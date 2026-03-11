import { useState, useEffect } from "react";
import { StationMachineContextDialog } from "@/components/station/StationMachineContextDialog";
import { useNavigate } from "react-router-dom";
import { StationInfo, JobState } from "@/types/handoff";
import { StatusBadge, getJobStateStatus, getJobStateShortName } from "./StatusBadge";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import {
  AlertTriangle, Check, Plus, ListTodo, Lightbulb, Play, ChevronRight,
  Clock, Package, Pause, Timer, AlertCircle, Truck, MapPin, ArrowRight,
  CheckCircle2, Bell, Zap, Circle, Cpu
} from "lucide-react";
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
import { getQueueStatusBadgeColor } from "@/lib/status-colors";

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

interface RoutingStep {
  id: string;
  step_number: number;
  operation_name: string;
  status: string;
  station_id: string | null;
  next_station_name?: string;
}

interface StationCardProps {
  station: StationInfo;
  stationDbId?: string;
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
  const [pendingDelivery, setPendingDelivery] = useState<{
    itemId: string;
    workOrder: string;
    nextStationName: string | null;
    nextStationId: string | null;
    priority: string;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [deliveryFlash, setDeliveryFlash] = useState(false);
  const [showMachineContext, setShowMachineContext] = useState(false);
  
  
  // State for queued items waiting to be started at this station
  const [queuedItems, setQueuedItems] = useState<{
    id: string;
    title: string;
    workOrder: string | null;
    partNumber: string | null;
    priority: string;
  }[]>([]);

  // State for completed work orders needing delivery (all completed items at this station)
  const [completedNeedingDelivery, setCompletedNeedingDelivery] = useState<{
    id: string;
    workOrder: string;
    partNumber: string | null;
    nextStationName: string | null;
    priority: string;
  }[]>([]);
  
  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  
  // State for incoming queue items (work orders routed to this station, waiting for delivery)
  const [incomingItems, setIncomingItems] = useState<{
    itemId: string;
    workOrder: string;
    fromStationName: string | null;
    priority: string;
  }[]>([]);

  // Fetch active queue item and pending deliveries
  useEffect(() => {
    if (!stationDbId) return;
    
    const fetchStationData = async () => {
      // Get active/in-progress item
      const { data: activeItem } = await supabase
        .from("queue_items")
        .select("id, title, work_order, part_number, status, started_at, estimated_duration, priority")
        .eq("station_id", stationDbId)
        .in("status", ["in_progress", "on_hold"])
        .order("status", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      setActiveQueueItem(activeItem as ActiveQueueItem | null);
      
      // Get queued items (pending and queued items at this station) - for display
      const { data: queuedData, count } = await supabase
        .from("queue_items")
        .select("id, title, work_order, part_number, priority", { count: "exact" })
        .eq("station_id", stationDbId)
        .in("status", ["pending", "queued"])
        .order("priority", { ascending: false })
        .limit(5);
      
      setQueueCount(count || 0);
      setQueuedItems(queuedData?.map(q => ({
        id: q.id,
        title: q.title,
        workOrder: q.work_order,
        partNumber: q.part_number,
        priority: q.priority,
      })) || []);

      // Check for items ready for delivery (completed at this station, need to move to next)
      // This checks if there's a completed routing step at this station with a pending next step
      const { data: routingData } = await supabase
        .from("work_order_routing")
        .select(`
          id,
          step_number,
          operation_name,
          status,
          station_id,
          queue_item_id,
          queue_items!inner (
            id,
            title,
            work_order,
            status,
            priority
          )
        `)
        .eq("station_id", stationDbId)
        .eq("status", "completed")
        .order("step_number", { ascending: true })
        .limit(5);

      let foundPendingDelivery = false;
      if (routingData && routingData.length > 0) {
        // For each completed step, check if there's a next step pending
        for (const step of routingData) {
          const { data: nextStep } = await supabase
            .from("work_order_routing")
            .select(`
              id,
              step_number,
              operation_name,
              status,
              station_id,
              stations:station_id (
                name,
                station_id
              )
            `)
            .eq("queue_item_id", step.queue_item_id)
            .eq("step_number", step.step_number + 1)
            .eq("status", "pending")
            .maybeSingle();

          if (nextStep) {
            const queueItem = step.queue_items as any;
            const nextStation = nextStep.stations as any;
            const newDelivery = {
              itemId: step.queue_item_id,
              workOrder: queueItem?.work_order || queueItem?.title || "Unknown",
              nextStationName: nextStation?.name || nextStep.operation_name,
              nextStationId: nextStep.station_id,
              priority: queueItem?.priority || "normal",
            };
            
            // Trigger flash animation if this is a new delivery
            if (!pendingDelivery || pendingDelivery.itemId !== newDelivery.itemId) {
              setDeliveryFlash(true);
              setTimeout(() => setDeliveryFlash(false), 3000);
            }
            
            setPendingDelivery(newDelivery);
            foundPendingDelivery = true;
            break;
          }
        }
      }
      
      // Clear pending delivery if none found
      if (!foundPendingDelivery) {
        setPendingDelivery(null);
      }

      // Check for incoming items (work orders routed TO this station that are in queue/pending)
      // These are items where the previous routing step is completed and this station's step is pending
      const { data: incomingRoutingData } = await supabase
        .from("work_order_routing")
        .select(`
          id,
          step_number,
          operation_name,
          status,
          station_id,
          queue_item_id,
          queue_items!inner (
            id,
            title,
            work_order,
            status,
            station_id,
            priority
          )
        `)
        .eq("station_id", stationDbId)
        .eq("status", "pending")
        .order("step_number", { ascending: true })
        .limit(10);

      const incomingList: typeof incomingItems = [];
      if (incomingRoutingData && incomingRoutingData.length > 0) {
        for (const step of incomingRoutingData) {
          // Check if there's a previous step that's completed (meaning item is waiting for delivery to us)
          if (step.step_number > 1) {
            const { data: prevStep } = await supabase
              .from("work_order_routing")
              .select(`
                id,
                status,
                station_id,
                stations:station_id (
                  name
                )
              `)
              .eq("queue_item_id", step.queue_item_id)
              .eq("step_number", step.step_number - 1)
              .eq("status", "completed")
              .maybeSingle();

            if (prevStep) {
              const queueItem = step.queue_items as any;
              const prevStation = prevStep.stations as any;
              // Only show if not already at our station
              if (queueItem?.station_id !== stationDbId) {
                incomingList.push({
                  itemId: step.queue_item_id,
                  workOrder: queueItem?.work_order || queueItem?.title || "Unknown",
                  fromStationName: prevStation?.name || "Previous Station",
                  priority: queueItem?.priority || "normal",
                });
              }
            }
          }
        }
      }
      // Sort by priority (critical > urgent > high > normal > low)
      const priorityOrder = { critical: 0, urgent: 1, high: 2, normal: 3, low: 4 };
      incomingList.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3));
      setIncomingItems(incomingList);

      // Fetch ALL completed items at this station that need delivery to next station
      const completedList: typeof completedNeedingDelivery = [];
      if (routingData && routingData.length > 0) {
        for (const step of routingData) {
          const { data: nextStep } = await supabase
            .from("work_order_routing")
            .select(`
              id,
              step_number,
              operation_name,
              status,
              station_id,
              stations:station_id (
                name,
                station_id
              )
            `)
            .eq("queue_item_id", step.queue_item_id)
            .eq("step_number", step.step_number + 1)
            .eq("status", "pending")
            .maybeSingle();

          if (nextStep) {
            const queueItem = step.queue_items as any;
            const nextStation = nextStep.stations as any;
            completedList.push({
              id: step.queue_item_id,
              workOrder: queueItem?.work_order || queueItem?.title || "Unknown",
              partNumber: queueItem?.part_number || null,
              nextStationName: nextStation?.name || nextStep.operation_name,
              priority: queueItem?.priority || "normal",
            });
          }
        }
      }
      completedList.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3));
      setCompletedNeedingDelivery(completedList);
    };
    
    fetchStationData();
    
    // Subscribe to changes
    const channel = supabase
      .channel(`station-queue-${stationDbId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "queue_items",
        filter: `station_id=eq.${stationDbId}`,
      }, () => {
        fetchStationData();
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "work_order_routing",
        filter: `station_id=eq.${stationDbId}`,
      }, () => {
        fetchStationData();
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
  
  const Icon = workCenterIcons[workCenterType] || Circle;
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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "in_progress": return { label: "IN PROGRESS", icon: Play,        color: getQueueStatusBadgeColor("in_progress") };
      case "on_hold":     return { label: "ON HOLD",     icon: Pause,       color: getQueueStatusBadgeColor("on_hold") };
      case "pending":     return { label: "PENDING",     icon: Clock,       color: getQueueStatusBadgeColor("pending") };
      case "queued":      return { label: "QUEUED",      icon: ListTodo,    color: getQueueStatusBadgeColor("queued") };
      case "completed":   return { label: "COMPLETED",   icon: CheckCircle2, color: getQueueStatusBadgeColor("completed") };
      default:            return { label: status.toUpperCase(), icon: Clock, color: "bg-secondary" };
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

      {/* 🚨 PENDING DELIVERY ALERT - SHOUTING VERSION */}
      {pendingDelivery && (
        <div className={cn(
          "mb-3 p-3 rounded-lg border-2 transition-all duration-300",
          pendingDelivery.priority === "critical" && "border-status-critical bg-status-critical/20 animate-pulse",
          pendingDelivery.priority === "urgent" && "border-priority-urgent bg-priority-urgent/20 animate-pulse",
          pendingDelivery.priority === "high" && "border-warning bg-warning/15",
          !["critical", "urgent", "high"].includes(pendingDelivery.priority) && "border-warning bg-warning/10",
          deliveryFlash && "ring-2 ring-warning ring-offset-2 ring-offset-background"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-full",
                pendingDelivery.priority === "critical" ? "bg-status-critical animate-bounce" :
                pendingDelivery.priority === "urgent" ? "bg-priority-urgent animate-bounce" : "bg-warning"
              )}>
                <Truck className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className={cn(
                  "text-sm font-bold uppercase tracking-wide",
                  pendingDelivery.priority === "critical" ? "text-status-critical" :
                  pendingDelivery.priority === "urgent" ? "text-priority-urgent" : "text-warning"
                )}>
                  ⚠️ NEEDS DELIVERY
                </span>
                {pendingDelivery.priority && pendingDelivery.priority !== "normal" && pendingDelivery.priority !== "low" && (
                  <Badge className={cn(
                    "ml-2 text-[9px]",
                    pendingDelivery.priority === "critical" && "bg-status-critical",
                    pendingDelivery.priority === "urgent" && "bg-priority-urgent",
                    pendingDelivery.priority === "high" && "bg-warning"
                  )}>
                    <Zap className="w-2 h-2 mr-0.5" />
                    {pendingDelivery.priority.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-8">
            <Badge variant="outline" className="text-xs bg-background font-mono">
              <Package className="w-3 h-3 mr-1" />
              {pendingDelivery.workOrder}
            </Badge>
            <ArrowRight className="w-4 h-4 text-foreground animate-pulse" />
            <div className="flex items-center gap-1 text-xs font-medium text-foreground">
              <MapPin className="w-3 h-3" />
              {pendingDelivery.nextStationName || "Next Station"}
            </div>
          </div>
        </div>
      )}

      {/* 📦 INCOMING ITEMS ALERT - ENHANCED VERSION */}
      {incomingItems.length > 0 && (
        <div className={cn(
          "mb-3 p-3 rounded-lg border-2 transition-all",
          incomingItems.some(i => i.priority === "critical") && "border-status-critical/70 bg-status-critical/10",
          incomingItems.some(i => i.priority === "urgent") && !incomingItems.some(i => i.priority === "critical") && "border-priority-urgent/70 bg-priority-urgent/10",
          !incomingItems.some(i => ["critical", "urgent"].includes(i.priority)) && "border-status-waiting/70 bg-status-waiting/10"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-full",
                incomingItems.some(i => i.priority === "critical") ? "bg-status-critical" :
                incomingItems.some(i => i.priority === "urgent") ? "bg-priority-urgent" : "bg-status-waiting"
              )}>
                <Bell className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className={cn(
                "text-sm font-bold uppercase tracking-wide",
                incomingItems.some(i => i.priority === "critical") ? "text-status-critical" :
                incomingItems.some(i => i.priority === "urgent") ? "text-priority-urgent" : "text-status-waiting"
              )}>
                📦 {incomingItems.length} INCOMING
              </span>
            </div>
          </div>
          <div className="space-y-2 pl-8">
            {incomingItems.slice(0, 3).map((item) => (
              <div key={item.itemId} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-background font-mono">
                    <Package className="w-2.5 h-2.5 mr-1" />
                    {item.workOrder}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    from {item.fromStationName}
                  </span>
                </div>
                {item.priority && item.priority !== "normal" && item.priority !== "low" && (
                  <Badge className={cn(
                    "text-[9px]",
                    item.priority === "critical" && "bg-status-critical",
                    item.priority === "urgent" && "bg-priority-urgent",
                    item.priority === "high" && "bg-warning"
                  )}>
                    {item.priority.toUpperCase()}
                  </Badge>
                )}
              </div>
            ))}
            {incomingItems.length > 3 && (
              <span className="text-[10px] text-muted-foreground font-medium">
                +{incomingItems.length - 3} more in queue
              </span>
            )}
          </div>
        </div>
      )}

      {/* Queued Items Display (items waiting to be started at this station) */}
      {!activeQueueItem && queuedItems.length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg border border-role-org-owner/50 bg-role-org-owner/10">
          <div className="flex items-center gap-2 mb-1.5">
            <ListTodo className="w-4 h-4 text-role-org-owner" />
            <span className="text-xs font-semibold text-role-org-owner">
              {queueCount} {queueCount === 1 ? "Order" : "Orders"} in Queue
            </span>
          </div>
          <div className="space-y-1.5">
            {queuedItems.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px] bg-background">
                  <Package className="w-2.5 h-2.5 mr-1" />
                  {item.workOrder || item.title}
                </Badge>
                {item.priority && item.priority !== "normal" && item.priority !== "low" && (
                  <Badge variant="outline" className={cn(
                    "text-[9px]",
                    item.priority === "critical" && "bg-status-critical/20 text-status-critical border-status-critical/50",
                    item.priority === "urgent" && "bg-priority-urgent/20 text-priority-urgent border-priority-urgent/50",
                    item.priority === "high" && "bg-warning/20 text-warning border-warning/50"
                  )}>
                    {item.priority}
                  </Badge>
                )}
              </div>
            ))}
            {queueCount > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{queueCount - 2} more in queue
              </span>
            )}
          </div>
        </div>
      )}

      {/* Active Work Status Display */}
      {activeQueueItem && (
        <div className={cn(
          "mb-3 p-2 rounded-lg border",
          activeQueueItem.status === "in_progress" && "bg-status-ok/10 border-status-ok/30",
          activeQueueItem.status === "on_hold" && "bg-warning/10 border-warning/30"
        )}>
          <div className="flex items-center justify-between mb-1.5">
            {(() => {
              const statusDisplay = getStatusDisplay(activeQueueItem.status);
              const StatusIcon = statusDisplay.icon;
              return (
                <Badge variant="outline" className={cn("text-[10px]", statusDisplay.color)}>
                  <StatusIcon className="w-2.5 h-2.5 mr-1" />
                  {statusDisplay.label}
                </Badge>
              );
            })()}
            
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
                  timeInfo.isOverdue ? "text-status-critical" : "text-muted-foreground"
                )}>
                  {timeInfo.isOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                  {timeInfo.remaining}
                </span>
              </div>
              <Progress
                value={timeInfo.progress}
                className={cn(
                  "h-1",
                  timeInfo.isOverdue && "[&>div]:bg-status-critical"
                )}
              />
            </div>
          )}
        </div>
      )}

      {/* Machine Down Status */}
      {hasActiveAlarm && !activeQueueItem && (
        <div className="mb-3 p-2 rounded-lg bg-status-critical/10 border border-status-critical/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-critical" />
            <div>
              <span className="text-xs font-medium text-status-critical">Machine Down</span>
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
          <Progress
            value={progress}
            className={cn(
              "h-1.5",
              stateAttr === "running" && "[&>div]:bg-state-running",
              stateAttr === "setup" && "[&>div]:bg-state-setup",
              stateAttr === "waiting" && "[&>div]:bg-state-waiting",
              stateAttr === "down" && "[&>div]:bg-state-down"
            )}
          />
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
          Queue {queueCount > 0 && `(${queueCount})`}
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
            <DropdownMenuItem onClick={() => setShowMachineContext(true)}>
              <Cpu className="w-4 h-4 mr-2" />
              Machine Context
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Completed Work - Needs Delivery Section */}
      {completedNeedingDelivery.length > 0 && (
        <div className={cn(
          "mb-3 p-2.5 rounded-lg border-2 transition-all",
          completedNeedingDelivery.some(i => i.priority === "critical") && "border-status-critical bg-status-critical/10 animate-pulse",
          completedNeedingDelivery.some(i => i.priority === "urgent") && !completedNeedingDelivery.some(i => i.priority === "critical") && "border-priority-urgent bg-priority-urgent/10",
          !completedNeedingDelivery.some(i => ["critical", "urgent"].includes(i.priority)) && "border-warning bg-warning/10"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "p-1.5 rounded-full",
              completedNeedingDelivery.some(i => i.priority === "critical") ? "bg-status-critical" :
              completedNeedingDelivery.some(i => i.priority === "urgent") ? "bg-priority-urgent" : "bg-warning"
            )}>
              <Truck className={cn(
                "w-4 h-4 text-primary-foreground",
                completedNeedingDelivery.some(i => ["critical", "urgent"].includes(i.priority)) && "animate-bounce"
              )} />
            </div>
            <div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wide",
                completedNeedingDelivery.some(i => i.priority === "critical") ? "text-status-critical" :
                completedNeedingDelivery.some(i => i.priority === "urgent") ? "text-priority-urgent" : "text-warning"
              )}>
                ⚠️ {completedNeedingDelivery.length} NEEDS DELIVERY
              </span>
            </div>
          </div>
          <div className="space-y-1.5 pl-8">
            {completedNeedingDelivery.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-background font-mono">
                    <Package className="w-2.5 h-2.5 mr-1" />
                    {item.workOrder}
                  </Badge>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {item.nextStationName}
                  </span>
                </div>
                {item.priority && item.priority !== "normal" && item.priority !== "low" && (
                  <Badge className={cn(
                    "text-[9px]",
                    item.priority === "critical" && "bg-status-critical",
                    item.priority === "urgent" && "bg-priority-urgent",
                    item.priority === "high" && "bg-warning"
                  )}>
                    {item.priority.toUpperCase()}
                  </Badge>
                )}
              </div>
            ))}
            {completedNeedingDelivery.length > 3 && (
              <span className="text-[10px] text-muted-foreground font-medium">
                +{completedNeedingDelivery.length - 3} more awaiting pickup
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        {pendingDelivery && (
          <div className="flex items-center gap-1 text-warning">
            <Truck className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Delivery Needed</span>
          </div>
        )}
        {hasActiveAlarm && !pendingDelivery && (
          <div className="flex items-center gap-1 text-status-critical">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">ISSUE</span>
          </div>
        )}
        {hasIssues && !hasActiveAlarm && !pendingDelivery && (
          <div className="flex items-center gap-1 text-status-warning">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs">Attention</span>
          </div>
        )}
        {!hasIssues && !hasActiveAlarm && !pendingDelivery && (
          <div className="ml-auto flex items-center gap-1 text-status-ok">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs">All OK</span>
          </div>
        )}
      </div>

      {/* Machine Context Dialog */}
      {stationDbId && showMachineContext && (
        <StationMachineContextDialog
          stationId={stationDbId}
          stationName={station.name || station.stationId}
          open={showMachineContext}
          onOpenChange={setShowMachineContext}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { QueueItem, QueueStatus, QueuePriority } from "@/hooks/useQueue";
import { format } from "date-fns";
import {
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Package,
  Truck,
  MapPin,
  Zap,
  Timer,
  Play,
  Pause,
  Clock,
  AlertCircle,
  GitBranch,
  Wrench,
  Eye,
  Plug,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react";

interface RoutingStepInfo {
  step_number: number;
  operation_name: string;
  status: string;
  station_name: string | null;
  completed_by_name: string | null;
  completed_at: string | null;
  estimated_duration: number | null;
}

interface WOAlertData {
  routingSteps: RoutingStepInfo[];
  currentStep: RoutingStepInfo | null;
  totalSteps: number;
  completedSteps: number;
  nextStationName: string | null;
  prevStationName: string | null;
  needsDelivery: boolean;
  isOverdue: boolean;
  elapsedDisplay: string | null;
  remainingDisplay: string | null;
  durationProgress: number | null;
  // Smart alerts
  staleDays: number | null; // days sitting without status change
  overEstimatedPct: number | null; // how much over estimated duration (e.g. 150 = 50% over)
  isHighPriorityWaiting: boolean; // critical/urgent stuck in queued
  hasNoOperator: boolean; // in_progress but no assigned_to
  queuedAtStationCount: number | null; // how many WOs queued at same station (bottleneck)
}

interface WorkOrderAlertTileProps {
  item: QueueItem;
  stationName?: string | null;
  stationCode?: string | null;
  workCenterType?: string | null;
  onItemClick: (itemId: string) => void;
}

function getPriorityConfig(priority: QueuePriority) {
  switch (priority) {
    case "critical": return { bg: "bg-red-500", text: "text-red-600", border: "border-red-500/50" };
    case "urgent": return { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-500/50" };
    case "high": return { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-500/50" };
    case "normal": return { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500/50" };
    case "low": return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
  }
}

function getStatusConfig(status: QueueStatus) {
  switch (status) {
    case "in_progress": return { label: "In Progress", icon: Play, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/30" };
    case "on_hold": return { label: "On Hold", icon: Pause, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    case "pending": return { label: "Pending", icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" };
    case "queued": return { label: "Queued", icon: Circle, color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/30" };
    case "completed": return { label: "Completed", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/30" };
    case "cancelled": return { label: "Cancelled", icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/30" };
  }
}

export function WorkOrderAlertTile({ item, stationName, stationCode, workCenterType, onItemClick }: WorkOrderAlertTileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState<WOAlertData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchAlertData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch routing steps with station names
      const { data: steps } = await supabase
        .from("work_order_routing")
        .select(`
          step_number, operation_name, status,
          completed_by, completed_at, estimated_duration,
          station_id,
          stations:station_id ( name )
        `)
        .eq("queue_item_id", item.id)
        .order("step_number", { ascending: true });

      const routingSteps: RoutingStepInfo[] = (steps || []).map((s: any) => ({
        step_number: s.step_number,
        operation_name: s.operation_name,
        status: s.status,
        station_name: s.stations?.name || null,
        completed_by_name: s.completed_by || null,
        completed_at: s.completed_at,
        estimated_duration: s.estimated_duration,
      }));

      const totalSteps = routingSteps.length;
      const completedSteps = routingSteps.filter(s => s.status === "completed").length;
      const currentStep = routingSteps.find(s => s.status !== "completed") || routingSteps[routingSteps.length - 1] || null;
      const currentIdx = currentStep ? routingSteps.indexOf(currentStep) : -1;
      const nextStep = currentIdx >= 0 && currentIdx < routingSteps.length - 1 ? routingSteps[currentIdx + 1] : null;
      const prevStep = currentIdx > 0 ? routingSteps[currentIdx - 1] : null;

      // Check if completed at current station but next step pending (needs delivery)
      const needsDelivery = currentStep?.status === "completed" && nextStep?.status === "pending";

      // Overdue check
      const isOverdue = !!(item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed" && item.status !== "cancelled");

      // Elapsed time
      let elapsedDisplay: string | null = null;
      let remainingDisplay: string | null = null;
      let durationProgress: number | null = null;
      let overEstimatedPct: number | null = null;

      if (item.started_at && (item.status === "in_progress" || item.status === "on_hold")) {
        const startTime = new Date(item.started_at).getTime();
        const elapsedMs = currentTime - startTime;
        const elapsedMins = Math.floor(elapsedMs / 60000);
        const elapsedHours = Math.floor(elapsedMins / 60);
        elapsedDisplay = elapsedHours > 0 ? `${elapsedHours}h ${elapsedMins % 60}m` : `${elapsedMins}m`;

        if (item.estimated_duration) {
          const estimatedMs = item.estimated_duration * 60000;
          const remainingMs = estimatedMs - elapsedMs;
          const isOver = remainingMs <= 0;
          const remMins = Math.floor(Math.abs(remainingMs) / 60000);
          const remHours = Math.floor(remMins / 60);
          remainingDisplay = isOver
            ? `+${remHours > 0 ? `${remHours}h ${remMins % 60}m` : `${remMins}m`} over`
            : `${remHours > 0 ? `${remHours}h ${remMins % 60}m` : `${remMins}m`} left`;
          durationProgress = Math.min((elapsedMs / estimatedMs) * 100, 100);
          if (isOver) {
            overEstimatedPct = Math.round((elapsedMs / estimatedMs) * 100);
          }
        }
      }

      // Stale detection: days since last status change (use updated_at)
      let staleDays: number | null = null;
      if (item.status !== "completed" && item.status !== "cancelled") {
        const refDate = item.updated_at || item.created_at;
        if (refDate) {
          const daysSince = Math.floor((Date.now() - new Date(refDate).getTime()) / 86400000);
          if (daysSince >= 2) staleDays = daysSince;
        }
      }

      // High priority waiting in queue
      const isHighPriorityWaiting = (item.priority === "critical" || item.priority === "urgent") && item.status === "queued";

      // No operator assigned but in progress
      const hasNoOperator = item.status === "in_progress" && !item.assigned_to;

      // Bottleneck: count other WOs queued at same station
      let queuedAtStationCount: number | null = null;
      if (item.station_id && (item.status === "queued" || item.status === "in_progress")) {
        const { count } = await supabase
          .from("queue_items")
          .select("id", { count: "exact", head: true })
          .eq("station_id", item.station_id)
          .in("status", ["queued", "in_progress"])
          .neq("id", item.id);
        if (count && count >= 2) queuedAtStationCount = count;
      }

      setAlertData({
        routingSteps,
        currentStep,
        totalSteps,
        completedSteps,
        nextStationName: nextStep?.station_name || null,
        prevStationName: prevStep?.station_name || null,
        needsDelivery,
        isOverdue,
        elapsedDisplay,
        remainingDisplay,
        durationProgress,
        staleDays,
        overEstimatedPct,
        isHighPriorityWaiting,
        hasNoOperator,
        queuedAtStationCount,
      });
    } catch (e) {
      console.error("WorkOrderAlertTile fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [item.id, item.started_at, item.estimated_duration, item.due_date, item.status, item.updated_at, item.created_at, item.priority, item.assigned_to, item.station_id, currentTime]);

  useEffect(() => {
    if (isOpen && !alertData) {
      fetchAlertData();
    }
  }, [isOpen, alertData, fetchAlertData]);

  const statusCfg = getStatusConfig(item.status);
  const priorityCfg = getPriorityConfig(item.priority);
  const StatusIcon = statusCfg.icon;
  const isOverdue = !!(item.due_date && new Date(item.due_date) < new Date() && item.status !== "completed" && item.status !== "cancelled");

  // Alert counts for pill
  const alertCount = alertData
    ? (alertData.needsDelivery ? 1 : 0) + (alertData.isOverdue ? 1 : 0) + (item.status === "on_hold" ? 1 : 0)
    : (isOverdue ? 1 : 0) + (item.status === "on_hold" ? 1 : 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "border-b border-border/30 transition-colors",
        isOpen && "bg-secondary/20",
        isOverdue && "bg-red-500/5",
        item.status === "on_hold" && !isOverdue && "bg-amber-500/5",
      )}>
        {/* Compact Row */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left group">
              {/* Priority dot */}
              <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", priorityCfg.bg)} />

              {/* Title + Part */}
              <div className="flex flex-col min-w-0 w-32 sm:w-40 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{item.title}</span>
                  {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                  {item.erp_source && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 flex-shrink-0">
                      <Plug className="w-2.5 h-2.5" />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {item.work_order && (
                    <span className="text-[10px] font-mono text-primary truncate">{item.work_order}</span>
                  )}
                  {item.part_number && (
                    <>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground truncate">{item.part_number}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0 flex-shrink-0", statusCfg.border, statusCfg.color)}
              >
                <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                {statusCfg.label}
              </Badge>

              {/* Alert pill */}
              {!isOpen && alertCount > 0 && (
                <Badge className={cn(
                  "text-[9px] px-1.5 py-0 flex-shrink-0",
                  isOverdue || item.priority === "critical" ? "bg-red-500" : "bg-amber-500",
                )}>
                  {alertCount}
                </Badge>
              )}

              {/* Desktop-only fields */}
              <span className="text-xs text-muted-foreground w-20 truncate flex-shrink-0 hidden md:block">
                {stationCode || stationName || "Unassigned"}
              </span>
              <span className="text-xs text-muted-foreground w-16 flex-shrink-0 truncate hidden md:block">
                {item.priority}
              </span>
              {item.due_date && (
                <span className={cn(
                  "text-[10px] w-20 flex-shrink-0 hidden md:flex items-center gap-1",
                  isOverdue ? "text-red-600 font-medium" : "text-muted-foreground",
                )}>
                  <Clock className="w-2.5 h-2.5" />
                  {format(new Date(item.due_date), "MMM d")}
                </span>
              )}

              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200",
                isOpen && "rotate-180",
              )} />
            </button>
          </CollapsibleTrigger>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex-shrink-0 hidden sm:flex"
            onClick={() => onItemClick(item.id)}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="px-3 sm:px-4 pb-3 space-y-2">
            {loading && (
              <div className="text-xs text-muted-foreground py-2 text-center">Loading details…</div>
            )}

            {alertData && (
              <>
                {/* Mobile-only: extra fields */}
                <div className="grid grid-cols-2 gap-2 md:hidden">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Station: </span>
                    <span className="font-medium">{stationName || "Unassigned"}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Priority: </span>
                    <Badge className={cn("text-[10px]", priorityCfg.bg, "text-white")}>{item.priority}</Badge>
                  </div>
                  {item.due_date && (
                    <div className={cn("text-xs col-span-2", isOverdue && "text-red-600 font-medium")}>
                      <span className="text-muted-foreground">Due: </span>
                      {format(new Date(item.due_date), "MMM d, yyyy")}
                      {isOverdue && " — OVERDUE"}
                    </div>
                  )}
                  {item.quantity && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Qty: </span>
                      <span className="font-mono">{item.parts_completed || 0}/{item.quantity}</span>
                    </div>
                  )}
                </div>

                {/* Overdue Alert */}
                {alertData.isOverdue && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <span className="text-xs font-medium text-red-600">Overdue</span>
                        {item.due_date && (
                          <p className="text-[10px] text-red-500">
                            Due {format(new Date(item.due_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* On Hold Alert */}
                {item.status === "on_hold" && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2">
                      <Pause className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700">Work Order On Hold</span>
                    </div>
                  </div>
                )}

                {/* Active Duration Tracking */}
                {alertData.elapsedDisplay && (
                  <div className={cn(
                    "p-2.5 rounded-lg border",
                    item.status === "in_progress" ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30",
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className={cn("text-[10px]", statusCfg.border, statusCfg.color)}>
                        <StatusIcon className="w-2.5 h-2.5 mr-1" />
                        {statusCfg.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Timer className="w-2.5 h-2.5" />
                        {alertData.elapsedDisplay}
                      </span>
                    </div>
                    {alertData.remainingDisplay && (
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={cn(
                            "text-[10px] flex items-center gap-1",
                            alertData.remainingDisplay.startsWith("+") ? "text-red-500 font-medium" : "text-muted-foreground",
                          )}>
                            {alertData.remainingDisplay.startsWith("+") && <AlertCircle className="w-2.5 h-2.5" />}
                            {alertData.remainingDisplay}
                          </span>
                        </div>
                        {alertData.durationProgress !== null && (
                          <Progress
                            value={alertData.durationProgress}
                            className={cn("h-1", alertData.remainingDisplay.startsWith("+") && "[&>div]:bg-red-500")}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Needs Delivery */}
                {alertData.needsDelivery && alertData.nextStationName && (
                  <div className={cn(
                    "p-2.5 rounded-lg border-2",
                    item.priority === "critical" ? "border-red-500 bg-red-500/10" :
                    item.priority === "urgent" ? "border-orange-500 bg-orange-500/10" :
                    "border-amber-500 bg-amber-500/10",
                  )}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Truck className={cn(
                        "w-4 h-4",
                        ["critical", "urgent"].includes(item.priority) ? "text-red-500 animate-bounce" : "text-amber-600",
                      )} />
                      <span className="text-xs font-bold uppercase tracking-wide">⚠️ Needs Delivery</span>
                      {item.priority !== "normal" && item.priority !== "low" && (
                        <Badge className={cn("text-[9px] ml-auto",
                          item.priority === "critical" && "bg-red-600",
                          item.priority === "urgent" && "bg-orange-600",
                          item.priority === "high" && "bg-amber-600",
                        )}>
                          <Zap className="w-2 h-2 mr-0.5" />{item.priority.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <Badge variant="outline" className="text-[10px] bg-background font-mono">
                        <Package className="w-2.5 h-2.5 mr-1" />
                        {item.work_order || item.title}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5" />
                        {alertData.nextStationName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Routing Timeline (mini) */}
                {alertData.totalSteps > 0 && (
                  <div className="p-2.5 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">
                        Routing — Step {alertData.completedSteps + (alertData.currentStep?.status !== "completed" ? 1 : 0)}/{alertData.totalSteps}
                      </span>
                      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(alertData.completedSteps / alertData.totalSteps) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1 pl-1">
                      {alertData.routingSteps.map((step) => (
                        <div key={step.step_number} className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            step.status === "completed" ? "bg-green-500" :
                            step.status === "in_progress" ? "bg-blue-500 animate-pulse" :
                            "bg-muted-foreground/30",
                          )} />
                          <span className={cn(
                            "text-[10px] flex-1 truncate",
                            step.status === "completed" ? "text-muted-foreground line-through" :
                            step.status === "in_progress" ? "text-foreground font-medium" :
                            "text-muted-foreground",
                          )}>
                            {step.step_number}. {step.operation_name}
                          </span>
                          {step.station_name && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                              <Wrench className="w-2.5 h-2.5 inline mr-0.5" />
                              {step.station_name}
                            </span>
                          )}
                          {step.completed_by_name && (
                            <span className="text-[10px] text-green-600 truncate max-w-[60px]">
                              ✓ {step.completed_by_name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No routing */}
                {alertData.totalSteps === 0 && item.status !== "completed" && item.status !== "cancelled" && (
                  <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">No routing defined</span>
                    </div>
                  </div>
                )}

                {/* Pending / Idle WO */}
                {item.status === "pending" && (
                  <div className="p-2.5 rounded-lg border border-border bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Pending — Not yet queued or assigned
                      </span>
                    </div>
                  </div>
                )}

                {/* Quantity progress */}
                {item.quantity && item.quantity > 0 && item.status !== "cancelled" && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">Qty:</span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(((item.parts_completed || 0) / item.quantity) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono">{item.parts_completed || 0}/{item.quantity}</span>
                  </div>
                )}

                {/* View Detail CTA — mobile */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs sm:hidden"
                  onClick={() => onItemClick(item.id)}
                >
                  View Work Order Detail
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

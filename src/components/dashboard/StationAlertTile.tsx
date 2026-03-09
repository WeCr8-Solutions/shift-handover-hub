import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { StationQuickActions, type QuickActionTarget } from "./StationQuickActions";
import {
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Package,
  Truck,
  Bell,
  ListTodo,
  MapPin,
  Zap,
  Timer,
  Play,
  Pause,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  STATUS_CONFIG,
  getStatusFromJobState,
  getStatusBgClass,
  type StatusLabel,
} from "./stationStatus";

interface StationAlertData {
  activeItem: {
    id: string;
    title: string;
    work_order: string | null;
    part_number: string | null;
    status: string;
    started_at: string | null;
    estimated_duration: number | null;
    priority: string;
  } | null;
  queueCount: number;
  pendingDeliveries: {
    id: string;
    workOrder: string;
    nextStationName: string | null;
    priority: string;
  }[];
  incomingItems: {
    itemId: string;
    workOrder: string;
    fromStationName: string | null;
    priority: string;
  }[];
}

interface StationAlertTileProps {
  station: {
    id: string;
    dbId: string;
    name: string;
    teamName: string | null;
    workCenter: string;
    workCenterType: string;
    operator: string;
    workOrder: string;
    partNumber: string;
    progress: number;
    status: StatusLabel;
  };
  onViewStation?: (stationId: string, stationName: string) => void;
  onQuickAction?: (action: string, target: QuickActionTarget) => void;
}

export function StationAlertTile({ station, onViewStation, onQuickAction }: StationAlertTileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState<StationAlertData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every minute for elapsed time display
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchAlertData = useCallback(async () => {
    if (!station.dbId) return;
    setLoading(true);

    try {
      // Parallel fetches
      const [activeRes, queueRes, routingRes, incomingRes] = await Promise.all([
        // Active item
        supabase
          .from("queue_items")
          .select("id, title, work_order, part_number, status, started_at, estimated_duration, priority")
          .eq("station_id", station.dbId)
          .in("status", ["in_progress", "on_hold"])
          .order("status", { ascending: true })
          .limit(1)
          .maybeSingle(),
        // Queue count
        supabase
          .from("queue_items")
          .select("id", { count: "exact", head: true })
          .eq("station_id", station.dbId)
          .in("status", ["pending", "queued"]),
        // Completed steps at this station (for pending deliveries)
        supabase
          .from("work_order_routing")
          .select(`
            id, step_number, queue_item_id,
            queue_items!inner ( id, work_order, title, priority )
          `)
          .eq("station_id", station.dbId)
          .eq("status", "completed")
          .limit(10),
        // Incoming items (pending steps at this station)
        supabase
          .from("work_order_routing")
          .select(`
            id, step_number, queue_item_id,
            queue_items!inner ( id, work_order, title, priority, station_id )
          `)
          .eq("station_id", station.dbId)
          .eq("status", "pending")
          .limit(10),
      ]);

      // Resolve pending deliveries (completed here → next step pending elsewhere)
      const deliveries: StationAlertData["pendingDeliveries"] = [];
      if (routingRes.data) {
        for (const step of routingRes.data) {
          const { data: nextStep } = await supabase
            .from("work_order_routing")
            .select(`
              id, station_id,
              stations:station_id ( name )
            `)
            .eq("queue_item_id", step.queue_item_id)
            .eq("step_number", step.step_number + 1)
            .eq("status", "pending")
            .maybeSingle();

          if (nextStep) {
            const qi = step.queue_items as any;
            const ns = nextStep.stations as any;
            deliveries.push({
              id: step.queue_item_id,
              workOrder: qi?.work_order || qi?.title || "Unknown",
              nextStationName: ns?.name || null,
              priority: qi?.priority || "normal",
            });
          }
        }
      }

      // Resolve incoming items (prev step completed → this step pending)
      const incoming: StationAlertData["incomingItems"] = [];
      if (incomingRes.data) {
        for (const step of incomingRes.data) {
          if (step.step_number <= 1) continue;
          const qi = step.queue_items as any;
          if (qi?.station_id === station.dbId) continue;

          const { data: prevStep } = await supabase
            .from("work_order_routing")
            .select(`id, station_id, stations:station_id ( name )`)
            .eq("queue_item_id", step.queue_item_id)
            .eq("step_number", step.step_number - 1)
            .eq("status", "completed")
            .maybeSingle();

          if (prevStep) {
            const ps = prevStep.stations as any;
            incoming.push({
              itemId: step.queue_item_id,
              workOrder: qi?.work_order || qi?.title || "Unknown",
              fromStationName: ps?.name || "Previous Station",
              priority: qi?.priority || "normal",
            });
          }
        }
      }

      setAlertData({
        activeItem: activeRes.data as StationAlertData["activeItem"],
        queueCount: queueRes.count || 0,
        pendingDeliveries: deliveries,
        incomingItems: incoming,
      });
    } catch (e) {
      console.error("StationAlertTile fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [station.dbId]);

  // Fetch when expanded
  useEffect(() => {
    if (isOpen && !alertData) {
      fetchAlertData();
    }
  }, [isOpen, alertData, fetchAlertData]);

  const statusCfg = STATUS_CONFIG[station.status];
  const totalAlerts = alertData
    ? (alertData.pendingDeliveries.length + alertData.incomingItems.length + (alertData.queueCount > 0 ? 1 : 0))
    : 0;

  // Has any high-priority alerts?
  const hasCritical = alertData?.pendingDeliveries.some(d => d.priority === "critical" || d.priority === "urgent") ||
    alertData?.incomingItems.some(d => d.priority === "critical" || d.priority === "urgent");

  const getTimeInfo = () => {
    if (!alertData?.activeItem?.started_at) return null;
    const startTime = new Date(alertData.activeItem.started_at).getTime();
    const elapsedMs = currentTime - startTime;
    const elapsedMins = Math.floor(elapsedMs / 60000);
    const elapsedHours = Math.floor(elapsedMins / 60);
    const elapsedDisplay = elapsedHours > 0 ? `${elapsedHours}h ${elapsedMins % 60}m` : `${elapsedMins}m`;

    if (!alertData.activeItem.estimated_duration) {
      return { elapsed: elapsedDisplay, remaining: null, progress: null, isOverdue: false };
    }

    const estimatedMs = alertData.activeItem.estimated_duration * 60000;
    const remainingMs = estimatedMs - elapsedMs;
    const remainingMins = Math.floor(Math.abs(remainingMs) / 60000);
    const isOverdue = remainingMs <= 0;
    const remainingHours = Math.floor(remainingMins / 60);
    const remainingDisplay = isOverdue
      ? `+${remainingHours > 0 ? `${remainingHours}h ${remainingMins % 60}m` : `${remainingMins}m`} over`
      : `${remainingHours > 0 ? `${remainingHours}h ${remainingMins % 60}m` : `${remainingMins}m`} left`;

    return { elapsed: elapsedDisplay, remaining: remainingDisplay, progress: Math.min((elapsedMs / estimatedMs) * 100, 100), isOverdue };
  };

  const quickTarget: QuickActionTarget = {
    id: station.dbId,
    name: station.name,
    type: "station",
    status: station.status,
    workOrder: station.workOrder !== "—" ? station.workOrder : undefined,
    activeItemId: alertData?.activeItem?.id,
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <StationQuickActions
        target={quickTarget}
        onViewDetail={() => onViewStation?.(station.dbId, station.name)}
        onCreateHandoff={(t) => onQuickAction?.("handoff", t)}
        onToggleHold={(t) => onQuickAction?.("hold", t)}
        onRequestDelivery={(t) => onQuickAction?.("delivery", t)}
        onReportIssue={(t) => onQuickAction?.("issue", t)}
      >
      <div className={cn(
        "border-b border-border/30 transition-colors",
        isOpen && "bg-secondary/20",
        station.status === "down" && "bg-[hsl(var(--state-down)/0.05)]",
        hasCritical && "bg-[hsl(var(--warning)/0.05)]",
      )}>
        {/* Compact Row — always visible */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left group">
              <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", statusCfg.bgClass,
                station.status === "running" && "animate-pulse"
              )} />
              <div className="flex flex-col min-w-0 w-24 sm:w-28 flex-shrink-0">
                <span className="text-xs font-mono font-medium truncate">{station.name}</span>
                <div className="flex items-center gap-1">
                  {station.teamName && (
                    <span className="text-[10px] text-muted-foreground truncate">{station.teamName}</span>
                  )}
                  {station.teamName && station.workCenter && (
                    <span className="text-[10px] text-muted-foreground">·</span>
                  )}
                  <span className="text-[10px] text-muted-foreground truncate">{station.workCenter}</span>
                </div>
              </div>

              {/* Status badge — mobile + desktop */}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 flex-shrink-0",
                  statusCfg.borderClass,
                  statusCfg.textClass,
                )}
              >
                {statusCfg.displayName}
              </Badge>

              {/* Alert count pill */}
              {!isOpen && alertData && totalAlerts > 0 && (
                <Badge className={cn(
                  "text-[9px] px-1.5 py-0 flex-shrink-0",
                  hasCritical ? "bg-[hsl(var(--priority-critical))]" : "bg-[hsl(var(--priority-high))]",
                )}>
                  {totalAlerts}
                </Badge>
              )}

              {/* Desktop-only fields */}
              <span className="text-xs text-muted-foreground w-20 truncate flex-shrink-0 hidden md:block">{station.operator}</span>
              <span className="text-xs font-mono text-primary w-20 flex-shrink-0 truncate hidden md:block">{station.workOrder}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden hidden md:block">
                <div
                  className={cn("h-full rounded-full transition-all", statusCfg.bgClass)}
                  style={{ width: `${station.progress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-10 text-right hidden md:block">
                {station.progress}%
              </span>

              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>

          {/* View Detail Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex-shrink-0 hidden sm:flex"
            onClick={() => onViewStation?.(station.dbId, station.name)}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="px-3 sm:px-4 pb-3 space-y-2">
            {loading && (
              <div className="text-xs text-muted-foreground py-2 text-center">Loading alerts…</div>
            )}

            {alertData && (
              <>
                {/* Mobile-only: operator + WO + progress */}
                <div className="grid grid-cols-2 gap-2 md:hidden">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Operator: </span>
                    <span className="font-medium">{station.operator}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">WO: </span>
                    <span className="font-mono text-primary">{station.workOrder}</span>
                  </div>
                  {station.partNumber && (
                    <div className="text-xs col-span-2">
                      <span className="text-muted-foreground">Part: </span>
                      <span className="font-mono">{station.partNumber}</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">Progress</span>
                      <span className="text-[10px] font-mono">{station.progress}%</span>
                    </div>
                    <Progress value={station.progress} className="h-1.5" />
                  </div>
                </div>

                {/* Active Work Item */}
                {alertData.activeItem && (() => {
                  const timeInfo = getTimeInfo();
                  const isOnHold = alertData.activeItem!.status === "on_hold";
                  return (
                    <div className={cn(
                      "p-2.5 rounded-lg border",
                      isOnHold ? "bg-[hsl(var(--warning)/0.1)] border-[hsl(var(--warning)/0.3)]" : "bg-[hsl(var(--success)/0.1)] border-[hsl(var(--success)/0.3)]",
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          isOnHold ? "border-[hsl(var(--warning)/0.5)] text-[hsl(var(--warning))]" : "border-[hsl(var(--success)/0.5)] text-[hsl(var(--success))]",
                        )}>
                          {isOnHold ? <Pause className="w-2.5 h-2.5 mr-1" /> : <Play className="w-2.5 h-2.5 mr-1" />}
                          {isOnHold ? "ON HOLD" : "IN PROGRESS"}
                        </Badge>
                        {timeInfo && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Timer className="w-2.5 h-2.5" />
                            {timeInfo.elapsed}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <Package className="w-3 h-3 text-primary" />
                        {alertData.activeItem!.work_order || alertData.activeItem!.title}
                        {alertData.activeItem!.part_number && (
                          <span className="text-muted-foreground ml-1">· {alertData.activeItem!.part_number}</span>
                        )}
                      </div>
                      {timeInfo?.remaining && (
                        <div className="mt-1.5">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={cn(
                              "text-[10px] flex items-center gap-1",
                              timeInfo.isOverdue ? "text-destructive font-medium" : "text-muted-foreground",
                            )}>
                              {timeInfo.isOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                              {timeInfo.remaining}
                            </span>
                          </div>
                          {timeInfo.progress !== null && (
                            <Progress
                              value={timeInfo.progress}
                              className={cn("h-1", timeInfo.isOverdue && "[&>div]:bg-destructive")}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Pending Deliveries */}
                {alertData.pendingDeliveries.length > 0 && (
                  <div className={cn(
                    "p-2.5 rounded-lg border-2",
                    alertData.pendingDeliveries.some(d => d.priority === "critical") ? "border-red-500 bg-red-500/10" :
                    alertData.pendingDeliveries.some(d => d.priority === "urgent") ? "border-orange-500 bg-orange-500/10" :
                    "border-amber-500 bg-amber-500/10",
                  )}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Truck className={cn(
                        "w-4 h-4",
                        alertData.pendingDeliveries.some(d => ["critical", "urgent"].includes(d.priority))
                          ? "text-red-500 animate-bounce" : "text-amber-600",
                      )} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        ⚠️ {alertData.pendingDeliveries.length} Needs Delivery
                      </span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {alertData.pendingDeliveries.slice(0, 3).map((d) => (
                        <div key={d.id} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-[10px] bg-background font-mono">
                            <Package className="w-2.5 h-2.5 mr-1" />
                            {d.workOrder}
                          </Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-2.5 h-2.5" />
                            {d.nextStationName || "Next"}
                          </span>
                          {d.priority !== "normal" && d.priority !== "low" && (
                            <Badge className={cn("text-[9px] ml-auto",
                              d.priority === "critical" && "bg-red-600",
                              d.priority === "urgent" && "bg-orange-600",
                              d.priority === "high" && "bg-amber-600",
                            )}>
                              <Zap className="w-2 h-2 mr-0.5" />{d.priority.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {alertData.pendingDeliveries.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{alertData.pendingDeliveries.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Incoming Items */}
                {alertData.incomingItems.length > 0 && (
                  <div className={cn(
                    "p-2.5 rounded-lg border-2",
                    alertData.incomingItems.some(d => d.priority === "critical") ? "border-red-400 bg-red-500/10" :
                    alertData.incomingItems.some(d => d.priority === "urgent") ? "border-orange-400 bg-orange-500/10" :
                    "border-blue-400 bg-blue-500/10",
                  )}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Bell className={cn(
                        "w-4 h-4",
                        alertData.incomingItems.some(d => ["critical", "urgent"].includes(d.priority))
                          ? "text-red-500" : "text-blue-500",
                      )} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        📦 {alertData.incomingItems.length} Incoming
                      </span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {alertData.incomingItems.slice(0, 3).map((item) => (
                        <div key={item.itemId} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-[10px] bg-background font-mono">
                            <Package className="w-2.5 h-2.5 mr-1" />
                            {item.workOrder}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">from {item.fromStationName}</span>
                          {item.priority !== "normal" && item.priority !== "low" && (
                            <Badge className={cn("text-[9px] ml-auto",
                              item.priority === "critical" && "bg-red-600",
                              item.priority === "urgent" && "bg-orange-600",
                              item.priority === "high" && "bg-amber-600",
                            )}>
                              {item.priority.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {alertData.incomingItems.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{alertData.incomingItems.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Queue Count */}
                {alertData.queueCount > 0 && !alertData.activeItem && (
                  <div className="p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10">
                    <div className="flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700">
                        {alertData.queueCount} {alertData.queueCount === 1 ? "Order" : "Orders"} Queued
                      </span>
                    </div>
                  </div>
                )}

                {/* Machine Down */}
                {station.status === "down" && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-medium text-red-600">Machine Down — Requires Attention</span>
                    </div>
                  </div>
                )}

                {/* Idle Station Alert */}
                {station.status === "idle" && (
                  <div className={cn(
                    "p-2.5 rounded-lg border",
                    alertData.queueCount > 0
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-muted/50 border-border",
                  )}>
                    <div className="flex items-center gap-2">
                      <Clock className={cn(
                        "w-4 h-4",
                        alertData.queueCount > 0 ? "text-amber-500" : "text-muted-foreground",
                      )} />
                      <div className="flex-1">
                        <span className={cn(
                          "text-xs font-medium",
                          alertData.queueCount > 0 ? "text-amber-700" : "text-muted-foreground",
                        )}>
                          Station Idle
                          {station.operator === "—" && " — No Operator"}
                        </span>
                        {alertData.queueCount > 0 && (
                          <p className="text-[10px] text-amber-600 mt-0.5">
                            {alertData.queueCount} {alertData.queueCount === 1 ? "order" : "orders"} waiting in queue
                          </p>
                        )}
                        {alertData.queueCount === 0 && station.operator === "—" && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            No operator checked in · No work orders assigned
                          </p>
                        )}
                        {alertData.queueCount === 0 && station.operator !== "—" && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Operator present · No active work orders
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Waiting Station Alert */}
                {station.status === "waiting" && !alertData.activeItem && (
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700">
                        Station Waiting
                      </span>
                    </div>
                  </div>
                )}

                {/* No alerts — only for running/setup with nothing extra */}
                {totalAlerts === 0 && !alertData.activeItem && station.status !== "down" && station.status !== "idle" && station.status !== "waiting" && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    No active alerts
                  </div>
                )}

                {/* View Detail CTA — mobile */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs sm:hidden"
                  onClick={() => onViewStation?.(station.dbId, station.name)}
                >
                  View Station Detail
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
      </StationQuickActions>
    </Collapsible>
  );
}

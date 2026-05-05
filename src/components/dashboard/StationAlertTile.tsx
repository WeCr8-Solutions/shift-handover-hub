import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { StationQuickActions, type QuickActionTarget } from "./StationQuickActions";
import { getPriorityBadgeColor, getPriorityContainerStyles } from "@/lib/status-colors";
import {
  ChevronDown, ArrowRight, AlertTriangle, Package, Truck, Bell,
  ListTodo, MapPin, Zap, Timer, Play, Pause, Clock, AlertCircle,
} from "lucide-react";
import { STATUS_CONFIG, type StatusLabel } from "./stationStatus";

// ── Types ──
interface StationAlertData {
  activeItem: {
    id: string; title: string; work_order: string | null; part_number: string | null;
    status: string; started_at: string | null; estimated_duration: number | null; priority: string;
  } | null;
  queueCount: number;
  pendingDeliveries: { id: string; workOrder: string; nextStationName: string | null; priority: string }[];
  incomingItems: { itemId: string; workOrder: string; fromStationName: string | null; priority: string }[];
}

interface StationAlertTileProps {
  station: {
    id: string; dbId: string; name: string; teamName: string | null;
    workCenter: string | undefined; workCenterType: string | undefined; operator: string;
    workOrder: string; partNumber: string; progress: number; status: StatusLabel;
  };
  onViewStation?: (stationId: string, stationName: string) => void;
  onQuickAction?: (action: string, target: QuickActionTarget) => void;
}

// ── Sub-components ──

function ActiveItemCard({ item, currentTime }: { item: NonNullable<StationAlertData["activeItem"]>; currentTime: number }) {
  const isOnHold = item.status === "on_hold";
  const timeInfo = useMemo(() => {
    if (!item.started_at) return null;
    const elapsedMs = currentTime - new Date(item.started_at).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    const h = Math.floor(elapsedMins / 60);
    const elapsed = h > 0 ? `${h}h ${elapsedMins % 60}m` : `${elapsedMins}m`;
    if (!item.estimated_duration) return { elapsed, remaining: null, progress: null, isOverdue: false };
    const estMs = item.estimated_duration * 60000;
    const remMs = estMs - elapsedMs;
    const remMins = Math.floor(Math.abs(remMs) / 60000);
    const isOverdue = remMs <= 0;
    const rh = Math.floor(remMins / 60);
    const remaining = isOverdue
      ? `+${rh > 0 ? `${rh}h ${remMins % 60}m` : `${remMins}m`} over`
      : `${rh > 0 ? `${rh}h ${remMins % 60}m` : `${remMins}m`} left`;
    return { elapsed, remaining, progress: Math.min((elapsedMs / estMs) * 100, 100), isOverdue };
  }, [item.started_at, item.estimated_duration, currentTime]);

  const containerStyle = isOnHold ? "bg-warning/10 border-warning/30" : "bg-status-ok/10 border-status-ok/30";
  const badgeStyle = isOnHold ? "border-warning/50 text-warning" : "border-status-ok/50 text-status-ok";

  return (
    <div className={cn("p-2.5 rounded-lg border", containerStyle)}>
      <div className="flex items-center justify-between mb-1">
        <Badge variant="outline" className={cn("text-[10px]", badgeStyle)}>
          {isOnHold ? <Pause className="w-2.5 h-2.5 mr-1" /> : <Play className="w-2.5 h-2.5 mr-1" />}
          {isOnHold ? "ON HOLD" : "IN PROGRESS"}
        </Badge>
        {timeInfo && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Timer className="w-2.5 h-2.5" /> {timeInfo.elapsed}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs font-medium">
        <Package className="w-3 h-3 text-primary" />
        {item.work_order || item.title}
        {item.part_number && <span className="text-muted-foreground ml-1">· {item.part_number}</span>}
      </div>
      {timeInfo?.remaining && (
        <div className="mt-1.5">
          <span className={cn("text-[10px] flex items-center gap-1",
            timeInfo.isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
            {timeInfo.isOverdue && <AlertCircle className="w-2.5 h-2.5" />}
            {timeInfo.remaining}
          </span>
          {timeInfo.progress !== null && (
            <Progress value={timeInfo.progress} className={cn("h-1 mt-0.5", timeInfo.isOverdue && "[&>div]:bg-destructive")} />
          )}
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "normal" || priority === "low") return null;
  return (
    <Badge className={cn("text-[9px] ml-auto", getPriorityBadgeColor(priority))}>
      {priority === "critical" && <Zap className="w-2 h-2 mr-0.5" />}
      {priority.toUpperCase()}
    </Badge>
  );
}

function DeliverySection({ deliveries }: { deliveries: StationAlertData["pendingDeliveries"] }) {
  if (deliveries.length === 0) return null;
  const priorities = deliveries.map(d => d.priority);
  const hasCritical = priorities.some(p => ["critical", "urgent"].includes(p));
  return (
    <div className={cn("p-2.5 rounded-lg border-2", getPriorityContainerStyles(priorities, "priority-high"))}>
      <div className="flex items-center gap-2 mb-1.5">
        <Truck className={cn("w-4 h-4", hasCritical ? "text-priority-critical animate-bounce" : "text-warning")} />
        <span className="text-xs font-bold uppercase tracking-wide">⚠️ {deliveries.length} Needs Delivery</span>
      </div>
      <div className="space-y-1 pl-6">
        {deliveries.slice(0, 3).map((d) => (
          <div key={d.id} className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px] bg-background font-mono">
              <Package className="w-2.5 h-2.5 mr-1" /> {d.workOrder}
            </Badge>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" /> {d.nextStationName || "Next"}
            </span>
            <PriorityBadge priority={d.priority} />
          </div>
        ))}
        {deliveries.length > 3 && <span className="text-[10px] text-muted-foreground">+{deliveries.length - 3} more</span>}
      </div>
    </div>
  );
}

function IncomingSection({ items }: { items: StationAlertData["incomingItems"] }) {
  if (items.length === 0) return null;
  const priorities = items.map(i => i.priority);
  const hasCritical = priorities.some(p => ["critical", "urgent"].includes(p));
  return (
    <div className={cn("p-2.5 rounded-lg border-2", getPriorityContainerStyles(priorities, "info"))}>
      <div className="flex items-center gap-2 mb-1.5">
        <Bell className={cn("w-4 h-4", hasCritical ? "text-priority-critical" : "text-info")} />
        <span className="text-xs font-bold uppercase tracking-wide">📦 {items.length} Incoming</span>
      </div>
      <div className="space-y-1 pl-6">
        {items.slice(0, 3).map((item) => (
          <div key={item.itemId} className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px] bg-background font-mono">
              <Package className="w-2.5 h-2.5 mr-1" /> {item.workOrder}
            </Badge>
            <span className="text-[10px] text-muted-foreground">from {item.fromStationName}</span>
            <PriorityBadge priority={item.priority} />
          </div>
        ))}
        {items.length > 3 && <span className="text-[10px] text-muted-foreground">+{items.length - 3} more</span>}
      </div>
    </div>
  );
}

function StatusAlert({ status, queueCount, operator }: { status: StatusLabel; queueCount: number; operator: string }) {
  if (status === "down") {
    return (
      <div className="p-2.5 rounded-lg bg-state-down/10 border border-state-down/30">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-state-down" />
          <span className="text-xs font-medium text-state-down">Machine Down — Requires Attention</span>
        </div>
      </div>
    );
  }
  if (status === "idle") {
    const hasQueue = queueCount > 0;
    const noOp = operator === "—";
    return (
      <div className={cn("p-2.5 rounded-lg border", hasQueue ? "bg-warning/10 border-warning/30" : "bg-muted/50 border-border")}>
        <div className="flex items-center gap-2">
          <Clock className={cn("w-4 h-4", hasQueue ? "text-warning" : "text-muted-foreground")} />
          <div className="flex-1">
            <span className={cn("text-xs font-medium", hasQueue ? "text-warning" : "text-muted-foreground")}>
              Station Idle{noOp && " — No Operator"}
            </span>
            {hasQueue && <p className="text-[10px] text-warning mt-0.5">{queueCount} {queueCount === 1 ? "order" : "orders"} waiting in queue</p>}
            {!hasQueue && noOp && <p className="text-[10px] text-muted-foreground mt-0.5">No operator checked in · No work orders assigned</p>}
            {!hasQueue && !noOp && <p className="text-[10px] text-muted-foreground mt-0.5">Operator present · No active work orders</p>}
          </div>
        </div>
      </div>
    );
  }
  if (status === "waiting") {
    return (
      <div className="p-2.5 rounded-lg bg-state-waiting/10 border border-state-waiting/30">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-state-waiting" />
          <span className="text-xs font-medium text-state-waiting">Station Waiting</span>
        </div>
      </div>
    );
  }
  return null;
}

// ── Main Component ──

export function StationAlertTile({ station, onViewStation, onQuickAction }: StationAlertTileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState<StationAlertData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchAlertData = useCallback(async () => {
    if (!station.dbId) return;
    setLoading(true);
    try {
      const [activeRes, queueRes, routingRes, incomingRes] = await Promise.all([
        supabase.from("queue_items")
          .select("id, title, work_order, part_number, status, started_at, estimated_duration, priority")
          .eq("station_id", station.dbId).in("status", ["in_progress", "on_hold"])
          .order("status", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("queue_items")
          .select("id", { count: "exact", head: true })
          .eq("station_id", station.dbId).in("status", ["pending", "queued"]),
        supabase.from("work_order_routing")
          .select("id, step_number, queue_item_id, queue_items!inner ( id, work_order, title, priority )")
          .eq("station_id", station.dbId).eq("status", "completed").limit(10),
        supabase.from("work_order_routing")
          .select("id, step_number, queue_item_id, queue_items!inner ( id, work_order, title, priority, station_id )")
          .eq("station_id", station.dbId).eq("status", "pending").limit(10),
      ]);

      const deliveries: StationAlertData["pendingDeliveries"] = [];
      if (routingRes.data) {
        for (const step of routingRes.data) {
          const { data: nextStep } = await supabase.from("work_order_routing")
            .select("id, station_id, stations:station_id ( name )")
            .eq("queue_item_id", step.queue_item_id).eq("step_number", step.step_number + 1)
            .eq("status", "pending").maybeSingle();
          if (nextStep) {
            const qi = step.queue_items as any;
            const ns = nextStep.stations as any;
            deliveries.push({ id: step.queue_item_id, workOrder: qi?.work_order || qi?.title || "Unknown", nextStationName: ns?.name || null, priority: qi?.priority || "normal" });
          }
        }
      }

      const incoming: StationAlertData["incomingItems"] = [];
      if (incomingRes.data) {
        for (const step of incomingRes.data) {
          if (step.step_number <= 1) continue;
          const qi = step.queue_items as any;
          if (qi?.station_id === station.dbId) continue;
          const { data: prevStep } = await supabase.from("work_order_routing")
            .select("id, station_id, stations:station_id ( name )")
            .eq("queue_item_id", step.queue_item_id).eq("step_number", step.step_number - 1)
            .eq("status", "completed").maybeSingle();
          if (prevStep) {
            const ps = prevStep.stations as any;
            incoming.push({ itemId: step.queue_item_id, workOrder: qi?.work_order || qi?.title || "Unknown", fromStationName: ps?.name || "Previous Station", priority: qi?.priority || "normal" });
          }
        }
      }

      setAlertData({ activeItem: activeRes.data as StationAlertData["activeItem"], queueCount: queueRes.count || 0, pendingDeliveries: deliveries, incomingItems: incoming });
    } catch (e) {
      console.error("StationAlertTile fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [station.dbId]);

  useEffect(() => {
    if (isOpen && !alertData) fetchAlertData();
  }, [isOpen, alertData, fetchAlertData]);

  const statusCfg = STATUS_CONFIG[station.status];
  const totalAlerts = alertData ? (alertData.pendingDeliveries.length + alertData.incomingItems.length + (alertData.queueCount > 0 ? 1 : 0)) : 0;
  const hasCritical = alertData?.pendingDeliveries.some(d => d.priority === "critical" || d.priority === "urgent") ||
    alertData?.incomingItems.some(d => d.priority === "critical" || d.priority === "urgent");

  const quickTarget: QuickActionTarget = {
    id: station.dbId, name: station.name, type: "station", status: station.status,
    workOrder: station.workOrder !== "—" ? station.workOrder : undefined,
    activeItemId: alertData?.activeItem?.id,
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <StationQuickActions target={quickTarget}
        onViewDetail={() => onViewStation?.(station.dbId, station.name)}
        onCreateHandoff={(t) => onQuickAction?.("handoff", t)}
        onToggleHold={(t) => onQuickAction?.("hold", t)}
        onRequestDelivery={(t) => onQuickAction?.("delivery", t)}
        onReportIssue={(t) => onQuickAction?.("issue", t)}>
        <div className={cn("border-b border-border/30 transition-colors",
          isOpen && "bg-secondary/20",
          station.status === "down" && "bg-state-down/5",
          hasCritical && "bg-warning/5")}>
          {/* Compact Row */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left group">
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", statusCfg.bgClass, station.status === "running" && "animate-pulse")} />
                <div className="flex flex-col min-w-0 w-24 sm:w-28 flex-shrink-0">
                  <span className="text-xs font-mono font-medium truncate">{station.name}</span>
                  <div className="flex items-center gap-1">
                    {station.teamName && <span className="text-[10px] text-muted-foreground truncate">{station.teamName}</span>}
                    {station.teamName && station.workCenter && <span className="text-[10px] text-muted-foreground">·</span>}
                    <span className="text-[10px] text-muted-foreground truncate">{station.workCenter}</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 flex-shrink-0", statusCfg.borderClass, statusCfg.textClass)}>
                  {statusCfg.displayName}
                </Badge>
                {!isOpen && alertData && totalAlerts > 0 && (
                  <Badge className={cn("text-[9px] px-1.5 py-0 flex-shrink-0", hasCritical ? "bg-priority-critical" : "bg-priority-high")}>
                    {totalAlerts}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground w-20 truncate flex-shrink-0 hidden md:block">{station.operator}</span>
                <span className="text-xs font-mono text-primary w-20 flex-shrink-0 truncate hidden md:block">{station.workOrder}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden hidden md:block">
                  <div className={cn("h-full rounded-full transition-all", statusCfg.bgClass)} style={{ width: `${station.progress}%` }} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-10 text-right hidden md:block">{station.progress}%</span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-shrink-0 hidden sm:flex"
              onClick={() => onViewStation?.(station.dbId, station.name)}>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-3 sm:px-4 pb-3 space-y-2">
              {loading && <div className="text-xs text-muted-foreground py-2 text-center">Loading alerts…</div>}
              {alertData && (
                <>
                  {/* Mobile-only fields */}
                  <div className="grid grid-cols-2 gap-2 md:hidden">
                    <div className="text-xs"><span className="text-muted-foreground">Operator: </span><span className="font-medium">{station.operator}</span></div>
                    <div className="text-xs"><span className="text-muted-foreground">WO: </span><span className="font-mono text-primary">{station.workOrder}</span></div>
                    {station.partNumber && <div className="text-xs col-span-2"><span className="text-muted-foreground">Part: </span><span className="font-mono">{station.partNumber}</span></div>}
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Progress</span>
                        <span className="text-[10px] font-mono">{station.progress}%</span>
                      </div>
                      <Progress value={station.progress} className="h-1.5" />
                    </div>
                  </div>

                  {alertData.activeItem && <ActiveItemCard item={alertData.activeItem} currentTime={currentTime} />}
                  <DeliverySection deliveries={alertData.pendingDeliveries} />
                  <IncomingSection items={alertData.incomingItems} />

                  {alertData.queueCount > 0 && !alertData.activeItem && (
                    <div className="p-2.5 rounded-lg border border-accent/30 bg-accent/10">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-accent" />
                        <span className="text-xs font-semibold text-accent-foreground">
                          {alertData.queueCount} {alertData.queueCount === 1 ? "Order" : "Orders"} Queued
                        </span>
                      </div>
                    </div>
                  )}

                  <StatusAlert status={station.status} queueCount={alertData.queueCount} operator={station.operator} />

                  {totalAlerts === 0 && !alertData.activeItem && !["down", "idle", "waiting"].includes(station.status) && (
                    <div className="text-xs text-muted-foreground text-center py-1">No active alerts</div>
                  )}

                  <Button variant="outline" size="sm" className="w-full h-8 text-xs sm:hidden"
                    onClick={() => onViewStation?.(station.dbId, station.name)}>
                    View Station Detail <ArrowRight className="w-3.5 h-3.5 ml-1" />
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

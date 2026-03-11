import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Play,
  Clock,
  Loader2,
  CheckCircle2,
  FileText,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CalendarDays,
  GitBranch,
  Layers,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAdminAccess } from "@/hooks/useAdminData";
import { OperatorStationKanban } from "@/components/operator/OperatorStationKanban";
import { useDimensions } from "@/hooks/useDimensions";
import { useDimensionRequests } from "@/hooks/useDimensionRequests";
import { DimensionCheckForm } from "@/components/dimensions/DimensionCheckForm";
import { RequestDimensionCheckButton } from "@/components/dimensions/RequestDimensionCheckButton";
import { format, isPast, formatDistanceToNow } from "date-fns";

interface WorkOrder {
  id: string;
  title: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  status: string;
  priority: string;
  position: number;
  quantity: number | null;
  started_at: string | null;
  due_date: string | null;
  description: string | null;
  qty_original: number | null;
  qty_completed: number | null;
  qty_scrap: number | null;
  qty_rework: number | null;
  qty_open: number | null;
  quantity_locked: boolean | null;
  estimated_duration: number | null;
  setup_time_minutes: number | null;
  first_article_minutes: number | null;
  cycle_time_minutes: number | null;
  material_type: string | null;
  part_weight_lbs: number | null;
  tags: string[] | null;
  is_rework: boolean | null;
  assigned_to: string | null;
}

interface RoutingStep {
  id: string;
  station_id: string | null;
  status: string;
  step_number: number;
  operation_name: string;
  operation_type: string;
  stations?: { name: string } | null;
}

interface RoutingInfo {
  isFinalStep: boolean;
  nextStationName: string | null;
  currentStepId: string | null;
  nextStep: RoutingStep | null;
  totalSteps: number;
  currentStepNumber: number;
  allSteps: RoutingStep[];
}

interface OperatorStationPanelProps {
  stationId: string;
  stationName: string;
  onCreateHandoff: () => void;
  onPerformanceUpdate: () => void;
  onViewWorkOrder?: (orderId: string) => void;
}

export function OperatorStationPanel({
  stationId,
  stationName,
  onCreateHandoff,
  onPerformanceUpdate,
  onViewWorkOrder,
}: OperatorStationPanelProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { hasOrgSupervisorAccess } = useAdminAccess();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deliverOrder, setDeliverOrder] = useState<WorkOrder | null>(null);
  const [routingInfo, setRoutingInfo] = useState<RoutingInfo | null>(null);
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const stepDimensions = useDimensions();
  const operatorDimRequests = useDimensionRequests();

  // Completion form state
  const [completionData, setCompletionData] = useState<{
    qtyCompleted: number;
    qtyScrap: number;
    qtyRework: number;
    qtyOriginal: number;
    loaded: boolean;
  }>({ qtyCompleted: 0, qtyScrap: 0, qtyRework: 0, qtyOriginal: 0, loaded: false });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const activeOrder = orders.find((o) => o.status === "in_progress") ?? null;
  const queuedOrders = orders.filter((o) => o.status === "pending" || o.status === "queued");

  // Elapsed timer
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    if (!activeOrder?.started_at) {
      setElapsed("");
      return;
    }
    const tick = () => {
      const diff = Date.now() - new Date(activeOrder.started_at!).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeOrder?.started_at]);

  // Fetch routing info for active order
  useEffect(() => {
    if (!activeOrder) {
      setRoutingInfo(null);
      return;
    }
    const fetchRouting = async () => {
      const { data: steps } = await supabase
        .from("work_order_routing")
        .select("*, stations(name)")
        .eq("queue_item_id", activeOrder.id)
        .order("step_number", { ascending: true });

      if (!steps || steps.length === 0) {
        setRoutingInfo(null);
        return;
      }

      const curIdx = steps.findIndex((s) => s.station_id === stationId && s.status !== "completed");
      const nextStep = curIdx >= 0 ? steps[curIdx + 1] : null;

      setRoutingInfo({
        isFinalStep: !nextStep,
        nextStationName: nextStep?.stations?.name || null,
        currentStepId: curIdx >= 0 ? steps[curIdx].id : null,
        nextStep: nextStep || null,
        totalSteps: steps.length,
        currentStepNumber: curIdx >= 0 ? curIdx + 1 : 0,
        allSteps: steps.map((s) => ({
          id: s.id,
          station_id: s.station_id,
          status: s.status,
          step_number: s.step_number,
          operation_name: s.operation_name || `Step ${s.step_number}`,
          operation_type: s.operation_type || 'internal',
          stations: s.stations,
        })),
      });
    };
    fetchRouting();
  }, [activeOrder, stationId]);

  // Fetch orders
  const fetchOrders = async () => {
    if (!stationId || !user) return;
    const { data, error } = await supabase
      .from("queue_items")
      .select("id, title, work_order, part_number, operation_number, status, priority, position, quantity, started_at, due_date, description, qty_original, qty_completed, qty_scrap, qty_rework, qty_open, quantity_locked, estimated_duration, setup_time_minutes, first_article_minutes, cycle_time_minutes, material_type, part_weight_lbs, tags, is_rework, assigned_to")
      .eq("station_id", stationId)
      .in("status", ["pending", "queued", "in_progress", "on_hold"])
      .order("position", { ascending: true });

    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const ch = supabase
      .channel(`op-panel-${stationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_items",
          filter: `station_id=eq.${stationId}`,
        },
        () => fetchOrders(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, user]);

  // Start work
  const handleStart = async (order: WorkOrder) => {
    if (!user || !profile) return;
    setProcessing(true);
    try {
      await supabase
        .from("queue_items")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
          assigned_to: user.id,
        })
        .eq("id", order.id);

      await supabase.from("current_station_status").upsert(
        {
          station_id: stationId,
          current_job_work_order: order.work_order || order.title,
          current_job_part_number: order.part_number,
          current_job_state: "Part Running",
          current_operator_name: profile.display_name,
          current_operator_id: user.id,
          parts_complete: 0,
          parts_required: order.quantity || 0,
        },
        { onConflict: "station_id" },
      );

      toast.success(`Started: ${order.work_order || order.title}`);
    } catch {
      toast.error("Failed to start work order");
    }
    setProcessing(false);
  };

  // Complete operation / deliver — uses atomic backend RPC with pre-advance validation
  const confirmDelivery = async () => {
    if (!deliverOrder || !user) return;
    const { qtyOriginal, qtyCompleted, qtyScrap, qtyRework } = completionData;

    // Client-side validation (unless override)
    if (!isOverride) {
      if (qtyOriginal > 0 && (qtyCompleted + qtyScrap + qtyRework) < qtyOriginal) {
        toast.error("All parts must be accounted for before advancing.");
        return;
      }

      // Station state checks
      const { data: stationStatus } = await supabase
        .from("current_station_status")
        .select("current_job_state")
        .eq("station_id", stationId)
        .maybeSingle();

      if (stationStatus?.current_job_state === "Waiting on QA") {
        toast.error("Quality sign-off required: station is still 'Waiting on QA'.");
        return;
      }
      if (stationStatus?.current_job_state === "First Article in Process") {
        toast.error("First article inspection must be completed before advancing.");
        return;
      }
    }

    setProcessing(true);
    try {
      // Save updated quantities to the work order first
      await supabase
        .from("queue_items")
        .update({
          qty_completed: qtyCompleted,
          qty_scrap: qtyScrap,
          qty_rework: qtyRework,
          parts_completed: qtyCompleted,
        })
        .eq("id", deliverOrder.id);

      // Call atomic RPC
      const { data, error } = await supabase.rpc("pass_work_order_to_next_step", {
        _queue_item_id: deliverOrder.id,
        _current_station_id: stationId,
        _actor_id: user.id,
        _is_override: isOverride,
        _override_reason: isOverride ? overrideReason : undefined,
      });

      if (error) {
        // Surface permission errors clearly
        if (error.message?.includes("Permission denied")) {
          toast.error(error.message);
        } else {
          toast.error(`Operation failed: ${error.message}`);
        }
        setProcessing(false);
        return;
      }

      const result = data as { action?: string; next_station_name?: string };
      if (result?.action === "advanced") {
        toast.success(`Operation complete — advanced to ${result.next_station_name || "next station"}`, {
          action: {
            label: "View Work Order",
            onClick: () => handleNavigateToOrder(deliverOrder.id),
          },
        });
      } else {
        toast.success("Work order completed! Final operation done.", {
          action: {
            label: "View Work Order",
            onClick: () => handleNavigateToOrder(deliverOrder.id),
          },
        });
      }
    } catch {
      toast.error("Operation failed");
    }
    setProcessing(false);
    setDeliverOrder(null);
    setIsOverride(false);
    setOverrideReason("");
  };

  const handleNavigateToOrder = (orderId: string) => {
    if (onViewWorkOrder) {
      onViewWorkOrder(orderId);
    } else {
      navigate(`/queue?item=${orderId}`);
    }
  };

  // Load qty data and dimension requirements when delivery dialog opens
  useEffect(() => {
    if (!deliverOrder) {
      setCompletionData({ qtyCompleted: 0, qtyScrap: 0, qtyRework: 0, qtyOriginal: 0, loaded: false });
      setValidationErrors([]);
      return;
    }
    const loadQty = async () => {
      const { data } = await supabase
        .from("queue_items")
        .select("qty_original, qty_completed, qty_scrap, qty_rework, parts_completed, quantity")
        .eq("id", deliverOrder.id)
        .maybeSingle();
      if (data) {
        setCompletionData({
          qtyOriginal: data.qty_original ?? data.quantity ?? 0,
          qtyCompleted: data.qty_completed ?? data.parts_completed ?? 0,
          qtyScrap: data.qty_scrap ?? 0,
          qtyRework: data.qty_rework ?? 0,
          loaded: true,
        });
      } else {
        setCompletionData({ qtyCompleted: 0, qtyScrap: 0, qtyRework: 0, qtyOriginal: 0, loaded: true });
      }
    };
    loadQty();

    // Load dimension requirements for current routing step
    if (routingInfo?.currentStepId) {
      stepDimensions.loadAll(routingInfo.currentStepId, deliverOrder.id);
    }
  }, [deliverOrder, routingInfo?.currentStepId, stepDimensions]);

  // Validate completion form (includes dimension check)
  useEffect(() => {
    const errors: string[] = [];
    if (!completionData.loaded) return;
    const { qtyOriginal, qtyCompleted, qtyScrap, qtyRework } = completionData;
    const total = qtyCompleted + qtyScrap + qtyRework;

    if (qtyOriginal > 0 && total < qtyOriginal) {
      const unaccounted = qtyOriginal - total;
      errors.push(`${unaccounted} part(s) unaccounted. Total must equal ${qtyOriginal}.`);
    }

    if (stepDimensions.hasPendingDimensions()) {
      errors.push("Dimension checks incomplete — all required measurements must be recorded.");
    } else if (stepDimensions.requirements.length > 0 && !stepDimensions.allDimensionsPassing()) {
      errors.push("One or more dimensions are out of tolerance — review or request supervisor override.");
    }

    setValidationErrors(errors);
  }, [completionData, stepDimensions]);

  const handleCloseDeliveryDialog = (open: boolean) => {
    if (!open) {
      setDeliverOrder(null);
      setIsOverride(false);
      setOverrideReason("");
    }
  };

  const priorityClass = (p: string) => {
    switch (p) {
      case "critical":
        return "bg-[hsl(var(--priority-critical))] text-white";
      case "urgent":
        return "bg-[hsl(var(--priority-urgent))] text-white";
      case "high":
        return "bg-[hsl(var(--priority-high))] text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{stationName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active order */}
          {activeOrder && (
            <div className="rounded-lg p-4 bg-primary/10 border border-primary/30 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Play className="w-3 h-3" /> IN PROGRESS
                  </Badge>
                  <Badge className={priorityClass(activeOrder.priority)}>{activeOrder.priority}</Badge>
                  {activeOrder.is_rework && (
                    <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.5)] gap-1">
                      <Wrench className="w-3 h-3" /> Rework
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {routingInfo && routingInfo.totalSteps > 0 && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <GitBranch className="w-3 h-3" />
                      Step {routingInfo.currentStepNumber}/{routingInfo.totalSteps}
                    </Badge>
                  )}
                  {elapsed && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {elapsed}
                    </span>
                  )}
                </div>
              </div>

              {/* Title & core info */}
              <h4 className="font-semibold text-base">{activeOrder.work_order || activeOrder.title}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {activeOrder.part_number && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Part #</span>
                    <span className="font-medium">{activeOrder.part_number}</span>
                  </div>
                )}
                {activeOrder.operation_number && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Operation</span>
                    <span className="font-medium">{activeOrder.operation_number}</span>
                  </div>
                )}
                {activeOrder.material_type && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Material</span>
                    <span className="font-medium">{activeOrder.material_type}</span>
                  </div>
                )}
                {activeOrder.part_weight_lbs && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Weight</span>
                    <span className="font-medium">{activeOrder.part_weight_lbs} lbs</span>
                  </div>
                )}
              </div>

              {/* Due date */}
              {activeOrder.due_date && (
                <div className={cn(
                  "flex items-center gap-1.5 text-xs rounded px-2 py-1 w-fit",
                  isPast(new Date(activeOrder.due_date))
                    ? "bg-destructive/10 text-destructive font-medium"
                    : "bg-muted text-muted-foreground"
                )}>
                  <CalendarDays className="w-3 h-3" />
                  Due: {format(new Date(activeOrder.due_date), "MMM d, yyyy")}
                  {isPast(new Date(activeOrder.due_date)) && " — OVERDUE"}
                </div>
              )}

              {/* Quantity breakdown */}
              {(activeOrder.qty_original ?? activeOrder.quantity ?? 0) > 0 && (() => {
                const orig = activeOrder.qty_original ?? activeOrder.quantity ?? 0;
                const completed = activeOrder.qty_completed ?? 0;
                const scrap = activeOrder.qty_scrap ?? 0;
                const rework = activeOrder.qty_rework ?? 0;
                const open = activeOrder.qty_open ?? (orig - completed - scrap - rework);
                const pct = orig > 0 ? Math.round((completed / orig) * 100) : 0;
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Quantity Progress
                      </span>
                      <span className="font-medium">{completed}/{orig} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="grid grid-cols-4 gap-1 text-[11px] text-center">
                      <div className="rounded bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] py-0.5">
                        ✓ {completed}
                      </div>
                      <div className="rounded bg-destructive/10 text-destructive py-0.5">
                        ✗ {scrap}
                      </div>
                      <div className="rounded bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] py-0.5">
                        ↺ {rework}
                      </div>
                      <div className="rounded bg-primary/10 text-primary py-0.5">
                        ○ {Math.max(open, 0)}
                      </div>
                    </div>
                    {activeOrder.quantity_locked && (
                      <span className="text-[10px] text-[hsl(var(--warning))]">🔒 Quantity locked</span>
                    )}
                  </div>
                );
              })()}

              {/* Machine time */}
              {(activeOrder.setup_time_minutes || activeOrder.cycle_time_minutes) && (
                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  {activeOrder.setup_time_minutes && <span>Setup: {activeOrder.setup_time_minutes}m</span>}
                  {activeOrder.first_article_minutes && <span>FA: {activeOrder.first_article_minutes}m</span>}
                  {activeOrder.cycle_time_minutes && <span>Cycle: {activeOrder.cycle_time_minutes}m/pc</span>}
                  {activeOrder.estimated_duration && <span className="font-medium">Total: {activeOrder.estimated_duration}m</span>}
                </div>
              )}

              {/* Routing timeline — horizontally scrollable */}
              {routingInfo && routingInfo.allSteps.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <GitBranch className="w-3 h-3" />
                    Routing ({routingInfo.currentStepNumber}/{routingInfo.totalSteps})
                    {routingInfo.isFinalStep && <span className="text-primary ml-1">— Final Op</span>}
                  </div>
                  <div className="overflow-x-auto overscroll-x-contain pb-1 -mx-1 px-1 webkit-overflow-scrolling">
                    <div className="flex items-center gap-0 min-w-max">
                      {routingInfo.allSteps.map((step, idx) => {
                        const isCurrent = step.station_id === stationId && step.status !== "completed"
                          && !routingInfo.allSteps.slice(0, idx).some(s => s.station_id === stationId && s.status !== "completed");
                        const isCompleted = step.status === "completed";
                        const isPending = !isCompleted && !isCurrent;
                        const isOutside = step.operation_type === "outside_processing";

                        return (
                          <div key={step.id} className="flex items-center">
                            {idx > 0 && (
                              <div className={cn(
                                "w-4 sm:w-6 h-0.5 flex-shrink-0",
                                isCompleted ? "bg-[hsl(var(--success))]" : isCurrent ? "bg-primary" : "bg-border"
                              )} />
                            )}
                            <div className={cn(
                              "flex flex-col items-center flex-shrink-0 px-1",
                              isCurrent && "relative"
                            )}>
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                                isCompleted && "bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white",
                                isCurrent && "bg-primary border-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1",
                                isPending && "bg-muted border-border text-muted-foreground",
                                isOutside && !isCompleted && !isCurrent && "border-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                              )}>
                                {isCompleted ? "✓" : step.step_number}
                              </div>
                              <span className={cn(
                                "text-[9px] mt-0.5 max-w-[60px] sm:max-w-[80px] text-center truncate leading-tight",
                                isCurrent ? "font-semibold text-primary" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/70"
                              )}>
                                {step.stations?.name || step.operation_name}
                              </span>
                              {isOutside && (
                                <span className="text-[8px] text-[hsl(var(--warning))]">Outside</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {!routingInfo.isFinalStep && routingInfo.nextStationName && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />
                      Next delivery: <span className="font-medium text-foreground">{routingInfo.nextStationName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {activeOrder.tags && activeOrder.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activeOrder.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description preview */}
              {activeOrder.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 italic">{activeOrder.description}</p>
              )}

              {/* Quick actions */}
              <div className="flex gap-2 pt-1 flex-wrap">
                {routingInfo && !routingInfo.isFinalStep ? (
                  <Button
                    size="sm"
                    className="flex-1 gap-1 bg-primary hover:bg-primary/90"
                    onClick={() => setDeliverOrder(activeOrder)}
                    disabled={processing}
                  >
                    <ArrowRight className="w-3 h-3" /> Complete Op & Advance
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1 gap-1 bg-primary hover:bg-primary/90"
                    onClick={() => setDeliverOrder(activeOrder)}
                    disabled={processing}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {routingInfo ? "Complete Work Order" : "Complete & Deliver"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => handleNavigateToOrder(activeOrder.id)}
                >
                  <ExternalLink className="w-3 h-3" /> Full Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={onCreateHandoff}
                >
                  <FileText className="w-3 h-3" /> Handoff
                </Button>
              </div>
            </div>
          )}

          {/* Station Queue Kanban */}
          <Separator />
          <OperatorStationKanban
            stationId={stationId}
            onStartOrder={(orderId) => {
              const order = orders.find((o) => o.id === orderId);
              if (order) handleStart(order);
            }}
            onViewOrder={(orderId) => handleNavigateToOrder(orderId)}
          />

          {/* Quick actions */}
          <Separator />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={onCreateHandoff}>
              <FileText className="w-3 h-3" /> Handoff
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={onPerformanceUpdate}>
              <Lightbulb className="w-3 h-3" /> Performance Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delivery confirm dialog — routing-aware with completion form */}
      <AlertDialog open={!!deliverOrder} onOpenChange={handleCloseDeliveryDialog}>
        <AlertDialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {routingInfo && !routingInfo.isFinalStep ? (
                <>
                  <ArrowRight className="w-5 h-5 text-primary" />
                  Complete Operation & Advance
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {routingInfo ? "Complete Work Order" : "Complete & Deliver"}
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {routingInfo && !routingInfo.isFinalStep ? (
                  <p>
                    Complete your operation on <strong>{deliverOrder?.work_order || deliverOrder?.title}</strong> and
                    advance it to <strong>{routingInfo.nextStationName || "the next station"}</strong>.
                  </p>
                ) : routingInfo ? (
                  <p>
                    Complete the <strong>final operation</strong> on{" "}
                    <strong>{deliverOrder?.work_order || deliverOrder?.title}</strong>.
                  </p>
                ) : (
                  <p>
                    Complete <strong>{deliverOrder?.work_order || deliverOrder?.title}</strong> and move it to the next
                    station?
                  </p>
                )}

                {/* Quantity completion form */}
                {completionData.loaded && completionData.qtyOriginal > 0 && (
                  <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantity Accounting</span>
                      <Badge variant="outline" className="text-xs">
                        Required: {completionData.qtyOriginal}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="qty-completed" className="text-xs text-muted-foreground">
                          Completed
                        </Label>
                        <Input
                          id="qty-completed"
                          type="number"
                          min={0}
                          max={completionData.qtyOriginal}
                          value={completionData.qtyCompleted}
                          onChange={(e) =>
                            setCompletionData((prev) => ({
                              ...prev,
                              qtyCompleted: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className="h-9 text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qty-scrap" className="text-xs text-muted-foreground">
                          Scrap
                        </Label>
                        <Input
                          id="qty-scrap"
                          type="number"
                          min={0}
                          value={completionData.qtyScrap}
                          onChange={(e) =>
                            setCompletionData((prev) => ({
                              ...prev,
                              qtyScrap: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className="h-9 text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qty-rework" className="text-xs text-muted-foreground">
                          Rework
                        </Label>
                        <Input
                          id="qty-rework"
                          type="number"
                          min={0}
                          value={completionData.qtyRework}
                          onChange={(e) =>
                            setCompletionData((prev) => ({
                              ...prev,
                              qtyRework: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className="h-9 text-center"
                        />
                      </div>
                    </div>

                    {/* Running total */}
                    <div className="flex items-center justify-between text-xs border-t pt-2">
                      <span className="text-muted-foreground">
                        Total: {completionData.qtyCompleted + completionData.qtyScrap + completionData.qtyRework} / {completionData.qtyOriginal}
                      </span>
                      {completionData.qtyCompleted + completionData.qtyScrap + completionData.qtyRework >= completionData.qtyOriginal ? (
                        <span className="text-[hsl(var(--success))] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Accounted
                        </span>
                      ) : (
                        <span className="text-destructive font-medium">
                          {completionData.qtyOriginal - completionData.qtyCompleted - completionData.qtyScrap - completionData.qtyRework} unaccounted
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Dimension checks — required before advancing */}
                {stepDimensions.requirements.length > 0 && deliverOrder && routingInfo?.currentStepId && (
                  <DimensionCheckForm
                    requirements={stepDimensions.requirements}
                    readings={stepDimensions.readings}
                    queueItemId={deliverOrder.id}
                    routingStepId={routingInfo.currentStepId}
                    onRecordReading={stepDimensions.recordReading}
                    loading={stepDimensions.loading}
                  />
                )}

                {/* Request dimension check from supervisor */}
                {deliverOrder && routingInfo?.currentStepId && (
                  <RequestDimensionCheckButton
                    routingStepId={routingInfo.currentStepId}
                    queueItemId={deliverOrder.id}
                    operationName={routingInfo?.allSteps?.find(s => s.step_number === routingInfo?.currentStepNumber)?.operation_name || "this operation"}
                    onSubmit={operatorDimRequests.submitRequest}
                  />
                )}
                {validationErrors.length > 0 && !isOverride && (
                  <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {validationErrors.map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Supervisor override section */}
                {hasOrgSupervisorAccess && (
                  <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOverride}
                        onChange={(e) => setIsOverride(e.target.checked)}
                        className="rounded"
                      />
                      <ShieldAlert className="w-4 h-4 text-destructive" />
                      Supervisor Override
                    </label>
                    {isOverride && (
                      <div className="space-y-1">
                        <Label htmlFor="override-reason" className="text-xs">
                          Override Reason (required)
                        </Label>
                        <Textarea
                          id="override-reason"
                          placeholder="Explain why this override is needed..."
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="text-sm min-h-[60px]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelivery}
              disabled={
                processing ||
                (isOverride && !overrideReason.trim()) ||
                (!isOverride && validationErrors.length > 0)
              }
              className="bg-primary hover:bg-primary/90"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : routingInfo && !routingInfo.isFinalStep ? (
                <ArrowRight className="w-4 h-4 mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {isOverride ? "Override & Confirm" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

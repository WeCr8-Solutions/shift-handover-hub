import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAdminAccess } from "@/hooks/useAdminData";
import { OperatorStationKanban } from "@/components/operator/OperatorStationKanban";

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
}

interface RoutingStep {
  id: string;
  station_id: string;
  status: string;
  step_number: number;
  stations?: { name: string } | null;
}

interface RoutingInfo {
  isFinalStep: boolean;
  nextStationName: string | null;
  currentStepId: string | null;
  nextStep: RoutingStep | null;
  totalSteps: number;
  currentStepNumber: number;
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
      });
    };
    fetchRouting();
  }, [activeOrder?.id, stationId]);

  // Fetch orders
  const fetchOrders = async () => {
    if (!stationId || !user) return;
    const { data, error } = await supabase
      .from("queue_items")
      .select("id, title, work_order, part_number, operation_number, status, priority, position, quantity, started_at")
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

  // Complete operation / deliver — uses atomic backend RPC
  const confirmDelivery = async () => {
    if (!deliverOrder || !user) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc("pass_work_order_to_next_step", {
        _queue_item_id: deliverOrder.id,
        _current_station_id: stationId,
        _actor_id: user.id,
        _is_override: isOverride,
        _override_reason: isOverride ? overrideReason : null,
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
        return "bg-red-500 text-white";
      case "urgent":
        return "bg-orange-500 text-white";
      case "high":
        return "bg-amber-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
            <div className="rounded-lg p-4 bg-primary/10 border border-primary/30 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-primary text-primary-foreground gap-1">
                  <Play className="w-3 h-3" /> IN PROGRESS
                </Badge>
                <div className="flex items-center gap-2">
                  {routingInfo && routingInfo.totalSteps > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Step {routingInfo.currentStepNumber}/{routingInfo.totalSteps}
                    </span>
                  )}
                  {elapsed && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {elapsed}
                    </span>
                  )}
                </div>
              </div>
              <h4 className="font-semibold">{activeOrder.work_order || activeOrder.title}</h4>
              {activeOrder.part_number && (
                <p className="text-sm text-muted-foreground">
                  Part: {activeOrder.part_number}
                  {activeOrder.operation_number && ` • Op ${activeOrder.operation_number}`}
                </p>
              )}
              {activeOrder.quantity && <p className="text-sm text-muted-foreground">Qty: {activeOrder.quantity}</p>}
              <div className="flex gap-2 pt-1 flex-wrap">
                {/* Routing-aware completion button */}
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
                {/* View Details */}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => handleNavigateToOrder(activeOrder.id)}
                >
                  <ExternalLink className="w-3 h-3" /> View Details
                </Button>
              </div>
            </div>
          )}

          {/* Queue */}
          {queuedOrders.length > 0 && (
            <>
              {activeOrder && <Separator />}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Up Next ({queuedOrders.length})
                </h5>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {queuedOrders.map((order, i) => (
                    <div
                      key={order.id}
                      className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{order.work_order || order.title}</span>
                        {order.part_number && (
                          <span className="text-[10px] text-muted-foreground">
                            {order.part_number}
                            {order.operation_number && ` • Op ${order.operation_number}`}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5", priorityClass(order.priority))}>
                        {order.priority}
                      </Badge>
                      <Button
                        size="sm"
                        className="h-7 px-2 gap-1"
                        onClick={() => handleStart(order)}
                        disabled={processing || !!activeOrder}
                      >
                        <Play className="w-3 h-3" /> Start
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!activeOrder && queuedOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No work orders</p>
              <p className="text-xs">Check with your supervisor</p>
            </div>
          )}

          {/* Quick actions */}
          <Separator />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={onCreateHandoff}>
              <FileText className="w-3 h-3" /> Handoff
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={onPerformanceUpdate}>
              <Lightbulb className="w-3 h-3" /> Performance Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => navigate(`/queue?station=${stationId}`)}
            >
              Full Queue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delivery confirm dialog — routing-aware */}
      <AlertDialog open={!!deliverOrder} onOpenChange={handleCloseDeliveryDialog}>
        <AlertDialogContent>
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
              <div className="space-y-3">
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
              disabled={processing || (isOverride && !overrideReason.trim())}
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

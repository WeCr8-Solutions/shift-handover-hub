import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Package, Play, CheckCircle2, Send, MapPin, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AvailableWorkOrder {
  id: string;
  title: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  status: string;
  priority: string;
  station_id: string | null;
  station_name?: string;
  position: number;
  quantity: number | null;
  estimated_duration: number | null;
  next_station_name?: string;
  next_operation?: string;
}

interface StationWorkOrderPickerProps {
  stationId: string;
  stationName: string;
  className?: string;
}

export function StationWorkOrderPicker({ stationId, stationName, className }: StationWorkOrderPickerProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [availableOrders, setAvailableOrders] = useState<AvailableWorkOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<AvailableWorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState<AvailableWorkOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!stationId || !user) {
      setAvailableOrders([]);
      setActiveOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("queue_items")
        .select(
          `
          id,
          title,
          work_order,
          part_number,
          operation_number,
          status,
          priority,
          station_id,
          position,
          quantity,
          estimated_duration
        `,
        )
        .eq("station_id", stationId)
        .in("status", ["pending", "queued", "in_progress"])
        .order("position", { ascending: true });

      if (error) {
        throw error;
      }

      const orders = (data as AvailableWorkOrder[]) || [];
      const active = orders.find((wo) => wo.status === "in_progress") || null;
      const available = orders.filter((wo) => wo.status === "pending" || wo.status === "queued");

      setActiveOrder(active);
      setAvailableOrders(available);
    } catch (err) {
      console.error("Error fetching station work orders:", err);
      toast.error("Failed to load station work orders");
      setActiveOrder(null);
      setAvailableOrders([]);
    } finally {
      setLoading(false);
    }
  }, [stationId, user]);

  useEffect(() => {
    if (!stationId || !user) return;

    void fetchOrders();

    const channel = supabase
      .channel(`station-orders-${stationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_items",
          filter: `station_id=eq.${stationId}`,
        },
        () => {
          void fetchOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [stationId, user, fetchOrders]);

  const handleStartWork = async (order: AvailableWorkOrder) => {
    if (!user || !profile) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from("queue_items")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
          assigned_to: user.id,
        })
        .eq("id", order.id);

      if (error) throw error;

      const { error: stationStatusError } = await supabase.from("current_station_status").upsert(
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

      if (stationStatusError) throw stationStatusError;

      toast.success(`Started work on ${order.work_order || order.title}`);
      await fetchOrders();
    } catch (err) {
      console.error("Error starting work:", err);
      toast.error("Failed to start work order");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeliverToNextStation = (order: AvailableWorkOrder) => {
    setOrderToDeliver(order);
    setShowDeliveryConfirm(true);
  };

  const confirmDelivery = async () => {
    if (!orderToDeliver || !user || !profile) return;

    setProcessing(true);

    try {
      const { data: routingSteps, error: routingError } = await supabase
        .from("work_order_routing")
        .select("*, stations(name)")
        .eq("queue_item_id", orderToDeliver.id)
        .order("step_number", { ascending: true });

      if (routingError) throw routingError;

      const currentStepIndex =
        routingSteps?.findIndex((step: any) => step.station_id === stationId && step.status !== "completed") ?? -1;

      let nextStep: any = null;

      if (currentStepIndex >= 0 && routingSteps) {
        const { error: completeStepError } = await supabase
          .from("work_order_routing")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            completed_by: user.id,
          })
          .eq("id", routingSteps[currentStepIndex].id);

        if (completeStepError) throw completeStepError;

        nextStep = routingSteps[currentStepIndex + 1] ?? null;
      }

      if (nextStep?.station_id) {
        const { error: moveError } = await supabase
          .from("queue_items")
          .update({
            status: "queued",
            station_id: nextStep.station_id,
            started_at: null,
          })
          .eq("id", orderToDeliver.id);

        if (moveError) throw moveError;

        const { error: startNextError } = await supabase
          .from("work_order_routing")
          .update({
            status: "in_progress",
            started_at: new Date().toISOString(),
          })
          .eq("id", nextStep.id);

        if (startNextError) throw startNextError;

        const nextStationName = (nextStep.stations as { name?: string } | null)?.name;

        const { error: nextStationStatusError } = await supabase.from("current_station_status").upsert(
          {
            station_id: nextStep.station_id,
            current_job_work_order: orderToDeliver.work_order || orderToDeliver.title,
            current_job_part_number: orderToDeliver.part_number,
            current_job_state: "Waiting on Material",
          },
          { onConflict: "station_id" },
        );

        if (nextStationStatusError) throw nextStationStatusError;

        toast.success(`Delivered to ${nextStationName || "next station"}`);
      } else {
        const { error: completeOrderError } = await supabase
          .from("queue_items")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", orderToDeliver.id);

        if (completeOrderError) throw completeOrderError;

        toast.success("Work order completed - ready for final QC/Shipping");
      }

      const { error: clearStationError } = await supabase
        .from("current_station_status")
        .update({
          current_job_work_order: null,
          current_job_part_number: null,
          current_job_state: null,
          current_operator_name: null,
          current_operator_id: null,
          parts_complete: null,
          parts_required: null,
        })
        .eq("station_id", stationId);

      if (clearStationError) throw clearStationError;

      setShowDeliveryConfirm(false);
      setOrderToDeliver(null);
      await fetchOrders();
    } catch (err) {
      console.error("Error delivering to next station:", err);
      toast.error("Failed to deliver work order");
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("border-primary/20", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{stationName}</CardTitle>
          </div>
          <CardDescription>Digital Expeditor - Select available work orders</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeOrder && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <Badge className="bg-green-600 text-white">
                  <Play className="mr-1 h-3 w-3" />
                  IN PROGRESS
                </Badge>
                <Badge variant="outline" className={getPriorityColor(activeOrder.priority)}>
                  {activeOrder.priority}
                </Badge>
              </div>

              <h4 className="font-semibold">{activeOrder.work_order || activeOrder.title}</h4>

              {activeOrder.part_number && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Part: {activeOrder.part_number}
                  {activeOrder.operation_number && ` • Op ${activeOrder.operation_number}`}
                </p>
              )}

              {activeOrder.quantity && <p className="text-sm text-muted-foreground">Qty: {activeOrder.quantity}</p>}

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleDeliverToNextStation(activeOrder)}
                  disabled={processing}
                >
                  <Send className="h-3 w-3" />
                  Deliver to Next Station
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/queue?item=${activeOrder.id}`)}>
                  Details
                </Button>
              </div>
            </div>
          )}

          {availableOrders.length > 0 ? (
            <>
              {activeOrder && <Separator />}

              <div>
                <h5 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Available ({availableOrders.length})
                </h5>

                <div className="space-y-2">
                  {availableOrders.slice(0, 5).map((order, index) => (
                    <div
                      key={order.id}
                      className="flex items-center gap-2 rounded border p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-mono font-bold">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-sm font-medium">{order.work_order || order.title}</span>
                        </div>

                        {order.part_number && (
                          <span className="text-[10px] text-muted-foreground">
                            {order.part_number}
                            {order.operation_number && ` • Op ${order.operation_number}`}
                          </span>
                        )}
                      </div>

                      <Badge variant="outline" className={cn("px-1.5 text-[9px]", getPriorityColor(order.priority))}>
                        {order.priority}
                      </Badge>

                      <Button
                        size="sm"
                        className="h-7 gap-1 px-2"
                        onClick={() => handleStartWork(order)}
                        disabled={processing || !!activeOrder}
                      >
                        <Play className="h-3 w-3" />
                        Start
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : !activeOrder ? (
            <div className="py-6 text-center text-muted-foreground">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No work orders available</p>
              <p className="text-xs">Check with your supervisor or the queue</p>
            </div>
          ) : null}

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => navigate(`/queue?station=${stationId}`)}
            >
              View Full Queue
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => navigate("/dashboard")}>
              <TrendingUp className="h-3 w-3" />
              Performance Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeliveryConfirm} onOpenChange={setShowDeliveryConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Confirm Delivery to Next Station
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to complete work on <strong>{orderToDeliver?.work_order || orderToDeliver?.title}</strong>{" "}
                and deliver it to the next station in the routing.
              </p>
              <p className="text-sm">This action will:</p>
              <ul className="ml-4 list-disc space-y-1 text-sm">
                <li>Mark your operation as complete</li>
                <li>Move the work order to the next station&apos;s queue</li>
                <li>Clear your station for the next job</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelivery}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirm Delivery
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

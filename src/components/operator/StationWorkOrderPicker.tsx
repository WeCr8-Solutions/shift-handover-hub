import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
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
import { 
  Package, 
  Play, 
  CheckCircle2, 
  Send,
  Clock,
  ArrowRight,
  MapPin,
  Loader2,
  AlertCircle,
  TrendingUp
} from "lucide-react";
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
  const { currentTeam } = useCurrentTeam();
  const [availableOrders, setAvailableOrders] = useState<AvailableWorkOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<AvailableWorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState<AvailableWorkOrder | null>(null);

  useEffect(() => {
    if (!stationId || !user) return;

    const fetchOrders = async () => {
      // Fetch work orders assigned to this station
      const { data, error } = await supabase
        .from("queue_items")
        .select(`
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
        `)
        .eq("station_id", stationId)
        .in("status", ["pending", "queued", "in_progress"])
        .order("position", { ascending: true });

      if (!error && data) {
        // Find active order
        const active = data.find(wo => wo.status === "in_progress");
        const available = data.filter(wo => wo.status === "pending" || wo.status === "queued");
        
        setActiveOrder(active || null);
        setAvailableOrders(available);
      }
      setLoading(false);
    };

    fetchOrders();

    // Real-time subscription
    const channel = supabase
      .channel(`station-orders-${stationId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "queue_items",
        filter: `station_id=eq.${stationId}`,
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [stationId, user]);

  const handleStartWork = async (order: AvailableWorkOrder) => {
    if (!user || !profile) return;
    setProcessing(true);

    try {
      // Update queue item to in_progress
      const { error } = await supabase
        .from("queue_items")
        .update({ 
          status: "in_progress", 
          started_at: new Date().toISOString(),
          assigned_to: user.id
        })
        .eq("id", order.id);

      if (error) throw error;

      // Update station status
      await supabase
        .from("current_station_status")
        .upsert({
          station_id: stationId,
          current_job_work_order: order.work_order || order.title,
          current_job_part_number: order.part_number,
          current_job_state: "Part Running",
          current_operator_name: profile.display_name,
          current_operator_id: user.id,
          parts_complete: 0,
          parts_required: order.quantity || 0,
        }, { onConflict: "station_id" });

      toast.success(`Started work on ${order.work_order || order.title}`);
    } catch (err) {
      console.error("Error starting work:", err);
      toast.error("Failed to start work order");
    }

    setProcessing(false);
  };

  const handleDeliverToNextStation = (order: AvailableWorkOrder) => {
    setOrderToDeliver(order);
    setShowDeliveryConfirm(true);
  };

  const confirmDelivery = async () => {
    if (!orderToDeliver || !user || !profile) return;
    setProcessing(true);

    try {
      // Get routing to find next step
      const { data: routingSteps } = await supabase
        .from("work_order_routing")
        .select("*, stations(name)")
        .eq("queue_item_id", orderToDeliver.id)
        .order("step_number", { ascending: true });

      // Find current step and next step
      const currentStepIndex = routingSteps?.findIndex(
        step => step.station_id === stationId && step.status !== "completed"
      ) ?? -1;

      let nextStep = null;
      if (currentStepIndex >= 0 && routingSteps) {
        // Complete current step
        await supabase
          .from("work_order_routing")
          .update({ 
            status: "completed", 
            completed_at: new Date().toISOString(),
            completed_by: user.id
          })
          .eq("id", routingSteps[currentStepIndex].id);

        nextStep = routingSteps[currentStepIndex + 1];
      }

      if (nextStep && nextStep.station_id) {
        // Move work order to next station
        await supabase
          .from("queue_items")
          .update({ 
            status: "queued",
            station_id: nextStep.station_id,
            started_at: null
          })
          .eq("id", orderToDeliver.id);

        // Start next routing step
        await supabase
          .from("work_order_routing")
          .update({ status: "in_progress", started_at: new Date().toISOString() })
          .eq("id", nextStep.id);

        // Update next station status to show incoming work
        const nextStationName = (nextStep.stations as any)?.name;
        await supabase
          .from("current_station_status")
          .upsert({
            station_id: nextStep.station_id,
            current_job_work_order: orderToDeliver.work_order || orderToDeliver.title,
            current_job_part_number: orderToDeliver.part_number,
            current_job_state: "Waiting on Material",
          }, { onConflict: "station_id" });

        toast.success(`Delivered to ${nextStationName || "next station"}`);
      } else {
        // No more steps - mark as complete
        await supabase
          .from("queue_items")
          .update({ 
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("id", orderToDeliver.id);

        toast.success("Work order completed - ready for final QC/Shipping");
      }

      // Clear current station status
      await supabase
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

    } catch (err) {
      console.error("Error delivering to next station:", err);
      toast.error("Failed to deliver work order");
    }

    setProcessing(false);
    setShowDeliveryConfirm(false);
    setOrderToDeliver(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500 text-white";
      case "urgent": return "bg-orange-500 text-white";
      case "high": return "bg-amber-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("border-primary/20", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">{stationName}</CardTitle>
          </div>
          <CardDescription>
            Digital Expeditor - Select available work orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Work Order */}
          {activeOrder && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-green-600 text-white">
                  <Play className="w-3 h-3 mr-1" />
                  IN PROGRESS
                </Badge>
                <Badge variant="outline" className={getPriorityColor(activeOrder.priority)}>
                  {activeOrder.priority}
                </Badge>
              </div>
              
              <h4 className="font-semibold">
                {activeOrder.work_order || activeOrder.title}
              </h4>
              
              {activeOrder.part_number && (
                <p className="text-sm text-muted-foreground mt-1">
                  Part: {activeOrder.part_number}
                  {activeOrder.operation_number && ` • Op ${activeOrder.operation_number}`}
                </p>
              )}

              {activeOrder.quantity && (
                <p className="text-sm text-muted-foreground">
                  Qty: {activeOrder.quantity}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleDeliverToNextStation(activeOrder)}
                  disabled={processing}
                >
                  <Send className="w-3 h-3" />
                  Deliver to Next Station
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/queue?item=${activeOrder.id}`)}
                >
                  Details
                </Button>
              </div>
            </div>
          )}

          {/* Available Work Orders */}
          {availableOrders.length > 0 ? (
            <>
              {activeOrder && <Separator />}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Available ({availableOrders.length})
                </h5>
                <div className="space-y-2">
                  {availableOrders.slice(0, 5).map((order, index) => (
                    <div 
                      key={order.id}
                      className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">
                            {order.work_order || order.title}
                          </span>
                        </div>
                        {order.part_number && (
                          <span className="text-[10px] text-muted-foreground">
                            {order.part_number}
                            {order.operation_number && ` • Op ${order.operation_number}`}
                          </span>
                        )}
                      </div>

                      <Badge 
                        variant="outline" 
                        className={cn("text-[9px] px-1.5", getPriorityColor(order.priority))}
                      >
                        {order.priority}
                      </Badge>

                      <Button 
                        size="sm" 
                        className="h-7 px-2 gap-1"
                        onClick={() => handleStartWork(order)}
                        disabled={processing || !!activeOrder}
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : !activeOrder && (
            <div className="text-center py-6 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No work orders available</p>
              <p className="text-xs">Check with your supervisor or the queue</p>
            </div>
          )}

          {/* Quick Actions */}
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
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs gap-1"
              onClick={() => navigate("/dashboard")}
            >
              <TrendingUp className="w-3 h-3" />
              Performance Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Confirmation Dialog */}
      <AlertDialog open={showDeliveryConfirm} onOpenChange={setShowDeliveryConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Confirm Delivery to Next Station
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to complete work on <strong>{orderToDeliver?.work_order || orderToDeliver?.title}</strong> and deliver it to the next station in the routing.
              </p>
              <p className="text-sm">
                This action will:
              </p>
              <ul className="text-sm list-disc ml-4 space-y-1">
                <li>Mark your operation as complete</li>
                <li>Move the work order to the next station's queue</li>
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
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Confirm Delivery
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

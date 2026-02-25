import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { computeRemainingMinutes, formatMinutes, WorkPhase } from "@/lib/machineTime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Package,
  ChevronRight,
  Timer,
  ListTodo,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AssignedWorkOrder {
  id: string;
  title: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  status: string;
  priority: string;
  station_id: string | null;
  station_name?: string;
  station_code?: string;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration: number | null;
  setup_time_minutes: number | null;
  first_article_minutes: number | null;
  cycle_time_minutes: number | null;
  quantity: number | null;
  parts_completed: number;
  current_phase: string;
  position: number;
}

export function OperatorWorkflowPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<AssignedWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch operator's assigned work orders
  useEffect(() => {
    if (!user) return;

    const fetchWorkOrders = async () => {
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
          started_at,
          completed_at,
          estimated_duration,
          setup_time_minutes,
          first_article_minutes,
          cycle_time_minutes,
          quantity,
          parts_completed,
          current_phase,
          position,
          stations!queue_items_station_id_fkey(name, station_id)
        `)
        .eq("assigned_to", user.id)
        .in("status", ["pending", "queued", "in_progress", "on_hold"])
        .order("position", { ascending: true });

      if (!error && data) {
        setWorkOrders(data.map((wo: any) => ({
          ...wo,
          station_name: wo.stations?.name,
          station_code: wo.stations?.station_id,
        })));
      }
      setLoading(false);
    };

    fetchWorkOrders();

    // Subscribe to changes
    const channel = supabase
      .channel(`operator-work-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "queue_items",
        filter: `assigned_to=eq.${user.id}`,
      }, () => {
        fetchWorkOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const activeWorkOrder = workOrders.find(wo => wo.status === "in_progress");
  const queuedOrders = workOrders.filter(wo => 
    wo.status === "pending" || wo.status === "queued" || wo.status === "on_hold"
  );

  const getElapsedTime = (startedAt: string) => {
    const elapsed = Math.floor((currentTime - new Date(startedAt).getTime()) / 60000);
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEstimatedRemaining = (wo: AssignedWorkOrder) => {
    // If we have granular time fields, use phase-aware computation
    if (wo.setup_time_minutes || wo.first_article_minutes || wo.cycle_time_minutes) {
      const remaining = computeRemainingMinutes({
        setup_time_minutes: wo.setup_time_minutes ?? null,
        first_article_minutes: wo.first_article_minutes ?? null,
        cycle_time_minutes: wo.cycle_time_minutes ?? null,
        quantity: wo.quantity ?? null,
        current_phase: (wo.current_phase || 'setup') as WorkPhase,
        parts_completed: wo.parts_completed ?? 0,
      });
      if (remaining <= 0) return "Complete";
      return `${formatMinutes(remaining)} left`;
    }
    // Fallback: wall-clock based
    if (!wo.estimated_duration || !wo.started_at) return null;
    const elapsed = Math.floor((currentTime - new Date(wo.started_at).getTime()) / 60000);
    const remaining = wo.estimated_duration - elapsed;
    if (remaining <= 0) return "Overdue";
    return `${formatMinutes(remaining)} left`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-500/10 border-red-500/30";
      case "urgent": return "text-orange-600 bg-orange-500/10 border-orange-500/30";
      case "high": return "text-amber-600 bg-amber-500/10 border-amber-500/30";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  if (!user) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-primary" />
            My Work Orders
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => navigate("/queue")}
          >
            View All
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No work orders assigned
          </div>
        ) : (
          <>
            {/* Active Work Order */}
            {activeWorkOrder && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-600 text-white text-[10px]">
                    <Play className="w-2.5 h-2.5 mr-1" />
                    ACTIVE
                  </Badge>
                  {activeWorkOrder.started_at && (
                    <span className="text-xs text-green-600 font-mono flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {getElapsedTime(activeWorkOrder.started_at)}
                    </span>
                  )}
                </div>
                
                <h4 className="font-medium text-sm mb-1">
                  {activeWorkOrder.work_order || activeWorkOrder.title}
                </h4>
                
                {activeWorkOrder.part_number && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Part: {activeWorkOrder.part_number}
                    {activeWorkOrder.operation_number && ` • Op ${activeWorkOrder.operation_number}`}
                  </p>
                )}

                {activeWorkOrder.station_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    {activeWorkOrder.station_code} - {activeWorkOrder.station_name}
                  </div>
                )}

                {activeWorkOrder.started_at && (activeWorkOrder.estimated_duration || activeWorkOrder.setup_time_minutes || activeWorkOrder.cycle_time_minutes) && (
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    <span className={cn(
                      "font-medium",
                      getEstimatedRemaining(activeWorkOrder) === "Overdue" || getEstimatedRemaining(activeWorkOrder) === "Complete"
                        ? "text-destructive" 
                        : "text-muted-foreground"
                    )}>
                      {getEstimatedRemaining(activeWorkOrder)}
                    </span>
                  </div>
                )}

                <Button 
                  size="sm" 
                  className="w-full mt-3 h-8"
                  onClick={() => navigate(`/queue?item=${activeWorkOrder.id}`)}
                >
                  View Details
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}

            {/* Work Order Flow */}
            {queuedOrders.length > 0 && (
              <>
                {activeWorkOrder && <Separator />}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Queue ({queuedOrders.length})
                  </h5>
                  
                  {/* Visual Flow */}
                  <div className="space-y-1">
                    {queuedOrders.slice(0, 4).map((wo, index) => (
                      <div 
                        key={wo.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors",
                          wo.status === "on_hold" && "bg-amber-500/5 border-amber-500/30"
                        )}
                        onClick={() => navigate(`/queue?item=${wo.id}`)}
                      >
                        {/* Position indicator */}
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono font-bold">
                          {index + 1}
                        </div>
                        
                        {/* Work order info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium truncate">
                              {wo.work_order || wo.title}
                            </span>
                            {wo.status === "on_hold" && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-amber-600 border-amber-500/30">
                                <Pause className="w-2 h-2 mr-0.5" />
                                Hold
                              </Badge>
                            )}
                          </div>
                          {wo.station_code && (
                            <span className="text-[10px] text-muted-foreground">
                              {wo.station_code}
                            </span>
                          )}
                        </div>

                        {/* Priority */}
                        <Badge 
                          variant="outline" 
                          className={cn("text-[9px] px-1.5", getPriorityColor(wo.priority))}
                        >
                          {wo.priority}
                        </Badge>

                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    ))}
                    
                    {queuedOrders.length > 4 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs h-7"
                        onClick={() => navigate("/queue")}
                      >
                        +{queuedOrders.length - 4} more in queue
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

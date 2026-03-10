import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Package, Play, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface MiniQueueItem {
  id: string;
  title: string;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  status: string;
  priority: string;
  position: number;
  quantity: number | null;
  due_date: string | null;
  started_at: string | null;
}

type KanbanStatus = "queued" | "in_progress" | "on_hold";

const COLUMNS: { status: KanbanStatus; title: string; accent: string }[] = [
  { status: "queued", title: "Queued", accent: "border-t-yellow-500" },
  { status: "in_progress", title: "In Progress", accent: "border-t-primary" },
  { status: "on_hold", title: "On Hold", accent: "border-t-orange-500" },
];

interface OperatorStationKanbanProps {
  stationId: string;
  onStartOrder?: (orderId: string) => void;
  onViewOrder?: (orderId: string) => void;
  className?: string;
}

export function OperatorStationKanban({
  stationId,
  onStartOrder,
  onViewOrder,
  className,
}: OperatorStationKanbanProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<MiniQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!stationId || !user) return;
    const { data, error } = await supabase
      .from("queue_items")
      .select(
        "id, title, work_order, part_number, operation_number, status, priority, position, quantity, due_date, started_at"
      )
      .eq("station_id", stationId)
      .in("status", ["pending", "queued", "in_progress", "on_hold"])
      .order("position", { ascending: true });

    if (!error && data) {
      // Map "pending" to "queued" for display
      setItems(
        data.map((d) => ({
          ...d,
          status: d.status === "pending" ? "queued" : d.status,
        }))
      );
    }
    setLoading(false);
  }, [stationId, user]);

  useEffect(() => {
    fetchItems();
    const ch = supabase
      .channel(`op-kanban-${stationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_items", filter: `station_id=eq.${stationId}` },
        () => fetchItems()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [stationId, user, fetchItems]);

  const itemsByCol: Record<KanbanStatus, MiniQueueItem[]> = {
    queued: items.filter((i) => i.status === "queued").sort((a, b) => a.position - b.position),
    in_progress: items.filter((i) => i.status === "in_progress"),
    on_hold: items.filter((i) => i.status === "on_hold"),
  };

  const handleViewOrder = (id: string) => {
    if (onViewOrder) onViewOrder(id);
    else navigate(`/queue?item=${id}`);
  };

  const priorityDot = (p: string) => {
    switch (p) {
      case "critical": return "bg-destructive";
      case "urgent": return "bg-priority-urgent";
      case "high": return "bg-priority-high";
      default: return "bg-muted-foreground/40";
    }
  };

  if (loading) {
    return (
      <div className={cn("grid grid-cols-3 gap-2", className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const totalItems = items.length;
  if (totalItems === 0) {
    return (
      <div className={cn("text-center py-6 text-muted-foreground", className)}>
        <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm font-medium">No work orders in station queue</p>
        <p className="text-xs">Check with your supervisor or view the full queue</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 text-xs"
          onClick={() => navigate(`/queue?station=${stationId}`)}
        >
          Open Full Queue
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Station Queue
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2 gap-1"
          onClick={() => navigate(`/queue?station=${stationId}`)}
        >
          <ExternalLink className="w-3 h-3" />
          Full Queue
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {COLUMNS.map((col) => {
          const colItems = itemsByCol[col.status];
          return (
            <div
              key={col.status}
              className={cn(
                "rounded-md border border-border bg-secondary/30 border-t-2 min-h-[120px]",
                col.accent
              )}
            >
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.title}
                </span>
                <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                  {colItems.length}
                </Badge>
              </div>
              <ScrollArea className="h-[160px] px-1 pb-1">
                <div className="space-y-1">
                  {colItems.map((item) => {
                    const isOverdue =
                      item.due_date &&
                      new Date(item.due_date) < new Date() &&
                      item.status !== "completed";
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleViewOrder(item.id)}
                        className={cn(
                          "w-full text-left rounded border bg-card p-2 text-xs transition-colors hover:border-primary/50 hover:bg-muted/50",
                          isOverdue && "border-destructive/40"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityDot(item.priority))} />
                          <span className="font-medium truncate">
                            {item.work_order || item.title}
                          </span>
                        </div>
                        {item.part_number && (
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {item.part_number}
                            {item.operation_number && ` · Op ${item.operation_number}`}
                          </span>
                        )}
                        {isOverdue && item.due_date && (
                          <span className="text-[10px] text-destructive flex items-center gap-0.5 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Due {format(new Date(item.due_date), "MMM d")}
                          </span>
                        )}
                        {col.status === "queued" && !items.some((i) => i.status === "in_progress") && onStartOrder && (
                          <Button
                            size="sm"
                            className="h-5 px-1.5 text-[9px] mt-1 gap-0.5 w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartOrder(item.id);
                            }}
                          >
                            <Play className="w-2.5 h-2.5" /> Start
                          </Button>
                        )}
                      </button>
                    );
                  })}
                  {colItems.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-muted-foreground/60">
                      Empty
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueueItem, QueueStatus } from "@/hooks/useQueue";
import { cn } from "@/lib/utils";
import { LayoutList, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkOrderAlertTile } from "./WorkOrderAlertTile";
import { getQueueStatusBadgeColor } from "@/lib/status-colors";
import { CancelHoldDialog, CancelHoldMode } from "./CancelHoldDialog";

// Valid state transitions matching the DB trigger
const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  pending: ["queued", "cancelled"],
  queued: ["in_progress", "cancelled", "pending"],
  in_progress: ["on_hold", "completed", "queued", "cancelled"],
  on_hold: ["in_progress", "cancelled"],
  completed: ["pending"],
  cancelled: [],
};

interface QueueListViewProps {
  items: QueueItem[];
  onItemClick: (itemId: string) => void;
  onStatusChange: (itemId: string, newStatus: QueueStatus) => Promise<{ error: string | null }>;
  onDelete: (itemId: string) => Promise<{ error: string | null }>;
  onOpenRouting?: (item: { id: string; work_order?: string | null; part_number?: string | null }) => void;
}

interface StationInfo {
  id: string;
  name: string;
  station_id: string;
  work_center_type: string;
}

const statusOptions: { value: QueueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function getStatusColor(status: QueueStatus): string {
  return getQueueStatusBadgeColor(status);
}

export function QueueListView({ items, onItemClick, onStatusChange, onDelete, onOpenRouting }: QueueListViewProps) {
  const [stations, setStations] = useState<Map<string, StationInfo>>(new Map());
  const [pendingAction, setPendingAction] = useState<{ item: QueueItem; mode: CancelHoldMode } | null>(null);

  // Fetch station info for all items
  useEffect(() => {
    const stationIds = [...new Set(items.filter(i => i.station_id).map(i => i.station_id!))];
    if (stationIds.length === 0) return;

    const fetchStations = async () => {
      const { data } = await supabase
        .from("stations")
        .select("id, name, station_id, work_center_type")
        .in("id", stationIds);
      
      if (data) {
        const stationMap = new Map<string, StationInfo>();
        data.forEach(s => stationMap.set(s.id, s));
        setStations(stationMap);
      }
    };

    fetchStations();
  }, [items]);

  // Cancelled WOs are hidden here — they live on the dedicated /work-orders/cancelled page.
  const visibleItems = items.filter(i => i.status !== "cancelled");
  const activeItems = visibleItems.filter(i => i.status !== "completed");
  const doneItems = visibleItems.filter(i => i.status === "completed");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutList className="w-5 h-5 text-primary" />
          Queue Items
          <Badge variant="outline" className="ml-2">{items.length} total</Badge>
          {activeItems.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{activeItems.length} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 py-2 border-b border-border bg-secondary/20 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Click any row to expand alerts, routing, and delivery status</span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No queue items found
          </div>
        ) : (
          <div>
            {activeItems.map((item) => {
              const station = item.station_id ? stations.get(item.station_id) : null;
              return (
                <div key={item.id} className="relative">
                  <WorkOrderAlertTile
                    item={item}
                    stationName={station?.name}
                    stationCode={station?.station_id}
                    workCenterType={station?.work_center_type}
                    onItemClick={onItemClick}
                    onOpenRouting={onOpenRouting}
                  />
                  {/* Inline status change */}
                  <div className="absolute top-1.5 right-12 sm:right-14 z-10">
                    <Select
                      value={item.status}
                      onValueChange={async (value) => {
                        const next = value as QueueStatus;
                        if (next === "cancelled" || next === "on_hold") {
                          setPendingAction({ item, mode: next === "cancelled" ? "cancel" : "hold" });
                          return;
                        }
                        const result = await onStatusChange(item.id, next);
                        if (result.error) toast.error(result.error);
                      }}
                    >
                      <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent [&>svg]:hidden">
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem key={item.status} value={item.status} disabled>
                          <Badge className={cn("text-[10px]", getStatusColor(item.status))}>
                            {statusOptions.find(o => o.value === item.status)?.label}
                          </Badge>
                        </SelectItem>
                        {(VALID_TRANSITIONS[item.status] || []).map((targetStatus) => {
                          const option = statusOptions.find(o => o.value === targetStatus);
                          if (!option) return null;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <Badge className={cn("text-[10px]", getStatusColor(option.value))}>
                                {option.label}
                              </Badge>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}

            {doneItems.length > 0 && (
              <details className="border-t border-border">
                <summary className="px-4 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-secondary/30">
                  {doneItems.length} completed/cancelled
                </summary>
                {doneItems.map((item) => {
                  const station = item.station_id ? stations.get(item.station_id) : null;
                  return (
                    <WorkOrderAlertTile
                      key={item.id}
                      item={item}
                      stationName={station?.name}
                      stationCode={station?.station_id}
                      workCenterType={station?.work_center_type}
                      onItemClick={onItemClick}
                    />
                  );
                })}
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

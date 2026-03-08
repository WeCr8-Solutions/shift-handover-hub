import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { QueueItem } from "@/hooks/useQueue";

export interface WorkOrderLinkedData {
  routing: RoutingStep[];
  handoffs: HandoffSummary[];
  performanceUpdates: PerformanceUpdateSummary[];
  deliveryRequests: DeliverySummary[];
  downtimeEvents: DowntimeSummary[];
  comments: CommentSummary[];
  history: HistorySummary[];
}

export interface RoutingStep {
  id: string;
  step_order: number;
  operation_number: string;
  work_center: string;
  work_center_type: string;
  station_name: string | null;
  description: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  actual_duration_minutes: number | null;
  operator_name: string | null;
  inspection_status: string | null;
  inspection_notes: string | null;
}

export interface HandoffSummary {
  id: string;
  date: string;
  shift: string;
  outgoing_operator_name: string;
  incoming_operator_name: string;
  primary_state: string;
  parts_completed_this_shift: number;
  handoff_summary: string;
}

export interface PerformanceUpdateSummary {
  id: string;
  title: string;
  update_type: string;
  status: string;
  priority: string;
  user_name: string;
  created_at: string;
  description: string;
}

export interface DeliverySummary {
  id: string;
  status: string;
  priority: string;
  created_at: string;
  delivered_at: string | null;
  notes: string | null;
}

export interface DowntimeSummary {
  id: string;
  downtime_type: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  reason_code: string | null;
  description: string | null;
}

export interface CommentSummary {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface HistorySummary {
  id: string;
  user_name: string;
  action: string;
  created_at: string;
}

export interface WorkOrderWithLinkedData extends QueueItem {
  linked_data?: WorkOrderLinkedData;
  station_name?: string;
  team_name?: string;
}

export interface WorkOrderHistoryFilters {
  search?: string;
  work_order?: string;
  part_number?: string;
  date_from?: string;
  date_to?: string;
  status?: string[];
}

export function useWorkOrderHistory(filters?: WorkOrderHistoryFilters) {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
  const [workOrders, setWorkOrders] = useState<WorkOrderWithLinkedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkOrders = useCallback(async () => {
    if (!user || !organization?.id) {
      setWorkOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("queue_items")
        .select(`
          *,
          stations:station_id (name),
          teams:team_id (name)
        `)
        .eq("organization_id", organization.id)
        .eq("item_type", "work_order")
        .order("updated_at", { ascending: false });

      // Apply status filter - default to completed if not specified
      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status as ("cancelled" | "completed" | "in_progress" | "on_hold" | "pending" | "queued")[]);
      } else {
        query = query.in("status", ["completed", "cancelled"] as const);
      }

      // Apply search filters
      if (filters?.work_order) {
        query = query.ilike("work_order", `%${filters.work_order}%`);
      }

      if (filters?.part_number) {
        query = query.ilike("part_number", `%${filters.part_number}%`);
      }

      if (filters?.search) {
        query = query.or(`work_order.ilike.%${filters.search}%,part_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }

      if (filters?.date_from) {
        query = query.gte("completed_at", filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte("completed_at", filters.date_to);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) throw fetchError;

      // Transform data
      const transformed: WorkOrderWithLinkedData[] = (data || []).map((item: any) => ({
        ...item,
        station_name: item.stations?.name || null,
        team_name: item.teams?.name || null,
      }));

      setWorkOrders(transformed);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching work order history:", err);
    }

    setLoading(false);
  }, [user, organization?.id, filters?.search, filters?.work_order, filters?.part_number, filters?.date_from, filters?.date_to, filters?.status]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  // Fetch linked data for a specific work order
  const fetchLinkedData = useCallback(async (workOrderId: string): Promise<WorkOrderLinkedData | null> => {
    if (!user || !organization?.id) return null;

    try {
      // Fetch routing steps
      const { data: routingData } = await supabase
        .from("work_order_routing")
        .select(`
          *,
          stations:station_id (name)
        `)
        .eq("queue_item_id", workOrderId)
        .order("step_order");

      // Fetch the work order to get work_order number and part_number
      const workOrder = workOrders.find(wo => wo.id === workOrderId);
      
      // Fetch handoffs linked by work_order or part_number
      let handoffsQuery = supabase
        .from("handoff_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (workOrder?.work_order) {
        handoffsQuery = handoffsQuery.eq("work_order", workOrder.work_order);
      }
      
      const { data: handoffsData } = await handoffsQuery;

      // Fetch performance updates linked by work_order or part_number
      let performanceQuery = supabase
        .from("job_performance_updates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (workOrder?.work_order) {
        performanceQuery = performanceQuery.eq("work_order", workOrder.work_order);
      }
      
      const { data: performanceData } = await performanceQuery;

      // Fetch delivery requests
      const { data: deliveryData } = await supabase
        .from("delivery_requests")
        .select("*")
        .eq("queue_item_id", workOrderId)
        .order("created_at", { ascending: false });

      // Fetch downtime events
      const { data: downtimeData } = await supabase
        .from("downtime_events")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("started_at", { ascending: false });

      // Fetch comments
      const { data: commentsData } = await supabase
        .from("queue_item_comments")
        .select("*")
        .eq("queue_item_id", workOrderId)
        .order("created_at", { ascending: true });

      // Fetch history
      const { data: historyData } = await supabase
        .from("queue_item_history")
        .select("*")
        .eq("queue_item_id", workOrderId)
        .order("created_at", { ascending: false });

      return {
        routing: (routingData || []).map((r: any) => ({
          id: r.id,
          step_order: r.step_order,
          operation_number: r.operation_number,
          work_center: r.work_center,
          work_center_type: r.work_center_type,
          station_name: r.stations?.name || null,
          description: r.description,
          status: r.status,
          started_at: r.started_at,
          completed_at: r.completed_at,
          actual_duration_minutes: r.actual_duration_minutes,
          operator_name: r.operator_name,
          inspection_status: r.inspection_status,
          inspection_notes: r.inspection_notes,
        })),
        handoffs: (handoffsData || []).map((h: any) => ({
          id: h.id,
          date: h.date,
          shift: h.shift,
          outgoing_operator_name: h.outgoing_operator_name,
          incoming_operator_name: h.incoming_operator_name,
          primary_state: h.primary_state,
          parts_completed_this_shift: h.parts_completed_this_shift,
          handoff_summary: h.handoff_summary,
        })),
        performanceUpdates: (performanceData || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          update_type: p.update_type,
          status: p.status,
          priority: p.priority,
          user_name: p.user_name,
          created_at: p.created_at,
          description: p.description,
        })),
        deliveryRequests: (deliveryData || []).map((d: any) => ({
          id: d.id,
          status: d.status,
          priority: d.priority,
          created_at: d.created_at,
          delivered_at: d.delivered_at,
          notes: d.notes,
        })),
        downtimeEvents: (downtimeData || []).map((dt: any) => ({
          id: dt.id,
          downtime_type: dt.downtime_type,
          started_at: dt.started_at,
          ended_at: dt.ended_at,
          duration_minutes: dt.duration_minutes,
          reason_code: dt.reason_code,
          description: dt.description,
        })),
        comments: (commentsData || []).map((c: any) => ({
          id: c.id,
          user_name: c.user_name,
          content: c.content,
          created_at: c.created_at,
        })),
        history: (historyData || []).map((h: any) => ({
          id: h.id,
          user_name: h.user_name,
          action: h.action,
          created_at: h.created_at,
        })),
      };
    } catch (err) {
      console.error("Error fetching linked data:", err);
      return null;
    }
  }, [user, organization?.id, workOrders]);

  return {
    workOrders,
    loading,
    error,
    fetchWorkOrders,
    fetchLinkedData,
  };
}

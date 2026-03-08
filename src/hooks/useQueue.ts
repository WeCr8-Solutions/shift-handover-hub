import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { Database } from "@/integrations/supabase/types";

export type QueueItemType = Database["public"]["Enums"]["queue_item_type"];
export type QueueStatus = Database["public"]["Enums"]["queue_status"];
export type QueuePriority = Database["public"]["Enums"]["queue_priority"];

export interface QueueItem {
  id: string;
  organization_id: string | null;
  team_id: string | null;
  station_id: string | null;
  item_type: QueueItemType;
  title: string;
  description: string | null;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  quantity: number | null;
  status: QueueStatus;
  priority: QueuePriority;
  position: number;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  estimated_duration: number | null;
  setup_time_minutes: number | null;
  first_article_minutes: number | null;
  cycle_time_minutes: number | null;
  parts_completed: number;
  current_phase: string;
  started_at: string | null;
  completed_at: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // NCR quantity tracking
  qty_original: number | null;
  qty_completed: number | null;
  qty_scrap: number | null;
  qty_rework: number | null;
  qty_open: number | null;
  quantity_locked: boolean | null;
  parent_work_order_id: string | null;
  is_rework: boolean | null;
  // ERP sync fields
  erp_job_id?: string | null;
  erp_source?: string | null;
  erp_last_synced_at?: string | null;
  // Part spec fields
  material_type?: string | null;
  part_length_inches?: number | null;
  part_width_inches?: number | null;
  part_height_inches?: number | null;
  part_weight_lbs?: number | null;
  part_shape?: string | null;
  part_catalog_id?: string | null;
  required_tolerance?: string | null;
  surface_finish?: string | null;
}

export interface QueueItemComment {
  id: string;
  queue_item_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface QueueItemHistory {
  id: string;
  queue_item_id: string;
  user_id: string;
  user_name: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface RoutingStepInput {
  step_number: number;
  operation_name: string;
  operation_type: string;
  station_id?: string;
  setup_time_minutes?: number;
  first_article_minutes?: number;
  cycle_time_minutes?: number;
  notes?: string;
  outside_vendor?: string;
  po_number?: string;
  expected_return_date?: string;
}

export interface CreateQueueItemInput {
  item_type: QueueItemType;
  title: string;
  description?: string;
  work_order?: string;
  part_number?: string;
  operation_number?: string;
  quantity?: number;
  priority?: QueuePriority;
  station_id?: string;
  assigned_to?: string;
  due_date?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration?: number;
  setup_time_minutes?: number;
  first_article_minutes?: number;
  cycle_time_minutes?: number;
  tags?: string[];
  // Part specs
  material_type?: string;
  part_length_inches?: number;
  part_width_inches?: number;
  part_height_inches?: number;
  part_weight_lbs?: number;
  part_shape?: string;
  part_catalog_id?: string;
  required_tolerance?: string;
  surface_finish?: string;
  // Routing
  routing_steps?: RoutingStepInput[];
}

export interface UpdateQueueItemInput {
  title?: string;
  description?: string;
  status?: QueueStatus;
  priority?: QueuePriority;
  position?: number;
  assigned_to?: string | null;
  due_date?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  estimated_duration?: number | null;
  setup_time_minutes?: number | null;
  first_article_minutes?: number | null;
  cycle_time_minutes?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  tags?: string[];
}

export function useQueue(filters?: {
  status?: QueueStatus[];
  item_type?: QueueItemType[];
  station_id?: string;
  assigned_to?: string;
  organization_id?: string;
}) {
  const { user, profile } = useAuth();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useOrgContext();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedOnce = useRef(false);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    
    // Only show full loading on initial fetch to prevent UI flash
    if (!hasFetchedOnce.current) {
      setLoading(true);
    }
    setError(null);

    let query = supabase
      .from("queue_items")
      .select("*")
      .order("position", { ascending: true })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    // Filter by organization for proper multi-tenant isolation
    // Use explicit filter if provided, otherwise use user's organization
    const orgId = filters?.organization_id || organization?.id;
    if (orgId) {
      query = query.eq("organization_id", orgId);
    }

    // Additional team filter if specified
    if (currentTeam) {
      query = query.eq("team_id", currentTeam.id);
    }

    if (filters?.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

    if (filters?.item_type && filters.item_type.length > 0) {
      query = query.in("item_type", filters.item_type);
    }

    if (filters?.station_id) {
      query = query.eq("station_id", filters.station_id);
    }

    if (filters?.assigned_to) {
      query = query.eq("assigned_to", filters.assigned_to);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      console.error("Error fetching queue items:", fetchError);
    } else {
      setItems((data as QueueItem[]) || []);
    }

    hasFetchedOnce.current = true;
    setLoading(false);
  }, [user, currentTeam, organization?.id, filters?.status, filters?.item_type, filters?.station_id, filters?.assigned_to, filters?.organization_id]);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Real-time subscription with debounce to prevent query storms
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedFetch = useCallback(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => {
      // Skip refetch when tab is hidden
      if (!document.hidden) {
        fetchItems();
      }
    }, 500);
  }, [fetchItems]);

  useEffect(() => {
    if (!user) return;

    const orgId = organization?.id || 'global';
    const channelName = `queue-changes-${orgId}-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_items",
        },
        debouncedFetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, debouncedFetch, organization?.id]);

  const createItem = useCallback(
    async (input: CreateQueueItemInput) => {
      if (!user || !profile) return { error: "Not authenticated" };

      // Get max position within the organization
      let maxPosQuery = supabase
        .from("queue_items")
        .select("position")
        .order("position", { ascending: false })
        .limit(1);
      
      if (organization?.id) {
        maxPosQuery = maxPosQuery.eq("organization_id", organization.id);
      }
      if (currentTeam?.id) {
        maxPosQuery = maxPosQuery.eq("team_id", currentTeam.id);
      }

      const { data: maxPosData } = await maxPosQuery;
      const maxPosition = maxPosData?.[0]?.position || 0;

      // If routing steps provided, use the first step's station as the WO station
      const effectiveStationId = input.routing_steps?.length
        ? input.routing_steps[0].station_id || null
        : input.station_id || null;

      const { data: insertedItem, error } = await supabase.from("queue_items").insert({
        organization_id: organization?.id || null,
        team_id: currentTeam?.id || null,
        item_type: input.item_type,
        title: input.title,
        description: input.description || null,
        work_order: input.work_order || null,
        part_number: input.part_number || null,
        operation_number: input.operation_number || null,
        quantity: input.quantity || null,
        qty_original: input.quantity || null,
        priority: input.priority || "normal",
        position: maxPosition + 1,
        station_id: effectiveStationId,
        assigned_to: input.assigned_to || null,
        assigned_by: input.assigned_to ? user.id : null,
        due_date: input.due_date || null,
        scheduled_start: input.scheduled_start || null,
        scheduled_end: input.scheduled_end || null,
        estimated_duration: input.estimated_duration || null,
        setup_time_minutes: input.setup_time_minutes || null,
        first_article_minutes: input.first_article_minutes || null,
        cycle_time_minutes: input.cycle_time_minutes || null,
        tags: input.tags || [],
        created_by: user.id,
        material_type: input.material_type || null,
        part_length_inches: input.part_length_inches || null,
        part_width_inches: input.part_width_inches || null,
        part_height_inches: input.part_height_inches || null,
        part_weight_lbs: input.part_weight_lbs || null,
        part_shape: input.part_shape || null,
        part_catalog_id: input.part_catalog_id || null,
        required_tolerance: input.required_tolerance || null,
        surface_finish: input.surface_finish || null,
      }).select("id").single();

      if (error) return { error: error.message };

      // Insert routing steps if provided
      if (input.routing_steps?.length && insertedItem?.id && organization?.id) {
        const routingRows = input.routing_steps.map((step) => ({
          queue_item_id: insertedItem.id,
          organization_id: organization.id,
          step_number: step.step_number,
          operation_name: step.operation_name,
          operation_type: step.operation_type,
          station_id: step.station_id || null,
          setup_time_minutes: step.setup_time_minutes || null,
          first_article_minutes: step.first_article_minutes || null,
          cycle_time_minutes: step.cycle_time_minutes || null,
          notes: step.notes || null,
          outside_vendor: step.outside_vendor || null,
          po_number: step.po_number || null,
          expected_return_date: step.expected_return_date || null,
          status: step.step_number === 1 ? "pending" : "pending",
        }));

        const { error: routingError } = await supabase
          .from("work_order_routing")
          .insert(routingRows);

        if (routingError) {
          console.error("Error inserting routing steps:", routingError);
        }
      }

      await fetchItems();
      return { error: null };
    },
    [user, profile, currentTeam, organization, fetchItems]
  );

  const updateItem = useCallback(
    async (id: string, input: UpdateQueueItemInput, logHistory = true) => {
      if (!user || !profile) return { error: "Not authenticated" };

      // Get old item for history
      const { data: oldItem } = await supabase
        .from("queue_items")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("queue_items")
        .update({
          ...input,
          assigned_by: input.assigned_to !== undefined ? user.id : undefined,
        })
        .eq("id", id);

      if (error) return { error: error.message };

      // Sync with current_station_status when work starts or completes
      if (oldItem?.station_id && input.status) {
        if (input.status === "in_progress") {
          // Update station status to show active work
          await syncStationStatus(oldItem.station_id, {
            current_job_work_order: oldItem.work_order || oldItem.title,
            current_job_part_number: oldItem.part_number,
            current_job_state: "Part Running",
            current_operator_name: profile.display_name,
            current_operator_id: user.id,
            parts_complete: 0,
            parts_required: oldItem.quantity || 0,
          });
        } else if (input.status === "completed" || input.status === "cancelled") {
          // Clear station status when work completes
          await syncStationStatus(oldItem.station_id, {
            current_job_work_order: null,
            current_job_part_number: null,
            current_job_state: null,
            current_operator_name: null,
            current_operator_id: null,
            parts_complete: null,
            parts_required: null,
          });
        } else if (input.status === "on_hold") {
          // Update station status to show on hold
          await syncStationStatus(oldItem.station_id, {
            current_job_state: "On Hold",
          });
        }
      }

      // Log history
      if (logHistory && oldItem) {
        const changes: string[] = [];
        if (input.status && input.status !== oldItem.status) {
          changes.push(`Status: ${oldItem.status} → ${input.status}`);
        }
        if (input.priority && input.priority !== oldItem.priority) {
          changes.push(`Priority: ${oldItem.priority} → ${input.priority}`);
        }
        if (input.assigned_to !== undefined && input.assigned_to !== oldItem.assigned_to) {
          changes.push(`Assignment changed`);
        }

        if (changes.length > 0) {
          await supabase.from("queue_item_history").insert([{
            queue_item_id: id,
            user_id: user.id,
            user_name: profile.display_name,
            action: changes.join(", "),
            old_value: JSON.parse(JSON.stringify({ status: oldItem.status, priority: oldItem.priority, assigned_to: oldItem.assigned_to })),
            new_value: JSON.parse(JSON.stringify(input)),
            organization_id: organization?.id || "",
          }]);
        }
      }

      await fetchItems();
      return { error: null };
    },
    [user, profile, fetchItems]
  );

  // Helper to sync station status when queue item changes
  const syncStationStatus = async (
    stationId: string,
    status: {
      current_job_work_order?: string | null;
      current_job_part_number?: string | null;
      current_job_state?: string | null;
      current_operator_name?: string | null;
      current_operator_id?: string | null;
      parts_complete?: number | null;
      parts_required?: number | null;
    }
  ) => {
    const { data: existing } = await supabase
      .from("current_station_status")
      .select("id")
      .eq("station_id", stationId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("current_station_status")
        .update(status)
        .eq("station_id", stationId);
    } else {
      await supabase
        .from("current_station_status")
        .insert({ station_id: stationId, ...status });
    }
  };

  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) return { error: "Not authenticated" };

      const { error } = await supabase.from("queue_items").delete().eq("id", id);

      if (error) return { error: error.message };

      await fetchItems();
      return { error: null };
    },
    [user, fetchItems]
  );

  const reorderItems = useCallback(
    async (itemId: string, newPosition: number) => {
      if (!user) return { error: "Not authenticated" };

      const { error } = await supabase.rpc("reorder_queue_item", {
        _item_id: itemId,
        _new_position: newPosition,
        _org_id: organization?.id || null,
        _team_id: currentTeam?.id || null,
      });

      if (error) return { error: error.message };

      await fetchItems();
      return { error: null };
    },
    [user, organization?.id, currentTeam?.id, fetchItems]
  );

  const addComment = useCallback(
    async (itemId: string, content: string) => {
      if (!user || !profile) return { error: "Not authenticated" };

      const { error } = await supabase.from("queue_item_comments").insert({
        queue_item_id: itemId,
        user_id: user.id,
        user_name: profile.display_name,
        content,
        organization_id: organization?.id || "",
      });

      if (error) return { error: error.message };
      return { error: null };
    },
    [user, profile]
  );

  const getComments = useCallback(async (itemId: string) => {
    const { data, error } = await supabase
      .from("queue_item_comments")
      .select("*")
      .eq("queue_item_id", itemId)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: data as QueueItemComment[], error: null };
  }, []);

  const getHistory = useCallback(async (itemId: string) => {
    const { data, error } = await supabase
      .from("queue_item_history")
      .select("*")
      .eq("queue_item_id", itemId)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as QueueItemHistory[], error: null };
  }, []);

  // Group items by status for Kanban view
  const itemsByStatus = items.reduce(
    (acc, item) => {
      if (!acc[item.status]) acc[item.status] = [];
      acc[item.status].push(item);
      return acc;
    },
    {} as Record<QueueStatus, QueueItem[]>
  );

  // Group items by station for station queue view
  const itemsByStation = items.reduce(
    (acc, item) => {
      const key = item.station_id || "unassigned";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, QueueItem[]>
  );

  return {
    items,
    itemsByStatus,
    itemsByStation,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    addComment,
    getComments,
    getHistory,
  };
}

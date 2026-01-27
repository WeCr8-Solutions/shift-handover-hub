import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { Database } from "@/integrations/supabase/types";

export type QueueItemType = Database["public"]["Enums"]["queue_item_type"];
export type QueueStatus = Database["public"]["Enums"]["queue_status"];
export type QueuePriority = Database["public"]["Enums"]["queue_priority"];

export interface QueueItem {
  id: string;
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
  started_at: string | null;
  completed_at: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
  tags?: string[];
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
  started_at?: string | null;
  completed_at?: string | null;
  tags?: string[];
}

export function useQueue(filters?: {
  status?: QueueStatus[];
  item_type?: QueueItemType[];
  station_id?: string;
  assigned_to?: string;
}) {
  const { user, profile } = useAuth();
  const { currentTeam } = useCurrentTeam();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    let query = supabase
      .from("queue_items")
      .select("*")
      .order("position", { ascending: true })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

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

    setLoading(false);
  }, [user, currentTeam, filters?.status, filters?.item_type, filters?.station_id, filters?.assigned_to]);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_items",
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchItems]);

  const createItem = useCallback(
    async (input: CreateQueueItemInput) => {
      if (!user || !profile) return { error: "Not authenticated" };

      // Get max position
      const { data: maxPosData } = await supabase
        .from("queue_items")
        .select("position")
        .eq("team_id", currentTeam?.id || "")
        .order("position", { ascending: false })
        .limit(1);

      const maxPosition = maxPosData?.[0]?.position || 0;

      const { error } = await supabase.from("queue_items").insert({
        team_id: currentTeam?.id || null,
        item_type: input.item_type,
        title: input.title,
        description: input.description || null,
        work_order: input.work_order || null,
        part_number: input.part_number || null,
        operation_number: input.operation_number || null,
        quantity: input.quantity || null,
        priority: input.priority || "normal",
        position: maxPosition + 1,
        station_id: input.station_id || null,
        assigned_to: input.assigned_to || null,
        assigned_by: input.assigned_to ? user.id : null,
        due_date: input.due_date || null,
        scheduled_start: input.scheduled_start || null,
        scheduled_end: input.scheduled_end || null,
        estimated_duration: input.estimated_duration || null,
        tags: input.tags || [],
        created_by: user.id,
      });

      if (error) return { error: error.message };

      await fetchItems();
      return { error: null };
    },
    [user, profile, currentTeam, fetchItems]
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

      const item = items.find((i) => i.id === itemId);
      if (!item) return { error: "Item not found" };

      const oldPosition = item.position;

      // Update positions of affected items
      if (newPosition < oldPosition) {
        // Moving up - increment positions of items between new and old
        for (const i of items) {
          if (i.position >= newPosition && i.position < oldPosition && i.id !== itemId) {
            await supabase
              .from("queue_items")
              .update({ position: i.position + 1 })
              .eq("id", i.id);
          }
        }
      } else {
        // Moving down - decrement positions of items between old and new
        for (const i of items) {
          if (i.position > oldPosition && i.position <= newPosition && i.id !== itemId) {
            await supabase
              .from("queue_items")
              .update({ position: i.position - 1 })
              .eq("id", i.id);
          }
        }
      }

      // Update the moved item's position
      await supabase.from("queue_items").update({ position: newPosition }).eq("id", itemId);

      await fetchItems();
      return { error: null };
    },
    [user, items, fetchItems]
  );

  const addComment = useCallback(
    async (itemId: string, content: string) => {
      if (!user || !profile) return { error: "Not authenticated" };

      const { error } = await supabase.from("queue_item_comments").insert({
        queue_item_id: itemId,
        user_id: user.id,
        user_name: profile.display_name,
        content,
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

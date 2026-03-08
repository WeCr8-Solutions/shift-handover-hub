import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DimensionCheckRequest {
  id: string;
  routing_step_id: string;
  queue_item_id: string;
  organization_id: string | null;
  requested_by: string | null;
  requested_by_name: string | null;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export function useDimensionRequests() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<DimensionCheckRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async (routingStepId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("dimension_check_requests")
      .select("*")
      .eq("routing_step_id", routingStepId)
      .order("created_at", { ascending: false });
    setRequests((data as DimensionCheckRequest[]) || []);
    setLoading(false);
  }, []);

  const fetchRequestsByQueueItem = useCallback(async (queueItemId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("dimension_check_requests")
      .select("*")
      .eq("queue_item_id", queueItemId)
      .order("created_at", { ascending: false });
    setRequests((data as DimensionCheckRequest[]) || []);
    setLoading(false);
  }, []);

  const submitRequest = async (routingStepId: string, queueItemId: string, reason: string) => {
    const { error } = await supabase.from("dimension_check_requests").insert({
      routing_step_id: routingStepId,
      queue_item_id: queueItemId,
      requested_by: user?.id,
      requested_by_name: profile?.display_name || null,
      reason,
    });
    if (!error) await fetchRequests(routingStepId);
    return { error: error?.message || null };
  };

  const reviewRequest = async (requestId: string, status: "approved" | "dismissed", notes?: string) => {
    const { error } = await supabase
      .from("dimension_check_requests")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_by_name: profile?.display_name || null,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    return { error: error?.message || null };
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return {
    requests,
    loading,
    pendingCount,
    fetchRequests,
    fetchRequestsByQueueItem,
    submitRequest,
    reviewRequest,
  };
}

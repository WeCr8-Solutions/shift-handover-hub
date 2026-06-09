/**
 * useDeliveryRequests
 *
 * Tracks physical hand-carry of parts + paperwork between stations after a
 * routing-advance. A delivery is created automatically by the
 * `pass_work_order_to_next_step` RPC (status='pending'), then progresses:
 *
 *   pending  → in_transit  (someone picks the work up)
 *            → delivered   (someone drops it off at the next station)
 *
 * Until `delivered`, the receiving station shows the WO with an "Awaiting
 * delivery" badge and the WO's `awaiting_delivery` flag is true.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";

export type DeliveryStatus = "pending" | "in_transit" | "delivered" | "cancelled";

export interface DeliveryRequest {
  id: string;
  organization_id: string;
  queue_item_id: string | null;
  routing_step_id: string | null;
  from_station_id: string | null;
  to_station_id: string | null;
  status: DeliveryStatus;
  priority: string | null;
  quantity: number | null;
  notes: string | null;
  requested_by: string | null;
  requested_by_name: string | null;
  picked_up_by: string | null;
  picked_up_by_name: string | null;
  picked_up_at: string | null;
  delivered_by: string | null;
  delivered_by_name: string | null;
  delivered_at: string | null;
  estimated_delivery_time: string | null;
  created_at: string;
  updated_at: string;
  // Joined display fields (filled below)
  from_station_name?: string | null;
  to_station_name?: string | null;
  work_order?: string | null;
  part_number?: string | null;
}

interface UseDeliveryRequestsResult {
  deliveries: DeliveryRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markPickedUp: (id: string) => Promise<{ error: string | null }>;
  markDelivered: (id: string) => Promise<{ error: string | null }>;
  cancel: (id: string) => Promise<{ error: string | null }>;
}

const ACTIVE_STATUSES: DeliveryStatus[] = ["pending", "in_transit"];

export function useDeliveryRequests(): UseDeliveryRequestsResult {
  const { organization } = useOrgContext();
  const orgId = organization?.id;

  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    if (!orgId) {
      setDeliveries([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("delivery_requests")
        .select("*")
        .eq("organization_id", orgId)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: true });
      if (err) throw err;

      const rows = (data || []) as DeliveryRequest[];
      const stationIds = Array.from(
        new Set(
          rows.flatMap((r) => [r.from_station_id, r.to_station_id]).filter(Boolean) as string[],
        ),
      );
      const queueItemIds = Array.from(
        new Set(rows.map((r) => r.queue_item_id).filter(Boolean) as string[]),
      );

      const [stationsRes, itemsRes] = await Promise.all([
        stationIds.length
          ? supabase.from("stations").select("id, name").in("id", stationIds)
          : Promise.resolve({ data: [] as any[] }),
        queueItemIds.length
          ? supabase
              .from("queue_items")
              .select("id, work_order, part_number")
              .in("id", queueItemIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const stationMap = new Map<string, string>(
        (stationsRes.data || []).map((s: any) => [s.id, s.name]),
      );
      const itemMap = new Map<string, { work_order: string | null; part_number: string | null }>(
        (itemsRes.data || []).map((i: any) => [
          i.id,
          { work_order: i.work_order, part_number: i.part_number },
        ]),
      );

      setDeliveries(
        rows.map((r) => ({
          ...r,
          from_station_name: r.from_station_id ? stationMap.get(r.from_station_id) ?? null : null,
          to_station_name: r.to_station_id ? stationMap.get(r.to_station_id) ?? null : null,
          work_order: r.queue_item_id ? itemMap.get(r.queue_item_id)?.work_order ?? null : null,
          part_number: r.queue_item_id ? itemMap.get(r.queue_item_id)?.part_number ?? null : null,
        })),
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void fetchDeliveries();
  }, [fetchDeliveries]);

  // Realtime: refresh whenever any delivery for this org changes.
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`delivery_requests:${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_requests", filter: `organization_id=eq.${orgId}` },
        () => void fetchDeliveries(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId, fetchDeliveries]);

  const markPickedUp = useCallback(
    async (id: string) => {
      const { error: err } = await supabase.rpc("mark_delivery_picked_up", { _delivery_id: id });
      if (err) return { error: err.message };
      await fetchDeliveries();
      return { error: null };
    },
    [fetchDeliveries],
  );

  const markDelivered = useCallback(
    async (id: string) => {
      const { error: err } = await supabase.rpc("mark_delivery_delivered", { _delivery_id: id });
      if (err) return { error: err.message };
      await fetchDeliveries();
      return { error: null };
    },
    [fetchDeliveries],
  );

  const cancel = useCallback(
    async (id: string) => {
      const { error: err } = await supabase
        .from("delivery_requests")
        .update({ status: "cancelled" as DeliveryStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (err) return { error: err.message };
      await fetchDeliveries();
      return { error: null };
    },
    [fetchDeliveries],
  );

  return { deliveries, loading, error, refetch: fetchDeliveries, markPickedUp, markDelivered, cancel };
}

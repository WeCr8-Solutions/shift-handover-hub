/**
 * useWorkOrderTraveler — fetches everything the printable traveler needs in one
 * round-trip: the work order, its routing steps, and any comments tagged as
 * "Special Instructions". Serial numbers are derived from `metadata.serials`
 * if present, otherwise blank numbered rows are rendered = order qty.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TravelerRoutingStep {
  id: string;
  step_number: number;
  operation_name: string;
  operation_type: string | null;
  station_name?: string | null;
  estimated_duration: number | null;
  outside_vendor: string | null;
  po_number: string | null;
  expected_return_date: string | null;
}

export interface TravelerWorkOrder {
  id: string;
  work_order: string | null;
  part_number: string | null;
  title: string;
  description: string | null;
  quantity: number | null;
  priority: string;
  status: string;
  due_date: string | null;
  scheduled_start: string | null;
  created_at: string;
  organization_id: string | null;
  metadata: Record<string, any> | null;
  tags: string[] | null;
  operation_number: string | null;
}

export interface TravelerData {
  workOrder: TravelerWorkOrder;
  routing: TravelerRoutingStep[];
  serials: string[];
}

export function useWorkOrderTraveler(workOrderId: string | undefined) {
  return useQuery({
    enabled: !!workOrderId,
    queryKey: ["traveler-work-order", workOrderId],
    queryFn: async (): Promise<TravelerData | null> => {
      if (!workOrderId) return null;

      const { data: wo, error: woErr } = await supabase
        .from("queue_items")
        .select(
          "id, work_order, part_number, title, description, quantity, priority, status, due_date, scheduled_start, created_at, organization_id, metadata, tags, operation_number",
        )
        .eq("id", workOrderId)
        .maybeSingle();
      if (woErr) throw woErr;
      if (!wo) return null;

      const { data: routing, error: rErr } = await supabase
        .from("work_order_routing")
        .select(
          "id, step_number, operation_name, operation_type, estimated_duration, outside_vendor, po_number, expected_return_date, station_id, stations(name)",
        )
        .eq("queue_item_id", workOrderId)
        .order("step_number", { ascending: true });
      if (rErr) throw rErr;

      const steps: TravelerRoutingStep[] = (routing ?? []).map((r: any) => ({
        id: r.id,
        step_number: r.step_number,
        operation_name: r.operation_name,
        operation_type: r.operation_type,
        station_name: r.stations?.name ?? null,
        estimated_duration: r.estimated_duration,
        outside_vendor: r.outside_vendor,
        po_number: r.po_number,
        expected_return_date: r.expected_return_date,
      }));

      const meta = (wo.metadata as Record<string, any>) ?? {};
      const metaSerials: unknown = meta.serials ?? meta.serial_numbers;
      const serials: string[] = Array.isArray(metaSerials) ? metaSerials.map(String) : [];

      return {
        workOrder: wo as TravelerWorkOrder,
        routing: steps,
        serials,
      };
    },
  });
}

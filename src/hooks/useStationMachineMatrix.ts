/**
 * Concierge station ↔ machine assignment.
 * station_machine_assignments is keyed UNIQUE on station_id, so each station
 * has at most one assigned purchase. Backed by the
 * `concierge_assign_purchase_to_station` admin RPC.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StationRow { id: string; name: string; station_id: string; work_center: string }
export interface PurchaseRow {
  id: string;
  machine_library_id: string;
  is_active: boolean;
  machine?: { display_name?: string | null; manufacturer?: string | null; model?: string | null } | null;
}
export interface AssignmentRow { station_id: string; purchase_id: string }

export function useStationMachineMatrix(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const enabled = !!orgId;
  const queryKey = ["concierge-station-machine-matrix", orgId];

  const query = useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      if (!orgId) return { stations: [], purchases: [], assignments: [] };
      const [stationsRes, purchasesRes, assignmentsRes] = await Promise.all([
        (supabase as any).from("stations")
          .select("id, name, station_id, work_center")
          .eq("organization_id", orgId)
          .order("name", { ascending: true }),
        (supabase as any).from("organization_machine_purchases")
          .select("id, machine_library_id, is_active, machine:verified_machine_library(display_name, manufacturer, model)")
          .eq("organization_id", orgId)
          .eq("is_active", true),
        (supabase as any).from("station_machine_assignments")
          .select("station_id, purchase_id")
          .eq("organization_id", orgId),
      ]);
      if (stationsRes.error) throw stationsRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      return {
        stations: (stationsRes.data ?? []) as StationRow[],
        purchases: (purchasesRes.data ?? []) as PurchaseRow[],
        assignments: (assignmentsRes.data ?? []) as AssignmentRow[],
      };
    },
  });

  const assign = useMutation({
    mutationFn: async (input: { stationId: string; purchaseId: string | null }) => {
      const attach = !!input.purchaseId;
      const { error } = await (supabase as any).rpc("concierge_assign_purchase_to_station", {
        _station_id: input.stationId,
        _purchase_id: input.purchaseId,
        _attach: attach,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment updated");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Assignment failed"),
  });

  return { query, assign };
}

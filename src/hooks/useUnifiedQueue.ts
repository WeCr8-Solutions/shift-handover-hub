/**
 * useUnifiedQueue
 *
 * Single hook for "give me this org's active work orders" regardless of source.
 *
 *   Native            → queue_items via Supabase (RLS-scoped)
 *   JobBOSS / SAP     → live read-through via the vendor's edge function
 *                       (no Supabase persistence, ITAR/FedRAMP-safe)
 *
 * The shape returned matches the subset of `queue_items` that every dashboard
 * surface (queue, kanban, station view, KPI cards, AI assistant) consumes,
 * so call sites don't have to branch.
 *
 * Read-through items carry a synthetic `id` of `${vendor}:${erp_job_id}` and
 * `source_system === vendor`, which lets handoff/AI-assistant features tell
 * "this is live ERP data, do not try to mutate it directly" from a single
 * field check.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useDataSourceMode } from "@/hooks/useDataSourceMode";

export interface UnifiedWorkOrder {
  id: string;
  source_system: "native" | "jobboss" | "sap";
  is_read_through: boolean;
  work_order: string | null;
  title: string;
  part_number: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  station_id: string | null;
  quantity: number | null;
  qty_completed: number | null;
  erp_job_id: string | null;
  raw?: Record<string, unknown>;
}

const NATIVE_COLUMNS =
  "id, work_order, title, part_number, status, priority, due_date, station_id, quantity, qty_completed, erp_job_id, erp_source";

export function useUnifiedQueue() {
  const { organization } = useOrgContext();
  const { mode, vendor, isReadThrough, isItar, loading: modeLoading } = useDataSourceMode();
  const orgId = organization?.id;

  const query = useQuery({
    enabled: !!orgId && !modeLoading,
    queryKey: ["unified-queue", orgId, mode],
    staleTime: 30_000,
    queryFn: async (): Promise<UnifiedWorkOrder[]> => {
      if (!orgId) return [];

      // ── Native + write_through ERP orgs read from queue_items ─────────────
      if (!isReadThrough) {
        const { data, error } = await supabase
          .from("queue_items")
          .select(NATIVE_COLUMNS)
          .eq("organization_id", orgId)
          .not("status", "in", "(completed,cancelled)")
          .order("priority", { ascending: false })
          .limit(500);
        if (error) throw error;
        return (data ?? []).map((r: any) => ({
          id: r.id,
          source_system: (r.erp_source as "jobboss" | "sap") ?? "native",
          is_read_through: false,
          work_order: r.work_order,
          title: r.title,
          part_number: r.part_number,
          status: r.status,
          priority: r.priority,
          due_date: r.due_date,
          station_id: r.station_id,
          quantity: r.quantity,
          qty_completed: r.qty_completed,
          erp_job_id: r.erp_job_id,
        }));
      }

      // ── Read-through: invoke the vendor edge function ─────────────────────
      const fn = vendor === "sap" ? "sap-sync" : "erp-sync";
      const body =
        vendor === "sap"
          ? { organization_id: orgId, resource: "production_orders", top: 200 }
          : { organization_id: orgId, sync_type: "incremental", read_only: true };

      const { data, error } = await supabase.functions.invoke(fn, { body });
      if (error || !data) return [];

      // SAP returns { ok, data: NormalizedSapOrder[] }; JobBOSS read_through
      // currently returns { skipped:true } until a future read endpoint lands,
      // so we degrade gracefully and surface zero rows.
      const rows: any[] = Array.isArray((data as any).data) ? (data as any).data : [];
      return rows.map((r) => ({
        id: `${vendor}:${r.erp_job_id ?? r.work_order ?? r.work_order_number ?? crypto.randomUUID()}`,
        source_system: vendor as "jobboss" | "sap",
        is_read_through: true,
        work_order: r.work_order ?? r.work_order_number ?? r.erp_job_id ?? null,
        title: r.title ?? r.part_name ?? r.part_number ?? r.work_order_number ?? r.erp_job_id ?? "ERP Order",
        part_number: r.part_number ?? null,
        status: r.status ?? "queued",
        priority: r.priority ?? "normal",
        due_date: r.due_date ?? null,
        station_id: null,
        quantity: r.quantity_ordered ?? r.quantity ?? null,
        qty_completed: r.quantity_complete ?? r.qty_completed ?? 0,
        erp_job_id: r.erp_job_id ?? r.work_order_number ?? null,
        raw: r,
      }));
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading || modeLoading,
    error: query.error,
    refetch: query.refetch,
    mode,
    vendor,
    isReadThrough,
    isItar,
  };
}

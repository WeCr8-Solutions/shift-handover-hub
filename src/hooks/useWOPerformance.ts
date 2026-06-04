/**
 * useWOPerformance — Roadmap item #20 (materialized current-WO-performance view).
 *
 * Wraps the `wo_performance_summary` SQL view so charts, the morning brief,
 * and ad-hoc supervisor screens share a single computation of pct_complete,
 * schedule_status, and setup_variance_pct.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";

export interface WOPerformanceRow {
  queue_item_id: string;
  organization_id: string | null;
  team_id: string | null;
  station_id: string | null;
  work_order: string | null;
  part_number: string | null;
  operation_number: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  qty_original: number | null;
  qty_completed: number | null;
  qty_scrap: number | null;
  qty_rework: number | null;
  qty_open: number | null;
  setup_planned_minutes: number | null;
  cycle_time_minutes: number | null;
  first_article_minutes: number | null;
  setup_actual_minutes: number | null;
  run_actual_minutes: number | null;
  current_phase: string | null;
  setup_started_at: string | null;
  run_started_at: string | null;
  station_name: string | null;
  work_center: string | null;
  work_center_type: string | null;
  station_state: string | null;
  current_operator_name: string | null;
  schedule_status: "on_time" | "late" | "overdue" | "at_risk" | "on_track" | "unknown";
  pct_complete: number;
  setup_variance_pct: number | null;
}

interface Options {
  teamId?: string | null;
  statuses?: string[]; // default: open work
  limit?: number;
}

export function useWOPerformance(opts: Options = {}) {
  const { organization } = useOrgContext();
  const [rows, setRows] = useState<WOPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    if (!organization?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // `wo_performance_summary` is a security_invoker view → RLS on queue_items applies.
      // Type cast: the view is not in the generated `Database` types yet.
      let q = (supabase as unknown as {
        from: (name: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => unknown;
          };
        };
      })
        .from("wo_performance_summary")
        .select("*")
        .eq("organization_id", organization.id) as unknown as {
        in: (col: string, vals: string[]) => unknown;
        eq: (col: string, val: string) => unknown;
        limit: (n: number) => unknown;
      };

      const statuses = opts.statuses ?? ["pending", "queued", "in_progress", "on_hold"];
      q = (q.in("status", statuses) as unknown) as typeof q;
      if (opts.teamId) q = (q.eq("team_id", opts.teamId) as unknown) as typeof q;
      if (opts.limit) q = (q.limit(opts.limit) as unknown) as typeof q;

      const { data, error: err } = (await (q as unknown as Promise<{
        data: WOPerformanceRow[] | null;
        error: { message: string } | null;
      }>));
      if (err) throw err;
      setRows(data ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load WO performance");
    } finally {
      setLoading(false);
    }
  }, [organization?.id, opts.teamId, opts.limit, opts.statuses]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  return { rows, loading, error, refresh: fetchRows };
}

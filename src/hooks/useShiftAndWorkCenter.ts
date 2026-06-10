/**
 * Concierge shift schedules CRUD.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShiftScheduleRow {
  id: string;
  organization_id: string;
  team_id: string | null;
  shift_name: string;
  shift_code: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  is_active: boolean;
  color: string;
}

export function useShiftSchedules(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const queryKey = ["concierge-shift-schedules", orgId];

  const query = useQuery<ShiftScheduleRow[]>({
    queryKey,
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any)
        .from("shift_schedules")
        .select("*")
        .eq("organization_id", orgId)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ShiftScheduleRow[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const upsert = useMutation({
    mutationFn: async (row: Partial<ShiftScheduleRow> & { id?: string }) => {
      if (!orgId) throw new Error("Missing organization");
      const { id, ...rest } = row;
      if (id) {
        const { error } = await (supabase as any).from("shift_schedules").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("shift_schedules").insert({ ...rest, organization_id: orgId });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Shift saved"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("shift_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Shift deleted"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  return { query, upsert, remove };
}


export interface WorkCenterConfigRow {
  id: string;
  organization_id: string;
  work_center_type: string;
  display_name: string;
  default_cycle_time: number | null;
  default_setup_time: number | null;
  requires_first_article: boolean;
  requires_qa_signoff: boolean;
  track_scrap: boolean;
  track_rework: boolean;
  is_active: boolean;
  sort_order: number;
}

export function useWorkCenterConfigs(orgId: string | null | undefined) {
  const qc = useQueryClient();
  const queryKey = ["concierge-work-center-configs", orgId];

  const query = useQuery<WorkCenterConfigRow[]>({
    queryKey,
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await (supabase as any)
        .from("work_center_config")
        .select("*")
        .eq("organization_id", orgId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as WorkCenterConfigRow[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const upsert = useMutation({
    mutationFn: async (row: Partial<WorkCenterConfigRow> & { id?: string }) => {
      if (!orgId) throw new Error("Missing organization");
      const { id, ...rest } = row;
      if (id) {
        const { error } = await (supabase as any).from("work_center_config").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("work_center_config").insert({ ...rest, organization_id: orgId });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Work center saved"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("work_center_config").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Work center deleted"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  return { query, upsert, remove };
}

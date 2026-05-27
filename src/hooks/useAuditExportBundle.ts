import { supabase } from "@/integrations/supabase/client";

export type AuditRecordType =
  | "work_orders"
  | "routing"
  | "handoffs"
  | "downtime"
  | "ncrs"
  | "quality"
  | "queue_changes"
  | "station_sessions";

export const RECORD_TYPE_LABELS: Record<AuditRecordType, string> = {
  work_orders: "Work Orders",
  routing: "Routing Steps",
  handoffs: "Shift Handoffs",
  downtime: "Downtime Events",
  ncrs: "NCR Reports",
  quality: "Quality Inspections",
  queue_changes: "Queue Changes",
  station_sessions: "Station Sessions",
};

export type AuditStandard = "AS9100" | "ISO9001" | "ITAR" | "FDA_QSR" | "CUSTOM";

export const STANDARD_CLAUSES: Record<AuditStandard, { label: string; clauses: { code: string; topic: string }[] }> = {
  AS9100: {
    label: "AS9100 Rev D",
    clauses: [
      { code: "8.5.1", topic: "Control of production & service provision" },
      { code: "8.5.2", topic: "Identification & traceability" },
      { code: "8.6", topic: "Release of products & services" },
      { code: "8.7", topic: "Control of nonconforming outputs" },
      { code: "9.1", topic: "Monitoring, measurement, analysis, evaluation" },
      { code: "10.2", topic: "Nonconformity & corrective action" },
    ],
  },
  ISO9001: {
    label: "ISO 9001:2015",
    clauses: [
      { code: "8.5", topic: "Production & service provision" },
      { code: "8.7", topic: "Control of nonconforming outputs" },
      { code: "9.1", topic: "Monitoring, measurement, analysis & evaluation" },
    ],
  },
  ITAR: {
    label: "ITAR / EAR controlled output",
    clauses: [
      { code: "120.10", topic: "Technical data control" },
      { code: "127.1", topic: "Record-keeping for controlled articles" },
    ],
  },
  FDA_QSR: {
    label: "FDA 21 CFR Part 820",
    clauses: [
      { code: "820.70", topic: "Production & process controls" },
      { code: "820.90", topic: "Nonconforming product" },
      { code: "820.180", topic: "Records — general requirements" },
    ],
  },
  CUSTOM: { label: "Internal audit", clauses: [] },
};

export interface AuditBundleMeta {
  organization_id: string;
  organization_name: string;
  month: string; // YYYY-MM or "custom"
  date_from: string;
  date_to: string;
  standard: AuditStandard;
  generated_at: string;
  generated_by: string;
  record_types: AuditRecordType[];
}

export interface AuditBundle {
  meta: AuditBundleMeta;
  data: Partial<Record<AuditRecordType, any[]>>;
}

export interface FetchBundleArgs {
  organization_id: string;
  organization_name: string;
  date_from: string;
  date_to: string;
  month: string;
  standard: AuditStandard;
  record_types: AuditRecordType[];
  station_id?: string;
  team_id?: string;
  generated_by: string;
}

/** Single-shot fetcher that pulls every requested record type in parallel and returns a normalized bundle. */
export async function fetchAuditBundle(args: FetchBundleArgs): Promise<AuditBundle> {
  const { organization_id, date_from, date_to, record_types, station_id, team_id } = args;
  const isoEnd = date_to + "T23:59:59";

  const tasks: Record<AuditRecordType, () => Promise<any[]>> = {
    work_orders: async () => {
      let q = supabase
        .from("queue_items")
        .select("id, work_order, part_number, title, status, priority, quantity, station_id, team_id, started_at, completed_at, created_at, updated_at")
        .eq("organization_id", organization_id)
        .eq("item_type", "work_order")
        .gte("created_at", date_from)
        .lte("created_at", isoEnd)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (station_id) q = q.eq("station_id", station_id);
      if (team_id) q = q.eq("team_id", team_id);
      const { data } = await q;
      return data || [];
    },
    routing: async () => {
      const { data } = await supabase
        .from("work_order_routing")
        .select("id, queue_item_id, step_order, operation_number, work_center, work_center_type, station_id, status, started_at, completed_at, actual_duration_minutes, operator_name, inspection_status, inspection_notes")
        .eq("organization_id", organization_id)
        .gte("created_at", date_from)
        .lte("created_at", isoEnd)
        .order("queue_item_id")
        .limit(5000);
      return data || [];
    },
    handoffs: async () => {
      let q = supabase
        .from("handoff_records")
        .select("id, date, shift, station_id, team_id, work_order, part_number, operation_number, outgoing_operator_name, incoming_operator_name, supervisor_name, primary_state, state_reason, delay_code, created_at")
        .eq("organization_id", organization_id)
        .gte("date", date_from)
        .lte("date", date_to)
        .order("date", { ascending: false })
        .limit(5000);
      if (station_id) q = q.eq("station_id", station_id);
      if (team_id) q = q.eq("team_id", team_id);
      const { data } = await q;
      return data || [];
    },
    downtime: async () => {
      let q = supabase
        .from("downtime_events")
        .select("id, station_id, team_id, downtime_type, reason_code, description, started_at, ended_at, duration_minutes, reported_by_name, resolved_by_name, work_order_id")
        .eq("organization_id", organization_id)
        .gte("started_at", date_from)
        .lte("started_at", isoEnd)
        .order("started_at", { ascending: false })
        .limit(5000);
      if (station_id) q = q.eq("station_id", station_id);
      if (team_id) q = q.eq("team_id", team_id);
      const { data } = await q;
      return data || [];
    },
    ncrs: async () => {
      const { data } = await supabase
        .from("ncr_reports")
        .select("id, ncr_number, work_order_number, part_number, serial_or_lot, operation_number, defect_type, disposition, description, authorized_by_name, authorized_at, authorization_status, quantity_affected, created_at")
        .eq("organization_id", organization_id)
        .gte("created_at", date_from)
        .lte("created_at", isoEnd)
        .order("created_at", { ascending: false })
        .limit(5000);
      return data || [];
    },
    quality: async () => {
      let q = supabase
        .from("quality_inspections")
        .select("id, queue_item_id, checkpoint_id, station_id, inspector_name, status, notes, defects_found, completed_at, created_at")
        .eq("organization_id", organization_id)
        .gte("created_at", date_from)
        .lte("created_at", isoEnd)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (station_id) q = q.eq("station_id", station_id);
      const { data } = await q;
      return data || [];
    },
    queue_changes: async () => {
      const { data } = await supabase
        .from("queue_item_history")
        .select("id, queue_item_id, user_name, action, old_value, new_value, created_at")
        .eq("organization_id", organization_id)
        .gte("created_at", date_from)
        .lte("created_at", isoEnd)
        .order("created_at", { ascending: false })
        .limit(5000);
      return data || [];
    },
    station_sessions: async () => {
      let q = supabase
        .from("operator_station_sessions")
        .select("id, station_id, user_id, shift, checked_in_at, checked_out_at, is_active")
        .eq("organization_id", organization_id)
        .gte("checked_in_at", date_from)
        .lte("checked_in_at", isoEnd)
        .order("checked_in_at", { ascending: false })
        .limit(5000);
      if (station_id) q = q.eq("station_id", station_id);
      const { data } = await q;
      return data || [];
    },
  };

  const results = await Promise.all(record_types.map(async (t) => [t, await tasks[t]()] as const));
  const data: Partial<Record<AuditRecordType, any[]>> = {};
  for (const [t, rows] of results) data[t] = rows;

  return {
    meta: {
      organization_id,
      organization_name: args.organization_name,
      month: args.month,
      date_from,
      date_to,
      standard: args.standard,
      generated_at: new Date().toISOString(),
      generated_by: args.generated_by,
      record_types,
    },
    data,
  };
}

export function useAuditExportBundle() {
  // Thin facade for code parity with other hooks; the fetch is on-demand.
  return { fetchAuditBundle };
}

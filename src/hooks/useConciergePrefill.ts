import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Aggregates an org's real configuration data for prefilling the printable
 * Concierge Sales Pack worksheets. Returns parallel arrays of rows (strings)
 * matching the column order used in ConciergeSalesPack.tsx WorksheetTable.
 * Only platform admins / developers should invoke this (gated upstream by
 * the page that already checks hasStaffAccess before mounting).
 */
export interface ConciergePrefillData {
  equipment: string[][]; // asset_tag, name, equipment_type, manufacturer, model, serial_number, controller, machine_type
  stations: string[][]; // department, station_name, station_id, station_type, capacity, shift_pattern
  users: string[][]; // email, first_name, last_name, role, department, default_station, phone, send_invite_now
  routing: string[][]; // template_name, step_number, operation, work_center, setup_minutes, run_minutes_per_unit, dimension_spec, quality_checkpoint
  quality: string[][]; // checkpoint_name, operation_after, tool_required, frequency, sample_size
  erp: { connector: string | null; baseUrl: string | null; persistenceMode: string | null } | null;
  intake: Record<string, any>; // module_key -> payload
  subscription: {
    plan: string;
    status: string;
    tier: string;
    seatLimit: number | null;
    seatsUsed: number;
    openSeats: number | null;
    pendingInvites: number;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    seatAssignments: string[][]; // seat_number, email, name, role, assigned (Y/N), notes
  };
}

const EMPTY: ConciergePrefillData = {
  equipment: [],
  stations: [],
  users: [],
  routing: [],
  quality: [],
  erp: null,
  intake: {},
  subscription: {
    plan: "free",
    status: "unknown",
    tier: "free",
    seatLimit: null,
    seatsUsed: 0,
    openSeats: null,
    pendingInvites: 0,
    periodEnd: null,
    cancelAtPeriodEnd: false,
    seatAssignments: [],
  },
};

export function useConciergePrefill(organizationId: string | null | undefined, engagementId: string | null | undefined) {
  return useQuery({
    queryKey: ["concierge-prefill", organizationId, engagementId],
    enabled: !!organizationId,
    queryFn: async (): Promise<ConciergePrefillData> => {
      if (!organizationId) return EMPTY;

      const [eqRes, stRes, deptRes, memRes, rtRes, rsRes, qcRes, erpRes, intakeRes, subRes, entRes, orgRes, inviteRes] = await Promise.all([
        supabase.from("equipment").select("asset_tag,name,equipment_type,manufacturer,model,serial_number,metadata").eq("organization_id", organizationId).order("asset_tag"),
        supabase.from("stations").select("station_id,name,work_center_type,daily_capacity_hours,department_id").eq("organization_id", organizationId).order("name"),
        supabase.from("departments").select("id,name").eq("organization_id", organizationId),
        supabase.from("organization_members").select("user_id,role,joined_at").eq("organization_id", organizationId).order("joined_at"),
        supabase.from("routing_templates").select("id,name").eq("organization_id", organizationId).order("name"),
        supabase.from("routing_template_steps").select("template_id,step_number,operation_name,work_center_type,setup_time_minutes,cycle_time_minutes,instructions").eq("organization_id", organizationId).order("step_number"),
        supabase.from("quality_checkpoints").select("name,checkpoint_type,required_for_work_centers,checklist_items").eq("organization_id", organizationId),
        supabase.from("erp_connections").select("erp_vendor,api_base_url,erp_persistence_mode,is_active").eq("organization_id", organizationId).maybeSingle(),
        engagementId
          ? supabase.from("onboarding_intake_responses").select("module_key,payload").eq("engagement_id", engagementId)
          : Promise.resolve({ data: [] as any[], error: null }),
        supabase.from("subscriptions").select("status,quantity,current_period_end,cancel_at_period_end,stripe_price_id").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("entitlements").select("plan,limits").eq("organization_id", organizationId).maybeSingle(),
        supabase.from("organizations").select("subscription_tier,subscription_status").eq("id", organizationId).maybeSingle(),
        supabase.from("organization_invites").select("invited_email,org_role,expires_at,uses_count,max_uses,is_active").eq("organization_id", organizationId),
      ]);

      const deptMap = new Map<string, string>((deptRes.data ?? []).map((d: any) => [d.id, d.name]));
      const templateMap = new Map<string, string>((rtRes.data ?? []).map((t: any) => [t.id, t.name]));

      // Resolve member emails/names via profiles (separate query so RLS works)
      const userIds = (memRes.data ?? []).map((m: any) => m.user_id);
      let profileMap = new Map<string, { email: string; display_name: string }>();
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id,email,display_name").in("user_id", userIds);
        profileMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      }

      const intake: Record<string, any> = {};
      for (const row of (intakeRes.data ?? []) as any[]) intake[row.module_key] = row.payload;

      return {
        equipment: (eqRes.data ?? []).map((e: any) => [
          e.asset_tag ?? "",
          e.name ?? "",
          e.equipment_type ?? "",
          e.manufacturer ?? "",
          e.model ?? "",
          e.serial_number ?? "",
          e.metadata?.controller ?? "",
          e.metadata?.machine_type ?? "",
        ]),
        stations: (stRes.data ?? []).map((s: any) => [
          (s.department_id && deptMap.get(s.department_id)) || "",
          s.name ?? "",
          s.station_id ?? "",
          s.work_center_type ?? "",
          String(s.daily_capacity_hours ?? ""),
          "", // shift_pattern lives in shift_schedules; left blank for sales rep to confirm
        ]),
        users: (memRes.data ?? []).map((m: any) => {
          const p = profileMap.get(m.user_id);
          const display = p?.display_name ?? "";
          const [first, ...rest] = display.split(" ");
          return [p?.email ?? "", first ?? "", rest.join(" "), m.role ?? "", "", "", "", "N"];
        }),
        routing: (rsRes.data ?? []).map((s: any) => [
          templateMap.get(s.template_id) ?? "",
          String(s.step_number ?? ""),
          s.operation_name ?? "",
          s.work_center_type ?? "",
          String(s.setup_time_minutes ?? ""),
          String(s.cycle_time_minutes ?? ""),
          "",
          s.instructions ?? "",
        ]),
        quality: (qcRes.data ?? []).map((q: any) => [
          q.name ?? "",
          (q.required_for_work_centers ?? []).join(", "),
          "",
          q.checkpoint_type ?? "",
          String(Array.isArray(q.checklist_items) ? q.checklist_items.length : ""),
        ]),
        erp: erpRes.data
          ? {
              connector: (erpRes.data as any).erp_vendor ?? null,
              baseUrl: (erpRes.data as any).api_base_url ?? null,
              persistenceMode: (erpRes.data as any).erp_persistence_mode ?? null,
            }
          : null,
        intake,
      };
    },
  });
}

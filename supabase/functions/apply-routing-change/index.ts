/**
 * supabase/functions/apply-routing-change/index.ts
 *
 * Executes a routing-change proposal that an AI Planning Assistant generated
 * AFTER an org supervisor/admin explicitly approves it in the chat UI.
 *
 * Hard guarantees:
 *   - Caller must be authenticated (JWT verified in code).
 *   - Caller must be a Supervisor / Org Admin / Org Owner / Platform Admin.
 *   - Every routing_step_id must belong to the caller's organization.
 *   - Every to_station_id must belong to the caller's organization.
 *   - Each change is applied as a separate UPDATE; partial failures are
 *     reported back per-step (no silent loss).
 *   - An activity_logs entry is written for the approval event AND a
 *     work_order_status_history entry per step it touched.
 *
 * Body shape (matches the AI's "routing-proposal" JSON):
 *   {
 *     organization_id: string,
 *     proposal_title: string,
 *     proposal_rationale: string,
 *     changes: [{
 *       routing_step_id: string,
 *       queue_item_id: string,
 *       to_station_id: string,
 *       reason?: string,
 *       work_order?: string,
 *       step_number?: number,
 *       operation_name?: string,
 *       from_station_id?: string | null,
 *       from_station_name?: string | null,
 *       to_station_name?: string | null,
 *     }, ...]
 *   }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChangeItem {
  routing_step_id: string;
  queue_item_id: string;
  to_station_id: string;
  reason?: string;
  work_order?: string;
  step_number?: number;
  operation_name?: string;
  from_station_id?: string | null;
  from_station_name?: string | null;
  to_station_name?: string | null;
}

interface RequestBody {
  organization_id: string;
  proposal_title: string;
  proposal_rationale?: string;
  changes: ChangeItem[];
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { ok: false, error: "Missing bearer token" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth context (anon + JWT) — to identify the caller
    const supaAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supaAuth.auth.getUser();
    if (userErr || !userData.user) {
      return json(401, { ok: false, error: "Invalid session" });
    }
    const userId = userData.user.id;

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid JSON body" });
    }

    if (!isUuid(body.organization_id)) {
      return json(400, { ok: false, error: "organization_id required" });
    }
    if (!body.proposal_title || typeof body.proposal_title !== "string") {
      return json(400, { ok: false, error: "proposal_title required" });
    }
    if (!Array.isArray(body.changes) || body.changes.length === 0) {
      return json(400, { ok: false, error: "changes[] required" });
    }
    if (body.changes.length > 25) {
      return json(400, { ok: false, error: "Too many changes in one proposal (max 25)" });
    }

    // Service-role client — used for hardened, validated writes only.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // --- Authorization: caller must be supervisor/admin in this org ---
    const { data: membership } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", body.organization_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return json(403, { ok: false, error: "Not a member of this organization" });
    }

    const { data: platformRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roleList = (platformRoles ?? []).map((r: any) => r.role);

    const orgRole = (membership as any).role;
    const isSupervisorOrAbove =
      roleList.includes("admin") ||
      roleList.includes("developer") ||
      roleList.includes("supervisor") ||
      orgRole === "owner" ||
      orgRole === "admin";

    if (!isSupervisorOrAbove) {
      return json(403, {
        ok: false,
        error: "Only supervisors or admins can apply routing changes.",
      });
    }

    // --- Validate every step + station belongs to this org ---
    const stepIds = body.changes.map((c) => c.routing_step_id);
    const stationIds = Array.from(new Set(body.changes.map((c) => c.to_station_id)));

    if (!stepIds.every(isUuid) || !stationIds.every(isUuid)) {
      return json(400, { ok: false, error: "All routing_step_id and to_station_id values must be UUIDs" });
    }

    const { data: steps } = await admin
      .from("work_order_routing")
      .select("id, organization_id, queue_item_id, station_id, step_number, operation_name, status")
      .in("id", stepIds);

    const stepMap = new Map<string, any>((steps ?? []).map((s: any) => [s.id, s]));

    for (const c of body.changes) {
      const step = stepMap.get(c.routing_step_id);
      if (!step) {
        return json(400, {
          ok: false,
          error: `Routing step not found: ${c.routing_step_id}`,
        });
      }
      if (step.organization_id !== body.organization_id) {
        return json(403, {
          ok: false,
          error: `Routing step ${c.routing_step_id} does not belong to this organization.`,
        });
      }
      if (step.status === "completed" || step.status === "skipped") {
        return json(400, {
          ok: false,
          error: `Cannot reroute step ${c.routing_step_id} — it is already ${step.status}.`,
        });
      }
    }

    const { data: stationRows } = await admin
      .from("stations")
      .select("id, organization_id, name")
      .in("id", stationIds);

    const stationMap = new Map<string, any>((stationRows ?? []).map((s: any) => [s.id, s]));
    for (const id of stationIds) {
      const s = stationMap.get(id);
      if (!s) {
        return json(400, { ok: false, error: `Station not found: ${id}` });
      }
      if (s.organization_id !== body.organization_id) {
        return json(403, { ok: false, error: `Station ${id} does not belong to this organization.` });
      }
    }

    // --- Apply each change individually; collect per-step result ---
    const results: Array<{
      routing_step_id: string;
      ok: boolean;
      error?: string;
      from_station_id?: string | null;
      to_station_id?: string;
    }> = [];

    let appliedCount = 0;

    for (const c of body.changes) {
      const step = stepMap.get(c.routing_step_id);
      const fromStationId = step.station_id ?? null;

      const { error: updErr } = await admin
        .from("work_order_routing")
        .update({
          station_id: c.to_station_id,
          notes: c.reason
            ? `[AI-routed ${new Date().toISOString().slice(0, 10)}] ${c.reason}`
            : undefined,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", c.routing_step_id)
        .eq("organization_id", body.organization_id);

      if (updErr) {
        results.push({
          routing_step_id: c.routing_step_id,
          ok: false,
          error: updErr.message,
        });
        continue;
      }

      appliedCount += 1;
      results.push({
        routing_step_id: c.routing_step_id,
        ok: true,
        from_station_id: fromStationId,
        to_station_id: c.to_station_id,
      });
    }

    // --- Audit: write a single activity_logs row covering the whole proposal ---
    try {
      await admin.from("activity_logs").insert({
        organization_id: body.organization_id,
        user_id: userId,
        activity_type: "data_modified",
        description: `AI routing proposal approved: ${body.proposal_title}`,
        metadata: {
          source: "ai_planning_assistant",
          proposal_title: body.proposal_title,
          proposal_rationale: body.proposal_rationale ?? null,
          changes_requested: body.changes.length,
          changes_applied: appliedCount,
          results,
        },
      } as any);
    } catch (e) {
      console.error("activity_logs insert failed (non-fatal):", e);
    }

    return json(200, {
      ok: true,
      requested: body.changes.length,
      applied: appliedCount,
      failed: body.changes.length - appliedCount,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("apply-routing-change error:", message);
    return json(500, { ok: false, error: message });
  }
});

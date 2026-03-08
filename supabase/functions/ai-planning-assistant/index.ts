import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  // Small improvement: explicitly allow methods for preflight clarity
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "").trim();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid token. Please sign in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Guard against invalid JSON / wrong body type
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, organization_id } = body ?? {};

    if (!messages || !organization_id) {
      return new Response(
        JSON.stringify({
          error: "messages and organization_id are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- Authorization: verify user belongs to requested org ---
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .single();

    if (membershipError) {
      console.error("Membership error:", membershipError);
    }

    if (!membership) {
      return new Response(
        JSON.stringify({
          error: "Access denied. You are not a member of this organization.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Usage limit check ---
    const { data: usageData, error: usageError } = await supabase.rpc("increment_ai_chat_usage", {
      _org_id: organization_id,
    });

    if (usageError) {
      console.error("Usage check error:", usageError);
    } else if (usageData?.limit_reached) {
      return new Response(
        JSON.stringify({
          error: "limit_reached",
          message: "Daily AI message limit reached. Upgrade your plan for more.",
          count: usageData.count,
          daily_limit: usageData.daily_limit,
          plan: usageData.plan,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- Determine caller's role for context ---
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (userRolesError) {
      console.error("user_roles error:", userRolesError);
    }

    const platformRoles = (userRoles || []).map((r: any) => r.role);
    const orgRole = (membership as any).role; // owner, admin, member
    const isSupervisorOrAbove =
      platformRoles.includes("admin") ||
      platformRoles.includes("developer") ||
      platformRoles.includes("supervisor") ||
      orgRole === "owner" ||
      orgRole === "admin";

    // Fetch data in parallel
    const [
      queueRes,
      stationsRes,
      routingRes,
      stationStatusRes,
      routingTemplatesRes,
      machineProfilesRes,
      manualProfilesRes,
      activeSessionsRes,
      certificationsRes,
      downtimeRes,
    ] = await Promise.all([
      supabase
        .from("queue_items")
        .select(
          "id, title, work_order, part_number, status, priority, due_date, assigned_to, station_id, item_type, quantity, qty_completed, qty_scrap, qty_rework, qty_open, quantity_locked, operation_number, created_at, estimated_duration, material_type, part_length_inches, part_width_inches, part_height_inches, part_weight_lbs, part_shape, required_tolerance, surface_finish",
        )
        .eq("organization_id", organization_id)
        .in("status", ["pending", "queued", "in_progress", "on_hold", "blocked"])
        .order("priority", { ascending: false })
        .limit(200),
      supabase
        .from("stations")
        .select("id, station_id, name, work_center, work_center_type, is_active")
        .eq("organization_id", organization_id)
        .limit(100),
      supabase
        .from("work_order_routing")
        .select(
          "id, queue_item_id, step_number, station_id, operation_name, operation_type, status, estimated_duration, setup_time_minutes, cycle_time_minutes, first_article_minutes, vendor_name, po_number, expected_return_date",
        )
        .eq("organization_id", organization_id)
        .in("status", ["pending", "in_progress"])
        .order("step_number", { ascending: true })
        .limit(500),
      supabase
        .from("current_station_status")
        .select(
          "station_id, current_job_work_order, current_job_part_number, current_job_state, current_operator_name, parts_complete, parts_required, condition_status",
        )
        .eq("organization_id", organization_id)
        .limit(100),
      supabase
        .from("routing_templates")
        .select("id, name, description")
        .eq("organization_id", organization_id)
        .limit(50),
      supabase
        .from("station_machine_assignments")
        .select(
          "station_id, purchase_id, organization_machine_purchases!inner(machine_library_id, is_active, verified_machine_library!inner(manufacturer, model, machine_type, platform_category, max_x_travel, max_y_travel, max_z_travel, max_part_weight, max_part_envelope_length, max_part_envelope_width, max_part_envelope_height, five_axis_simultaneous, fourth_axis, live_tooling, y_axis_turn, sub_spindle, probing, through_spindle_coolant, pallet_pool, bar_feeder, material_capability, typical_tolerance, hard_constraints))",
        )
        .eq("organization_id", organization_id)
        .limit(100),
      supabase
        .from("station_manual_machine_profiles")
        .select(
          "station_id, manufacturer, model, machine_type, platform_category, max_x_travel, max_y_travel, max_z_travel, max_part_weight, max_part_envelope_length, max_part_envelope_width, max_part_envelope_height, five_axis_simultaneous, fourth_axis, live_tooling, y_axis_turn, sub_spindle, probing, through_spindle_coolant, pallet_pool, bar_feeder, material_capability, typical_tolerance, hard_constraints",
        )
        .eq("organization_id", organization_id)
        .limit(100),
      supabase
        .from("operator_station_sessions")
        .select("user_id, station_id, checked_in_at, profiles!inner(display_name)")
        .eq("organization_id", organization_id)
        .eq("is_active", true)
        .is("checked_out_at", null)
        .limit(100),
      supabase
        .from("user_certifications")
        .select(
          "user_id, certification_id, status, expires_at, certifications!inner(name, category, required_for_work_centers)",
        )
        .eq("organization_id", organization_id)
        .limit(500),
      supabase
        .from("downtime_events")
        .select("id, station_id, equipment_id, downtime_type, reason_code, description, started_at, reported_by_name")
        .eq("organization_id", organization_id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(50),
    ]);

    const queueItems = queueRes.data ?? [];
    const stations = stationsRes.data ?? [];
    const routing = routingRes.data ?? [];
    const stationStatus = stationStatusRes.data ?? [];
    const routingTemplates = routingTemplatesRes.data ?? [];
    const machineProfiles = machineProfilesRes.data ?? [];
    const manualProfiles = manualProfilesRes.data ?? [];
    const activeSessions = activeSessionsRes.data ?? [];
    const certifications = certificationsRes.data ?? [];
    const activeDowntime = downtimeRes.data ?? [];

    const now = new Date().toISOString();
    const stationMap: Record<string, string> = Object.fromEntries(stations.map((s: any) => [s.id, s.name]));
    const stationTypeMap: Record<string, { name: string; type: string; work_center: string; active: boolean }> =
      Object.fromEntries(
        stations.map((s: any) => [
          s.id,
          {
            name: s.name,
            type: s.work_center_type,
            work_center: s.work_center,
            active: s.is_active,
          },
        ]),
      );

    const queueSummary = queueItems.map((q: any) => ({
      id: q.id?.slice(0, 8),
      title: q.title,
      wo: q.work_order,
      part: q.part_number,
      op: q.operation_number,
      status: q.status,
      priority: q.priority,
      due: q.due_date,
      station: q.station_id ? stationMap[q.station_id] || q.station_id : "unassigned",
      qty: q.quantity,
      completed: q.qty_completed,
      open: q.qty_open,
      locked: q.quantity_locked,
      ...(q.material_type || q.part_length_inches || q.part_shape || q.required_tolerance
        ? {
            part_specs: {
              material: q.material_type,
              length: q.part_length_inches,
              width: q.part_width_inches,
              height: q.part_height_inches,
              weight: q.part_weight_lbs,
              shape: q.part_shape,
              tolerance: q.required_tolerance,
              surface_finish: q.surface_finish,
            },
          }
        : {}),
    }));

    const stationSummary = stations.map((s: any) => ({
      name: s.name,
      id_code: s.station_id,
      type: s.work_center_type,
      work_center: s.work_center,
      active: s.is_active,
    }));

    const liveStationStatus = stationStatus.map((ss: any) => ({
      station: stationMap[ss.station_id] || ss.station_id,
      current_wo: ss.current_job_work_order,
      current_part: ss.current_job_part_number,
      state: ss.current_job_state,
      operator: ss.current_operator_name,
      progress:
        ss.parts_complete != null && ss.parts_required != null ? `${ss.parts_complete}/${ss.parts_required}` : null,
      condition: ss.condition_status,
    }));

    const overdueItems = queueItems.filter(
      (q: any) => q.due_date && new Date(q.due_date) < new Date() && q.status !== "completed",
    );

    const routingSummary = routing.slice(0, 80).map((r: any) => ({
      wo_item: r.queue_item_id?.slice(0, 8),
      step: r.step_number,
      op: r.operation_name,
      op_type: r.operation_type,
      station: r.station_id ? stationMap[r.station_id] || r.station_id : "unassigned",
      status: r.status,
      est_duration_min: r.estimated_duration,
      setup_min: r.setup_time_minutes,
      cycle_min: r.cycle_time_minutes,
      first_article_min: r.first_article_minutes,
      vendor: r.vendor_name,
      po: r.po_number,
      expected_return: r.expected_return_date,
    }));

    const buildProfileSummary = (ml: any, stationId: string, source: string) => ({
      station: stationMap[stationId] || stationId,
      source,
      manufacturer: ml.manufacturer,
      model: ml.model,
      machine_type: ml.machine_type,
      platform: ml.platform_category,
      envelope: {
        x: ml.max_x_travel,
        y: ml.max_y_travel,
        z: ml.max_z_travel,
        max_weight: ml.max_part_weight,
        max_length: ml.max_part_envelope_length,
        max_width: ml.max_part_envelope_width,
        max_height: ml.max_part_envelope_height,
      },
      capabilities: {
        five_axis: ml.five_axis_simultaneous,
        fourth_axis: ml.fourth_axis,
        live_tooling: ml.live_tooling,
        y_axis: ml.y_axis_turn,
        sub_spindle: ml.sub_spindle,
        probing: ml.probing,
        tsc: ml.through_spindle_coolant,
        pallet_pool: ml.pallet_pool,
        bar_feeder: ml.bar_feeder,
      },
      materials: ml.material_capability,
      tolerance: ml.typical_tolerance,
      constraints: ml.hard_constraints,
    });

    const verifiedContextSummary = machineProfiles
      .map((a: any) => {
        const ml = a.organization_machine_purchases?.verified_machine_library;
        if (!ml) return null;
        return buildProfileSummary(ml, a.station_id, "verified_library");
      })
      .filter(Boolean) as any[];

    const verifiedStationIds = new Set(machineProfiles.map((a: any) => a.station_id));

    const manualContextSummary = manualProfiles
      .filter((mp: any) => !verifiedStationIds.has(mp.station_id))
      .map((mp: any) => buildProfileSummary(mp, mp.station_id, "manual_entry"));

    const machineContextSummary = [...verifiedContextSummary, ...manualContextSummary];

    const stationLoad: Record<string, { items: number; est_minutes: number; in_progress: number }> = {};
    for (const q of queueItems as any[]) {
      if (!q.station_id) continue;
      if (!stationLoad[q.station_id]) {
        stationLoad[q.station_id] = {
          items: 0,
          est_minutes: 0,
          in_progress: 0,
        };
      }
      stationLoad[q.station_id].items++;
      stationLoad[q.station_id].est_minutes += q.estimated_duration || 0;
      if (q.status === "in_progress") stationLoad[q.station_id].in_progress++;
    }

    const stationLoadSummary = Object.entries(stationLoad)
      .map(([sid, load]) => ({
        station: stationMap[sid] || sid,
        queued_items: load.items,
        est_total_minutes: load.est_minutes,
        est_total_hours: Math.round((load.est_minutes / 60) * 10) / 10,
        actively_running: load.in_progress,
      }))
      .sort((a, b) => b.queued_items - a.queued_items);

    const operatorSessionsSummary = activeSessions.map((s: any) => ({
      operator: (s.profiles as any)?.display_name || "Unknown",
      station: stationMap[s.station_id] || s.station_id,
      checked_in: s.checked_in_at,
    }));

    const certsByUser: Record<
      string,
      {
        name: string;
        category: string | null;
        status: string;
        expires_at: string | null;
        required_for: string[] | null;
      }[]
    > = {};
    for (const c of certifications as any[]) {
      const cert = c.certifications as any;
      if (!certsByUser[c.user_id]) certsByUser[c.user_id] = [];
      certsByUser[c.user_id].push({
        name: cert?.name,
        category: cert?.category,
        status: c.status,
        expires_at: c.expires_at,
        required_for: cert?.required_for_work_centers,
      });
    }

    const operatorCertSummary = activeSessions
      .map((s: any) => ({
        operator: (s.profiles as any)?.display_name || "Unknown",
        station: stationMap[s.station_id] || s.station_id,
        certifications: certsByUser[s.user_id] || [],
      }))
      .filter((o: any) => o.certifications.length > 0);

    const downtimeSummary = activeDowntime.map((d: any) => ({
      station: d.station_id ? stationMap[d.station_id] || d.station_id : "unknown",
      type: d.downtime_type,
      reason: d.reason_code,
      description: d.description,
      started: d.started_at,
      reported_by: d.reported_by_name,
      duration_so_far: Math.round((Date.now() - new Date(d.started_at).getTime()) / 60000) + " min",
    }));

    // --- LOAD BALANCER: compute recommendations for unassigned/pending items ---
    const operatorsByStation: Record<string, number> = {};
    for (const s of activeSessions as any[]) {
      operatorsByStation[s.station_id] = (operatorsByStation[s.station_id] || 0) + 1;
    }
    const downtimeStationSet = new Set((activeDowntime as any[]).map((d: any) => d.station_id).filter(Boolean));

    // Build availability map
    const stationAvailabilityMap: Record<string, { has_active_downtime: boolean; downtime_reason?: string | null; checked_in_operators: number }> = {};
    for (const s of stations as any[]) {
      const downEvt = (activeDowntime as any[]).find((d: any) => d.station_id === s.id);
      stationAvailabilityMap[s.id] = {
        has_active_downtime: downtimeStationSet.has(s.id),
        downtime_reason: downEvt?.reason_code || downEvt?.description || null,
        checked_in_operators: operatorsByStation[s.id] || 0,
      };
    }

    // Build load map
    const stationLoadMap: Record<string, { queued_items: number; est_total_minutes: number; in_progress_count: number }> = {};
    for (const [sid, load] of Object.entries(stationLoad)) {
      stationLoadMap[sid] = {
        queued_items: load.items,
        est_total_minutes: load.est_minutes,
        in_progress_count: load.in_progress,
      };
    }

    // Build machine profile list for balancer
    const allProfiles: any[] = [];
    for (const a of machineProfiles as any[]) {
      const ml = a.organization_machine_purchases?.verified_machine_library;
      if (ml) allProfiles.push({ station_id: a.station_id, source: "verified_library", ...ml });
    }
    const verifiedStationIdsSet = new Set(allProfiles.map((p) => p.station_id));
    for (const mp of manualProfiles as any[]) {
      if (!verifiedStationIdsSet.has(mp.station_id)) {
        allProfiles.push({ station_id: mp.station_id, source: "manual_entry", ...mp });
      }
    }

    // Run load balancer for each unassigned/pending work order that has part specs
    interface LBScore { station_id: string; station_name: string; station_code: string; work_center_type: string; total_score: number; workload_score: number; capability_score: number; availability_score: number; blockers: string[]; warnings: string[]; advantages: string[]; }
    interface LBResult { wo: string; part: string; recommendations: LBScore[]; summary: string; best_station: string | null; }
    const loadBalancerResults: LBResult[] = [];

    const unassignedWOs = (queueItems as any[]).filter(
      (q: any) => q.item_type === "work_order" && !q.station_id && q.status !== "completed" && q.status !== "cancelled"
    ).slice(0, 10); // Limit to avoid huge prompts

    for (const wo of unassignedWOs) {
      const partReqs = {
        material_type: wo.material_type,
        part_length_inches: wo.part_length_inches,
        part_width_inches: wo.part_width_inches,
        part_height_inches: wo.part_height_inches,
        part_weight_lbs: wo.part_weight_lbs,
        part_shape: wo.part_shape,
        required_tolerance: wo.required_tolerance,
      };
      const hasSpecs = Object.values(partReqs).some((v) => v != null);

      const results: LBScore[] = [];
      for (const s of stations as any[]) {
        if (!s.is_active) continue;
        const profile = allProfiles.find((p: any) => p.station_id === s.id);
        const load = stationLoadMap[s.id];
        const avail = stationAvailabilityMap[s.id];

        let workloadScore = 95;
        const warnList: string[] = [];
        const blockerList: string[] = [];
        const advList: string[] = [];

        // Workload scoring
        if (load) {
          const hours = load.est_total_minutes / 60;
          workloadScore = Math.max(10, Math.round(100 - hours * 5));
          if (load.queued_items > 5) warnList.push(`${load.queued_items} items queued`);
          if (hours > 8) warnList.push(`${Math.round(hours)}h backlog`);
        }

        // Availability scoring
        let availScore = 80;
        if (avail?.has_active_downtime) {
          blockerList.push(`Machine down: ${avail.downtime_reason || "unknown"}`);
          availScore = 0;
        }
        if (avail && avail.checked_in_operators > 0) availScore += 15;
        availScore = Math.min(100, Math.max(0, availScore));

        // Capability scoring
        let capScore = profile ? 80 : 50;
        if (profile && hasSpecs) {
          // Envelope checks
          if (partReqs.part_length_inches != null && profile.max_part_envelope_length != null) {
            if (partReqs.part_length_inches > profile.max_part_envelope_length) blockerList.push("Part exceeds length envelope");
            else advList.push("Fits length envelope");
          }
          if (partReqs.part_width_inches != null && profile.max_part_envelope_width != null && partReqs.part_width_inches > profile.max_part_envelope_width) blockerList.push("Part exceeds width envelope");
          if (partReqs.part_height_inches != null && profile.max_part_envelope_height != null && partReqs.part_height_inches > profile.max_part_envelope_height) blockerList.push("Part exceeds height envelope");
          if (partReqs.part_weight_lbs != null && profile.max_part_weight != null) {
            if (partReqs.part_weight_lbs > profile.max_part_weight) blockerList.push("Exceeds weight limit");
            else advList.push("Weight OK");
          }
          // Material check
          if (partReqs.material_type && profile.material_capability?.length > 0) {
            const mat = partReqs.material_type.toLowerCase();
            const canCut = profile.material_capability.some((m: string) => mat.includes(m.toLowerCase()) || m.toLowerCase().includes(mat));
            if (!canCut) { warnList.push("Material may not be supported"); capScore -= 15; }
            else { advList.push("Material supported"); capScore += 5; }
          }
          if (profile.manufacturer) advList.push(`${profile.manufacturer} ${profile.model || ""}`);
        }
        if (!profile) warnList.push("No machine profile");

        if (blockerList.length > 0) capScore = 0;
        capScore = Math.min(100, Math.max(0, capScore));

        const totalScore = blockerList.length > 0 ? 0 : Math.round(workloadScore * 0.35 + capScore * 0.45 + availScore * 0.20);

        results.push({
          station_id: s.id,
          station_name: s.name,
          station_code: s.station_id,
          work_center_type: s.work_center_type,
          total_score: totalScore,
          workload_score: workloadScore,
          capability_score: capScore,
          availability_score: availScore,
          blockers: blockerList,
          warnings: warnList,
          advantages: advList,
        });
      }

      results.sort((a, b) => b.total_score - a.total_score);
      const best = results.find((r) => r.total_score > 0);
      const eligible = results.filter((r) => r.total_score > 0);

      loadBalancerResults.push({
        wo: wo.work_order || wo.title,
        part: wo.part_number || "N/A",
        recommendations: results.slice(0, 5),
        summary: eligible.length > 0
          ? `Best: ${best!.station_name} (score ${best!.total_score}/100), ${eligible.length} eligible of ${results.length}`
          : `No eligible stations (${results.length} analyzed)`,
        best_station: best ? `${best.station_name} (${best.station_code})` : null,
      });
    }

    // Also compute overall shop load balance
    const shopLoadBalance = (stations as any[])
      .filter((s: any) => s.is_active)
      .map((s: any) => {
        const load = stationLoadMap[s.id];
        const avail = stationAvailabilityMap[s.id];
        return {
          station: s.name,
          code: s.station_id,
          type: s.work_center_type,
          queued: load?.queued_items || 0,
          est_hours: load ? Math.round((load.est_total_minutes / 60) * 10) / 10 : 0,
          in_progress: load?.in_progress_count || 0,
          operators: avail?.checked_in_operators || 0,
          down: avail?.has_active_downtime || false,
          utilization_pct: load ? Math.min(100, Math.round((load.est_total_minutes / 480) * 100)) : 0,
        };
      })
      .sort((a, b) => b.est_hours - a.est_hours);

    const callerRoleLabel = isSupervisorOrAbove
      ? `Supervisor/Admin (org role: ${orgRole}, platform roles: ${platformRoles.join(", ") || "operator"})`
      : `Operator (org role: ${orgRole})`;

    const systemPrompt = `You are a Production Planning Assistant for a manufacturing organization. You help supervisors and managers make real-time decisions about scheduling, routing, machine downtime, and priority management.

You have access to a **Load Balancer** that scores stations based on workload, machine capability fit (envelope, materials, axes), and operator availability. Use these scores to make informed routing and scheduling recommendations.

CURRENT DATE/TIME: ${now}
CALLER ROLE: ${callerRoleLabel}

## LIVE ORGANIZATION DATA

### Active Queue Items (${queueItems.length} total, ${overdueItems.length} overdue):
${JSON.stringify(queueSummary, null, 2)}

### Stations (${stations.length} total):
${JSON.stringify(stationSummary, null, 2)}

### Live Station Status:
${JSON.stringify(liveStationStatus, null, 2)}

### Station Queue Load (backlog per station):
${
  stationLoadSummary.length > 0
    ? JSON.stringify(stationLoadSummary, null, 2)
    : "No station-specific queue data available."
}

### Shop Floor Load Balance (utilization overview):
${JSON.stringify(shopLoadBalance, null, 2)}

### Active Operators on Stations:
${
  operatorSessionsSummary.length > 0
    ? JSON.stringify(operatorSessionsSummary, null, 2)
    : "No operators currently checked in."
}

### Operator Certifications (active operators):
${
  operatorCertSummary.length > 0
    ? JSON.stringify(operatorCertSummary, null, 2)
    : "No certification data available for active operators."
}

### Active Routing Steps (${routing.length}):
${JSON.stringify(routingSummary, null, 2)}

### Available Routing Templates (${routingTemplates.length}):
${JSON.stringify(
  routingTemplates.map((t: any) => ({
    name: t.name,
    description: t.description,
  })),
  null,
  2,
)}

### Machine Identity Profiles (${
      machineContextSummary.length
    } context-active stations — ${verifiedContextSummary.length} verified, ${manualContextSummary.length} manual):
${
  machineContextSummary.length > 0
    ? JSON.stringify(machineContextSummary, null, 2)
    : "No stations have manufacturer context activated. Routing validation will use generic station type tags only."
}

### Active Downtime Events (${downtimeSummary.length} stations currently down):
${downtimeSummary.length > 0 ? JSON.stringify(downtimeSummary, null, 2) : "No active downtime events."}

${loadBalancerResults.length > 0 ? `### 🔄 Load Balancer — Unassigned Work Order Recommendations (${loadBalancerResults.length}):
${JSON.stringify(loadBalancerResults, null, 2)}

Use these scores when recommending station assignments. Score breakdown:
- **Workload (35%)**: Lower queue depth = higher score
- **Capability (45%)**: Part specs vs machine envelope/materials/tolerances
- **Availability (20%)**: Operator presence, downtime status
- Scores of 0 indicate hard blockers (machine down, part exceeds envelope, etc.)
` : "### Load Balancer: No unassigned work orders to analyze."}

## LOAD BALANCING GUIDELINES

When recommending station assignments or rerouting:
1. **Always check the Load Balancer scores first** — prefer stations with higher total scores
2. **Never route to a station with blockers** (score = 0) unless the user explicitly overrides
3. **Warn about overloaded stations** (utilization > 100%) — suggest alternatives
4. **Consider machine capabilities** — a part that barely fits an envelope is riskier than one with margin
5. **Factor in operator availability** — stations with checked-in operators can start sooner
6. **For rerouting requests**, compare the current station's score vs alternatives and explain the trade-off

## WORK ORDER REROUTING & APPROVAL RULES

[... rest of your prompt unchanged ...]
`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add credits in workspace settings.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        // Helpful for SSE in some clients
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("Planning assistant error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

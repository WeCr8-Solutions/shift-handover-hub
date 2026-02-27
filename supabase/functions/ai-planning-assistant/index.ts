import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, organization_id } = await req.json();

    if (!messages || !organization_id) {
      return new Response(
        JSON.stringify({ error: "messages and organization_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Authorization: verify user belongs to requested org ---
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Access denied. You are not a member of this organization." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // --- Usage limit check ---
    const { data: usageData, error: usageError } = await supabase.rpc(
      "increment_ai_chat_usage",
      { _org_id: organization_id }
    );

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
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Determine caller's role for context ---
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const platformRoles = (userRoles || []).map((r: any) => r.role);
    const orgRole = (membership as any).role; // owner, admin, member
    const isSupervisorOrAbove =
      platformRoles.includes("admin") ||
      platformRoles.includes("developer") ||
      platformRoles.includes("supervisor") ||
      orgRole === "owner" ||
      orgRole === "admin";

    // Fetch queue items, stations, routing, station status, routing templates, machine profiles,
    // active operator sessions, and operator certifications in parallel
    const [queueRes, stationsRes, routingRes, stationStatusRes, routingTemplatesRes, machineProfilesRes, manualProfilesRes, activeSessionsRes, certificationsRes, downtimeRes] = await Promise.all([
      supabase
        .from("queue_items")
        .select("id, title, work_order, part_number, status, priority, due_date, assigned_to, station_id, item_type, quantity, qty_completed, qty_scrap, qty_rework, qty_open, quantity_locked, operation_number, created_at, estimated_duration, material_type, part_length_inches, part_width_inches, part_height_inches, part_weight_lbs, part_shape, required_tolerance, surface_finish")
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
        .select("id, queue_item_id, step_number, station_id, operation_name, operation_type, status, estimated_duration, setup_time_minutes, cycle_time_minutes, first_article_minutes, vendor_name, po_number, expected_return_date")
        .eq("organization_id", organization_id)
        .in("status", ["pending", "in_progress"])
        .order("step_number", { ascending: true })
        .limit(500),
      supabase
        .from("current_station_status")
        .select("station_id, current_job_work_order, current_job_part_number, current_job_state, current_operator_name, parts_complete, parts_required, condition_status")
        .eq("organization_id", organization_id)
        .limit(100),
      supabase
        .from("routing_templates")
        .select("id, name, description")
        .eq("organization_id", organization_id)
        .limit(50),
      supabase
        .from("station_machine_assignments")
        .select("station_id, purchase_id, organization_machine_purchases!inner(machine_library_id, is_active, verified_machine_library!inner(manufacturer, model, machine_type, platform_category, max_x_travel, max_y_travel, max_z_travel, max_part_weight, max_part_envelope_length, max_part_envelope_width, max_part_envelope_height, five_axis_simultaneous, fourth_axis, live_tooling, y_axis_turn, sub_spindle, probing, through_spindle_coolant, pallet_pool, bar_feeder, material_capability, typical_tolerance, hard_constraints))")
        .eq("organization_id", organization_id)
        .limit(100),
      supabase
        .from("station_manual_machine_profiles")
        .select("station_id, manufacturer, model, machine_type, platform_category, max_x_travel, max_y_travel, max_z_travel, max_part_weight, max_part_envelope_length, max_part_envelope_width, max_part_envelope_height, five_axis_simultaneous, fourth_axis, live_tooling, y_axis_turn, sub_spindle, probing, through_spindle_coolant, pallet_pool, bar_feeder, material_capability, typical_tolerance, hard_constraints")
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
        .select("user_id, certification_id, status, expires_at, certifications!inner(name, category, required_for_work_centers)")
        .eq("organization_id", organization_id)
        .limit(500),
      // Active downtime events (not yet resolved)
      supabase
        .from("downtime_events")
        .select("id, station_id, equipment_id, downtime_type, reason_code, description, started_at, reported_by_name")
        .eq("organization_id", organization_id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(50),
    ]);

    const queueItems = queueRes.data || [];
    const stations = stationsRes.data || [];
    const routing = routingRes.data || [];
    const stationStatus = stationStatusRes.data || [];
    const routingTemplates = routingTemplatesRes.data || [];
    const machineProfiles = machineProfilesRes.data || [];
    const manualProfiles = manualProfilesRes.data || [];
    const activeSessions = activeSessionsRes.data || [];
    const certifications = certificationsRes.data || [];
    const activeDowntime = downtimeRes.data || [];
    // Build context
    const now = new Date().toISOString();
    const stationMap = Object.fromEntries(stations.map((s: any) => [s.id, s.name]));
    const stationTypeMap = Object.fromEntries(stations.map((s: any) => [s.id, { name: s.name, type: s.work_center_type, work_center: s.work_center, active: s.is_active }]));

    const queueSummary = queueItems.map((q: any) => ({
      id: q.id.slice(0, 8),
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
      // Part specs for machine-aware routing
      ...(q.material_type || q.part_length_inches || q.part_shape || q.required_tolerance ? {
        part_specs: {
          material: q.material_type,
          length: q.part_length_inches,
          width: q.part_width_inches,
          height: q.part_height_inches,
          weight: q.part_weight_lbs,
          shape: q.part_shape,
          tolerance: q.required_tolerance,
          surface_finish: q.surface_finish,
        }
      } : {}),
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
      progress: ss.parts_complete != null ? `${ss.parts_complete}/${ss.parts_required}` : null,
      condition: ss.condition_status,
    }));

    const overdueItems = queueItems.filter(
      (q: any) => q.due_date && new Date(q.due_date) < new Date() && q.status !== "completed"
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

    // Build machine profile summaries from verified library assignments
    const buildProfileSummary = (ml: any, stationId: string, source: string) => ({
      station: stationMap[stationId] || stationId,
      source,
      manufacturer: ml.manufacturer,
      model: ml.model,
      machine_type: ml.machine_type,
      platform: ml.platform_category,
      envelope: {
        x: ml.max_x_travel, y: ml.max_y_travel, z: ml.max_z_travel,
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

    // Verified library profiles
    const verifiedContextSummary = machineProfiles.map((a: any) => {
      const ml = a.organization_machine_purchases?.verified_machine_library;
      if (!ml) return null;
      return buildProfileSummary(ml, a.station_id, "verified_library");
    }).filter(Boolean);

    // Manual profiles (only for stations without a verified profile)
    const verifiedStationIds = new Set(machineProfiles.map((a: any) => a.station_id));
    const manualContextSummary = manualProfiles
      .filter((mp: any) => !verifiedStationIds.has(mp.station_id))
      .map((mp: any) => buildProfileSummary(mp, mp.station_id, "manual_entry"));

    const machineContextSummary = [...verifiedContextSummary, ...manualContextSummary];

    // --- Station Queue Load: items count + total estimated minutes per station ---
    const stationLoad: Record<string, { items: number; est_minutes: number; in_progress: number }> = {};
    for (const q of queueItems) {
      if (!q.station_id) continue;
      if (!stationLoad[q.station_id]) stationLoad[q.station_id] = { items: 0, est_minutes: 0, in_progress: 0 };
      stationLoad[q.station_id].items++;
      stationLoad[q.station_id].est_minutes += q.estimated_duration || 0;
      if (q.status === "in_progress") stationLoad[q.station_id].in_progress++;
    }

    const stationLoadSummary = Object.entries(stationLoad).map(([sid, load]) => ({
      station: stationMap[sid] || sid,
      queued_items: load.items,
      est_total_minutes: load.est_minutes,
      est_total_hours: Math.round(load.est_minutes / 60 * 10) / 10,
      actively_running: load.in_progress,
    })).sort((a, b) => b.queued_items - a.queued_items);

    // --- Active Operator Sessions: who is checked into which station ---
    const operatorSessionsSummary = activeSessions.map((s: any) => ({
      operator: (s.profiles as any)?.display_name || "Unknown",
      station: stationMap[s.station_id] || s.station_id,
      checked_in: s.checked_in_at,
    }));

    // --- Operator Certifications: build a map of user_id → certs ---
    const certsByUser: Record<string, { name: string; category: string | null; status: string; expires_at: string | null; required_for: string[] | null }[]> = {};
    for (const c of certifications) {
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

    // Build operator-cert summary for active operators
    const operatorCertSummary = activeSessions.map((s: any) => ({
      operator: (s.profiles as any)?.display_name || "Unknown",
      station: stationMap[s.station_id] || s.station_id,
      certifications: certsByUser[s.user_id] || [],
    })).filter((o: any) => o.certifications.length > 0);

    // Build downtime summary
    const downtimeSummary = activeDowntime.map((d: any) => ({
      station: d.station_id ? stationMap[d.station_id] || d.station_id : "unknown",
      type: d.downtime_type,
      reason: d.reason_code,
      description: d.description,
      started: d.started_at,
      reported_by: d.reported_by_name,
      duration_so_far: Math.round((Date.now() - new Date(d.started_at).getTime()) / 60000) + " min",
    }));

    const callerRoleLabel = isSupervisorOrAbove
      ? `Supervisor/Admin (org role: ${orgRole}, platform roles: ${platformRoles.join(", ") || "operator"})`
      : `Operator (org role: ${orgRole})`;

    const systemPrompt = `You are a Production Planning Assistant for a manufacturing organization. You help supervisors and managers make real-time decisions about scheduling, routing, machine downtime, and priority management.

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
${stationLoadSummary.length > 0 ? JSON.stringify(stationLoadSummary, null, 2) : "No station-specific queue data available."}

### Active Operators on Stations:
${operatorSessionsSummary.length > 0 ? JSON.stringify(operatorSessionsSummary, null, 2) : "No operators currently checked in."}

### Operator Certifications (active operators):
${operatorCertSummary.length > 0 ? JSON.stringify(operatorCertSummary, null, 2) : "No certification data available for active operators."}

### Active Routing Steps (${routing.length}):
${JSON.stringify(routingSummary, null, 2)}

### Available Routing Templates (${routingTemplates.length}):
${JSON.stringify(routingTemplates.map((t: any) => ({ name: t.name, description: t.description })), null, 2)}

### Machine Identity Profiles (${machineContextSummary.length} context-active stations — ${verifiedContextSummary.length} verified, ${manualContextSummary.length} manual):
${machineContextSummary.length > 0 ? JSON.stringify(machineContextSummary, null, 2) : "No stations have manufacturer context activated. Routing validation will use generic station type tags only."}

### Active Downtime Events (${downtimeSummary.length} stations currently down):
${downtimeSummary.length > 0 ? JSON.stringify(downtimeSummary, null, 2) : "No active downtime events."}

## WORK ORDER REROUTING & APPROVAL RULES

You MUST follow these rules when advising on rerouting or advancing work orders:

### Who Can Do What
1. **Operators** can only advance/pass work orders at stations where they are actively checked in via an operator session.
2. **Supervisors, Org Admins, and Org Owners** can override and advance any work order in their organization, but MUST provide a written override reason.
3. **Rerouting** (changing which station a WO goes to next) requires editing the work order routing steps — only supervisors and above can modify routing.

### Advancement Validation Rules
Before a work order can advance to the next station or be completed, three checks are enforced:
1. **Quantity Reconciliation** — total completed + scrap + rework must account for the original quantity.
2. **Quality Sign-off** — advancement is blocked if station status is "Waiting on QA".
3. **First Article Approval** — advancement is blocked if "First Article in Process".

A supervisor can bypass these checks by providing an explicit override reason.

### How Rerouting Works
- Each work order has a sequence of routing steps (operation_type: quote, engineering, purchasing, receiving, internal, outside_processing, inspection, shipping).
- To reroute: a supervisor modifies the routing steps to assign different stations or reorder operations.
- The system uses an atomic database operation (\`pass_work_order_to_next_step\`) that completes the current step and moves the item to the next station.
- When suggesting rerouting, ALWAYS specify which station the WO should move to and why (e.g., machine capability, availability, load balancing).

## MACHINE-AWARE ROUTING VALIDATION (for context-active stations)

When a station has a Machine Identity Profile, you MUST validate routing compatibility using these checks:

1. **Machine Type Compatibility** — Mill operations only to mill-type stations, turn ops only to turn centers.
2. **Envelope Check** — Part dimensions must fit within the machine's max travel and part envelope.
3. **Weight Check** — Part weight must be within the machine's max_part_weight.
4. **Material Compatibility** — Part material must be in the station's material_capability list.
5. **Tolerance Check** — Required tolerance must be achievable (≤ machine's typical_tolerance).
6. **Special Feature Requirements** — If 5-axis simultaneous is needed, station must have five_axis=true. Same for live_tooling, probing, etc.

**If any HARD constraint fails:** Block the routing suggestion and suggest an alternative station that passes all checks.
**If all pass:** Mark station as valid with HIGH confidence.

## PART-AWARE CONTEXT VALIDATION

Work orders may include part_specs with material, dimensions (length/width/height in inches), weight (lbs), shape, tolerance, and surface_finish.

When part_specs are present on a work order AND a station has a machine profile:
1. **Envelope Fit** — Compare part length/width/height against machine max_x/y/z_travel AND max_part_envelope dimensions. Part must fit.
2. **Weight Fit** — Part weight must be ≤ machine max_part_weight.
3. **Material Match** — Part material_type must be in the station's material_capability list.
4. **Shape-to-Machine Logic** — Cylindrical parts → prefer lathes/turn centers. Prismatic → prefer mills. Complex → prefer 5-axis capable machines.
5. **Tolerance Match** — Compare part required_tolerance against machine typical_tolerance. If the part needs ±0.001" but the machine is only capable of ±0.005", REJECT and suggest a more precise machine.
6. **Surface Finish Feasibility** — Finer finishes (8Ra, 16Ra) require grinding or lapping stations. Standard machining achieves 32-63Ra. Flag if the assigned machine cannot achieve the required finish.

When part_specs are MISSING, note "No part specs available — routing confidence is reduced. Recommend adding material/dimension/tolerance data to the work order for better AI routing."

## DOWNTIME AWARENESS

When a station has an active downtime event:
1. **NEVER route new work orders to a station with active downtime** — flag it as UNAVAILABLE.
2. Identify all work orders currently assigned to or in-progress at the downed station.
3. For each affected WO, suggest the best alternative station (considering capability, load, and operator certs).
4. If downtime type is "planned_maintenance", note expected duration if available.
5. If downtime type is "breakdown", escalate urgency — suggest immediate rerouting of in-progress work.
6. Proactively alert when answering any routing question: "Note: [Station X] is currently DOWN ([reason]) since [time]."

## SETUP & CYCLE TIME AWARENESS

Routing steps now include setup_time_minutes, cycle_time_minutes, and first_article_minutes:
1. **Total operation time** = setup_time_minutes + (cycle_time_minutes × quantity) + first_article_minutes (if applicable).
2. When estimating station backlog, use these granular times instead of just estimated_duration when available.
3. If a work order is being rerouted to a different machine, note that setup time may differ — similar machines in the same family will have similar setups.
4. First article time is typically a one-time cost per setup — factor this into the total when the WO has not started yet.

## UNIT CONVERSION RULES (CRITICAL)

Part specifications use **inches** for dimensions and **lbs** for weight.
Machine profiles use **mm** for travel/envelope and **lbs** for weight.
**You MUST convert units before comparing:** 1 inch = 25.4 mm.
- To check envelope fit: convert part dimensions from inches to mm (multiply by 25.4), THEN compare against machine max travel/envelope in mm.
- Example: Part is 12" long → 304.8mm. Machine max_x_travel is 762mm → Part fits.
- ALWAYS show the conversion in your response so the user can verify.

## STATION LOAD-AWARE ROUTING

When suggesting a station for a work order, you MUST consider queue load:
1. Check "Station Queue Load" data — prefer stations with fewer queued items and lower est_total_hours.
2. If two stations are equally capable, ALWAYS recommend the one with less backlog.
3. When a station has 0 queued items and no active job, flag it as "Available Now" — high priority recommendation.
4. When a station has >8 est_total_hours of backlog, warn that lead time will be affected.
5. Factor in due dates: if a WO is urgent/overdue, prioritize station availability over optimal machine match.

## OPERATOR CERTIFICATION VALIDATION

When routing or assigning work:
1. Check if the active operator at a station has the required certifications for the work center type.
2. If a certification has "required_for_work_centers" that matches the station's work_center, the operator MUST have that cert with status "active" and not expired.
3. If an operator lacks a required certification, **flag this as a warning** and suggest either:
   - Reassigning the WO to a station where a certified operator is checked in, OR
   - Having a certified operator swap to the required station.
4. Expired certifications (expires_at < current date) should be flagged as "EXPIRED — operator cannot perform this work."

## MULTI-OPERATION SEQUENCE OPTIMIZATION

When a work order has multiple routing steps:
1. **Minimize re-fixturing** — If consecutive operations (e.g., Op 10 rough mill → Op 20 finish mill) can run on the same machine, prefer keeping them on the same station to avoid re-setup.
2. **Setup time awareness** — If a WO has setup_time_minutes, factor this into the total time when evaluating station load. Multiple re-setups = more lost time.
3. **Material flow** — Prefer routing sequences where stations are logically adjacent or in the same work center to reduce material handling time.
4. **Outside processing gaps** — When a routing step is "outside_processing", the WO leaves the shop. Warn about lead time impact from vendor turnaround and suggest having the next internal operation station ready.

When rerouting due to machine downtime or quality holds:
1. Filter all stations with context_active profiles
2. Eliminate stations failing any hard constraint (including part-vs-machine checks)
3. Rank remaining by: same manufacturer family (preference), same platform, **lowest queue backlog**, certified operator available
4. Output: "Best Alternate: [Station] ([Manufacturer Model]) — [X items queued, ~Y hrs backlog]" with reason and confidence score

For stations WITHOUT a machine profile (context_active=false), fall back to generic station type matching only and note reduced routing confidence.

### Quantity Lock Rules
- When qty_completed >= qty_original, the work order auto-locks (quantity_locked = true).
- Only org owners can increase qty_original after lock.
- Do NOT advise operators to modify locked quantities — direct them to their supervisor.

## RESPONSE INSTRUCTIONS
- Reference specific work orders by their WO number and stations by name.
- When suggesting rerouting, specify the exact station and operation type. Cross-reference station types with the routing step's operation_type (e.g., "internal" ops go to CNC/lathe/mill stations).
- Include station load data in routing suggestions (e.g., "Station X — 3 items queued, ~4.5 hrs backlog").
- Flag operator certification issues proactively when relevant.
- If the caller is an operator, remind them that rerouting requires supervisor approval and tell them which supervisor action is needed.
- If the caller is a supervisor, provide the actionable steps: which WO, from which station, to which station, and what override reason to provide.
- Flag overdue items proactively.
- Give concrete, actionable advice — not generic platitudes.
- Use markdown formatting for readability (headers, lists, bold for emphasis).
- When asked about machine downtime, identify affected WOs and suggest specific alternative stations with their current load.
- For due date feasibility, calculate based on remaining routing steps, estimated hours, AND station backlog.
- Keep responses focused and concise — production staff are busy.
- NEVER suggest actions that violate the approval hierarchy. Always make approval requirements clear.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Planning assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

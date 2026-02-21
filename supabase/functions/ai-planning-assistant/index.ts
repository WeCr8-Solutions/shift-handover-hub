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
      .select("id")
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
      // Don't block on usage tracking errors — proceed
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

    // Fetch queue items, stations, and routing in parallel
    const [queueRes, stationsRes, routingRes] = await Promise.all([
      supabase
        .from("queue_items")
        .select("id, title, work_order, part_number, status, priority, due_date, assigned_to, station_id, item_type, created_at")
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
        .select("id, queue_item_id, step_number, station_id, operation_name, status, estimated_hours, actual_hours")
        .eq("organization_id", organization_id)
        .limit(500),
    ]);

    const queueItems = queueRes.data || [];
    const stations = stationsRes.data || [];
    const routing = routingRes.data || [];

    // Build context summary
    const now = new Date().toISOString();
    const stationMap = Object.fromEntries(stations.map((s) => [s.id, s.name]));

    const queueSummary = queueItems.map((q) => ({
      id: q.id.slice(0, 8),
      title: q.title,
      wo: q.work_order,
      part: q.part_number,
      status: q.status,
      priority: q.priority,
      due: q.due_date,
      station: q.station_id ? stationMap[q.station_id] || q.station_id : "unassigned",
    }));

    const stationSummary = stations.map((s) => ({
      name: s.name,
      id_code: s.station_id,
      type: s.work_center_type,
      work_center: s.work_center,
      active: s.is_active,
    }));

    const overdueItems = queueItems.filter(
      (q) => q.due_date && new Date(q.due_date) < new Date() && q.status !== "completed"
    );

    const systemPrompt = `You are a Production Planning Assistant for a manufacturing organization. You help supervisors and managers make real-time decisions about scheduling, routing, machine downtime, and priority management.

CURRENT DATE/TIME: ${now}

## LIVE ORGANIZATION DATA

### Active Queue Items (${queueItems.length} total, ${overdueItems.length} overdue):
${JSON.stringify(queueSummary, null, 2)}

### Stations (${stations.length} total):
${JSON.stringify(stationSummary, null, 2)}

### Routing Steps (${routing.length} active):
${JSON.stringify(
      routing.slice(0, 50).map((r) => ({
        wo_item: r.queue_item_id?.slice(0, 8),
        step: r.step_number,
        op: r.operation_name,
        station: r.station_id ? stationMap[r.station_id] || r.station_id : "unassigned",
        status: r.status,
        est_hrs: r.estimated_hours,
        actual_hrs: r.actual_hours,
      })),
      null,
      2
    )}

## INSTRUCTIONS
- Reference specific work orders by their WO number, stations by name
- When suggesting rerouting, reference actual available stations and their types
- Flag overdue items proactively
- Give concrete, actionable advice (not generic platitudes)
- Use markdown formatting for readability (headers, lists, bold for emphasis)
- When asked about machine downtime, identify affected WOs and suggest alternatives
- For due date feasibility, calculate based on remaining routing steps and estimated hours
- Keep responses focused and concise — supervisors are busy`;

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

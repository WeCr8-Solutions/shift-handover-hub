// Concierge production smoke test — runs a synthetic work-order round-trip
// against a customer org and returns pass/fail per step. Platform admin only.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface StepResult { name: string; ok: boolean; detail?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing bearer token" }, 401);
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is a platform admin or developer
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id);
    const isAdmin = (roleRows ?? []).some((r: any) => r.role === "admin" || r.role === "developer");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { organizationId } = await req.json();
    if (!organizationId) return json({ error: "organizationId required" }, 400);

    const steps: StepResult[] = [];
    const cleanup: Array<() => Promise<unknown>> = [];

    // Step 1: pick an active station + routing template
    const { data: station } = await admin
      .from("stations").select("id, name")
      .eq("organization_id", organizationId).eq("is_active", true)
      .limit(1).maybeSingle();
    steps.push({ name: "Find active station", ok: !!station, detail: station?.name });

    const { data: routing } = await admin
      .from("routing_templates").select("id, name")
      .eq("organization_id", organizationId).limit(1).maybeSingle();
    steps.push({ name: "Find routing template", ok: !!routing, detail: routing?.name });

    if (!station || !routing) {
      return json({ ok: false, steps, message: "Org missing prerequisites; cannot run smoke test." });
    }

    // Step 2: create a synthetic queue item + routing row
    const woNumber = `SMOKE-${Date.now()}`;
    const { data: qi, error: qiErr } = await admin
      .from("queue_items")
      .insert({
        organization_id: organizationId,
        work_order: woNumber,
        part_number: "SMOKE-001",
        title: "Concierge smoke test (auto, safe to delete)",
        quantity: 1,
        qty_original: 1,
        status: "pending",
        source_system: "concierge_smoke",
      })
      .select("id").single();
    if (qiErr) {
      steps.push({ name: "Create smoke work order", ok: false, detail: qiErr.message });
      return json({ ok: false, steps });
    }
    steps.push({ name: "Create smoke work order", ok: true, detail: woNumber });
    cleanup.push(() => admin.from("queue_items").delete().eq("id", qi.id));

    // Apply routing step pointing at the picked station
    const { error: rErr } = await admin.from("work_order_routing").insert({
      queue_item_id: qi.id,
      organization_id: organizationId,
      step_number: 1,
      operation_type: "internal",
      operation_name: "Smoke test op",
      station_id: station.id,
      status: "pending",
    });
    steps.push({ name: "Apply routing step", ok: !rErr, detail: rErr?.message });

    // Step 3: walk through states
    const transitions: Array<{ to: string }> = [
      { to: "queued" }, { to: "in_progress" }, { to: "completed" },
    ];
    for (const t of transitions) {
      const { error } = await admin.from("queue_items").update({ status: t.to }).eq("id", qi.id);
      steps.push({ name: `Transition → ${t.to}`, ok: !error, detail: error?.message });
      if (error) break;
    }

    // Step 4: cleanup
    for (const fn of cleanup.reverse()) await fn();
    steps.push({ name: "Cleanup smoke artifacts", ok: true });

    const allOk = steps.every((s) => s.ok);
    return json({ ok: allOk, steps });
  } catch (e: any) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

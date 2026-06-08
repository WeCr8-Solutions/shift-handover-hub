// Release-to-customer: invoked from admin after activate_org_for_production
// succeeds. Sends "you're live" email and records a release certificate entry.
// Platform admin only.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing bearer" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRows } = await admin
      .from("user_roles").select("role").eq("user_id", userRes.user.id);
    const isAdmin = (roleRows ?? []).some((r: any) => r.role === "admin" || r.role === "developer");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { engagementId } = await req.json();
    if (!engagementId) return json({ error: "engagementId required" }, 400);

    const { data: eng } = await admin
      .from("onboarding_engagements")
      .select("id, organization_id, went_live_at, plan_tier, organizations:organization_id(name)")
      .eq("id", engagementId).maybeSingle();
    if (!eng?.organization_id) return json({ error: "Engagement not found" }, 404);

    const orgName = (eng as any).organizations?.name ?? "your shop";

    // Snapshot readiness for the certificate
    const { data: readiness } = await admin.rpc("verify_org_production_ready", { p_org_id: eng.organization_id });

    // Find org admin emails for the email send
    const { data: members } = await admin
      .from("organization_members").select("user_id")
      .eq("organization_id", eng.organization_id).in("role", ["admin", "owner"]);
    const userIds = (members ?? []).map((m: any) => m.user_id);
    const { data: profiles } = await admin
      .from("profiles").select("email, full_name").in("id", userIds);

    // Best-effort: enqueue an email via the existing send-transactional-email function.
    // We don't fail the release if email isn't wired up.
    let emailsQueued = 0;
    for (const p of profiles ?? []) {
      if (!(p as any).email) continue;
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "concierge-go-live",
            recipientEmail: (p as any).email,
            idempotencyKey: `concierge-go-live-${engagementId}-${(p as any).email}`,
            templateData: {
              name: (p as any).full_name ?? "there",
              orgName,
              tier: eng.plan_tier,
              wentLiveAt: eng.went_live_at,
            },
          },
        });
        emailsQueued += 1;
      } catch (_) { /* template may not exist yet — non-fatal */ }
    }

    // Record an audit event with the readiness snapshot — this acts as the
    // release certificate of record until a PDF generator is wired.
    await admin.from("admin_audit_events").insert({
      actor_id: userRes.user.id,
      action_type: "concierge.release_certificate_issued",
      target_type: "organization",
      target_id: eng.organization_id,
      organization_id: eng.organization_id,
      metadata: {
        engagement_id: engagementId,
        went_live_at: eng.went_live_at,
        readiness_snapshot: readiness,
        emails_queued: emailsQueued,
      },
    });

    return json({ ok: true, emailsQueued, readiness });
  } catch (e: any) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

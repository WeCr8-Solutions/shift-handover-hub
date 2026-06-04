/**
 * morning-brief-cron — Roadmap item #16 (supervisor morning brief).
 *
 * For each organization, builds a daily digest of:
 *   • Open work orders + overdue / at-risk counts
 *   • Top 3 bottleneck stations (most queue items pending)
 *   • Downtime hours in the prior 24h
 *   • Yesterday's completed-WO count
 *
 * Sends one email per org-supervisor with notification_preferences.email_enabled
 * and morning_brief_enabled = true. Dedupe by (org_id, brief_date) via
 * a header row stamped into `email_delivery_events`.
 *
 * Triggered by an internal scheduler (cron-style) and gated by INTERNAL_KEY.
 * verify_jwt = false because no user JWT is present.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTERNAL_KEY = Deno.env.get("INTERNAL_REMINDER_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://jobline.ai";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

interface BriefRow {
  org_id: string;
  org_name: string;
  open_wos: number;
  overdue: number;
  at_risk: number;
  completed_yesterday: number;
  downtime_hours: number;
  bottlenecks: { station: string; pending: number }[];
}

async function buildBriefForOrg(orgId: string, orgName: string): Promise<BriefRow> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: openRows } = await admin
    .from("wo_performance_summary")
    .select("schedule_status")
    .eq("organization_id", orgId)
    .in("status", ["pending", "queued", "in_progress", "on_hold"]);

  const open = openRows ?? [];
  const overdue = open.filter((r) => r.schedule_status === "overdue").length;
  const at_risk = open.filter((r) => r.schedule_status === "at_risk").length;

  const { count: completedYesterday } = await admin
    .from("queue_items")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .gte("completed_at", since);

  const { data: downtime } = await admin
    .from("downtime_events")
    .select("duration_minutes")
    .eq("organization_id", orgId)
    .gte("started_at", since);

  const downtime_hours = Math.round(
    ((downtime ?? []).reduce(
      (acc, d) => acc + (Number((d as { duration_minutes: number | null }).duration_minutes) || 0),
      0,
    ) /
      60) *
      10,
  ) / 10;

  const { data: pendingByStation } = await admin
    .from("queue_items")
    .select("station_id, stations!inner(name)")
    .eq("organization_id", orgId)
    .in("status", ["pending", "queued"]);

  const counts = new Map<string, { name: string; n: number }>();
  for (const r of pendingByStation ?? []) {
    const sid = (r as { station_id: string | null }).station_id;
    if (!sid) continue;
    const name =
      (r as { stations: { name: string } | null }).stations?.name || "Unknown";
    const c = counts.get(sid) ?? { name, n: 0 };
    c.n++;
    counts.set(sid, c);
  }
  const bottlenecks = Array.from(counts.values())
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
    .map((c) => ({ station: c.name, pending: c.n }));

  return {
    org_id: orgId,
    org_name: orgName,
    open_wos: open.length,
    overdue,
    at_risk,
    completed_yesterday: completedYesterday ?? 0,
    downtime_hours,
    bottlenecks,
  };
}

function renderHtml(b: BriefRow) {
  const rows = b.bottlenecks.length
    ? b.bottlenecks
        .map(
          (x) =>
            `<tr><td style="padding:4px 8px">${x.station}</td><td style="padding:4px 8px;text-align:right">${x.pending} pending</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="2" style="padding:4px 8px;color:#666">No bottlenecks detected.</td></tr>`;

  return `<!doctype html><html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f6f7f9;padding:24px;color:#111">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb">
      <h1 style="margin:0 0 4px;font-size:18px">${b.org_name} — Morning brief</h1>
      <p style="margin:0 0 16px;color:#666;font-size:13px">${new Date().toDateString()}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:6px 8px;background:#f3f4f6">Open work orders</td><td style="padding:6px 8px;background:#f3f4f6;text-align:right"><strong>${b.open_wos}</strong></td></tr>
        <tr><td style="padding:6px 8px">Overdue</td><td style="padding:6px 8px;text-align:right;color:#b91c1c"><strong>${b.overdue}</strong></td></tr>
        <tr><td style="padding:6px 8px;background:#f3f4f6">At risk (next 24h)</td><td style="padding:6px 8px;background:#f3f4f6;text-align:right;color:#b45309"><strong>${b.at_risk}</strong></td></tr>
        <tr><td style="padding:6px 8px">Completed in last 24h</td><td style="padding:6px 8px;text-align:right;color:#047857"><strong>${b.completed_yesterday}</strong></td></tr>
        <tr><td style="padding:6px 8px;background:#f3f4f6">Downtime hours (last 24h)</td><td style="padding:6px 8px;background:#f3f4f6;text-align:right"><strong>${b.downtime_hours}</strong></td></tr>
      </table>
      <h2 style="font-size:14px;margin:0 0 8px">Top bottleneck stations</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${rows}</table>
      <p style="margin:20px 0 0"><a href="${APP_URL}/" style="display:inline-block;background:#111827;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px">Open dashboard</a></p>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:11px">Manage this email in Settings → Notifications.</p>
    </div>
  </body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      "x-internal-key": INTERNAL_KEY,
    },
    body: JSON.stringify({ to, subject, html }),
  });
  if (!resp.ok) {
    console.error("send-email failed", await resp.text());
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Optional internal-key gate (cron-only).
  const provided = req.headers.get("x-internal-key") || "";
  if (INTERNAL_KEY && provided !== INTERNAL_KEY) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const briefDate = new Date().toISOString().slice(0, 10);
  let sent = 0;

  // 1) Discover orgs whose supervisors opted in.
  const { data: orgs } = await admin.from("organizations").select("id, name");
  if (!orgs) {
    return new Response(JSON.stringify({ sent: 0, orgs: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const o of orgs) {
    const brief = await buildBriefForOrg(o.id, o.name);
    if (brief.open_wos === 0 && brief.completed_yesterday === 0) continue;

    // Find supervisors/admins for this org with email notifications enabled.
    const { data: members } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", o.id);
    const ids = (members ?? []).map((m) => (m as { user_id: string }).user_id);
    if (ids.length === 0) continue;

    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", ids);

    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("user_id, email_morning_brief")
      .in("user_id", ids);
    const prefMap = new Map<string, { email_morning_brief: boolean | null }>();
    for (const p of prefs ?? []) {
      const row = p as { user_id: string; email_morning_brief: boolean | null };
      prefMap.set(row.user_id, row);
    }

    const html = renderHtml(brief);
    const subject = `[${o.name}] Morning brief — ${brief.open_wos} open, ${brief.overdue} overdue`;
    const category = `morning_brief:${o.id}:${briefDate}`;

    for (const p of profiles ?? []) {
      const profile = p as { user_id: string; email: string | null };
      if (!profile.email) continue;
      const pref = prefMap.get(profile.user_id);
      if (pref && pref.email_morning_brief === false) continue;

      // Dedupe per (org, recipient, brief_date) via email_delivery_events.
      const { data: existing } = await admin
        .from("email_delivery_events")
        .select("id")
        .eq("recipient_email", profile.email)
        .eq("category", category)
        .limit(1);
      if (existing && existing.length > 0) continue;

      await sendEmail(profile.email, subject, html);
      await admin.from("email_delivery_events").insert({
        recipient_email: profile.email,
        recipient_user_id: profile.user_id,
        category,
        status: "sent",
      });
      sent++;
    }
  }

  return new Response(
    JSON.stringify({ sent, orgs: orgs.length, date: briefDate }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

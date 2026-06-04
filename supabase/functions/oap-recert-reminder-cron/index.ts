/**
 * oap-recert-reminder-cron
 *
 * Daily scanner for upcoming and overdue OAP recertifications. Sends one
 * email per (enrollment, bucket, due_at) combination via the send-email
 * function. Dedupe is enforced by the oap_recert_reminder_log table.
 *
 * Buckets: 30d, 14d, 7d, due, overdue7
 *
 * verify_jwt = false (internal cron only)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTERNAL_KEY = Deno.env.get("INTERNAL_REMINDER_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://jobline.ai";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

interface Bucket {
  key: string;
  lowerDays: number; // inclusive (days from now, positive = future)
  upperDays: number; // exclusive
  subject: (program: string, days: number) => string;
}

const BUCKETS: Bucket[] = [
  { key: "30d", lowerDays: 29, upperDays: 31, subject: (p) => `Reminder: ${p} recertification due in 30 days` },
  { key: "14d", lowerDays: 13, upperDays: 15, subject: (p) => `Action soon: ${p} recertification due in 14 days` },
  { key: "7d",  lowerDays: 6,  upperDays: 8,  subject: (p) => `This week: ${p} recertification due in 7 days` },
  { key: "due", lowerDays: 0,  upperDays: 1,  subject: (p) => `Due today: ${p} recertification` },
  { key: "overdue7", lowerDays: -8, upperDays: -6, subject: (p) => `Overdue: ${p} recertification has lapsed 7 days` },
];

interface EnrollmentRow {
  id: string;
  user_id: string;
  organization_id: string;
  next_recert_due: string;
  role_program_id: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_KEY,
    },
    body: JSON.stringify({ to, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`send-email ${res.status}: ${text}`);
  }
}

function htmlBody(name: string, program: string, dueAt: string, bucket: string) {
  const link = `${APP_URL}/resources/oap`;
  const action =
    bucket === "overdue7"
      ? "Your certification has lapsed. Please contact your supervisor immediately to begin the recertification process."
      : "Please schedule your recertification with your mentor before the due date to keep your credential active.";
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;color:#0f172a">${program} — recertification ${bucket === "due" ? "due today" : bucket === "overdue7" ? "overdue" : "approaching"}</h2>
      <p>Hi ${name},</p>
      <p>Your <strong>${program}</strong> certification is due on <strong>${new Date(dueAt).toLocaleDateString()}</strong>.</p>
      <p>${action}</p>
      <p style="margin-top:20px"><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Open OAP</a></p>
      <p style="color:#64748b;font-size:12px;margin-top:24px">Sent by JobLine OAP · You can manage notification preferences in your account settings.</p>
    </div>`;
}

async function getRecipient(userId: string): Promise<{ email: string; name: string } | null> {
  const { data } = await admin.auth.admin.getUserById(userId);
  if (!data?.user?.email) return null;
  const { data: prof } = await admin
    .from("profiles")
    .select("display_name, full_name")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    email: data.user.email,
    name: prof?.display_name ?? prof?.full_name ?? "Operator",
  };
}

async function getProgramName(roleProgramId: string): Promise<string> {
  const { data } = await admin
    .from("oap_role_programs")
    .select("name")
    .eq("id", roleProgramId)
    .maybeSingle();
  return data?.name ?? "OAP";
}

async function processBucket(bucket: Bucket) {
  const now = new Date();
  const lo = new Date(now.getTime() + bucket.lowerDays * 86400000);
  const hi = new Date(now.getTime() + bucket.upperDays * 86400000);

  const { data: rows, error } = await admin
    .from("oap_enrollments")
    .select("id, user_id, organization_id, next_recert_due, role_program_id")
    .eq("lifecycle_status", "active")
    .gte("next_recert_due", lo.toISOString())
    .lt("next_recert_due", hi.toISOString())
    .limit(500);
  if (error) throw error;

  let sent = 0, skipped = 0, failed = 0;
  for (const row of (rows ?? []) as EnrollmentRow[]) {
    try {
      // Dedupe via unique (enrollment_id, reminder_bucket, due_at).
      const dueAt = row.next_recert_due;
      const { data: existing } = await admin
        .from("oap_recert_reminder_log")
        .select("id")
        .eq("enrollment_id", row.id)
        .eq("reminder_bucket", bucket.key)
        .eq("due_at", dueAt)
        .maybeSingle();
      if (existing) { skipped++; continue; }

      const recipient = await getRecipient(row.user_id);
      if (!recipient) { skipped++; continue; }
      const program = await getProgramName(row.role_program_id);

      await sendEmail(recipient.email, bucket.subject(program, bucket.lowerDays), htmlBody(recipient.name, program, dueAt, bucket.key));

      await admin.from("oap_recert_reminder_log").insert({
        enrollment_id: row.id,
        organization_id: row.organization_id,
        operator_user_id: row.user_id,
        recipient_email: recipient.email,
        due_at: dueAt,
        reminder_bucket: bucket.key,
      });
      await admin.from("oap_recert_events").insert({
        enrollment_id: row.id,
        organization_id: row.organization_id,
        operator_user_id: row.user_id,
        event_type: "reminder_sent",
        new_due: dueAt,
        metadata: { bucket: bucket.key, source: "cron" },
      });
      sent++;
    } catch (e) {
      console.error("recert reminder failed", row.id, e);
      failed++;
    }
  }
  return { bucket: bucket.key, scanned: rows?.length ?? 0, sent, skipped, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Soft auth — accept either the internal key or service role bearer.
  const internal = req.headers.get("x-internal-key");
  const auth = req.headers.get("authorization") || "";
  const ok = (INTERNAL_KEY && internal === INTERNAL_KEY) ||
             auth === `Bearer ${SERVICE_KEY}`;
  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const results = [];
    for (const b of BUCKETS) results.push(await processBucket(b));
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

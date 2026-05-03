/// <reference path="../deno-vscode.d.ts" />

/**
 * log-export — FedRAMP G-07 SIEM Log Export Edge Function
 * Controls: AU-6 (Audit Review, Analysis, and Reporting), AU-9 (Protection of Audit Information)
 *
 * This function can be called two ways:
 * 1. Via Supabase Database Webhook on activity_logs INSERT (automatic, push model)
 * 2. Via direct HTTP POST from the settings UI "Send Test Event" button
 *
 * It reads the org's siem_configurations row and forwards the event to the
 * configured SIEM endpoint in JSON (default) or CEF format.
 *
 * Severity filter: events below min_severity are silently dropped.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CEF (ArcSight Common Event Format) header builder
// CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension
// ---------------------------------------------------------------------------
function toCEF(event: Record<string, unknown>): string {
  const vendor  = "JobLineAI";
  const product = "JobLine";
  const version = "1.0";
  const sigId   = String(event.activity_type ?? "generic");
  const name    = String(event.description ?? "activity");
  const sev     = severityToCEFLevel(String(event.severity ?? "info"));

  const ext: string[] = [
    `rt=${new Date(String(event.created_at ?? new Date().toISOString())).getTime()}`,
    event.user_id   ? `suser=${event.user_id}`  : "",
    event.user_email ? `email=${event.user_email}` : "",
    event.ip_address ? `src=${event.ip_address}` : "",
    event.org_id    ? `cs1=${event.org_id} cs1Label=orgId` : "",
  ].filter(Boolean);

  return `CEF:0|${vendor}|${product}|${version}|${sigId}|${name}|${sev}|${ext.join(" ")}`;
}

function severityToCEFLevel(s: string): number {
  const map: Record<string, number> = { debug: 1, info: 3, warning: 6, error: 9, critical: 10 };
  return map[s.toLowerCase()] ?? 3;
}

// ---------------------------------------------------------------------------
// Severity ordering — filters below min_severity
// ---------------------------------------------------------------------------
const SEV_ORDER: Record<string, number> = { debug: 0, info: 1, warning: 2, error: 3, critical: 4 };

function severityMeetsMinimum(eventSev: string, minSev: string): boolean {
  return (SEV_ORDER[eventSev.toLowerCase()] ?? 1) >= (SEV_ORDER[minSev.toLowerCase()] ?? 1);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const supabaseUrl      = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[log-export] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Auth gate ───────────────────────────────────────────────────────────
  // Accept either:
  //   (a) Supabase DB Webhook signature header `x-supabase-signature` matching SUPABASE_WEBHOOK_SECRET, or
  //   (b) A valid JWT belonging to a platform admin / org admin / developer.
  // Reject everyone else to prevent SIEM event forgery + rate exhaustion.
  const webhookSecret = Deno.env.get("SUPABASE_WEBHOOK_SECRET") ?? "";
  const sigHeader = req.headers.get("x-supabase-signature") ?? "";
  let authorized = !!webhookSecret && sigHeader === webhookSecret;

  if (!authorized) {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      try {
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: u } = await userClient.auth.getUser();
        const uid = u?.user?.id;
        if (uid) {
          const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
          const { data: isDeveloper } = await supabase.rpc("has_role", { _user_id: uid, _role: "developer" });
          if (isAdmin === true || isDeveloper === true) authorized = true;
        }
      } catch (e) {
        console.error("[log-export] auth check failed:", e);
      }
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  // Determine org_id — either from a webhook payload or a direct call
  // Webhook payload shape: { type: 'INSERT', table: 'activity_logs', record: {...} }
  let orgId: string | undefined;
  let eventRecord: Record<string, unknown>;

  if (body.type === "INSERT" && body.table === "activity_logs" && body.record) {
    // Database webhook mode — look up org_id from user_id
    eventRecord = body.record as Record<string, unknown>;
    const userId = String(eventRecord.user_id ?? "");

    if (userId) {
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();
      orgId = member?.organization_id;
    }
  } else {
    // Direct call mode (from UI test button or manual invocation)
    orgId = String(body.org_id ?? "");
    eventRecord = (body.event as Record<string, unknown>) ?? {
      activity_type: "test_event",
      description: "SIEM connectivity test from JobLine admin UI",
      severity: "info",
      created_at: new Date().toISOString(),
    };
  }

  if (!orgId) {
    return new Response(JSON.stringify({ error: "Could not determine org_id for this event" }), { status: 422 });
  }

  // Load SIEM configuration for this org
  const { data: config, error: configErr } = await supabase
    .from("siem_configurations")
    .select("enabled, provider_type, endpoint_url, auth_header_name, auth_token, event_format, min_severity")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (configErr) {
    console.error("[log-export] Config read error:", configErr.message);
    return new Response(JSON.stringify({ error: "Failed to read SIEM configuration" }), { status: 500 });
  }

  if (!config || !config.enabled) {
    // SIEM not configured or disabled for this org — silently succeed
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "siem_disabled" }), { status: 200 });
  }

  if (!config.endpoint_url) {
    console.warn(`[log-export] SIEM enabled for org ${orgId} but no endpoint_url configured`);
    return new Response(JSON.stringify({ ok: false, reason: "no_endpoint" }), { status: 200 });
  }

  // Severity filter
  const eventSev = String(eventRecord.severity ?? "info");
  if (!severityMeetsMinimum(eventSev, String(config.min_severity ?? "info"))) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "below_min_severity" }), { status: 200 });
  }

  // Enrich event with org context
  const enriched = { ...eventRecord, org_id: orgId, _source: "jobline_ai" };

  // Format payload
  let body_str: string;
  let contentType: string;

  if (config.event_format === "cef") {
    body_str    = toCEF(enriched);
    contentType = "text/plain";
  } else {
    body_str    = JSON.stringify(enriched);
    contentType = "application/json";
  }

  // Forward to SIEM
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (config.auth_token) {
    headers[String(config.auth_header_name ?? "Authorization")] = config.auth_token;
  }

  let exportOk = false;
  let exportError: string | null = null;

  try {
    const siemResp = await fetch(String(config.endpoint_url), {
      method: "POST",
      headers,
      body: body_str,
    });

    exportOk = siemResp.ok;
    if (!siemResp.ok) {
      exportError = `SIEM returned HTTP ${siemResp.status}`;
      console.error(`[log-export] SIEM error for org ${orgId}: ${exportError}`);
    }
  } catch (err) {
    exportError = err instanceof Error ? err.message : "Network error";
    console.error(`[log-export] SIEM fetch failed for org ${orgId}: ${exportError}`);
  }

  // Update last_export_at and error count
  if (exportOk) {
    await supabase
      .from("siem_configurations")
      .update({ last_export_at: new Date().toISOString(), export_error_count: 0 })
      .eq("organization_id", orgId);
  } else {
    const { error: incrementError } = await supabase.rpc("increment_siem_error_count", { p_org_id: orgId });
    if (incrementError) {
      // Fallback if RPC not available — raw update
      await supabase
        .from("siem_configurations")
        .update({ export_error_count: (config as any).export_error_count + 1 })
        .eq("organization_id", orgId);
    }
  }

  return new Response(
    JSON.stringify({ ok: exportOk, error: exportError }),
    { status: exportOk ? 200 : 502, headers: { "Content-Type": "application/json" } }
  );
});

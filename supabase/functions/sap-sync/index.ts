/**
 * supabase/functions/sap-sync/index.ts
 *
 * SAP S/4HANA sync edge function.
 *
 * Phase status:
 *   ✅ Ph 1 — Sandbox APIKey wiring (sandbox.api.sap.com)
 *   ✅ Ph 2 — Connection model (instance_type + metadata.sap_default_plant)
 *   ✅ Ph 3 — Connector UI (vendor=sap, sandbox/production toggle)
 *   ✅ Ph 4 — Audit trail via erp_sync_logs (start/finish/duration/error)
 *   ✅ Ph 5 — Production OAuth client_credentials + queue_items write-through
 *
 * Auth flow:
 *   - JWT validated via supabase.auth.getUser()
 *   - Org membership verified against organization_members
 *   - Sandbox creds: SAP_SANDBOX_API_KEY env var (central)
 *   - Production creds: per-org erp_connections row
 *       (oauth_token_endpoint, client_id_encrypted, client_secret_encrypted,
 *        api_base_url, scopes, metadata.sap_default_plant)
 *
 * Resources:
 *   - test_connection      → cheap GET probe (sandbox or production)
 *   - production_orders    → A_ProductionOrder_2 OData entity, optionally
 *                            written through to public.queue_items when
 *                            ?writeThrough=true
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SAP_SANDBOX_BASE = "https://sandbox.api.sap.com/s4hanacloud";

interface SapSyncRequest {
  organization_id?: string;
  resource?:
    | "production_orders"
    | "planned_orders"
    | "inspection_lots"
    | "material_stock"
    | "test_connection";
  plant?: string;
  filter?: string;
  top?: number;
  /** Phase 5 — when true, upsert pulled production orders into queue_items */
  write_through?: boolean;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function callSapOData(
  baseUrl: string,
  path: string,
  authHeader: { name: string; value: string },
  query: Record<string, string | undefined> = {},
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("$format", "json");
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        [authHeader.name]: authHeader.value,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { raw: text.slice(0, 500) };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `SAP ${res.status}: ${typeof parsed === "object" ? JSON.stringify(parsed).slice(0, 300) : String(parsed)}`,
      };
    }
    return { ok: true, status: res.status, data: parsed };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ── Phase 5 — OAuth client_credentials token exchange ────────────────────────
//
// SAP S/4HANA Cloud uses OAuth2 client_credentials against the customer's
// tenant token endpoint. We do not cache tokens cross-invocation here; the
// edge runtime is short-lived and a fresh token per sync run is acceptable
// for the current scale. Move to a Postgres-backed cache when sync frequency
// crosses ~1 req/min/org.
async function exchangeClientCredentials(
  tokenEndpoint: string,
  clientId: string,
  clientSecret: string,
  scopes?: string,
): Promise<{ ok: boolean; token?: string; error?: string; expires_in?: number }> {
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });
    if (scopes && scopes !== "read-only") body.set("scope", scopes);

    const res = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `OAuth ${res.status}: ${text.slice(0, 300)}` };
    }
    const parsed = JSON.parse(text) as { access_token?: string; expires_in?: number };
    if (!parsed.access_token) {
      return { ok: false, error: "OAuth response missing access_token" };
    }
    return { ok: true, token: parsed.access_token, expires_in: parsed.expires_in };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "OAuth network error" };
  }
}

// ── Phase 5 — write-through to queue_items ───────────────────────────────────
//
// Upsert SAP production orders into public.queue_items keyed by
// (organization_id, work_order_number). We deliberately use the service-role
// client for this so RLS does not block the system-managed sync. Each row
// records erp_job_id + sync metadata so the AI assistant + UI can flag it as
// ERP-sourced.
async function upsertQueueItems(
  admin: ReturnType<typeof createClient>,
  organizationId: string,
  rows: Array<Record<string, unknown>>,
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const erpJobId = String(row.ManufacturingOrder ?? row.ProductionOrder ?? "").trim();
    if (!erpJobId) continue;

    const woNumber = `SAP-${erpJobId}`;
    const partNumber = String(row.Material ?? "").trim() || null;
    const qtyOrdered = Number(row.MfgOrderPlannedTotalQty ?? row.TotalQuantity ?? 0) || null;
    const dueDateRaw = String(row.MfgOrderScheduledEndDate ?? "");
    // SAP OData dates: "/Date(1700000000000)/"
    const dueDateMatch = dueDateRaw.match(/\/Date\((\d+)\)\//);
    const dueDate = dueDateMatch ? new Date(Number(dueDateMatch[1])).toISOString() : null;

    // Look for existing row first to count insert vs update accurately.
    const { data: existing } = await admin
      .from("queue_items")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("work_order_number", woNumber)
      .maybeSingle();

    const payload = {
      organization_id: organizationId,
      work_order_number: woNumber,
      part_number: partNumber,
      quantity_ordered: qtyOrdered,
      due_date: dueDate,
      status: "pending" as const,
      source_system: "sap",
      erp_job_id: erpJobId,
      last_synced_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await admin.from("queue_items").update(payload).eq("id", (existing as any).id)
      : await admin.from("queue_items").insert(payload as any);

    if (error) {
      errors.push(`${woNumber}: ${error.message}`);
    } else if (existing) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  return { inserted, updated, errors };
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { ok: false, error: { code: "unauthorized", message: "Missing bearer token" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return json(401, { ok: false, error: { code: "unauthorized", message: "Invalid session" } });
    }

    let body: SapSyncRequest;
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: { code: "bad_request", message: "Invalid JSON body" } });
    }

    if (!body.organization_id) {
      return json(400, { ok: false, error: { code: "bad_request", message: "organization_id required" } });
    }
    if (!body.resource) {
      return json(400, { ok: false, error: { code: "bad_request", message: "resource required" } });
    }

    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", body.organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!membership) {
      return json(403, { ok: false, error: { code: "forbidden", message: "Not a member of organization" } });
    }

    // Per-org connection lookup. Read full row from erp_connections (admin
    // client) so we can get the encrypted client_id/secret for production OAuth.
    const { data: erpConn } = await admin
      .from("erp_connections")
      .select(
        "id, erp_vendor, metadata, is_active, api_base_url, oauth_token_endpoint, client_id_encrypted, client_secret_encrypted, scopes",
      )
      .eq("organization_id", body.organization_id)
      .maybeSingle();

    const meta = ((erpConn as any)?.metadata ?? {}) as Record<string, unknown>;
    const instanceType = (meta.sap_instance_type as string) ?? "sandbox";
    const defaultPlant = (meta.sap_default_plant as string) ?? body.plant ?? "";
    const isProduction =
      (erpConn as any)?.erp_vendor === "sap" && instanceType === "production";

    // ── Resolve auth header for outbound SAP calls ──────────────────────────
    let sapBase = SAP_SANDBOX_BASE;
    let sapAuth: { name: string; value: string };

    if (isProduction) {
      const ec = erpConn as any;
      if (!ec.api_base_url || !ec.oauth_token_endpoint || !ec.client_id_encrypted || !ec.client_secret_encrypted) {
        return json(400, {
          ok: false,
          error: {
            code: "incomplete_production_config",
            message:
              "SAP production requires api_base_url, oauth_token_endpoint, client_id, and client_secret. Configure them in Settings → ERP Connector.",
          },
        });
      }
      const tokenRes = await exchangeClientCredentials(
        ec.oauth_token_endpoint,
        ec.client_id_encrypted,
        ec.client_secret_encrypted,
        ec.scopes ?? undefined,
      );
      if (!tokenRes.ok || !tokenRes.token) {
        return json(502, {
          ok: false,
          error: { code: "oauth_failed", message: tokenRes.error ?? "OAuth client_credentials failed" },
        });
      }
      sapBase = String(ec.api_base_url).replace(/\/+$/, "");
      sapAuth = { name: "Authorization", value: `Bearer ${tokenRes.token}` };
    } else {
      const apiKey = Deno.env.get("SAP_SANDBOX_API_KEY");
      if (!apiKey) {
        return json(500, {
          ok: false,
          error: { code: "missing_secret", message: "SAP_SANDBOX_API_KEY not configured" },
        });
      }
      sapAuth = { name: "APIKey", value: apiKey };
    }

    // ── Open audit log row (best-effort) ────────────────────────────────────
    const syncStartedAt = new Date().toISOString();
    let syncLogId: string | null = null;
    if ((erpConn as any)?.id) {
      const { data: logRow } = await admin
        .from("erp_sync_logs")
        .insert({
          organization_id: body.organization_id,
          erp_connection_id: (erpConn as any).id,
          sync_type: body.resource,
          started_at: syncStartedAt,
          status: "running",
          triggered_by: userData.user.id,
        } as any)
        .select("id")
        .maybeSingle();
      syncLogId = (logRow as any)?.id ?? null;
    }

    const closeLog = async (
      status: "success" | "error",
      records: number,
      created: number,
      updated: number,
      errorMessage?: string,
    ) => {
      if (!syncLogId) return;
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(syncStartedAt).getTime();
      await admin
        .from("erp_sync_logs")
        .update({
          status,
          completed_at: completedAt,
          duration_ms: durationMs,
          records_fetched: records,
          records_created: created,
          records_updated: updated,
          errors_count: status === "error" ? 1 : 0,
          error_details: errorMessage ? { message: errorMessage } : null,
        } as any)
        .eq("id", syncLogId);
    };

    // ── Resource: test_connection ───────────────────────────────────────────
    if (body.resource === "test_connection") {
      const probe = await callSapOData(
        sapBase,
        "/API_PRODUCTION_ORDER_2_SRV/A_ProductionOrder_2",
        sapAuth,
        { $top: "1" },
      );
      await closeLog(probe.ok ? "success" : "error", 0, 0, 0, probe.ok ? undefined : probe.error);
      return json(probe.ok ? 200 : 502, {
        ok: probe.ok,
        resource: "test_connection",
        count: 0,
        data: [],
        phase: 5,
        instance_type: instanceType,
        latency_check: probe.status,
        error: probe.ok ? undefined : { code: "sap_call_failed", message: probe.error ?? "Unknown" },
      });
    }

    // ── Resource: production_orders (with optional write-through) ──────────
    if (body.resource === "production_orders") {
      const filterParts: string[] = [];
      const plant = defaultPlant || body.plant;
      if (plant) filterParts.push(`ProductionPlant eq '${plant.replace(/'/g, "''")}'`);
      if (body.filter) filterParts.push(body.filter);

      const result = await callSapOData(
        sapBase,
        "/API_PRODUCTION_ORDER_2_SRV/A_ProductionOrder_2",
        sapAuth,
        {
          $top: String(Math.min(body.top ?? 50, 200)),
          $filter: filterParts.length ? filterParts.join(" and ") : undefined,
        },
      );

      if (!result.ok) {
        await closeLog("error", 0, 0, 0, result.error);
        return json(502, {
          ok: false,
          resource: body.resource,
          count: 0,
          data: [],
          phase: 5,
          error: { code: "sap_call_failed", message: result.error ?? "Unknown" },
        });
      }

      const d = (result.data as { d?: { results?: Array<Record<string, unknown>> } })?.d;
      const rows = Array.isArray(d?.results) ? d!.results! : [];

      // Optional write-through to queue_items
      let writeThroughResult: { inserted: number; updated: number; errors: string[] } | null = null;
      if (body.write_through) {
        writeThroughResult = await upsertQueueItems(admin, body.organization_id, rows);
      }

      await closeLog(
        "success",
        rows.length,
        writeThroughResult?.inserted ?? 0,
        writeThroughResult?.updated ?? 0,
        writeThroughResult?.errors.length ? writeThroughResult.errors.join("; ").slice(0, 500) : undefined,
      );
      return json(200, {
        ok: true,
        resource: body.resource,
        count: rows.length,
        data: rows,
        phase: 5,
        instance_type: instanceType,
        plant_filter: plant || null,
        write_through: writeThroughResult,
      });
    }

    await closeLog("success", 0, 0, 0);
    return json(200, {
      ok: true,
      resource: body.resource,
      count: 0,
      data: [],
      phase: 0,
      note: `${body.resource} not yet implemented.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(500, { ok: false, error: { code: "server_error", message } });
  }
});

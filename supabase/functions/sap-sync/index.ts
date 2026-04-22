/**
 * supabase/functions/sap-sync/index.ts
 *
 * SAP S/4HANA / ECC sync edge function — Phase 1 (sandbox wiring).
 *
 * Phase 1 calls SAP's free sandbox at api.sap.com using a raw fetch with
 * the `APIKey` header. No SDK install required — sandbox endpoints are plain
 * OData v2 + APIKey. The @sap-cloud-sdk/* libraries are deferred to Phase 2
 * (real customer connections needing OAuth + BTP destinations).
 *
 * Auth flow (per CONTEXT):
 *   - JWT validated in code via getClaims()
 *   - Org membership verified against organization_members
 *   - SAP credentials sourced from Deno.env (sandbox) or per-org config (P2)
 *
 * Resources supported in Phase 1:
 *   - test_connection      → cheap GET to verify APIKey works
 *   - production_orders    → API_PRODUCTION_ORDER_2_SRV / A_ProductionOrder_2
 *
 * Other resources still return phase:0 stub envelopes.
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
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callSapSandbox(
  path: string,
  apiKey: string,
  query: Record<string, string | undefined> = {}
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const url = new URL(`${SAP_SANDBOX_BASE}${path}`);
  url.searchParams.set("$format", "json");
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        APIKey: apiKey,
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
        error: `SAP sandbox ${res.status}: ${typeof parsed === "object" ? JSON.stringify(parsed).slice(0, 300) : String(parsed)}`,
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { ok: false, error: { code: "unauthorized", message: "Missing bearer token" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

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

    // === Phase 1 — sandbox wiring ===
    const apiKey = Deno.env.get("SAP_SANDBOX_API_KEY");
    if (!apiKey) {
      return json(500, {
        ok: false,
        resource: body.resource,
        count: 0,
        data: [],
        error: { code: "missing_secret", message: "SAP_SANDBOX_API_KEY not configured" },
      });
    }

    if (body.resource === "test_connection") {
      // Cheap probe — fetch one row from production orders.
      const probe = await callSapSandbox(
        "/API_PRODUCTION_ORDER_2_SRV/A_ProductionOrder_2",
        apiKey,
        { $top: "1" }
      );
      return json(probe.ok ? 200 : 502, {
        ok: probe.ok,
        resource: "test_connection",
        count: 0,
        data: [],
        phase: 1,
        sandbox: true,
        latency_check: probe.status,
        error: probe.ok ? undefined : { code: "sap_sandbox_error", message: probe.error ?? "Unknown" },
      });
    }

    if (body.resource === "production_orders") {
      const filterParts: string[] = [];
      if (body.plant) filterParts.push(`ProductionPlant eq '${body.plant.replace(/'/g, "''")}'`);
      if (body.filter) filterParts.push(body.filter);

      const result = await callSapSandbox(
        "/API_PRODUCTION_ORDER_2_SRV/A_ProductionOrder_2",
        apiKey,
        {
          $top: String(Math.min(body.top ?? 50, 200)),
          $filter: filterParts.length ? filterParts.join(" and ") : undefined,
        }
      );

      if (!result.ok) {
        return json(502, {
          ok: false,
          resource: body.resource,
          count: 0,
          data: [],
          phase: 1,
          sandbox: true,
          error: { code: "sap_sandbox_error", message: result.error ?? "Unknown" },
        });
      }

      // OData v2 envelope: { d: { results: [...] } }
      const d = (result.data as { d?: { results?: unknown[] } })?.d;
      const rows = Array.isArray(d?.results) ? d!.results! : [];

      return json(200, {
        ok: true,
        resource: body.resource,
        count: rows.length,
        data: rows,
        phase: 1,
        sandbox: true,
      });
    }

    // Other resources — still Phase 0 stubs.
    return json(200, {
      ok: true,
      resource: body.resource,
      count: 0,
      data: [],
      phase: 0,
      note: `${body.resource} not yet implemented — Phase 2.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(500, { ok: false, error: { code: "server_error", message } });
  }
});

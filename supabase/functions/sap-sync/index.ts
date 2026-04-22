/**
 * supabase/functions/sap-sync/index.ts
 *
 * SAP S/4HANA / ECC sync edge function — Phase 0 stub.
 *
 * Today: validates JWT + org membership and returns an empty success envelope
 * with `phase: 0` so the frontend can be wired before the SDK is installed.
 *
 * Phase 1 will install the SAP Cloud SDK via Deno npm specifiers:
 *   import { executeHttpRequest } from "npm:@sap-cloud-sdk/http-client@^4";
 *   import { registerDestination } from "npm:@sap-cloud-sdk/connectivity@^4";
 *
 * Per CONTEXT: never call functions by path; never log raw credentials;
 * always validate JWT in code (signing-keys system).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SapSyncRequest {
  organization_id?: string;
  resource?: "production_orders" | "planned_orders" | "inspection_lots" | "material_stock" | "test_connection";
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

    // Org membership check — same pattern as erp-sync.
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", body.organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!membership) {
      return json(403, { ok: false, error: { code: "forbidden", message: "Not a member of organization" } });
    }

    // === Phase 0 stub ===
    // The SAP Cloud SDK is intentionally NOT installed yet. This function
    // returns a well-formed empty envelope so the frontend can be developed
    // and tested without breaking Supabase or the existing `erp-sync` flow.
    return json(200, {
      ok: true,
      resource: body.resource,
      count: 0,
      data: [],
      phase: 0,
      note: "SAP connector scaffold — SDK install pending Phase 1.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(500, { ok: false, error: { code: "server_error", message } });
  }
});

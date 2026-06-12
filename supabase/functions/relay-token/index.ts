/**
 * relay-token — Supabase Edge Function
 *
 * Exchanges the relay API key for a short-lived subscriber JWT.
 * RELAY_API_KEY is a server-only secret and never reaches the browser.
 *
 * Required Supabase secrets:
 *   RELAY_URL      — HTTP/WS URL of the jobline-relay server
 *   RELAY_API_KEY  — Publisher API key (tenantId:apiKey)
 *
 * Response shape:
 *   200 { configured: true,  token, relayUrl, tenantId } — live relay ready
 *   200 { configured: false, reason }                    — relay disabled / not set up
 *   401                                                  — caller is not authenticated
 *
 * Returning 200 for "not configured" prevents the frontend from logging a
 * scary runtime error during the Phase 1 static-data fallback.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: use anon client + caller's Authorization header ─────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Missing Authorization header" });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json(401, { error: "User not authenticated" });
    }

    // ── Relay config (soft-fail to keep frontend quiet in Phase 1) ────────
    const RELAY_URL = Deno.env.get("RELAY_URL");
    const RELAY_API_KEY = Deno.env.get("RELAY_API_KEY");

    if (
      !RELAY_URL ||
      !RELAY_API_KEY ||
      RELAY_URL.includes("placeholder") ||
      RELAY_URL.includes("example")
    ) {
      return json(200, {
        configured: false,
        reason: "Relay is not configured on this server",
      });
    }

    // ── Exchange API key for subscriber JWT ───────────────────────────────
    const tokenEndpoint = `${RELAY_URL.replace(/\/$/, "")}/api/v1/auth/token`;

    let relayResp: Response;
    try {
      relayResp = await fetch(tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: RELAY_API_KEY }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[relay-token] Relay unreachable:", message);
      return json(200, { configured: false, reason: "Relay unreachable" });
    }

    if (!relayResp.ok) {
      const body = await relayResp.text().catch(() => "");
      console.error(`[relay-token] Exchange failed ${relayResp.status}: ${body}`);
      return json(200, {
        configured: false,
        reason: `Relay token exchange failed (${relayResp.status})`,
      });
    }

    const { token: subscriberToken, tenantId } = (await relayResp.json()) as {
      token: string;
      tenantId: string;
    };

    const relayWsUrl = RELAY_URL.replace(/^http/, "ws");

    return json(200, {
      configured: true,
      token: subscriberToken,
      relayUrl: relayWsUrl,
      tenantId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[relay-token] Error:", message);
    return json(500, { error: message });
  }
});

/**
 * relay-token — Supabase Edge Function
 *
 * Exchanges the relay API key for a short-lived subscriber JWT.
 * The relay API key is stored as a Supabase secret (RELAY_API_KEY) and
 * NEVER sent to the browser.
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   RELAY_URL      — HTTP/WS URL of the jobline-relay server, e.g. https://relay.jobline.ai
 *   RELAY_API_KEY  — Publisher API key (format: tenantId:apiKey)
 *
 * Response:
 *   { token: string, relayUrl: string, tenantId: string }
 *   where relayUrl uses ws:// or wss:// scheme for the browser WebSocket connection.
 *
 * Called by: src/connectors/jobline/client.ts → fetchRelayToken()
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: verify the calling user is authenticated ─────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError(401, "No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return jsonError(401, "User not authenticated");
    }

    // ── Read relay config from secrets ────────────────────────────────────
    const RELAY_URL     = Deno.env.get("RELAY_URL");
    const RELAY_API_KEY = Deno.env.get("RELAY_API_KEY");

    if (!RELAY_URL || !RELAY_API_KEY) {
      return jsonError(503, "Relay is not configured on this server");
    }

    // ── Exchange API key for subscriber JWT ───────────────────────────────
    const tokenEndpoint = `${RELAY_URL.replace(/\/$/, "")}/api/v1/auth/token`;

    const relayResp = await fetch(tokenEndpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ apiKey: RELAY_API_KEY }),
      signal:  AbortSignal.timeout(8000),
    });

    if (!relayResp.ok) {
      const body = await relayResp.text().catch(() => "");
      console.error(`[relay-token] Exchange failed ${relayResp.status}: ${body}`);
      return jsonError(502, "Relay token exchange failed");
    }

    const { token: subscriberToken, tenantId } = await relayResp.json() as {
      token: string;
      tenantId: string;
    };

    // ── Return WS URL + subscriber JWT to the browser ─────────────────────
    // Convert http(s) → ws(s) so the frontend can use it directly for WebSocket
    const relayWsUrl = RELAY_URL.replace(/^http/, "ws");

    return new Response(
      JSON.stringify({ token: subscriberToken, relayUrl: relayWsUrl, tenantId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[relay-token] Error:", message);
    return jsonError(500, message);
  }
});

function jsonError(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status }
  );
}

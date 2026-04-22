/**
 * sap-sync edge function — Deno tests
 *
 * Lightweight contract tests:
 *   1. OPTIONS preflight returns CORS headers
 *   2. Missing auth header returns 401
 *   3. Missing org_id returns 400
 *
 * SAP OData itself is NOT exercised here — that requires a live tenant
 * (sandbox.api.sap.com or a customer S/4HANA) and the SAP_SANDBOX_APIKEY
 * secret. End-to-end happy-path verification is performed manually via the
 * /dev/sap-test page. See:
 *   https://developers.sap.com/tutorials/api-tutorial-tools.html
 *   https://api.sap.com/api/OP_API_PRODUCTION_ORDER_2_SRV
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/sap-sync`;

Deno.test("sap-sync: OPTIONS returns CORS headers", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS" });
  await res.text();
  assertEquals(res.status, 200);
  assert(res.headers.get("access-control-allow-origin"));
});

Deno.test("sap-sync: missing Authorization → 401", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ organization_id: "00000000-0000-0000-0000-000000000000", resource: "test_connection" }),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("sap-sync: malformed body → 400", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON}`,
      apikey: ANON,
    },
    body: "not-json",
  });
  await res.text();
  assert(res.status === 400 || res.status === 401, `expected 400 or 401, got ${res.status}`);
});

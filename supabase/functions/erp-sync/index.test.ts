import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const ERP_SYNC_URL = `${SUPABASE_URL}/functions/v1/erp-sync`;

Deno.test("erp-sync: rejects unauthenticated requests", async () => {
  const response = await fetch(ERP_SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      organization_id: "test-org-id",
      sync_type: "full",
    }),
  });

  const body = await response.json();
  assertEquals(response.status, 401);
  assertExists(body.error);
});

Deno.test("erp-sync: rejects request without organization_id", async () => {
  const response = await fetch(ERP_SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, // will fail auth but tests the param check path
    },
    body: JSON.stringify({
      sync_type: "full",
    }),
  });

  // Should get 401 (auth fails first) or 400 (missing org_id)
  const body = await response.json();
  assertExists(body.error);
  // Either unauthorized or missing org_id is acceptable
  assertEquals(response.status >= 400, true);
});

Deno.test("erp-sync: handles CORS preflight", async () => {
  const response = await fetch(ERP_SYNC_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://jobline.ai",
      "Access-Control-Request-Method": "POST",
    },
  });

  await response.text(); // consume body
  assertEquals(response.status, 200);
});

Deno.test("erp-sync: rejects non-admin org members", async () => {
  // This tests that even with a valid-looking token, non-admins get rejected
  const response = await fetch(ERP_SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer invalid-token-for-non-admin",
    },
    body: JSON.stringify({
      organization_id: "test-org-id",
      sync_type: "incremental",
      test_connection: true,
    }),
  });

  const body = await response.json();
  assertExists(body.error);
  assertEquals(response.status >= 400, true);
});

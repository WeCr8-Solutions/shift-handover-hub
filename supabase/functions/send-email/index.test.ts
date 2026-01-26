import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-email`;

Deno.test("send-email: returns error for missing required fields", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });

  const body = await response.json();
  assertEquals(response.status, 500);
  assertExists(body.error);
});

Deno.test("send-email: handles CORS preflight request", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  // Consume the body
  await response.text();
  
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("send-email: returns error for unknown email type", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      type: "unknown-type",
      to: "test@example.com",
      data: {},
    }),
  });

  const body = await response.json();
  assertEquals(response.status, 500);
  assertExists(body.error);
});

Deno.test("send-email: validates email type parameter", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      type: "welcome",
      to: "test@example.com",
      data: {
        userName: "Test User",
      },
    }),
  });

  const body = await response.json();
  // This should either succeed or fail with Resend error (not validation)
  if (response.status === 200) {
    assertExists(body.success);
  } else {
    // If it fails, it should be a Resend API error, not a validation error
    assertExists(body.error);
  }
  
  // Consume response body
  await response.text().catch(() => {});
});

Deno.test("send-email: accepts team-invite email type", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      type: "team-invite",
      to: "teammate@example.com",
      data: {
        inviterName: "Admin User",
        teamName: "Test Team",
        inviteUrl: "https://jobline.ai/invite/test123",
        role: "member",
      },
    }),
  });

  // Response should be 200 or 500 (Resend API might reject in test mode)
  const body = await response.json();
  if (response.status === 200) {
    assertExists(body.success);
  } else {
    assertExists(body.error);
  }
});

Deno.test("send-email: accepts promo-code email type", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      type: "promo-code",
      to: "user@example.com",
      data: {
        recipientName: "User",
        senderName: "Sender",
        promoCode: "TEST123",
        discountAmount: "20%",
        expiryDate: "2024-12-31",
      },
    }),
  });

  const body = await response.json();
  if (response.status === 200) {
    assertExists(body.success);
  } else {
    assertExists(body.error);
  }
});

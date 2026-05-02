// supabase/functions/create-cert-checkout/index.ts
//
// Guest-friendly $12 one-time checkout for OAP/GCA certificates.
// No auth required. Recipient name/email are captured up front and stuffed
// into the Stripe session metadata so the webhook can issue the cert after
// payment settles.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Single SKU — covers both OAP and GCA at $12.
const CERT_PRICE_ID = "price_1TNJaOCyekafHX78smLqNM5i";

interface ReqBody {
  program: "OAP" | "GCA";
  recipientName: string;
  recipientEmail: string;
  programName?: string;
  organizationName?: string | null;
  bankId?: string | null;
  /** OAP role program the recipient passed; webhook validates passing attempts. */
  roleProgramId?: string | null;
  /** Authenticated user id (recipient must be signed in for paid cert). */
  recipientUserId?: string | null;
  /**
   * When set, the checkout is an "upgrade" — the holder of an existing
   * (digital-only) cert is paying $12 to unlock PDF download + Print on
   * jobline.ai/verify/:certId. The webhook will UPDATE the existing row
   * instead of inserting a new one. Cert ID format: PROGRAM-XXXXXX-YYYY.
   */
  upgradeCertId?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ReqBody;

    if (!body.program || !["OAP", "GCA"].includes(body.program)) {
      throw new Error("program must be 'OAP' or 'GCA'");
    }
    if (!body.recipientName?.trim() || !body.recipientEmail?.trim()) {
      throw new Error("recipientName and recipientEmail are required");
    }
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.recipientEmail);
    if (!emailOk) throw new Error("recipientEmail is not a valid email address");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://jobline.ai";

    const programName =
      body.programName?.trim() ||
      (body.program === "OAP"
        ? "Operator Acceptance Program — Floor Certified"
        : "G-Code Academy — Certificate of Completion");

    const upgradeCertId = body.upgradeCertId?.trim() || "";
    if (upgradeCertId && !/^(OAP|GCA)-[A-Z0-9-]+-\d{4}$/.test(upgradeCertId)) {
      throw new Error("upgradeCertId is not a valid cert ID");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: body.recipientEmail,
      line_items: [{ price: CERT_PRICE_ID, quantity: 1 }],
      success_url: upgradeCertId
        ? `${origin}/verify/${upgradeCertId}?upgraded=1`
        : `${origin}/cert/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: upgradeCertId
        ? `${origin}/verify/${upgradeCertId}`
        : `${origin}/${body.program === "OAP" ? "oap" : "gca"}`,
      metadata: {
        product_type: "cert",
        program: body.program,
        recipient_name: body.recipientName.trim().slice(0, 200),
        recipient_email: body.recipientEmail.trim().toLowerCase(),
        program_name: programName.slice(0, 200),
        organization_name: (body.organizationName ?? "").slice(0, 200),
        bank_id: body.bankId ?? "",
        upgrade_cert_id: upgradeCertId,
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-cert-checkout] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

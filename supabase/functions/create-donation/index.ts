import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-DONATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { price_id, amount_cents } = await req.json();
    logStep("Request body parsed", { price_id, amount_cents });

    // Allowlist origin to prevent attacker-controlled success/cancel redirects.
    const ALLOWED_ORIGINS = new Set([
      "https://jobline.ai",
      "https://www.jobline.ai",
      "https://app.jobline.ai",
      "https://dev.jobline.ai",
      "https://joblineai.lovable.app",
    ]);
    const rawOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : "https://jobline.ai";
    
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (price_id) {
      // Use preset price ID
      lineItems = [{
        price: price_id,
        quantity: 1,
      }];
      logStep("Using preset price", { price_id });
    } else if (amount_cents && amount_cents >= 100) {
      // Custom amount - create price_data
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Support JobLine - Custom Donation",
            description: "One-time donation to help keep JobLine running and improving",
          },
          unit_amount: amount_cents,
        },
        quantity: 1,
      }];
      logStep("Using custom amount", { amount_cents });
    } else {
      throw new Error("Invalid donation: provide price_id or amount_cents (min $1)");
    }

    // Create checkout session for one-time payment (no auth required for donations)
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/donation-success`,
      cancel_url: `${origin}/`,
      submit_type: "donate",
      billing_address_collection: "auto",
      metadata: {
        type: "donation",
        source: "jobline_support_modal",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

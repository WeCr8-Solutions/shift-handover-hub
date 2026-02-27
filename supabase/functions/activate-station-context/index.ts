import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMCA_PRICE_ID = "price_1T5YNyCyekafHX788ZWqCn1h";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ACTIVATE-STATION-CONTEXT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { station_id, profile_id } = await req.json();
    if (!station_id || !profile_id) {
      throw new Error("station_id and profile_id are required");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabase.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Verify the profile exists and belongs to the user's org
    const { data: profile, error: profileErr } = await supabase
      .from("station_machine_profiles")
      .select("id, organization_id, context_active")
      .eq("id", profile_id)
      .single();

    if (profileErr || !profile) throw new Error("Machine profile not found");
    if (profile.context_active) {
      return new Response(
        JSON.stringify({ error: "This station context is already activated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is org member
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!membership) throw new Error("Access denied: not an org member");

    // Get or create Stripe customer
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check org's stripe customer
    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id, billing_email")
      .eq("id", profile.organization_id)
      .single();

    let customerId: string | undefined;
    const billingEmail = org?.billing_email || user.email;

    if (org?.stripe_customer_id) {
      customerId = org.stripe_customer_id;
    } else {
      const customers = await stripe.customers.list({ email: billingEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        await supabase
          .from("organizations")
          .update({ stripe_customer_id: customerId })
          .eq("id", profile.organization_id);
      }
    }

    const origin = req.headers.get("origin") || "https://jobline.ai";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : billingEmail,
      line_items: [{ price: SMCA_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/settings?tab=stations&smca=success&profile_id=${profile_id}`,
      cancel_url: `${origin}/settings?tab=stations&smca=cancelled`,
      metadata: {
        type: "station_context_activation",
        profile_id: profile_id,
        station_id: station_id,
        user_id: user.id,
        org_id: profile.organization_id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

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

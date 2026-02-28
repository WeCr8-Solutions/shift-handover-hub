import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMCA_PRICE_ID = "price_1T5YNyCyekafHX788ZWqCn1h";

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
    const { machine_library_id, organization_id } = await req.json();
    if (!machine_library_id || !organization_id) {
      throw new Error("machine_library_id and organization_id are required");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabase.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Check if already purchased
    const { data: existing } = await supabase
      .from("organization_machine_purchases")
      .select("id, is_active")
      .eq("organization_id", organization_id)
      .eq("machine_library_id", machine_library_id)
      .maybeSingle();

    if (existing?.is_active) {
      return new Response(
        JSON.stringify({ error: "This machine profile is already purchased" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify machine exists in library
    const { data: machine, error: machineErr } = await supabase
      .from("verified_machine_library")
      .select("id, manufacturer, model")
      .eq("id", machine_library_id)
      .single();

    if (machineErr || !machine) throw new Error("Machine not found in library");

    // Verify user is org member
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .single();

    if (!membership) throw new Error("Access denied: not an org member");

    // Stripe checkout
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id, billing_email")
      .eq("id", organization_id)
      .single();

    let customerId: string | undefined;
    const billingEmail = org?.billing_email || user.email;

    if (org?.stripe_customer_id) {
      customerId = org.stripe_customer_id;
    } else {
      const customers = await stripe.customers.list({ email: billingEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        await supabase.from("organizations").update({ stripe_customer_id: customerId }).eq("id", organization_id);
      }
    }

    const origin = req.headers.get("origin") || "https://jobline.ai";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : billingEmail,
      line_items: [{ price: SMCA_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/settings?tab=stations&smca=success&machine_id=${machine_library_id}`,
      cancel_url: `${origin}/settings?tab=stations&smca=cancelled`,
      metadata: {
        type: "machine_library_purchase",
        machine_library_id,
        organization_id,
        user_id: user.id,
        machine_name: `${machine.manufacturer} ${machine.model}`,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

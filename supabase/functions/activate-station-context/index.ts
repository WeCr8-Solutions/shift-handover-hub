import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SMCA_PRICE_ID = "price_1T5YNyCyekafHX788ZWqCn1h";

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Explicit method guard (without changing your semantics)
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Safer JSON parsing
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { machine_library_id, organization_id } = body ?? {};
    if (!machine_library_id || !organization_id) {
      return new Response(
        JSON.stringify({
          error: "machine_library_id and organization_id are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data, error: authError } = await supabase.auth.getUser(token);

    if (authError || !data?.user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = data.user;
    if (!user.email) {
      return new Response(JSON.stringify({ error: "User email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already purchased
    const { data: existing, error: existingError } = await supabase
      .from("organization_machine_purchases")
      .select("id, is_active")
      .eq("organization_id", organization_id)
      .eq("machine_library_id", machine_library_id)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing purchase:", existingError);
    }

    if (existing?.is_active) {
      return new Response(
        JSON.stringify({
          error: "This machine profile is already purchased",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify machine exists in library
    const { data: machine, error: machineErr } = await supabase
      .from("verified_machine_library")
      .select("id, manufacturer, model")
      .eq("id", machine_library_id)
      .single();

    if (machineErr || !machine) {
      console.error("Machine lookup error:", machineErr);
      return new Response(JSON.stringify({ error: "Machine not found in library" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is org member
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organization_id)
      .single();

    if (membershipError) {
      console.error("Membership error:", membershipError);
    }

    const adminRoles = new Set(["owner", "admin", "org_admin", "super_admin"]);
    if (!membership || !adminRoles.has(String(membership.role))) {
      return new Response(
        JSON.stringify({ error: "Access denied: only org admins can purchase machine profiles" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return new Response(JSON.stringify({ error: "Payment configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stripe checkout
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("stripe_customer_id, billing_email")
      .eq("id", organization_id)
      .single();

    if (orgError) {
      console.error("Org lookup error:", orgError);
    }

    let customerId: string | undefined;
    const billingEmail = org?.billing_email || user.email;

    if (org?.stripe_customer_id) {
      customerId = org.stripe_customer_id;
    } else {
      const customers = await stripe.customers.list({
        email: billingEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;

        const { error: updateError } = await supabase
          .from("organizations")
          .update({ stripe_customer_id: customerId })
          .eq("id", organization_id);

        if (updateError) {
          console.error("Failed to update stripe_customer_id:", updateError);
        }
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
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("activate-station-context error:", error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

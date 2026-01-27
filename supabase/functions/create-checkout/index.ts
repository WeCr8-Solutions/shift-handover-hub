import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { priceId, orgId } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Price ID received", { priceId, orgId });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Get user's organization if orgId not provided
    let organizationId = orgId;
    let organizationName = "";
    let billingEmail = user.email;

    if (!organizationId) {
      const { data: orgMember } = await supabaseClient
        .from("organization_members")
        .select("organization_id, organizations(id, name, stripe_customer_id, billing_email)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (orgMember?.organization_id) {
        organizationId = orgMember.organization_id;
        const orgs = orgMember.organizations;
        const org = Array.isArray(orgs) ? orgs[0] : orgs;
        if (org) {
          organizationName = org.name || "";
          billingEmail = org.billing_email || user.email;
        }
        logStep("Found user organization", { organizationId, organizationName });
      }
    }

    // Check if organization already has a Stripe customer
    let customerId: string | undefined;
    
    if (organizationId) {
      const { data: org } = await supabaseClient
        .from("organizations")
        .select("stripe_customer_id, name, billing_email")
        .eq("id", organizationId)
        .maybeSingle();

      if (org?.stripe_customer_id) {
        customerId = org.stripe_customer_id;
        logStep("Existing Stripe customer found on org", { customerId });
      } else {
        organizationName = org?.name || "";
        billingEmail = org?.billing_email || user.email;
      }
    }

    // If no org customer, check for existing customer by email
    if (!customerId) {
      const customers = await stripe.customers.list({ email: billingEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found by email", { customerId });
        
        // Store customer ID on org if we have one
        if (organizationId) {
          await supabaseClient
            .from("organizations")
            .update({ stripe_customer_id: customerId })
            .eq("id", organizationId);
        }
      }
    }

    const origin = req.headers.get("origin") || "https://jobline.ai";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : billingEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        org_id: organizationId || "",
        org_name: organizationName,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          org_id: organizationId || "",
        },
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

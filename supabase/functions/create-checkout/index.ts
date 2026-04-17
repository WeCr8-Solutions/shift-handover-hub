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

    const { priceId, orgId, quantity } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Price ID received", { priceId, orgId, quantity });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // ── GCA BRANCH: standalone per-user subscription, no org ──
    const GCA_PRICE_IDS = new Set([
      "price_1TN4g9CyekafHX788v10vyWz", // monthly
      "price_1TN4jwCyekafHX785ZAg0oue", // annual
    ]);

    if (!orgId && GCA_PRICE_IDS.has(priceId)) {
      logStep("GCA standalone checkout flow");
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      // Find existing customer by email (don't require an org)
      let gcaCustomerId: string | undefined;
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) gcaCustomerId = customers.data[0].id;

      const origin = req.headers.get("origin") || "https://jobline.ai";

      const session = await stripe.checkout.sessions.create({
        customer: gcaCustomerId,
        customer_email: gcaCustomerId ? undefined : user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        payment_method_collection: "always",
        success_url: `${origin}/resources/gcode-academy?subscribed=true`,
        cancel_url: `${origin}/resources/gcode-academy?checkout=cancelled`,
        metadata: {
          user_id: user.id,
          product_type: "gca",
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            product_type: "gca",
          },
        },
      });

      logStep("GCA checkout session created", { sessionId: session.id });
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get user's organization
    let organizationId = orgId;
    let organizationName = "";
    let billingEmail = user.email;

    if (!organizationId) {
      const { data: orgMember } = await supabaseClient
        .from("organization_members")
        .select("organization_id, role, organizations:organization_id (id, name, stripe_customer_id, billing_email)")
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

    // Authorization check: only org owners, platform admins, or developers can create checkouts
    if (organizationId) {
      const { data: canManage } = await supabaseClient.rpc("can_manage_billing", {
        _user_id: user.id,
        _org_id: organizationId,
      });

      if (!canManage) {
        logStep("UNAUTHORIZED", { userId: user.id, orgId: organizationId });
        return new Response(
          JSON.stringify({ error: "Only organization owners, platform admins, or developers can manage billing." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
      logStep("Billing authorization verified");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

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
        
        if (organizationId) {
          await supabaseClient
            .from("organizations")
            .update({ stripe_customer_id: customerId })
            .eq("id", organizationId);
        }
      }
    }

    const origin = req.headers.get("origin") || "https://jobline.ai";
    
    // Enterprise price supports per-seat quantity (minimum 10)
    const ENTERPRISE_PRICE_ID = "price_1SthDUCyekafHX78MIJEHfCG";
    const lineQuantity = priceId === ENTERPRISE_PRICE_ID
      ? Math.max(quantity || 10, 10)
      : 1;

    logStep("Line item quantity", { priceId, lineQuantity });

    // Check if org already has an active/trialing subscription (no double trial)
    let trialDays: number | undefined = 14;
    if (customerId) {
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 5,
      });
      const hasHadSub = existingSubs.data.some(s => 
        ["active", "trialing", "past_due", "canceled"].includes(s.status)
      );
      if (hasHadSub) {
        trialDays = undefined; // No trial for returning customers
        logStep("Returning customer, skipping trial", { customerId });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : billingEmail,
      line_items: [{ price: priceId, quantity: lineQuantity }],
      mode: "subscription",
      payment_method_collection: "always",
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        org_id: organizationId || "",
        org_name: organizationName,
      },
      subscription_data: {
        trial_period_days: trialDays,
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

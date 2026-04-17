import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, corsPreflight } from "../_shared/cors.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product ID to tier mapping
const PRODUCT_TIERS: Record<string, string> = {
  "prod_TrQ3QqbNqlmDiS": "single",
  "prod_TrQ3SzBnvfW4yA": "team",
  "prod_TrQ3Y4BKSsc591": "enterprise",
  // TODO: Replace with real GCA Stripe product ID once created in dashboard
  // "prod_GCA_PLACEHOLDER": "gca_pro",
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req, {
    allowHeaders: "authorization, x-client-info, apikey, content-type",
  });

  if (req.method === "OPTIONS") {
    return corsPreflight(req, {
      allowHeaders: "authorization, x-client-info, apikey, content-type",
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, try to get subscription from local DB (via org membership)
    const { data: orgMember } = await supabaseClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (orgMember?.organization_id) {
      // Check local subscriptions table first
      const { data: localSub } = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("organization_id", orgMember.organization_id)
        .eq("status", "active")
        .maybeSingle();

      if (localSub) {
        const metadata = localSub.metadata as { plan?: string } | null;
        logStep("Found local subscription", { subscriptionId: localSub.stripe_subscription_id, plan: metadata?.plan });
        return new Response(JSON.stringify({
          subscribed: true,
          tier: metadata?.plan || null,
          product_id: localSub.stripe_price_id,
          subscription_end: localSub.current_period_end,
          cancel_at_period_end: localSub.cancel_at_period_end,
          status: localSub.status,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check organization status
      const { data: org } = await supabaseClient
        .from("organizations")
        .select("subscription_tier, subscription_status")
        .eq("id", orgMember.organization_id)
        .maybeSingle();

      if (org?.subscription_status === "active" && org.subscription_tier) {
        logStep("Found org subscription via status field", { tier: org.subscription_tier });
        return new Response(JSON.stringify({
          subscribed: true,
          tier: org.subscription_tier,
          product_id: null,
          subscription_end: null,
          cancel_at_period_end: false,
          status: org.subscription_status,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Fall back to Stripe API check (for users without org or legacy)
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: null,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active OR trialing subscriptions (trialing = card on file, auto-charges)
    const activeSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const trialingSubs = activeSubs.data.length > 0 ? activeSubs : await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });
    const allSubs = activeSubs.data.length > 0 ? activeSubs.data : trialingSubs.data;

    const hasActiveSub = allSubs.length > 0;
    let tier: string | null = null;
    let subscriptionEnd: string | null = null;
    let productId: string | null = null;
    let cancelAtPeriodEnd = false;

    if (hasActiveSub) {
      const subscription = allSubs[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      tier = PRODUCT_TIERS[productId] || null;
      cancelAtPeriodEnd = subscription.cancel_at_period_end;
      logStep("Active/trialing subscription found", { subscriptionId: subscription.id, tier, status: subscription.status, endDate: subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      status: hasActiveSub ? "active" : null,
    }), {
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

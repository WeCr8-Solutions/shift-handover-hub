import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[UPDATE-SEATS] ${step}${detailsStr}`);
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

    const { quantity } = await req.json();
    if (!quantity || typeof quantity !== "number" || quantity < 10) {
      return new Response(
        JSON.stringify({ error: "quantity must be a number >= 10" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Auth
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Get user's org
    const { data: orgMember } = await supabaseClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!orgMember?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }
    const orgId = orgMember.organization_id;

    // Billing authorization
    const { data: canManage } = await supabaseClient.rpc("can_manage_billing", {
      _user_id: user.id,
      _org_id: orgId,
    });
    if (!canManage) {
      return new Response(
        JSON.stringify({ error: "Only org owners, platform admins, or developers can manage seats." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Verify enterprise plan
    const { data: entitlement } = await supabaseClient
      .from("entitlements")
      .select("plan")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (!entitlement || entitlement.plan !== "enterprise") {
      return new Response(
        JSON.stringify({ error: "Seat management is only available on the Enterprise plan." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Get org's Stripe customer
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", orgId)
      .maybeSingle();

    if (!org?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer found. Please subscribe first." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find active enterprise subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: "active",
      limit: 10,
    });

    // Enterprise product ID
    const ENTERPRISE_PRODUCT_ID = "prod_TrQ3Y4BKSsc591";
    const enterpriseSub = subscriptions.data.find((sub) =>
      sub.items.data.some((item) => item.price.product === ENTERPRISE_PRODUCT_ID)
    );

    if (!enterpriseSub) {
      return new Response(
        JSON.stringify({ error: "No active Enterprise subscription found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const subItem = enterpriseSub.items.data.find(
      (item) => item.price.product === ENTERPRISE_PRODUCT_ID
    )!;

    logStep("Updating subscription quantity", {
      subscriptionId: enterpriseSub.id,
      itemId: subItem.id,
      oldQuantity: subItem.quantity,
      newQuantity: quantity,
    });

    // Update Stripe subscription quantity with proration
    await stripe.subscriptions.update(enterpriseSub.id, {
      items: [{ id: subItem.id, quantity }],
      proration_behavior: "create_prorations",
    });

    // Update entitlements limits.users in DB
    const { data: currentEntitlements } = await supabaseClient
      .from("entitlements")
      .select("limits")
      .eq("organization_id", orgId)
      .maybeSingle();

    const currentLimits = (currentEntitlements?.limits as Record<string, number>) || {};
    await supabaseClient
      .from("entitlements")
      .update({
        limits: { ...currentLimits, users: quantity },
      })
      .eq("organization_id", orgId);

    logStep("Seats updated successfully", { orgId, newQuantity: quantity });

    return new Response(
      JSON.stringify({
        success: true,
        seats: quantity,
        message: `Seat count updated to ${quantity}. Proration applied.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

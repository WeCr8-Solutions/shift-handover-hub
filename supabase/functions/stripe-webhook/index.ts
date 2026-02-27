import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

// Product ID to tier mapping
const PRODUCT_TIERS: Record<string, string> = {
  "prod_TrQ3QqbNqlmDiS": "single",
  "prod_TrQ3SzBnvfW4yA": "team",
  "prod_TrQ3Y4BKSsc591": "enterprise",
};

// ERP add-on product ID to tier mapping
const ERP_PRODUCT_TIERS: Record<string, string> = {
  "prod_U3eObrQgIK5XOW": "starter",
  "prod_U3eOU03pp8fNG0": "pro",
  "prod_U3eOQKkbY8NHrj": "unlimited",
};

// Entitlements per plan
const PLAN_ENTITLEMENTS: Record<string, { features: Record<string, boolean>; limits: Record<string, number> }> = {
  free: {
    features: { handoff_hub: true, work_orders: true, analytics: false, api_access: false, bulk_upload: false },
    limits: { users: 1, work_orders_per_month: 50, stations: 5 },
  },
  single: {
    features: { handoff_hub: true, work_orders: true, analytics: true, api_access: false, bulk_upload: true },
    limits: { users: 1, work_orders_per_month: 500, stations: 20 },
  },
  team: {
    features: { handoff_hub: true, work_orders: true, analytics: true, api_access: false, bulk_upload: true },
    limits: { users: 4, work_orders_per_month: 2000, stations: 50 },
  },
  enterprise: {
    features: { handoff_hub: true, work_orders: true, analytics: true, api_access: true, bulk_upload: true },
    limits: { users: 100, work_orders_per_month: 10000, stations: 200 },
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function checkIdempotency(eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  return !!data;
}

function sanitizePayload(eventType: string, payload: unknown): Record<string, unknown> {
  const obj = payload as Record<string, unknown>;
  // Only keep non-sensitive fields for idempotency and debugging
  const safe: Record<string, unknown> = {
    id: obj.id,
    object: obj.object,
    status: obj.status,
    created: obj.created,
  };

  // Add type-specific safe fields
  if (eventType.startsWith("customer.subscription")) {
    safe.cancel_at_period_end = obj.cancel_at_period_end;
    safe.current_period_end = obj.current_period_end;
  } else if (eventType.startsWith("checkout.session")) {
    safe.payment_status = obj.payment_status;
    safe.mode = obj.mode;
  } else if (eventType.startsWith("invoice.")) {
    safe.status = obj.status;
    safe.amount_due = obj.amount_due;
  }

  return safe;
}

async function recordEvent(eventId: string, eventType: string, payload: unknown) {
  await supabaseAdmin.from("stripe_events").insert({
    id: eventId,
    event_type: eventType,
    payload: sanitizePayload(eventType, payload),
  });
}

async function updateOrgEntitlements(orgId: string, plan: string, erpTier?: string) {
  const entitlements = PLAN_ENTITLEMENTS[plan] || PLAN_ENTITLEMENTS.free;
  
  const features = { ...entitlements.features };
  if (erpTier) {
    features.erp_connector = true;
    (features as Record<string, unknown>).erp_tier = erpTier;
  }

  const { error } = await supabaseAdmin
    .from("entitlements")
    .upsert({
      organization_id: orgId,
      plan,
      features,
      limits: entitlements.limits,
    }, { onConflict: "organization_id" });

  if (error) {
    logStep("Error updating entitlements", error);
  }
}

async function updateErpTierOnly(orgId: string, erpTier: string | null) {
  // Fetch current entitlements, then patch only erp fields
  const { data: current } = await supabaseAdmin
    .from("entitlements")
    .select("features")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!current) return;

  const features = (current.features as Record<string, unknown>) || {};
  if (erpTier) {
    features.erp_connector = true;
    features.erp_tier = erpTier;
  } else {
    features.erp_connector = false;
    delete features.erp_tier;
  }

  await supabaseAdmin
    .from("entitlements")
    .update({ features })
    .eq("organization_id", orgId);

  logStep("Updated ERP tier in entitlements", { orgId, erpTier });
}

function isErpProduct(productId: string): boolean {
  return productId in ERP_PRODUCT_TIERS;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logStep("Processing checkout.session.completed", { sessionId: session.id });
  
  const orgId = session.metadata?.org_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!orgId || !subscriptionId) {
    logStep("Missing org_id or subscription in session metadata");
    return;
  }

  // Update organization with stripe_customer_id
  await supabaseAdmin
    .from("organizations")
    .update({ stripe_customer_id: customerId })
    .eq("id", orgId);

  // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const productId = subscription.items.data[0]?.price.product as string;

  // Check if this is an ERP add-on checkout
  if (isErpProduct(productId)) {
    const erpTier = ERP_PRODUCT_TIERS[productId];
    await updateErpTierOnly(orgId, erpTier);
    logStep("ERP add-on checkout completed", { orgId, erpTier });
    return;
  }

  const plan = PRODUCT_TIERS[productId] || "single";

  // Upsert subscription record
  await supabaseAdmin.from("subscriptions").upsert({
    organization_id: orgId,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    stripe_price_id: subscription.items.data[0]?.price.id,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    quantity: subscription.items.data[0]?.quantity || 1,
    metadata: { product_id: productId, plan },
  }, { onConflict: "stripe_subscription_id" });

  // Update organization status
  await supabaseAdmin
    .from("organizations")
    .update({
      subscription_tier: plan,
      subscription_status: "active",
    })
    .eq("id", orgId);

  // Update entitlements
  await updateOrgEntitlements(orgId, plan);

  logStep("Checkout session processed successfully", { orgId, plan });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logStep("Processing customer.subscription.updated", { subscriptionId: subscription.id });

  const productId = subscription.items.data[0]?.price.product as string;

  // Handle ERP add-on subscription separately
  if (isErpProduct(productId)) {
    await handleErpAddonSubscription(subscription, productId);
    return;
  }

  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!subRecord) {
    logStep("No subscription record found for", subscription.id);
    return;
  }

  const plan = PRODUCT_TIERS[productId] || "single";

  // Update subscription record
  await supabaseAdmin
    .from("subscriptions")
    .update({
      stripe_price_id: subscription.items.data[0]?.price.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      quantity: subscription.items.data[0]?.quantity || 1,
      metadata: { product_id: productId, plan },
    })
    .eq("stripe_subscription_id", subscription.id);

  // Update organization status
  const orgStatus = subscription.status === "active" ? "active" : 
                    subscription.status === "past_due" ? "past_due" : 
                    subscription.status === "canceled" ? "canceled" : "active";

  await supabaseAdmin
    .from("organizations")
    .update({
      subscription_tier: plan,
      subscription_status: orgStatus,
    })
    .eq("id", subRecord.organization_id);

  // Update entitlements
  await updateOrgEntitlements(subRecord.organization_id, plan);

  logStep("Subscription updated successfully", { orgId: subRecord.organization_id, plan, status: subscription.status });
}

async function handleErpAddonSubscription(subscription: Stripe.Subscription, productId: string) {
  const erpTier = ERP_PRODUCT_TIERS[productId];
  const orgId = subscription.metadata?.org_id;

  if (!orgId) {
    // Try to find org via customer ID
    const customerId = subscription.customer as string;
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (!org) {
      logStep("Cannot find org for ERP add-on subscription", { subscriptionId: subscription.id });
      return;
    }

    if (subscription.status === "active") {
      await updateErpTierOnly(org.id, erpTier);
    } else if (subscription.status === "canceled") {
      await updateErpTierOnly(org.id, null);
    }

    logStep("ERP add-on processed", { orgId: org.id, erpTier, status: subscription.status });
    return;
  }

  if (subscription.status === "active") {
    await updateErpTierOnly(orgId, erpTier);
  } else if (subscription.status === "canceled") {
    await updateErpTierOnly(orgId, null);
  }

  logStep("ERP add-on processed", { orgId, erpTier, status: subscription.status });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id });

  const productId = subscription.items.data[0]?.price.product as string;

  // Handle ERP add-on cancellation
  if (isErpProduct(productId)) {
    await handleErpAddonSubscription(subscription, productId);
    return;
  }

  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!subRecord) {
    logStep("No subscription record found for", subscription.id);
    return;
  }

  // Update subscription record
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Update organization to free tier
  await supabaseAdmin
    .from("organizations")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
    })
    .eq("id", subRecord.organization_id);

  // Reset entitlements to free
  await updateOrgEntitlements(subRecord.organization_id, "free");

  logStep("Subscription deleted, org reverted to free", { orgId: subRecord.organization_id });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });

  const customerId = invoice.customer as string;
  
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (org) {
    await supabaseAdmin
      .from("organizations")
      .update({ subscription_status: "past_due" })
      .eq("id", org.id);

    logStep("Set org to past_due", { orgId: org.id });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logStep("Processing invoice.payment_succeeded", { invoiceId: invoice.id });

  const customerId = invoice.customer as string;
  
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id, subscription_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (org && org.subscription_status === "past_due") {
    await supabaseAdmin
      .from("organizations")
      .update({ subscription_status: "active" })
      .eq("id", org.id);

    logStep("Restored org to active from past_due", { orgId: org.id });
  }
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    
    logStep("Received event", { type: event.type, id: event.id });

    // Check idempotency
    if (await checkIdempotency(event.id)) {
      logStep("Event already processed, skipping", { id: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }

    // Record event for idempotency
    await recordEvent(event.id, event.type, event.data.object);

    // Handle events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Webhook error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
});
